from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


class Company(models.Model):
    user = models.OneToOneField(
        User, on_delete=models.CASCADE,
        related_name='company_profile',
        limit_choices_to={'role': 'company'},
        null=True, blank=True
    )
    company_name = models.CharField(max_length=150)
    email = models.EmailField(unique=True)
    contact_no = models.CharField(max_length=15)
    address = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'companies'
        ordering = ['-created_at']
        verbose_name_plural = 'Companies'

    def __str__(self):
        return self.company_name
