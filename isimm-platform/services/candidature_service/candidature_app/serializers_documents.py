"""
Serializers pour la gestion des documents et dépôt de dossiers - Sprint2
"""
from rest_framework import serializers
from django.core.files.base import ContentFile
from django.utils import timezone
import hashlib
import os

from .models import Document, DocumentType, ValidationDocument, Dossier, Candidature


class DocumentTypeSerializer(serializers.ModelSerializer):
    """Serializer pour les types de documents"""
    
    class Meta:
        model = DocumentType
        fields = [
            'id', 'type_document', 'obligatoire', 'description', 
            'taille_max_mb', 'formats_acceptes'
        ]


class DocumentSerializer(serializers.ModelSerializer):
    """Serializer pour les documents individuels"""
    type_document_detail = DocumentTypeSerializer(source='type_document', read_only=True)
    fichier_url = serializers.SerializerMethodField()
    
    class Meta:
        model = Document
        fields = [
            'id', 'type_document', 'type_document_detail', 'fichier', 'fichier_url',
            'nom_fichier_original', 'format_fichier', 'taille_bytes',
            'statut', 'description', 'score_ocr', 'donnees_extraites',
            'erreur_ocr', 'date_upload', 'date_traitement_ocr'
        ]
        read_only_fields = [
            'statut', 'score_ocr', 'donnees_extraites', 'erreur_ocr',
            'date_upload', 'date_traitement_ocr', 'taille_bytes'
        ]
    
    def get_fichier_url(self, obj):
        """Retourner l'URL du fichier"""
        if obj.fichier:
            return obj.fichier.url
        return None


class DocumentUploadSerializer(serializers.Serializer):
    """Serializer pour l'upload de documents avec validation"""
    type_document = serializers.PrimaryKeyRelatedField(
        queryset=DocumentType.objects.all()
    )
    fichier = serializers.FileField(required=True)
    description = serializers.CharField(required=False, allow_blank=True)
    
    def validate_fichier(self, file):
        """Valider le fichier"""
        # Taille max globale : 10MB
        if file.size > 10 * 1024 * 1024:
            raise serializers.ValidationError("Le fichier ne doit pas dépasser 10MB")
        
        return file
    
    def create(self, validated_data):
        """Créer le document"""
        candidature = self.context.get('candidature')
        type_document = validated_data['type_document']
        fichier = validated_data['fichier']
        description = validated_data.get('description', '')
        
        # Calculer le checksum pour éviter les doublons
        file_hash = hashlib.sha256()
        for chunk in fichier.chunks():
            file_hash.update(chunk)
        checksum = file_hash.hexdigest()
        
        # Vérifier si le fichier existe déjà
        existing = Document.objects.filter(checksum_sha256=checksum).first()
        if existing:
            raise serializers.ValidationError(
                f"Ce fichier a déjà été soumis: {existing.candidature.numero}"
            )
        
        # Obtenir l'extension du fichier
        _, file_extension = os.path.splitext(fichier.name)
        format_fichier = file_extension.lstrip('.').lower()
        
        # Créer le document
        document = Document.objects.create(
            candidature=candidature,
            type_document=type_document,
            fichier=fichier,
            nom_fichier_original=fichier.name,
            taille_bytes=fichier.size,
            format_fichier=format_fichier,
            description=description,
            checksum_sha256=checksum,
            statut='en_attente'
        )
        
        return document


class ValidationDocumentSerializer(serializers.ModelSerializer):
    """Serializer pour les validations de documents"""
    document_detail = DocumentSerializer(source='document', read_only=True)
    
    class Meta:
        model = ValidationDocument
        fields = [
            'id', 'document', 'document_detail', 'statut', 'commentaires',
            'valide_par', 'date_validation', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']


class DossierSerializer(serializers.ModelSerializer):
    """Serializer pour le dossier complet"""
    documents = DocumentSerializer(source='candidature.documents', many=True, read_only=True)
    completude_percentage = serializers.SerializerMethodField()
    
    class Meta:
        model = Dossier
        fields = [
            'id', 'candidature', 'statut', 'date_depot', 'date_limite_depot',
            'nb_documents_attendus', 'nb_documents_soumis', 'score_completude',
            'completude_percentage', 'documents', 'feedback', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'score_completude', 'nb_documents_soumis', 'created_at', 'updated_at'
        ]
    
    def get_completude_percentage(self, obj):
        """Obtenir le pourcentage de complétude"""
        return f"{obj.score_completude:.0f}%"


class DepotDossierSerializer(serializers.Serializer):
    """Serializer pour déposer/soumettre un dossier complet"""
    documents = DocumentUploadSerializer(many=True, required=True)
    
    def validate(self, data):
        """Valider les documents"""
        if not data.get('documents'):
            raise serializers.ValidationError("Au moins un document doit être soumis")
        
        return data


class DetailedDossierSerializer(serializers.ModelSerializer):
    """Serializer détaillé pour consulter un dossier"""
    candidature_numero = serializers.CharField(source='candidature.numero', read_only=True)
    candidat_nom = serializers.CharField(
        source='candidature.candidat.get_full_name', read_only=True
    )
    master_nom = serializers.CharField(source='candidature.master.nom', read_only=True)
    
    # Documents groupés par type
    documents_par_type = serializers.SerializerMethodField()
    
    # Évaluation de complétude
    evaluation = serializers.SerializerMethodField()
    
    class Meta:
        model = Dossier
        fields = [
            'id', 'candidature_numero', 'candidat_nom', 'master_nom',
            'statut', 'date_depot', 'date_limite_depot',
            'nb_documents_attendus', 'nb_documents_soumis',
            'score_completude', 'documents_par_type', 'evaluation',
            'feedback', 'created_at', 'updated_at'
        ]
    
    def get_documents_par_type(self, obj):
        """Grouper les documents par type"""
        documents = obj.candidature.documents.select_related('type_document')
        grouped = {}
        
        for doc in documents:
            type_name = doc.type_document.get_type_document_display()
            if type_name not in grouped:
                grouped[type_name] = []
            
            grouped[type_name].append({
                'id': doc.id,
                'nom': doc.nom_fichier_original,
                'statut': doc.statut,
                'date_upload': doc.date_upload,
                'score_ocr': doc.score_ocr,
            })
        
        return grouped
    
    def get_evaluation(self, obj):
        """Évaluation détaillée de complétude"""
        docs_valides = obj.candidature.documents.filter(statut='valide').count()
        docs_rejected = obj.candidature.documents.filter(statut='rejete').count()
        docs_pending = obj.candidature.documents.filter(
            statut__in=['en_attente', 'en_cours_ocr']
        ).count()
        
        return {
            'total_expected': obj.nb_documents_attendus,
            'validated': docs_valides,
            'rejected': docs_rejected,
            'pending': docs_pending,
            'percentage': f"{obj.score_completude:.0f}%",
            'is_complete': obj.statut == 'complet',
        }
