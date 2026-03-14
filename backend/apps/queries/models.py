from django.db import models
from apps.companies.models import Company
from django.contrib.auth import get_user_model

User = get_user_model()


class ClientQuery(models.Model):
    STATUS_CHOICES = [('open', 'Open'), ('closed', 'Closed')]

    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='queries')
    query_text = models.TextField()
    response_text = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='open')
    responded_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='responded_queries'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'client_queries'
        ordering = ['-created_at']

    def __str__(self):
        return f"Query by {self.company.company_name} - {self.status}"
