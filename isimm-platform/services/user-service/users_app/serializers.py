from rest_framework import serializers
from .models import UserProfile

class UserProfileSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    
    class Meta:
        model = UserProfile
        fields = [
            'id', 'auth_user_id', 'email', 'username', 'role',
            'first_name', 'last_name', 'full_name', 'cin', 'telephone',
            'date_naissance', 'adresse', 'ville', 'code_postal',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'auth_user_id', 'email', 'username', 'role', 'created_at', 'updated_at']
    
    def get_full_name(self, obj):
        return obj.get_full_name()

class UpdateProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = [
            'first_name', 'last_name', 'cin', 'telephone',
            'date_naissance', 'adresse', 'ville', 'code_postal'
        ]