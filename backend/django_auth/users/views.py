from rest_framework import generics
from rest_framework.permissions import AllowAny
from .serializers import RegisterSerializer
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import Profile

class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]

@api_view(['GET', 'PATCH'])
@permission_classes([IsAuthenticated])
def me(request):
    user = request.user
    # Ensure profile exists, or create it if it's missing
    profile, created = Profile.objects.get_or_create(user=user)

    if request.method == 'GET':
        avatar_url = None
        if profile.avatar:
            avatar_url = request.build_absolute_uri(profile.avatar.url)

        return Response({
            "username": user.username,
            "email": user.email,
            "organization": profile.organization,
            "role": profile.role,
            "avatar": avatar_url
        })

    if request.method == 'PATCH':
        # 1. Update User model fields
        if 'username' in request.data:
            user.username = request.data['username']
        if 'email' in request.data:
            user.email = request.data['email']
        user.save()

        # 2. Update Profile model fields
        # Use .get() but ensure it doesn't overwrite with None if the key is missing
        if 'organization' in request.data:
            profile.organization = request.data['organization']
        
        if 'role' in request.data:
            profile.role = request.data['role']

        # 3. Handle the Avatar File
        if 'avatar' in request.FILES:
            profile.avatar = request.FILES['avatar']
        
        profile.save()
        
        return Response({
            "status": "success", 
            "message": "Profile updated successfully",
        })