from django.contrib.auth import get_user_model
from rest_framework import serializers

from .models import (
    Candidature,
    ConfigurationAppel,
    DonneesAcademiques,
    FormuleScore,
    ListeAdmission,
    Master,
    Notification,
    OffreMaster,
)

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name']


class UserUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['first_name', 'last_name', 'email']


class MasterSerializer(serializers.ModelSerializer):
    class Meta:
        model = Master
        fields = '__all__'


class OffreMasterSerializer(serializers.ModelSerializer):
    master_id = serializers.IntegerField(source='master.id', read_only=True)
    nombre_candidats_inscrits = serializers.SerializerMethodField()

    class Meta:
        model = OffreMaster
        fields = [
            'id',
            'master_id',
            'titre',
            'description',
            'type_formation',
            'capacite',
            'date_limite',
            'date_debut_visibilite',
            'date_fin_visibilite',
            'date_limite_preinscription',
            'date_limite_depot_dossier',
            'capacites_detaillees',
            'appel_actif',
            'est_publiee',
            'actif',
            'created_at',
            'updated_at',
            'nombre_candidats_inscrits',
        ]

    def get_nombre_candidats_inscrits(self, obj):
        return Candidature.objects.filter(master_id=obj.master_id).count()


class CandidatureSerializer(serializers.ModelSerializer):
    master_nom = serializers.CharField(source='master.nom', read_only=True)
    peut_modifier = serializers.SerializerMethodField()
    jours_restants = serializers.SerializerMethodField()

    class Meta:
        model = Candidature
        fields = [
            'id',
            'numero',
            'master',
            'master_nom',
            'statut',
            'motif_rejet',
            'score',
            'classement',
            'date_soumission',
            'date_limite_modification',
            'date_changement_statut',
            'dossier_valide',
            'dossier_depose',
            'choix_priorite',
            'peut_modifier',
            'jours_restants',
        ]
        read_only_fields = ['numero', 'date_soumission']

    def get_peut_modifier(self, obj):
        return obj.peut_etre_modifie()

    def get_jours_restants(self, obj):
        if obj.statut != 'soumis' or not obj.date_limite_modification:
            return 0
        from django.utils import timezone

        delta = obj.date_limite_modification - timezone.now()
        return max(0, delta.days)


class ConfigurationAppelSerializer(serializers.ModelSerializer):
    master_nom = serializers.CharField(source='master.nom', read_only=True)
    est_visible = serializers.SerializerMethodField()
    peut_candidater = serializers.SerializerMethodField()
    document_officiel_pdf_url = serializers.SerializerMethodField()

    class Meta:
        model = ConfigurationAppel
        fields = '__all__'

    def get_est_visible(self, obj):
        return obj.est_visible()

    def get_peut_candidater(self, obj):
        return obj.peut_candidater()

    def get_document_officiel_pdf_url(self, obj):
        if not obj.document_officiel_pdf:
            return None
        request = self.context.get('request')
        if request:
            return request.build_absolute_uri(obj.document_officiel_pdf.url)
        return obj.document_officiel_pdf.url


class FormuleScoreSerializer(serializers.ModelSerializer):
    master_nom = serializers.CharField(source='master.nom', read_only=True)

    class Meta:
        model = FormuleScore
        fields = '__all__'


class DonneesAcademiquesSerializer(serializers.ModelSerializer):
    class Meta:
        model = DonneesAcademiques
        fields = '__all__'


class ListeAdmissionSerializer(serializers.ModelSerializer):
    master_nom = serializers.CharField(source='master.nom', read_only=True)

    class Meta:
        model = ListeAdmission
        fields = '__all__'


class NotificationSerializer(serializers.ModelSerializer):
    date = serializers.DateTimeField(source='created_at', read_only=True)

    class Meta:
        model = Notification
        fields = ['id', 'titre', 'message', 'type', 'lue', 'date']
