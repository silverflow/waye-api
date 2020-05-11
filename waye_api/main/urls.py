from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_jwt.views import verify_jwt_token
from django.conf import settings
from django.conf.urls.static import static
from users.views import FacebookLogin, KakaoLogin, GoogleLogin

router = DefaultRouter()

urlpatterns = [
    path(r'', include(router.urls)),
    path(r'admin/', admin.site.urls),
    path(r'rest-auth/', include('rest_auth.urls')),
    path(r'rest-auth/registration/', include('rest_auth.registration.urls')),
    path(r'upload/', include('upload.urls')),
    path(r'chat/', include('chat.urls')),
    path(r'users/', include('users.urls')),
    path(r'verify/', verify_jwt_token),
    path(r'rest-auth/facebook/', FacebookLogin.as_view(), name='fb_login'),
    path(r'rest-auth/kakao/', KakaoLogin.as_view(), name='kakao_login'),
    path(r'rest-auth/google/', GoogleLogin.as_view(), name='google_login'),
]
if settings.DEBUG:
  urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)