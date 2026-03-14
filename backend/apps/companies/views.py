from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import Company
from .serializers import CompanySerializer, CompanyCreateSerializer
from apps.accounts.permissions import IsAdmin, IsCompany
from apps.tasks.models import Task
from apps.tasks.serializers import TaskSerializer
from apps.queries.models import ClientQuery


class CompanyListView(generics.ListAPIView):
    serializer_class = CompanySerializer
    permission_classes = [IsAdmin]
    search_fields = ['company_name', 'email']

    def get_queryset(self):
        return Company.objects.all()


class CompanyCreateView(generics.CreateAPIView):
    serializer_class = CompanyCreateSerializer
    permission_classes = [IsCompany]

    def create(self, request, *args, **kwargs):
        if hasattr(request.user, 'company_profile'):
            return Response(
                {'error': 'Company profile already exists.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        return super().create(request, *args, **kwargs)


class CompanyDetailView(generics.RetrieveUpdateAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return CompanyCreateSerializer
        return CompanySerializer

    def get_object(self):
        user = self.request.user
        if user.role == 'admin':
            from django.shortcuts import get_object_or_404
            return get_object_or_404(Company, pk=self.kwargs.get('pk'))
        return user.company_profile


class CompanyDashboardView(APIView):
    permission_classes = [IsCompany]

    def get(self, request):
        try:
            company = request.user.company_profile
        except Exception:
            return Response({'error': 'Company profile not found.'}, status=404)

        tasks = Task.objects.filter(company=company)
        return Response({
            'active_projects': tasks.filter(status__in=['pending', 'in_progress']).count(),
            'completed_projects': tasks.filter(status='completed').count(),
            'pending_requests': tasks.filter(status='pending').count(),
            'open_queries': ClientQuery.objects.filter(company=company, status='open').count(),
            'total_projects': tasks.count(),
        })
