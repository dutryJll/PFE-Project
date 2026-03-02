from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import RefreshToken

User = get_user_model()

@api_view(['POST'])
@permission_classes([AllowAny])  # ✅ IMPORTANT - Accessible sans authentification
def register_user(request):
    """
    Créer un nouvel utilisateur
    """
    try:
        data = request.data
        
        # Vérifier les champs obligatoires
        required_fields = ['email', 'password', 'first_name', 'last_name']
        for field in required_fields:
            if field not in data:
                return Response({
                    'error': f'Le champ {field} est obligatoire'
                }, status=status.HTTP_400_BAD_REQUEST)
        
        # Vérifier si l'email existe déjà
        if User.objects.filter(email=data['email']).exists():
            return Response({
                'error': 'Un utilisateur avec cet email existe déjà'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Créer l'utilisateur
        user = User.objects.create_user(
            username=data.get('username', data['email']),
            email=data['email'],
            password=data['password'],
            first_name=data['first_name'],
            last_name=data['last_name'],
            role=data.get('role', 'candidat')
        )
        
        # Générer les tokens JWT
        refresh = RefreshToken.for_user(user)
        
        return Response({
            'message': 'Utilisateur créé avec succès',
            'user': {
                'id': user.id,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'role': user.role
            },
            'access': str(refresh.access_token),
            'refresh': str(refresh)
        }, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        return Response({
            'error': 'Erreur lors de la création de l\'utilisateur',
            'details': str(e)
        }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])
def login_user(request):
    """
    Authentifier un utilisateur et retourner les tokens JWT
    """
    try:
        email = request.data.get('email')
        password = request.data.get('password')

        if not email or not password:
            return Response({
                'error': 'Email et mot de passe sont obligatoires'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Chercher l'utilisateur par email
        user = User.objects.filter(email=email).first()

        if not user or not user.check_password(password):
            return Response({
                'error': 'Email ou mot de passe incorrect'
            }, status=status.HTTP_401_UNAUTHORIZED)

        # Générer les tokens JWT
        refresh = RefreshToken.for_user(user)

        return Response({
            'message': 'Connexion réussie',
            'user': {
                'id': user.id,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'role': getattr(user, 'role', 'candidat')
            },
            'access': str(refresh.access_token),
            'refresh': str(refresh)
        }, status=status.HTTP_200_OK)

    except Exception as e:
        return Response({
            'error': 'Erreur lors de la connexion',
            'details': str(e)
        }, status=status.HTTP_400_BAD_REQUEST)