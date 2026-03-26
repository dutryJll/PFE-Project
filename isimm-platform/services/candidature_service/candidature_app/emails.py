from django.core.mail import send_mail, EmailMultiAlternatives
from django.template.loader import render_to_string
from django.conf import settings
from django.utils.html import strip_tags

def envoyer_email_confirmation_candidature(candidature):
    """Email de confirmation après soumission"""
    subject = f"Confirmation de candidature - {candidature.master.nom}"
    
    html_message = render_to_string('emails/confirmation_candidature.html', {
        'candidat': candidature.candidat,
        'candidature': candidature,
        'master': candidature.master,
        'date_limite': candidature.date_limite_modification.strftime('%d/%m/%Y à %H:%M')
    })
    
    plain_message = strip_tags(html_message)
    
    send_mail(
        subject=subject,
        message=plain_message,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[candidature.candidat.email],
        html_message=html_message,
        fail_silently=False
    )
    
    candidature.notification_envoyee = True
    candidature.save()


def envoyer_email_changement_statut(candidature, ancien_statut, nouveau_statut):
    """Email lors du changement de statut"""
    subject = f"Mise à jour de votre candidature - {candidature.master.nom}"
    
    messages_statut = {
        'sous_examen': 'Votre candidature est en cours d\'examen par la commission.',
        'preselectionne': 'Félicitations ! Vous avez été présélectionné(e).',
        'rejete': 'Malheureusement, votre candidature n\'a pas été retenue.',
        'selectionne': 'Félicitations ! Vous avez été sélectionné(e) pour une admission.',
        'en_attente_dossier': 'Vous êtes invité(e) à déposer votre dossier numérique.',
    }
    
    html_message = render_to_string('emails/changement_statut.html', {
        'candidat': candidature.candidat,
        'candidature': candidature,
        'master': candidature.master,
        'ancien_statut': ancien_statut,
        'nouveau_statut': nouveau_statut,
        'message': messages_statut.get(nouveau_statut, 'Votre candidature a été mise à jour.')
    })
    
    plain_message = strip_tags(html_message)
    
    send_mail(
        subject=subject,
        message=plain_message,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[candidature.candidat.email],
        html_message=html_message,
        fail_silently=False
    )


def envoyer_notification_liste_publiee(candidat_liste):
    """Envoyer notification de publication de liste"""
    from datetime import timedelta
    
    candidature = candidat_liste.candidature
    candidat = candidature.candidat
    liste = candidat_liste.liste
    master = liste.master
    
    if liste.type_liste == 'principale':
        subject = f"✅ FÉLICITATIONS - Vous êtes ADMIS(E) au {master.nom}"
    else:
        subject = f"📋 Liste d'attente - {master.nom}"
    
    date_limite_paiement = liste.date_publication + timedelta(days=7)
    
    context = {
        'candidat': candidat,
        'candidature': candidature,
        'master': master,
        'liste': liste,
        'type_liste': liste.type_liste,
        'position': candidat_liste.position,
        'score': candidat_liste.score,
        'iteration': liste.iteration,
        'date_publication': liste.date_publication.strftime('%d/%m/%Y à %H:%M'),
        'date_limite_paiement': date_limite_paiement.strftime('%d/%m/%Y')
    }
    
    html_message = render_to_string('emails/notification_liste_publiee.html', context)
    plain_message = strip_tags(html_message)
    
    email = EmailMultiAlternatives(
        subject=subject,
        body=plain_message,
        from_email=settings.DEFAULT_FROM_EMAIL,
        to=[candidat.email]
    )
    email.attach_alternative(html_message, "text/html")
    
    try:
        email.send(fail_silently=False)
        return True
    except Exception as e:
        print(f"Erreur envoi email à {candidat.email}: {e}")
        return False


def envoyer_notifications_masse(liste_admission):
    """Envoyer notifications à tous les candidats d'une liste"""
    candidats_listes = liste_admission.candidats.all()
    
    resultats = {
        'envoyes': 0,
        'echoues': 0,
        'total': candidats_listes.count()
    }
    
    for candidat_liste in candidats_listes:
        if envoyer_notification_liste_publiee(candidat_liste):
            resultats['envoyes'] += 1
        else:
            resultats['echoues'] += 1
    
    return resultats


def envoyer_email_inscription_validee(inscription):
    """Email de confirmation après validation du paiement d'inscription."""
    candidature = inscription.candidature
    candidat = candidature.candidat

    subject = f"Confirmation d'inscription validee - {candidature.master.nom}"
    message = (
        f"Bonjour {candidat.get_full_name() or candidat.username},\n\n"
        f"Votre paiement pour la candidature {candidature.numero} a ete valide.\n"
        f"Formation: {candidature.master.nom}\n"
        f"Reference paiement: {inscription.reference_paiement or '-'}\n"
        f"Montant: {inscription.montant_paye}\n\n"
        "Votre statut est maintenant: Inscrit.\n"
        "Cordialement,\n"
        "ISIMM Admission"
    )

    send_mail(
        subject=subject,
        message=message,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[candidat.email],
        fail_silently=False,
    )

    return True