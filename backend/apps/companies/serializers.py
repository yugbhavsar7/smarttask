from rest_framework import serializers
from .models import Company


class CompanySerializer(serializers.ModelSerializer):
    class Meta:
        model = Company
        fields = [
            'id', 'user', 'company_name', 'email',
            'contact_no', 'address', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class CompanyCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Company
        fields = ['company_name', 'email', 'contact_no', 'address']

    def create(self, validated_data):
        user = self.context['request'].user
        validated_data['user'] = user
        return Company.objects.create(**validated_data)
