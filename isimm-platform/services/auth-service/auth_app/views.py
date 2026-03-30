from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
try:
    from rest_framework_simplejwt.tokens import RefreshToken
except ImportError:
    RefreshToken = None
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from django.utils import timezone
from django.core.mail import send_mail, get_connection
from django.conf import settings
from django.db import transaction
import uuid

from .models import User, ActionRole
from .serializers import UserSerializer, RegisterSerializer
from .email_service import send_verification_email, send_login_notification


ROLE_KEYS = ['candidat', 'commission', 'responsable_commission', 'admin']

DEFAULT_ACTIONS = [
    {'action_no': 1, 'action_name': 'Préinscription', 'enabled_roles': ['candidat']},
    {'action_no': 2, 'action_name': 'Dépôt de dossier', 'enabled_roles': ['candidat']},
    {'action_no': 3, 'action_name': 'Consultation de dossier', 'enabled_roles': ['candidat', 'commission']},
    {'action_no': 4, 'action_name': 'Consultation de candidature', 'enabled_roles': ['candidat', 'commission']},
    {'action_no': 5, 'action_name': 'Suivi de candidature', 'enabled_roles': ['candidat']},
    {'action_no': 6, 'action_name': 'Modifier candidature', 'enabled_roles': ['candidat']},
    {'action_no': 7, 'action_name': 'Déposer réclamation', 'enabled_roles': ['candidat']},
    {'action_no': 8, 'action_name': 'Consulter notifications', 'enabled_roles': ['candidat', 'commission', 'responsable_commission', 'admin']},
    {'action_no': 9, 'action_name': 'Vérifier dossiers', 'enabled_roles': ['commission', 'responsable_commission']},
    {'action_no': 10, 'action_name': 'Préselection', 'enabled_roles': ['commission', 'responsable_commission']},
    {'action_no': 11, 'action_name': 'Sélection finale', 'enabled_roles': ['responsable_commission']},
    {'action_no': 12, 'action_name': 'Publier liste principale', 'enabled_roles': ['responsable_commission']},
    {'action_no': 13, 'action_name': 'Publier liste attente', 'enabled_roles': ['responsable_commission']},
    {'action_no': 14, 'action_name': 'Traiter réclamations', 'enabled_roles': ['commission', 'responsable_commission']},
    {'action_no': 15, 'action_name': 'Gérer inscriptions', 'enabled_roles': ['responsable_commission']},
    {'action_no': 16, 'action_name': 'Assigner commission', 'enabled_roles': ['admin']},
    {'action_no': 17, 'action_name': 'Gérer masters', 'enabled_roles': ['admin']},
    {'action_no': 18, 'action_name': 'Gérer concours ingénieur', 'enabled_roles': ['admin']},
    {'action_no': 19, 'action_name': 'Gérer utilisateurs', 'enabled_roles': ['admin']},
    {'action_no': 20, 'action_name': 'Gérer matrice des actions', 'enabled_roles': ['admin']},
    {'action_no': 21, 'action_name': 'Consulter statistiques', 'enabled_roles': ['commission', 'responsable_commission', 'admin']},
    {'action_no': 22, 'action_name': 'Exporter données', 'enabled_roles': ['admin']},
]


def _ensure_default_action_roles():
    if ActionRole.objects.exists():
        return

    bulk_rows = []
    for row in DEFAULT_ACTIONS:
        for role in ROLE_KEYS:
            bulk_rows.append(
                ActionRole(
                    action_no=row['action_no'],
                    action_name=row['action_name'],
                    target_role=role,
                    enabled=role in row['enabled_roles'],
                )
            )

    ActionRole.objects.bulk_create(bulk_rows)


def _build_action_matrix_payload():
    grouped = {}
    rows = ActionRole.objects.all().order_by('action_no', 'target_role')

    for row in rows:
        if row.action_no not in grouped:
            grouped[row.action_no] = {
                'action_no': row.action_no,
                'action_name': row.action_name,
                'roles': {k: False for k in ROLE_KEYS},
            }
        grouped[row.action_no]['roles'][row.target_role] = row.enabled

    return [grouped[key] for key in sorted(grouped.keys())]


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
    raw_password = data.get('password')

    if not raw_password:
        return Response(
            {'error': 'Mot de passe requis'},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        validate_password(raw_password)
    except DjangoValidationError as exc:
        return Response(
            {'error': 'Mot de passe invalide', 'details': list(exc.messages)},
            status=status.HTTP_400_BAD_REQUEST,
        )
    
    user = User.objects.create_user(
        username=data.get('email'),
        email=data.get('email'),
        password=raw_password,
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
    
    created_new_user = False

    # Si un compte existe deja avec cet email, on le reutilise pour reaffecter la commission.
    user = User.objects.filter(email=email).first()

    if user:
        if user.role == 'admin':
            return Response(
                {'error': 'Impossible de convertir un compte administrateur en membre commission'},
                status=status.HTTP_400_BAD_REQUEST
            )

        user.username = email
        user.first_name = first_name
        user.last_name = last_name
        user.role = role
        user.is_email_verified = False
        user.is_active = False
        user.set_unusable_password()
    else:
        created_new_user = True
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

    # Générer ou réutiliser le token d'activation.
    # Si le compte est déjà en attente d'activation, on conserve le même token
    # pour éviter que les anciens emails deviennent invalides.
    reuse_existing_token = (
        bool(user.email_verification_token)
        and not user.is_active
        and not user.has_usable_password()
    )

    activation_token = user.email_verification_token if reuse_existing_token else uuid.uuid4()
    user.email_verification_token = activation_token
    user.save()
    
    # Préparer l'email
    role_display = 'Responsable de Commission' if role == 'responsable_commission' else 'Membre de Commission'
    activation_link = f"{settings.FRONTEND_URL}/create-password/{activation_token}"

    # Vérification explicite de la configuration SMTP.
    # Si SMTP est mal configuré, on bascule en backend console au lieu d'échouer.
    email_mode = getattr(settings, 'EMAIL_MODE', 'console')
    email_user = (getattr(settings, 'EMAIL_HOST_USER', '') or '').strip()
    email_password = (getattr(settings, 'EMAIL_HOST_PASSWORD', '') or '').strip()
    placeholder_passwords = {'votre_app_password', 'your_app_password', 'changeme', 'password'}
    smtp_invalid = email_mode == 'smtp' and (
        not email_user
        or not email_password
        or email_password.lower() in placeholder_passwords
    )

    email_backend_override = None
    if smtp_invalid:
        email_backend_override = 'django.core.mail.backends.console.EmailBackend'
    
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
        connection = get_connection(backend=email_backend_override) if email_backend_override else None
        send_mail(
            subject,
            message,
            settings.DEFAULT_FROM_EMAIL,
            [email],
            fail_silently=False,
            connection=connection,
        )
        print(f"✅ Email d'activation envoyé à {email}")
        email_backend = getattr(settings, 'EMAIL_BACKEND', '')
        is_console_backend = bool(email_backend_override) or 'console' in str(email_backend).lower()

        response_payload = {
            'message': 'Membre créé avec succès. Email d\'activation envoyé.',
            'user_id': user.id,
            'email_mode': 'console' if email_backend_override else email_mode,
        }

        if is_console_backend:
            if email_backend_override:
                response_payload['message'] = (
                    'Membre créé avec succès. SMTP invalide: bascule automatique en mode console. '
                    'Le lien d activation est affiché dans les logs du serveur.'
                )
            else:
                response_payload['message'] = (
                    'Membre créé avec succès. Mode email=console: le lien est affiché '
                    'dans les logs du serveur, aucun email réel n\'est envoyé.'
                )

        return Response(response_payload, status=status.HTTP_201_CREATED)
    except Exception as e:
        # Si l'email échoue, supprimer uniquement un nouvel utilisateur créé.
        if created_new_user:
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
    
    try:
        user = User.objects.get(email_verification_token=token, is_active=False)

        try:
            validate_password(password, user=user)
        except DjangoValidationError as exc:
            return Response(
                {'error': 'Mot de passe invalide', 'details': list(exc.messages)},
                status=status.HTTP_400_BAD_REQUEST,
            )
        
        # Définir le mot de passe
        user.set_password(password)
        user.is_active = True
        user.is_email_verified = True
        # Invalider le token en le remplaçant par un nouveau UUID.
        user.email_verification_token = uuid.uuid4()
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


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_commission_member(request, user_id):
    """Supprimer un membre de commission (admin uniquement)."""
    if request.user.role != 'admin':
        return Response(
            {'error': 'Accès refusé'},
            status=status.HTTP_403_FORBIDDEN
        )

    fallback_email = request.query_params.get('email')

    user = User.objects.filter(
        id=user_id,
        role__in=['commission', 'responsable_commission']
    ).first()

    if not user and fallback_email:
        user = User.objects.filter(
            email=fallback_email,
            role__in=['commission', 'responsable_commission']
        ).first()

    if not user:
        return Response(
            {'error': 'Membre de commission introuvable'},
            status=status.HTTP_404_NOT_FOUND
        )

    try:
        user.delete()

        return Response(
            {'message': 'Membre de commission supprimé définitivement'},
            status=status.HTTP_200_OK
        )
    except Exception as e:
        return Response(
            {'error': f'Erreur suppression: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
@permission_classes([AllowAny])
def verify_token(request, token):
    """
    Vérifie si le token est valide et retourne les infos utilisateur
    """
    try:
        # Le convertisseur <uuid:token> de Django peut déjà fournir un UUID.
        token_uuid = token if isinstance(token, uuid.UUID) else uuid.UUID(str(token))

        # Token de creation de mot de passe commission.
        user = User.objects.filter(
            email_verification_token=token_uuid,
            is_active=False
        ).first()
        
        if not user:
            return Response(
                {
                    'valid': False,
                    'error': 'Token invalide ou expiré',
                },
                status=status.HTTP_200_OK,
            )
        
        # Un compte deja actif a deja finalise son mot de passe.
        if user.has_usable_password() and user.is_email_verified:
            return Response(
                {
                    'valid': False,
                    'error': 'Ce lien a déjà été utilisé',
                },
                status=status.HTTP_200_OK,
            )
        
        return Response(
            {
                'valid': True,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
            },
            status=status.HTTP_200_OK,
        )
        
    except (ValueError, TypeError, AttributeError):
        return Response(
            {
                'valid': False,
                'error': 'Format de token invalide',
            },
            status=status.HTTP_200_OK,
        )


# ========================================
# MATRICE ACTIONS / RÔLES (ADMIN)
# ========================================
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def action_roles_matrix(request):
    if request.user.role != 'admin':
        return Response({'error': 'Accès refusé'}, status=status.HTTP_403_FORBIDDEN)

    _ensure_default_action_roles()
    return Response({'actions': _build_action_matrix_payload()}, status=status.HTTP_200_OK)


@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def update_action_roles_matrix(request):
    if request.user.role != 'admin':
        return Response({'error': 'Accès refusé'}, status=status.HTTP_403_FORBIDDEN)

    actions = request.data.get('actions', [])
    if not isinstance(actions, list) or not actions:
        return Response({'error': 'Le champ actions est requis'}, status=status.HTTP_400_BAD_REQUEST)

    normalized_rows = []
    for index, row in enumerate(actions):
        action_no = row.get('action_no', index + 1)
        action_name = (row.get('action_name') or '').strip()
        roles = row.get('roles') or {}

        if not action_name:
            return Response(
                {'error': f"Nom d'action manquant pour la ligne {index + 1}"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        for role in ROLE_KEYS:
            normalized_rows.append(
                ActionRole(
                    action_no=int(action_no),
                    action_name=action_name,
                    target_role=role,
                    enabled=bool(roles.get(role, False)),
                )
            )

    with transaction.atomic():
        ActionRole.objects.all().delete()
        ActionRole.objects.bulk_create(normalized_rows)

    return Response(
        {
            'message': 'Matrice action/rôle mise à jour avec succès',
            'actions': _build_action_matrix_payload(),
        },
        status=status.HTTP_200_OK,
    )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_enabled_actions(request):
    _ensure_default_action_roles()
    actions = ActionRole.objects.filter(target_role=request.user.role, enabled=True).order_by('action_no')

    return Response(
        {
            'role': request.user.role,
            'actions': [
                {
                    'action_no': row.action_no,
                    'action_name': row.action_name,
                }
                for row in actions
            ],
        },
        status=status.HTTP_200_OK,
    )