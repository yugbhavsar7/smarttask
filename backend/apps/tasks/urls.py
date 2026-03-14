from django.urls import path
from . import views

urlpatterns = [
    path('',                              views.TaskListCreateView.as_view(),   name='task_list_create'),
    path('<int:pk>/',                     views.TaskDetailView.as_view(),        name='task_detail'),
    path('<int:task_id>/progress/',       views.UpdateProgressView.as_view(),    name='update_progress'),
    path('<int:task_id>/review/',         views.ReviewTaskView.as_view(),        name='review_task'),
    path('reminders/',                    views.ReminderListCreateView.as_view(), name='reminders'),
    path('reports/',                      views.ReportListCreateView.as_view(),   name='reports'),
    path('employee/dashboard/',           views.EmployeeDashboardView.as_view(), name='employee_dashboard'),
]
