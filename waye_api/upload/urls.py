from django.conf.urls import url
from upload.views import FileView

urlpatterns = [
    url(r'^profile/$', FileView.as_view(), name='file-upload'),
]