from django.conf.urls import url
from rest_framework.urlpatterns import format_suffix_patterns
from . import views

urlpatterns = [
    url(r'check_nickname', views.check_nickname, name = 'check_nickname'),
]

urlpatterns = format_suffix_patterns(urlpatterns)