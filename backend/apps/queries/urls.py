from django.urls import path
from . import views

urlpatterns = [
    path('', views.QueryListCreateView.as_view(), name='query_list_create'),
    path('<int:pk>/', views.QueryDetailView.as_view(), name='query_detail'),
    path('<int:pk>/respond/', views.RespondQueryView.as_view(), name='query_respond'),
]
