from rest_framework import serializers
from .models import ClientQuery


class ClientQuerySerializer(serializers.ModelSerializer):
    company_name = serializers.CharField(source='company.company_name', read_only=True)
    responded_by_name = serializers.CharField(source='responded_by.name', read_only=True)

    class Meta:
        model = ClientQuery
        fields = [
            'id', 'company', 'company_name', 'query_text',
            'response_text', 'status', 'responded_by',
            'responded_by_name', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'responded_by', 'status']


class QueryCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = ClientQuery
        fields = ['id', 'query_text']

    def create(self, validated_data):
        company = self.context['request'].user.company_profile
        return ClientQuery.objects.create(company=company, **validated_data)


class QueryRespondSerializer(serializers.ModelSerializer):
    class Meta:
        model = ClientQuery
        fields = ['response_text', 'status']
