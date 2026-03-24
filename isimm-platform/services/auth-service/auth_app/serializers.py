from rest_framework import serializers
from .models import User, ActionRole

class UserSerializer(serializers.ModelSerializer):
    """Serializer pour le modèle User"""
    
    class Meta:
        model = User
        fields = [
            'id',
            'email',
            'username',
            'first_name',
            'last_name',
            'role',
            'is_email_verified',
            'phone',
            'address',
            'date_of_birth',
            'date_inscription',
            'derniere_connexion',
            'is_active',
            'is_staff',
        ]
        read_only_fields = ['id', 'date_inscription', 'derniere_connexion']

class RegisterSerializer(serializers.ModelSerializer):
    """Serializer pour l'inscription"""
    password2 = serializers.CharField(write_only=True)
    
    class Meta:
        model = User
        fields = ['email', 'password', 'password2', 'first_name', 'last_name', 'role']
        extra_kwargs = {
            'password': {'write_only': True}
        }
    
    def validate(self, data):
        if data['password'] != data['password2']:
            raise serializers.ValidationError("Les mots de passe ne correspondent pas")
        return data
    
    def create(self, validated_data):
        validated_data.pop('password2')
        user = User.objects.create_user(**validated_data)
        return user


class ActionRoleSerializer(serializers.ModelSerializer):
    class Meta:
        model = ActionRole
        fields = [
            'id',
            'action_no',
            'action_name',
            'target_role',
            'enabled',
            'description',
        ]