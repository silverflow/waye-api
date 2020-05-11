from django.conf.urls import url
from rest_framework.urlpatterns import format_suffix_patterns
from . import views

urlpatterns = [
    url(r'roomlist', views.get_room, name = 'roomlist'),
    url(r'createroom', views.create_room, name = 'createRoom'),
    url(r'updateroom/(?P<pk>[0-9]+)/$', views.update_room, name = 'updateRoom'),
    url(r'inviteroom/(?P<pk>[0-9]+)/$', views.invite_room, name = 'inviteRoom'),
    url(r'kickroom/(?P<pk>[0-9]+)/$', views.kicked_room, name = 'kickRoom'),
]

urlpatterns = format_suffix_patterns(urlpatterns)