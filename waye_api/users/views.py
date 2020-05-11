from allauth.socialaccount.providers.facebook.views import FacebookOAuth2Adapter
from allauth.socialaccount.providers.kakao.views import KakaoOAuth2Adapter
from allauth.socialaccount.providers.google.views import GoogleOAuth2Adapter
from rest_auth.registration.views import SocialLoginView

from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import User

class FacebookLogin(SocialLoginView):
    adapter_class = FacebookOAuth2Adapter

class KakaoLogin(SocialLoginView):
    adapter_class = KakaoOAuth2Adapter

class GoogleLogin(SocialLoginView):
    adapter_class = GoogleOAuth2Adapter

@api_view(['POST'])
def check_nickname(request):
    # 닉네임 검사
    if request.method == 'POST':
        # 중복확인
        users = User.objects.filter(username=request.data['username']).count()
        print(users)
        if users != 0:
            return Response(status=status.HTTP_400_BAD_REQUEST)
        else:
            return Response(status=status.HTTP_200_OK)
            