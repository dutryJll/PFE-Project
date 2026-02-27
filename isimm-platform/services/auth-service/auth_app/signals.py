from django.core.mail import EmailMultiAlternatives
from django.dispatch import receiver
from django_rest_passwordreset.signals import reset_password_token_created

@receiver(reset_password_token_created)
def password_reset_token_created(sender, instance, reset_password_token, *args, **kwargs):
    """
    Envoi d'un email lorsqu'un token de réinitialisation est créé
    """
    email_plaintext_message = f"""
Bonjour {reset_password_token.user.username},

Vous avez demandé la réinitialisation de votre mot de passe sur la plateforme ISIMM Admissions.

Cliquez sur le lien ci-dessous pour créer un nouveau mot de passe :
http://localhost:4200/reset-password?token={reset_password_token.key}

Ce lien est valide pendant 24 heures.

Si vous n'avez pas fait cette demande, ignorez cet email.

Cordialement,
L'équipe ISIMM
    """

    msg = EmailMultiAlternatives(
        "Réinitialisation de votre mot de passe ISIMM",
        email_plaintext_message,
        "noreply@isimm.tn",
        [reset_password_token.user.email]
    )
    msg.send()