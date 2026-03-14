from rest_framework import serializers
from .models import Task, ProgressTracking, Reminder, Report
from apps.accounts.serializers import UserSerializer


class ProgressSerializer(serializers.ModelSerializer):
    class Meta:
        model  = ProgressTracking
        fields = ['id', 'progress_percent', 'notes', 'last_updated']


class ReminderSerializer(serializers.ModelSerializer):
    class Meta:
        model        = Reminder
        fields       = ['id', 'task', 'user', 'reminder_date', 'reminder_type', 'status', 'created_at']
        read_only_fields = ['id', 'created_at', 'status', 'user']


class TaskSerializer(serializers.ModelSerializer):
    assigned_to_detail = UserSerializer(source='assigned_to', read_only=True)
    progress           = ProgressSerializer(read_only=True)
    company_name       = serializers.CharField(source='company.company_name', read_only=True)

    class Meta:
        model  = Task
        fields = [
            'id', 'task_title', 'task_description', 'priority', 'deadline',
            'assigned_to', 'assigned_to_detail', 'company', 'company_name',
            'status', 'github_repo_url', 'rejection_reason',
            'progress', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class TaskCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Task
        fields = [
            'id', 'task_title', 'task_description', 'priority',
            'deadline', 'assigned_to', 'company', 'status',
        ]

    def create(self, validated_data):
        task = Task.objects.create(**validated_data)
        ProgressTracking.objects.create(task=task, user=task.assigned_to, progress_percent=0)
        return task


class UpdateProgressSerializer(serializers.ModelSerializer):
    github_repo_url = serializers.URLField(required=False, allow_blank=True)

    class Meta:
        model  = ProgressTracking
        fields = ['progress_percent', 'notes', 'github_repo_url']

    def validate_progress_percent(self, value):
        if not 0 <= value <= 100:
            raise serializers.ValidationError('Progress must be between 0 and 100.')
        return value


class ReviewTaskSerializer(serializers.Serializer):
    """Company uses this to accept or reject a submitted task."""
    action           = serializers.ChoiceField(choices=['accept', 'reject'])
    rejection_reason = serializers.CharField(required=False, allow_blank=True)

    def validate(self, attrs):
        if attrs['action'] == 'reject' and not attrs.get('rejection_reason', '').strip():
            raise serializers.ValidationError({'rejection_reason': 'Please provide a reason for rejection.'})
        return attrs


class ReportSerializer(serializers.ModelSerializer):
    task_title   = serializers.CharField(source='task.task_title', read_only=True)
    company_name = serializers.CharField(source='company.company_name', read_only=True)

    class Meta:
        model        = Report
        fields       = ['id', 'task', 'task_title', 'company', 'company_name',
                        'report_content', 'generated_by', 'generated_at']
        read_only_fields = ['id', 'generated_at', 'generated_by']