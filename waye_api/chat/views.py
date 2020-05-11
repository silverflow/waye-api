from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response
import json

from .models import chatMember,chatRoom
from .serializers import ChatMemberSerializer, ChatRoomSerializer

@api_view(['GET'])
def get_room(request):
    # 방 목록 불러오기
    if request.method == 'GET':
        # 요청보낸 토큰 값으로 필터하기
        rooms = chatMember.objects.filter(user_id=request.user.pk)
        serializer = ChatMemberSerializer(rooms, many=True)
        if serializer.is_valid:
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
def create_room(request):
    #채팅방 생성
    if request.method == 'POST':
        room_instance = chatRoom(master_id=request.user.pk, room_name=request.data['room_name'])
        serializer = ChatRoomSerializer(room_instance, data=request.data)
        if serializer.is_valid():
            # 초대하기
            users = json.loads(str(request.data['user']))
            # 초대한 사람이 없으면 돌려보내기 잘못된 요청
            if len(users) < 1:
                return Response("create_room(), invited error", status=status.HTTP_400_BAD_REQUEST)
            # 방장 추가
            users += [request.user.pk]
            serializer.save()
            for user in users:
                invite_instance = chatMember(room_id=serializer.data['id'], user_id=user)
                invite_instance.save()
            room_instance.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['PATCH'])
def update_room(request, pk, format=None):
    # 방 제목 수정
    if request.data.get('room_name') is not None and request.data.get('profile') is not None:
        return Response("update_room(), 파라미터 에러", status=status.HTTP_400_BAD_REQUEST)
    room = chatRoom.objects.get(id=pk)
    if request.user.pk != room.master_id:
        # master_id가 같을 경우에만 수정 가능함
        return Response("update_room(), 방 이름을 수정할 권한이 없습니다.", status=status.HTTP_400_BAD_REQUEST)
    serializer = ChatRoomSerializer(room, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET','POST'])
def invite_room(request, pk):
    if request.method == 'POST':
        # 초대하기
        users = json.loads(str(request.data['user']))
        # 초대한 사람이 없으면 돌려보내기 잘못된 요청
        if len(users) < 1:
            return Response("create_room(), invited error", status=status.HTTP_400_BAD_REQUEST)
        for user in users:
            if chatMember.objects.filter(room_id=pk, user_id=user).count() < 2:
                invite_instance = chatMember(room_id=pk, user_id=user)
                invite_instance.save()
            else:
                return Response("중복된 요청",status=status.HTTP_400_BAD_REQUEST)
        return Response("초대 성공", status=status.HTTP_201_CREATED)
    return Response("error: invite_room()", status=status.HTTP_400_BAD_REQUEST)

@api_view(['PATCH'])
def kicked_room(request, pk):
    if request.method == 'PATCH':
        # 방장만 요청할 수 있음
        room = chatRoom.objects.filter(id=pk, master_id=request.user.pk)
        # 방 정보 없음->방장이 아니거나 잘못된 요청
        if room is None:
            return Response("error: kicked_room(), 방 정보 없음", status.HTTP_400_BAD_REQUEST)
        users = json.loads(str(request.data['user']))
        memberCheck = chatMember.objects.filter(room_id=pk).values()
        #방 안에 들어온 user배열이 있는지 없는지 체크하고 있으면 kick
        for user in users:
            for member in memberCheck:
                if user == member['user_id']:
                    kick_instance = chatMember.objects.get(id=member['id'], user_id=user, room_id=pk)
                    kick_instance.kicked = 1
                    kick_instance.save()
                    break
        return Response(str(users)+"강퇴", status=status.HTTP_200_OK)
    return Response("error:kicked_room()", status=status.HTTP_400_BAD_REQUEST)
