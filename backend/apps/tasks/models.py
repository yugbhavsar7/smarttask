from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


class Task(models.Model):
    PRIORITY_CHOICES = [('high', 'High'), ('medium', 'Medium'), ('low', 'Low')]
    STATUS_CHOICES = [
        ('pending',         'Pending'),
        ('in_progress',     'In Progress'),
        ('under_review',    'Under Review'),
        ('accepted',        'Accepted'),
        ('rejected',        'Rejected'),
        ('completed',       'Completed'),
    ]

    task_title       = models.CharField(max_length=150)
    task_description = models.TextField()
    priority         = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default='medium')
    deadline         = models.DateField()
    assigned_to      = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True,
        related_name='assigned_tasks', limit_choices_to={'role': 'employee'}
    )
    company          = models.ForeignKey(
        'companies.Company', on_delete=models.SET_NULL, null=True, related_name='tasks'
    )
    status           = models.CharField(max_length=30, choices=STATUS_CHOICES, default='pending')
    github_repo_url  = models.URLField(blank=True, null=True)
    rejection_reason = models.TextField(blank=True, null=True)
    created_by       = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, related_name='created_tasks'
    )
    created_at       = models.DateTimeField(auto_now_add=True)
    updated_at       = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'tasks'
        ordering = ['-created_at']

    def __str__(self):
        return self.task_title


class ProgressTracking(models.Model):
    task             = models.OneToOneField(Task, on_delete=models.CASCADE, related_name='progress')
    user             = models.ForeignKey(User, on_delete=models.CASCADE, related_name='progress_entries')
    progress_percent = models.IntegerField(default=0)
    notes            = models.TextField(blank=True)
    last_updated     = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'progress_tracking'

    def __str__(self):
        return f"{self.task.task_title} - {self.progress_percent}%"


class Reminder(models.Model):
    REMINDER_TYPE_CHOICES = [('email', 'Email'), ('system', 'System')]
    STATUS_CHOICES        = [('pending', 'Pending'), ('sent', 'Sent')]

    task          = models.ForeignKey(Task, on_delete=models.CASCADE, related_name='reminders')
    user          = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reminders')
    reminder_date = models.DateTimeField()
    reminder_type = models.CharField(max_length=30, choices=REMINDER_TYPE_CHOICES, default='system')
    status        = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    created_at    = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'reminders'
        ordering = ['reminder_date']

    def __str__(self):
        return f"Reminder: {self.task.task_title} at {self.reminder_date}"


class Report(models.Model):
    task           = models.ForeignKey(Task, on_delete=models.CASCADE, related_name='reports')
    company        = models.ForeignKey('companies.Company', on_delete=models.CASCADE, related_name='reports')
    report_content = models.TextField()
    generated_by   = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    generated_at   = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'reports'
        ordering = ['-generated_at']

    def __str__(self):
        return f"Report: {self.task.task_title}"
