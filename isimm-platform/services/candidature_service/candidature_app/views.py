from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from .models import Candidature
import requests
from django.contrib.auth.hashers import make_password, check_password
#from .models import User
from .serializers import UserSerializer, UserUpdateSerializer
import uuid

@api_view(['POST'])
@permission_classes([AllowAny])
def create_candidature(request):
    """
    Créer une candidature et un compte utilisateur automatiquement
    """
    try:
        data = request.data
        print('📥 Données reçues:', data)
        
        # Vérifier les champs obligatoires
        required_fields = ['first_name', 'last_name', 'cin', 'email', 'telephone', 'type_candidature']
        missing_fields = [field for field in required_fields if field not in data or not data[field]]
        
        if missing_fields:
            return Response({
                'error': 'Champs obligatoires manquants',
                'details': {'missing_fields': missing_fields}
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Vérifier si le CIN existe déjà
        if Candidature.objects.filter(cin=data['cin']).exists():
            return Response({
                'error': 'Une candidature avec ce CIN existe déjà'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Créer le compte utilisateur via auth-service
        auth_service_url = 'http://127.0.0.1:8001/api/auth/register/'
        
        user_data = {
            'username': data['email'],
            'email': data['email'],
            'password': data.get('password', 'TempPassword123!'),
            'first_name': data['first_name'],
            'last_name': data['last_name'],
            'role': 'candidat'
        }
        
        print(f'📤 Envoi vers {auth_service_url}')
        
        try:
            auth_response = requests.post(
                auth_service_url,
                json=user_data,
                headers={'Content-Type': 'application/json'},
                timeout=5
            )
            
            print(f'📬 Réponse: {auth_response.status_code}')
            
            if auth_response.status_code != 201:
                return Response({
                    'error': 'Erreur création compte',
                    'details': auth_response.json() if auth_response.text else {}
                }, status=status.HTTP_400_BAD_REQUEST)
            
            user_info = auth_response.json()
            
        except requests.exceptions.RequestException as e:
            return Response({
                'error': 'Service auth non disponible',
                'details': str(e)
            }, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        
        # Créer la candidature
        candidature = Candidature.objects.create(
            user_id=user_info['user']['id'],
            cin=data['cin'],
            telephone=data['telephone'],
            date_naissance=data.get('date_naissance'),
            adresse=data.get('adresse'),
            ville=data.get('ville'),
            code_postal=data.get('code_postal'),
            type_candidature=data['type_candidature'],
            voeux=data.get('voeux'),
            specialite=data.get('specialite'),
            statut='en_cours'
        )
        
        print(f'✅ Candidature créée: {candidature.id}')
        
        return Response({
            'message': 'Candidature créée avec succès',
            'candidature_id': candidature.id,
            'user': user_info['user'],
            'token': user_info.get('access'),
            'password': user_data['password']
        }, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        print(f'❌ Erreur:', str(e))
        import traceback
        traceback.print_exc()
        
        return Response({
            'error': 'Erreur création candidature',
            'details': str(e)
        }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def mes_candidatures(request):
    """
    Récupérer les candidatures de l'utilisateur connecté
    """
    from .serializers import CandidatureSerializer
    
    candidatures = Candidature.objects.filter(user_id=request.user.id)
    serializer = CandidatureSerializer(candidatures, many=True)
    return Response(serializer.data)
@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def update_profile(request):
    """Mettre à jour le profil utilisateur"""
    user = request.user
    serializer = UserUpdateSerializer(user, data=request.data, partial=True)
    
    if serializer.is_valid():
        serializer.save()
        return Response({'user': serializer.data})
    
    return Response(serializer.errors, status=400)


# ✅ NOUVELLE FONCTION ICI
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def send_member_credentials(request):
    """Envoyer identifiants au nouveau membre"""
    from django.core.mail import send_mail
    from django.conf import settings
    
    email = request.data.get('email')
    password = request.data.get('password')
    first_name = request.data.get('first_name')
    last_name = request.data.get('last_name')
    role = request.data.get('role')
    
    if not email or not password:
        return Response({'error': 'Email et password requis'}, status=400)
    
    role_text = 'Responsable Commission' if role == 'responsable_commission' else 'Membre Commission'
    
    try:
        send_mail(
            subject='🎓 Vos identifiants ISIMM',
            message=f"""
Bonjour {first_name} {last_name},

Votre compte a été créé sur la plateforme ISIMM.

IDENTIFIANTS :
━━━━━━━━━━━━━━━━━━━━━━━━
Rôle : {role_text}
Email : {email}
Mot de passe : {password}

CONNEXION :
━━━━━━━━━━━━━━━━━━━━━━━━
{settings.FRONTEND_URL}/login-commission

Cordialement,
ISIMM
            """,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[email],
            fail_silently=False,
        )
        return Response({'message': 'Email envoyé'})
    except Exception as e:
        return Response({'error': str(e)}, status=500)