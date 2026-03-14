from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from .models import Task, ProgressTracking, Reminder, Report
from .serializers import (
    TaskSerializer, TaskCreateSerializer, UpdateProgressSerializer,
    ReviewTaskSerializer, ReminderSerializer, ReportSerializer
)
from apps.accounts.permissions import IsAdmin, IsEmployee, IsCompany


def _notify(user, title, message, notif_type='system'):
    try:
        from apps.notifications.views import create_notification
        create_notification(user, title, message, notif_type)
    except Exception:
        pass


class TaskListCreateView(generics.ListCreateAPIView):
    permission_classes  = [permissions.IsAuthenticated]
    filterset_fields    = ['status', 'priority', 'assigned_to', 'company']
    search_fields       = ['task_title', 'task_description']
    ordering_fields     = ['deadline', 'priority', 'created_at']

    def get_serializer_class(self):
        return TaskCreateSerializer if self.request.method == 'POST' else TaskSerializer

    def get_permissions(self):
        return [IsAdmin()] if self.request.method == 'POST' else [permissions.IsAuthenticated()]

    def get_queryset(self):
        user = self.request.user
        qs   = Task.objects.select_related('assigned_to', 'company', 'progress')
        if user.role == 'admin':
            return qs.all()
        if user.role == 'employee':
            return qs.filter(assigned_to=user)
        if user.role == 'company':
            try:
                return qs.filter(company=user.company_profile)
            except Exception:
                return Task.objects.none()
        return Task.objects.none()

    def perform_create(self, serializer):
        task = serializer.save(created_by=self.request.user)
        # Notify employee
        if task.assigned_to:
            _notify(
                task.assigned_to,
                'New Task Assigned',
                f'You have been assigned a new task: "{task.task_title}". Deadline: {task.deadline}',
                'task_assigned',
            )


class TaskDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        return TaskCreateSerializer if self.request.method in ['PUT', 'PATCH'] else TaskSerializer

    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin':
            return Task.objects.all()
        if user.role == 'employee':
            return Task.objects.filter(assigned_to=user)
        if user.role == 'company':
            try:
                return Task.objects.filter(company=user.company_profile)
            except Exception:
                return Task.objects.none()
        return Task.objects.none()


class UpdateProgressView(APIView):
    permission_classes = [IsEmployee]

    def patch(self, request, task_id):
        task = get_object_or_404(Task, id=task_id, assigned_to=request.user)
        progress, _ = ProgressTracking.objects.get_or_create(
            task=task, defaults={'user': request.user}
        )
        serializer = UpdateProgressSerializer(progress, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)

        github_url = serializer.validated_data.pop('github_repo_url', None)
        serializer.save()

        # Save github URL on the task itself
        if github_url is not None:
            task.github_repo_url = github_url
            task.save(update_fields=['github_repo_url', 'updated_at'])

        if progress.progress_percent == 100:
            task.status = 'under_review'
            task.save(update_fields=['status', 'updated_at'])
            # Notify company
            if task.company and task.company.user:
                _notify(
                    task.company.user,
                    'Task Submitted for Review',
                    f'Employee "{request.user.name}" has completed task "{task.task_title}" and submitted it for your review.',
                    'task_submitted',
                )

        return Response({'message': 'Progress updated.', 'progress': serializer.data})


class ReviewTaskView(APIView):
    """Company accepts or rejects a submitted task."""
    permission_classes = [IsCompany]

    def post(self, request, task_id):
        company = getattr(request.user, 'company_profile', None)
        if not company:
            return Response({'error': 'Company profile not found.'}, status=400)

        task = get_object_or_404(Task, id=task_id, company=company, status='under_review')
        serializer = ReviewTaskSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        action = serializer.validated_data['action']
        if action == 'accept':
            task.status           = 'accepted'
            task.rejection_reason = None
            task.save()
            if task.assigned_to:
                _notify(
                    task.assigned_to,
                    'Task Accepted ✅',
                    f'Your submission for "{task.task_title}" has been accepted by {company.company_name}.',
                    'task_accepted',
                )
        else:
            task.status           = 'rejected'
            task.rejection_reason = serializer.validated_data.get('rejection_reason', '')
            task.save()
            if task.assigned_to:
                _notify(
                    task.assigned_to,
                    'Task Rejected ❌',
                    f'Your submission for "{task.task_title}" was rejected. Reason: {task.rejection_reason}',
                    'task_rejected',
                )

        return Response({'message': f'Task {action}ed.', 'status': task.status})


class ReminderListCreateView(generics.ListCreateAPIView):
    serializer_class   = ReminderSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return Reminder.objects.all() if user.role == 'admin' else Reminder.objects.filter(user=user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class ReportListCreateView(generics.ListCreateAPIView):
    serializer_class   = ReportSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin':
            return Report.objects.all()
        if user.role == 'company':
            try:
                return Report.objects.filter(company=user.company_profile)
            except Exception:
                return Report.objects.none()
        return Report.objects.none()

    def perform_create(self, serializer):
        serializer.save(generated_by=self.request.user)


class EmployeeDashboardView(APIView):
    permission_classes = [IsEmployee]

    def get(self, request):
        user  = request.user
        tasks = Task.objects.filter(assigned_to=user)
        from datetime import date
        return Response({
            'total_tasks':      tasks.count(),
            'completed':        tasks.filter(status__in=['completed', 'accepted']).count(),
            'in_progress':      tasks.filter(status='in_progress').count(),
            'pending':          tasks.filter(status='pending').count(),
            'under_review':     tasks.filter(status='under_review').count(),
            'overdue':          tasks.filter(status__in=['pending', 'in_progress'], deadline__lt=date.today()).count(),
            'reminders_today':  Reminder.objects.filter(
                user=user, status='pending', reminder_date__date=date.today()
            ).count(),
        })
