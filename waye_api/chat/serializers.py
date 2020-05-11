from rest_framework import serializers
from .models import chatRoom, chatMember

class ChatRoomSerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = chatRoom
        fields = ['id', 'master_id', 'profile', 'room_name', '_at']

class ChatMemberSerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = chatMember
        fields = ['id','persnal_name','join_at','noti','unread_cnt','exit','exit_at','room_id','user_id','kicked']