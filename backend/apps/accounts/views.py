from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model
from django.utils import timezone
from django.core.mail import send_mail
from django.conf import settings
from datetime import timedelta

from .models import OTPRecord
from .serializers import (
    CustomTokenObtainPairSerializer, UserRegisterSerializer,
    UserSerializer, UserUpdateSerializer, ChangePasswordSerializer
)
from .permissions import IsAdmin

User = get_user_model()


# ── helpers ──────────────────────────────────────────────────────────────
def _send_otp_email(email, otp, purpose):
    subject_map = {
        'register':        'SmartTask — Your Registration OTP',
        'forgot_password': 'SmartTask — Password Reset OTP',
    }
    body = (
        f"Your SmartTask OTP is: {otp}\n\n"
        f"This OTP is valid for 10 minutes. Do not share it with anyone.\n\n"
        f"If you did not request this, please ignore this email."
    )
    try:
        send_mail(
            subject=subject_map.get(purpose, 'SmartTask OTP'),
            message=body,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[email],
            fail_silently=False,
        )
    except Exception as e:
        pass  # log in production


def _create_otp(email, purpose):
    otp = OTPRecord.generate_otp()
    OTPRecord.objects.create(
        email=email,
        otp=otp,
        purpose=purpose,
        expires_at=timezone.now() + timedelta(minutes=10),
    )
    _send_otp_email(email, otp, purpose)
    return otp


# ── Auth ─────────────────────────────────────────────────────────────────
class LoginView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer


class RegisterView(generics.CreateAPIView):
    serializer_class = UserRegisterSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        _create_otp(user.email, 'register')
        return Response({
            'message': 'OTP sent to your email. Please verify to activate your account.',
            'email': user.email,
        }, status=status.HTTP_201_CREATED)


class VerifyOTPView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email   = request.data.get('email', '').lower().strip()
        otp     = request.data.get('otp', '').strip()
        purpose = request.data.get('purpose', 'register')

        record = OTPRecord.objects.filter(
            email=email, otp=otp, purpose=purpose, is_used=False
        ).order_by('-created_at').first()

        if not record or not record.is_valid():
            return Response({'error': 'Invalid or expired OTP.'}, status=status.HTTP_400_BAD_REQUEST)

        record.is_used = True
        record.save()

        if purpose == 'register':
            try:
                user = User.objects.get(email=email)
                user.is_active   = True
                user.is_verified = True
                user.save()
            except User.DoesNotExist:
                return Response({'error': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)

        return Response({'message': 'OTP verified successfully.'})


class ResendOTPView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email   = request.data.get('email', '').lower().strip()
        purpose = request.data.get('purpose', 'register')
        if not email:
            return Response({'error': 'Email is required.'}, status=status.HTTP_400_BAD_REQUEST)
        _create_otp(email, purpose)
        return Response({'message': 'New OTP sent to your email.'})


class ForgotPasswordRequestView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = request.data.get('email', '').lower().strip()
        if not User.objects.filter(email=email).exists():
            # Don't reveal whether email exists
            return Response({'message': 'If that email is registered, an OTP has been sent.'})
        _create_otp(email, 'forgot_password')
        return Response({'message': 'OTP sent to your email.'})


class ResetPasswordView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email        = request.data.get('email', '').lower().strip()
        new_password = request.data.get('new_password', '')

        if len(new_password) < 8:
            return Response({'error': 'Password must be at least 8 characters.'}, status=400)

        # Verify a used OTP exists (we verify first, then reset password in two steps)
        verified = OTPRecord.objects.filter(
            email=email, purpose='forgot_password', is_used=True
        ).order_by('-created_at').first()

        if not verified or (timezone.now() - verified.created_at).seconds > 1800:
            return Response({'error': 'OTP not verified. Please verify OTP first.'}, status=400)

        try:
            user = User.objects.get(email=email)
            user.set_password(new_password)
            user.save()
            # Invalidate all future resets from same OTP session
            verified.delete()
            return Response({'message': 'Password reset successfully. You can now log in.'})
        except User.DoesNotExist:
            return Response({'error': 'User not found.'}, status=404)


class LogoutView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data.get('refresh')
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response({'message': 'Logged out successfully.'})
        except Exception:
            return Response({'error': 'Invalid token.'}, status=status.HTTP_400_BAD_REQUEST)


class ProfileView(generics.RetrieveUpdateAPIView):
    permission_classes = [permissions.IsAuthenticated]
    parser_classes     = [MultiPartParser, FormParser, JSONParser]

    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return UserUpdateSerializer
        return UserSerializer

    def get_object(self):
        return self.request.user

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(UserSerializer(user, context={'request': request}).data)


class ChangePasswordView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        request.user.set_password(serializer.validated_data['new_password'])
        request.user.save()
        return Response({'message': 'Password changed successfully.'})


# ── Admin-only ────────────────────────────────────────────────────────────
class UserListView(generics.ListAPIView):
    serializer_class = UserSerializer
    permission_classes = [IsAdmin]
    filterset_fields = ['role', 'status']
    search_fields    = ['name', 'email', 'skill_set']

    def get_queryset(self):
        return User.objects.all()


class UserDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = UserSerializer
    permission_classes = [IsAdmin]
    queryset = User.objects.all()


class BlockUserView(APIView):
    permission_classes = [IsAdmin]

    def post(self, request, pk):
        try:
            user   = User.objects.get(pk=pk)
            action = request.data.get('action', 'block')
            user.status = 'blocked' if action == 'block' else 'active'
            user.save()
            return Response({'message': f'User {action}ed successfully.', 'status': user.status})
        except User.DoesNotExist:
            return Response({'error': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)


class DashboardStatsView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request):
        from apps.tasks.models import Task
        from apps.queries.models import ClientQuery
        from apps.companies.models import Company
        return Response({
            'total_employees':  User.objects.filter(role='employee').count(),
            'total_companies':  Company.objects.count(),
            'active_tasks':     Task.objects.filter(status__in=['pending', 'in_progress']).count(),
            'completed_tasks':  Task.objects.filter(status='completed').count(),
            'open_queries':     ClientQuery.objects.filter(status='open').count(),
            'overdue_tasks':    Task.objects.filter(
                status__in=['pending', 'in_progress']
            ).extra(where=["deadline < NOW()"]).count(),
        })
