from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth import get_user_model

User = get_user_model()


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['name']   = user.name
        token['email']  = user.email
        token['role']   = user.role
        token['status'] = user.status
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        user = self.user
        if user.status == 'blocked':
            raise serializers.ValidationError('Your account has been blocked. Contact admin.')
        if not user.is_verified:
            raise serializers.ValidationError('Please verify your email before logging in.')
        photo_url = None
        if user.profile_photo:
            request = self.context.get('request')
            photo_url = request.build_absolute_uri(user.profile_photo.url) if request else user.profile_photo.url
        data['user'] = {
            'id':          user.id,
            'name':        user.name,
            'email':       user.email,
            'role':        user.role,
            'status':      user.status,
            'mobile':      user.mobile,
            'skill_set':   user.skill_set,
            'is_verified': user.is_verified,
            'profile_photo': photo_url,
        }
        return data


class UserRegisterSerializer(serializers.ModelSerializer):
    password         = serializers.CharField(write_only=True, min_length=8)
    confirm_password = serializers.CharField(write_only=True)

    class Meta:
        model  = User
        fields = ['id', 'name', 'email', 'mobile', 'password', 'confirm_password', 'role', 'skill_set']

    def validate(self, attrs):
        if attrs['password'] != attrs.pop('confirm_password'):
            raise serializers.ValidationError({'confirm_password': 'Passwords do not match.'})
        if attrs.get('role') == 'admin':
            raise serializers.ValidationError({'role': 'Cannot self-register as admin.'})
        return attrs

    def create(self, validated_data):
        # is_active=False until OTP verified
        user = User.objects.create_user(is_active=False, is_verified=False, **validated_data)
        return user


class UserSerializer(serializers.ModelSerializer):
    profile_photo_url = serializers.SerializerMethodField()

    class Meta:
        model  = User
        fields = ['id', 'name', 'email', 'mobile', 'skill_set', 'role', 'status',
                  'is_verified', 'profile_photo', 'profile_photo_url', 'created_at']
        read_only_fields = ['id', 'created_at', 'profile_photo_url']

    def get_profile_photo_url(self, obj):
        if obj.profile_photo:
            request = self.context.get('request')
            return request.build_absolute_uri(obj.profile_photo.url) if request else obj.profile_photo.url
        return None


class UserUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model  = User
        fields = ['name', 'mobile', 'skill_set', 'profile_photo']


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True, min_length=8)

    def validate_old_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError('Old password is incorrect.')
        return value
