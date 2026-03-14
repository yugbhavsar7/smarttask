from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from .models import ClientQuery
from .serializers import ClientQuerySerializer, QueryCreateSerializer, QueryRespondSerializer
from apps.accounts.permissions import IsAdmin, IsCompany


class QueryListCreateView(generics.ListCreateAPIView):
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['status']

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return QueryCreateSerializer
        return ClientQuerySerializer

    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin':
            return ClientQuery.objects.select_related('company', 'responded_by').all()
        elif user.role == 'company':
            try:
                return ClientQuery.objects.filter(company=user.company_profile)
            except Exception:
                return ClientQuery.objects.none()
        return ClientQuery.objects.none()

    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsCompany()]
        return [permissions.IsAuthenticated()]


class QueryDetailView(generics.RetrieveAPIView):
    serializer_class = ClientQuerySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin':
            return ClientQuery.objects.all()
        elif user.role == 'company':
            try:
                return ClientQuery.objects.filter(company=user.company_profile)
            except Exception:
                return ClientQuery.objects.none()
        return ClientQuery.objects.none()


class RespondQueryView(APIView):
    permission_classes = [IsAdmin]

    def post(self, request, pk):
        query = get_object_or_404(ClientQuery, pk=pk)
        serializer = QueryRespondSerializer(query, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save(responded_by=request.user, status='closed')
        return Response({'message': 'Query responded successfully.', 'query': ClientQuerySerializer(query).data})
