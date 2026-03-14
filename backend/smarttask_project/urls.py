from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/',              admin.site.urls),
    path('api/auth/',           include('apps.accounts.urls')),
    path('api/tasks/',          include('apps.tasks.urls')),
    path('api/companies/',      include('apps.companies.urls')),
    path('api/queries/',        include('apps.queries.urls')),
    path('api/notifications/',  include('apps.notifications.urls')),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
