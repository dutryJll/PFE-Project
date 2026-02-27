from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny
from .models import Candidature, Document
from .serializers import CandidatureSerializer, DocumentSerializer
import requests

class CreateCandidatureView(APIView):
    """Créer un compte dans auth-service ET une candidature"""
    permission_classes = [AllowAny]
    
    def post(self, request):
        print("📥 Réception données candidature:", request.data)
        
        # 1. Créer le compte dans auth-service
        auth_data = {
            'email': request.data.get('email'),
            'username': request.data.get('email'),
            'password': request.data.get('password'),
            'role': 'candidat',
            'first_name': request.data.get('first_name'),
            'last_name': request.data.get('last_name'),
        }
        
        try:
            # Appel à auth-service
            auth_response = requests.post(
                'http://localhost:8001/api/auth/register/',
                json=auth_data,
                timeout=10
            )
            
            if auth_response.status_code != 201:
                return Response(
                    {'error': 'Erreur lors de la création du compte', 'details': auth_response.json()},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            auth_user = auth_response.json()
            print("✅ Compte créé dans auth-service:", auth_user)
            
            # 2. Créer la candidature
            candidature_data = {
                'auth_user_id': auth_user['user']['id'],
                'email': request.data.get('email'),
                'first_name': request.data.get('first_name'),
                'last_name': request.data.get('last_name'),
                'cin': request.data.get('cin'),
                'telephone': request.data.get('telephone'),
                'date_naissance': request.data.get('date_naissance'),
                'moyenne_l1': request.data.get('moyenne_l1'),
                'moyenne_l2': request.data.get('moyenne_l2'),
                'moyenne_l3': request.data.get('moyenne_l3'),
                'moyenne_bac': request.data.get('moyenne_bac'),
                'type_candidature': request.data.get('type_candidature'),
                'voeux': request.data.get('voeux'),
                'specialite': request.data.get('specialite'),
            }
            
            serializer = CandidatureSerializer(data=candidature_data)
            if serializer.is_valid():
                candidature = serializer.save()
                print("✅ Candidature créée:", candidature)
                
                return Response({
                    'message': 'Compte et candidature créés avec succès',
                    'candidature': serializer.data,
                    'auth': auth_user
                }, status=status.HTTP_201_CREATED)
            else:
                print("❌ Erreur candidature:", serializer.errors)
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
                
        except requests.exceptions.RequestException as e:
            print("❌ Erreur connexion auth-service:", str(e))
            return Response(
                {'error': 'Impossible de contacter le service d\'authentification'},
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )


class CandidatureListView(generics.ListAPIView):
    """Liste toutes les candidatures d'un utilisateur"""
    serializer_class = CandidatureSerializer
    permission_classes = [AllowAny]
    
    def get_queryset(self):
        email = self.request.query_params.get('email')
        if email:
            return Candidature.objects.filter(email=email)
        return Candidature.objects.all()


class CandidatureDetailView(generics.RetrieveAPIView):
    """Détail d'une candidature"""
    queryset = Candidature.objects.all()
    serializer_class = CandidatureSerializer
    permission_classes = [AllowAny]


class MesCandidaturesView(APIView):
    """Récupérer toutes les candidatures d'un candidat"""
    permission_classes = [AllowAny]
    
    def get(self, request):
        email = request.query_params.get('email')
        if not email:
            return Response({'error': 'Email requis'}, status=status.HTTP_400_BAD_REQUEST)
        
        candidatures = Candidature.objects.filter(email=email)
        serializer = CandidatureSerializer(candidatures, many=True)
        return Response(serializer.data)