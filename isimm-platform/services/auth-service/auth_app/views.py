from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.utils import timezone
from django.core.mail import send_mail
from django.conf import settings
import uuid

from .models import User
from .serializers import UserSerializer, RegisterSerializer
from .email_service import send_verification_email, send_login_notification


# ========================================
# INSCRIPTION
# ========================================
@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    """Inscription"""
    serializer = RegisterSerializer(data=request.data)
    
    if serializer.is_valid():
        user = serializer.save()
        
        # Envoyer email de vérification
        try:
            send_verification_email(user)
        except Exception as e:
            print(f"⚠️ Erreur envoi email: {e}")
        
        return Response({
            'message': 'Inscription réussie ! Vérifiez votre email.',
            'user': UserSerializer(user).data
        }, status=status.HTTP_201_CREATED)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ========================================
# CONNEXION
# ========================================
@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
    """Connexion"""
    email = request.data.get('email')
    password = request.data.get('password')
    
    if not email or not password:
        return Response(
            {'error': 'Email et mot de passe requis'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Authentifier
    user = authenticate(username=email, password=password)
    
    if user is None:
        return Response(
            {'error': 'Email ou mot de passe incorrect'},
            status=status.HTTP_401_UNAUTHORIZED
        )
    
    # Générer tokens JWT
    refresh = RefreshToken.for_user(user)
    
    # Mettre à jour dernière connexion
    user.derniere_connexion = timezone.now()
    user.save()
    
    # Envoyer notification
    try:
        ip_address = request.META.get('REMOTE_ADDR')
        send_login_notification(user, ip_address)
    except Exception as e:
        print(f"⚠️ Erreur notification: {e}")
    
    return Response({
        'user': UserSerializer(user).data,
        'access': str(refresh.access_token),
        'refresh': str(refresh)
    }, status=status.HTTP_200_OK)


# ========================================
# PROFIL
# ========================================
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_profile(request):
    """Obtenir profil"""
    return Response(
        UserSerializer(request.user).data,
        status=status.HTTP_200_OK
    )


@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def update_profile(request):
    """Modifier profil"""
    user = request.user
    data = request.data
    
    user.first_name = data.get('first_name', user.first_name)
    user.last_name = data.get('last_name', user.last_name)
    user.phone = data.get('phone', user.phone)
    user.address = data.get('address', user.address)
    user.save()
    
    return Response(
        UserSerializer(user).data,
        status=status.HTTP_200_OK
    )


# ========================================
# VÉRIFICATION EMAIL
# ========================================
@api_view(['GET'])
@permission_classes([AllowAny])
def verify_email(request, token):
    """Vérifier email"""
    try:
        user = User.objects.get(email_verification_token=token)
        
        if user.is_email_verified:
            return Response(
                {'message': 'Email déjà vérifié'},
                status=status.HTTP_200_OK
            )
        
        user.is_email_verified = True
        user.save()
        
        return Response({
            'message': 'Email vérifié avec succès !'
        }, status=status.HTTP_200_OK)
        
    except User.DoesNotExist:
        return Response(
            {'error': 'Token invalide'},
            status=status.HTTP_400_BAD_REQUEST
        )


# ========================================
# GESTION UTILISATEURS (ADMIN)
# ========================================
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_users(request):
    """Lister utilisateurs (Admin seulement)"""
    if request.user.role != 'admin':
        return Response(
            {'error': 'Accès refusé'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    users = User.objects.all().order_by('-date_inscription')
    return Response(
        UserSerializer(users, many=True).data,
        status=status.HTTP_200_OK
    )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_user(request):
    """Créer utilisateur (Admin seulement)"""
    if request.user.role != 'admin':
        return Response(
            {'error': 'Accès refusé'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    data = request.data
    
    user = User.objects.create_user(
        username=data.get('email'),
        email=data.get('email'),
        password=data.get('password'),
        first_name=data.get('first_name'),
        last_name=data.get('last_name'),
        role=data.get('role', 'candidat'),
        is_email_verified=True
    )
    
    return Response(
        UserSerializer(user).data,
        status=status.HTTP_201_CREATED
    )


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_user(request, user_id):
    """Supprimer utilisateur (Admin)"""
    if request.user.role != 'admin':
        return Response(
            {'error': 'Accès refusé'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    try:
        user = User.objects.get(id=user_id)
        user.delete()
        
        return Response(
            {'message': 'Utilisateur supprimé'},
            status=status.HTTP_200_OK
        )
    except User.DoesNotExist:
        return Response(
            {'error': 'Utilisateur non trouvé'},
            status=status.HTTP_404_NOT_FOUND
        )


# ========================================
# CRÉATION MEMBRE COMMISSION
# ========================================
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_commission_member(request):
    """Créer un membre de commission et envoyer lien d'activation"""
    # Vérifier que c'est un admin
    if request.user.role != 'admin':
        return Response(
            {'error': 'Accès refusé'}, 
            status=status.HTTP_403_FORBIDDEN
        )
    
    email = request.data.get('email')
    first_name = request.data.get('first_name')
    last_name = request.data.get('last_name')
    specialite = request.data.get('specialite')
    grade = request.data.get('grade')
    role = request.data.get('role')
    
    if not email or not first_name or not last_name:
        return Response(
            {'error': 'Email, prénom et nom requis'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Vérifier si l'email existe déjà
    if User.objects.filter(email=email).exists():
        return Response(
            {'error': 'Un compte avec cet email existe déjà'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Créer l'utilisateur SANS mot de passe
    user = User.objects.create(
        username=email,
        email=email,
        first_name=first_name,
        last_name=last_name,
        role=role,
        is_email_verified=False,
        is_active=False
    )
    
    # Générer un token unique
    activation_token = uuid.uuid4()
    user.email_verification_token = activation_token
    user.save()
    
    # Préparer l'email
    role_display = 'Responsable de Commission' if role == 'responsable_commission' else 'Membre de Commission'
    activation_link = f"{settings.FRONTEND_URL}/create-password/{activation_token}"
    
    subject = '🎓 Bienvenue sur la plateforme ISIMM'
    message = f"""
Bonjour {first_name} {last_name},

Votre compte a été créé sur la plateforme d'admission ISIMM.

INFORMATIONS DE VOTRE COMPTE :
━━━━━━━━━━━━━━━━━━━━━━━━━━
Rôle : {role_display}
Spécialité : {specialite}
Grade : {grade}
Email : {email}

ACTIVATION DE VOTRE COMPTE :
━━━━━━━━━━━━━━━━━━━━━━━━━━
Pour activer votre compte et créer votre mot de passe, cliquez sur le lien ci-dessous :

{activation_link}

⚠️ IMPORTANT :
- Ce lien est valide pendant 7 jours
- Vous devrez créer un mot de passe sécurisé (minimum 8 caractères)
- Une fois votre mot de passe créé, vous pourrez accéder à la plateforme

ACCÈS À LA PLATEFORME :
━━━━━━━━━━━━━━━━━━━━━━━━━━
Après activation : {settings.FRONTEND_URL}/login-commission

Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.

Cordialement,
L'équipe ISIMM
    """
    
    try:
        send_mail(
            subject,
            message,
            settings.DEFAULT_FROM_EMAIL,
            [email],
            fail_silently=False,
        )
        print(f"✅ Email d'activation envoyé à {email}")
        return Response({
            'message': 'Membre créé avec succès. Email d\'activation envoyé.',
            'user_id': user.id
        }, status=status.HTTP_201_CREATED)
    except Exception as e:
        # Si l'email échoue, supprimer l'utilisateur créé
        user.delete()
        print(f"❌ Erreur envoi email: {e}")
        return Response(
            {'error': f'Erreur lors de l\'envoi de l\'email: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


# ========================================
# CRÉER MOT DE PASSE AVEC TOKEN
# ========================================
@api_view(['POST'])
@permission_classes([AllowAny])
def set_password_with_token(request, token):
    """Créer le mot de passe avec le token reçu par email"""
    password = request.data.get('password')
    confirm_password = request.data.get('confirm_password')
    
    if not password or not confirm_password:
        return Response(
            {'error': 'Mot de passe et confirmation requis'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    if password != confirm_password:
        return Response(
            {'error': 'Les mots de passe ne correspondent pas'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    if len(password) < 8:
        return Response(
            {'error': 'Le mot de passe doit contenir au moins 8 caractères'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        user = User.objects.get(email_verification_token=token, is_active=False)
        
        # Définir le mot de passe
        user.set_password(password)
        user.is_active = True
        user.is_email_verified = True
        user.email_verification_token = None
        user.save()
        
        return Response({
            'message': 'Mot de passe créé avec succès ! Vous pouvez maintenant vous connecter.',
            'email': user.email
        }, status=status.HTTP_200_OK)
        
    except User.DoesNotExist:
        return Response(
            {'error': 'Lien invalide ou expiré'}, 
            status=status.HTTP_400_BAD_REQUEST
        )


# ========================================
# LISTER MEMBRES COMMISSION
# ========================================
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_commission_members(request):
    """Lister les membres de la commission"""
    if request.user.role != 'admin':
        return Response(
            {'error': 'Accès refusé'}, 
            status=status.HTTP_403_FORBIDDEN
        )
    
    # Récupérer les membres
    members = User.objects.filter(
        role__in=['commission', 'responsable_commission']
    ).order_by('-date_inscription')
    
    # Transformer en format Angular
    members_data = []
    for member in members:
        members_data.append({
            'id': member.id,
            'first_name': member.first_name,
            'last_name': member.last_name,
            'email': member.email,
            'specialite': 'Tous les masters',
            'grade': 'Maître de conférences',
            'role': member.role,
            'statut': 'actif' if member.is_active else 'suspendu',
            'date_creation': member.date_inscription.strftime('%Y-%m-%d') if member.date_inscription else ''
        })
    
    return Response(members_data, status=status.HTTP_200_OK)