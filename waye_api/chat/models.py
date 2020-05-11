from django.db import models

class chatRoom(models.Model):
    # master = models.ForeignKey("auth.user", on_delete=models.CASCADE)
    profile = models.ImageField(null=True)
    room_name = models.CharField(max_length=100, null=False)
    _at = models.DateTimeField(auto_now_add=True)

class chatMember(models.Model):
    room = models.ForeignKey("chatRoom", on_delete=models.CASCADE)
    # user = models.ForeignKey("auth.user", on_delete=models.CASCADE)
    persnal_name = models.CharField(max_length=100,null=True)
    join_at = models.DateTimeField(auto_now_add=True)
    noti = models.PositiveSmallIntegerField(default=1,null=False)
    unread_cnt = models.IntegerField(null=False, default=0)
    exit = models.PositiveSmallIntegerField(null=False, default=0)
    kicked = models.PositiveSmallIntegerField(default=0)
    exit_at = models.DateTimeField(null=True,auto_now=False, auto_now_add=False)