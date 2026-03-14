from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


class Notification(models.Model):
    TYPE_CHOICES = [
        ('task_assigned',   'Task Assigned'),
        ('task_accepted',   'Task Accepted'),
        ('task_rejected',   'Task Rejected'),
        ('task_submitted',  'Task Submitted for Review'),
        ('task_created',    'Task Created'),
        ('query_responded', 'Query Responded'),
        ('system',          'System'),
    ]

    user      = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    title     = models.CharField(max_length=200)
    message   = models.TextField()
    notif_type = models.CharField(max_length=40, choices=TYPE_CHOICES, default='system')
    is_read   = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'notifications'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.name} — {self.title}"
