from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import Notification
from .serializers import NotificationSerializer


class NotificationListView(generics.ListAPIView):
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user)

    def list(self, request, *args, **kwargs):
        qs = self.get_queryset()
        unread = qs.filter(is_read=False).count()
        data = NotificationSerializer(qs[:30], many=True).data
        return Response({'notifications': data, 'unread_count': unread})


class MarkReadView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        """Mark all or specific notifications as read."""
        notif_id = request.data.get('id')
        if notif_id:
            Notification.objects.filter(user=request.user, id=notif_id).update(is_read=True)
        else:
            Notification.objects.filter(user=request.user, is_read=False).update(is_read=True)
        return Response({'message': 'Marked as read.'})


# Helper used by other apps to create notifications
def create_notification(user, title, message, notif_type='system'):
    Notification.objects.create(
        user=user,
        title=title,
        message=message,
        notif_type=notif_type,
    )
