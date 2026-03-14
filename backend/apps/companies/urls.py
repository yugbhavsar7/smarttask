from django.urls import path
from . import views

urlpatterns = [
    path('', views.CompanyListView.as_view(), name='company_list'),
    path('create/', views.CompanyCreateView.as_view(), name='company_create'),
    path('profile/', views.CompanyDetailView.as_view(), name='company_profile'),
    path('<int:pk>/', views.CompanyDetailView.as_view(), name='company_detail'),
    path('dashboard/', views.CompanyDashboardView.as_view(), name='company_dashboard'),
]
