from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.views import APIView
from .models import UserProfile
from .serializers import UserProfileSerializer

class UserListView(generics.ListAPIView):
    """Liste tous les profils (SANS authentification pour tests)"""
    queryset = UserProfile.objects.all()
    serializer_class = UserProfileSerializer
    permission_classes = [AllowAny]  # ✅ DÉSACTIVÉ temporairement

class UserProfileView(APIView):
    """Récupère le profil de l'utilisateur connecté"""
    permission_classes = [AllowAny]  # ✅ DÉSACTIVÉ temporairement

    def get(self, request):
        try:
            # Récupérer l'email depuis le token ou query param
            email = request.query_params.get('email')
            if not email and request.user and request.user.is_authenticated:
                email = request.user.email
            
            if not email:
                return Response(
                    {'error': 'Email requis'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            profile = UserProfile.objects.get(email=email)
            serializer = UserProfileSerializer(profile)
            return Response(serializer.data)
        except UserProfile.DoesNotExist:
            return Response(
                {'error': 'Profil non trouvé'}, 
                status=status.HTTP_404_NOT_FOUND
            )

class UserProfileUpdateView(APIView):
    """Met à jour le profil"""
    permission_classes = [AllowAny]  # ✅ DÉSACTIVÉ temporairement

    def put(self, request):
        try:
            email = request.data.get('email')
            if not email:
                return Response(
                    {'error': 'Email requis'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            profile = UserProfile.objects.get(email=email)
            serializer = UserProfileSerializer(profile, data=request.data, partial=True)
            
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except UserProfile.DoesNotExist:
            return Response(
                {'error': 'Profil non trouvé'}, 
                status=status.HTTP_404_NOT_FOUND
            )

class UserDeleteView(generics.DestroyAPIView):
    """Supprime un utilisateur"""
    queryset = UserProfile.objects.all()
    permission_classes = [AllowAny]  # ✅ DÉSACTIVÉ temporairement