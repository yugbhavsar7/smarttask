from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from . import views

urlpatterns = [
    path('login/',             views.LoginView.as_view(),               name='login'),
    path('register/',          views.RegisterView.as_view(),            name='register'),
    path('verify-otp/',        views.VerifyOTPView.as_view(),           name='verify_otp'),
    path('resend-otp/',        views.ResendOTPView.as_view(),           name='resend_otp'),
    path('forgot-password/',   views.ForgotPasswordRequestView.as_view(), name='forgot_password'),
    path('reset-password/',    views.ResetPasswordView.as_view(),       name='reset_password'),
    path('logout/',            views.LogoutView.as_view(),              name='logout'),
    path('token/refresh/',     TokenRefreshView.as_view(),              name='token_refresh'),
    path('profile/',           views.ProfileView.as_view(),             name='profile'),
    path('change-password/',   views.ChangePasswordView.as_view(),      name='change_password'),
    # Admin
    path('users/',             views.UserListView.as_view(),            name='user_list'),
    path('users/<int:pk>/',    views.UserDetailView.as_view(),          name='user_detail'),
    path('users/<int:pk>/block/', views.BlockUserView.as_view(),        name='block_user'),
    path('dashboard/stats/',   views.DashboardStatsView.as_view(),      name='dashboard_stats'),
]
