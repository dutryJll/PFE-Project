from django.db.models.signals import pre_save, post_save
from django.dispatch import receiver
from django.utils import timezone

from .models import Candidature
from .emails import envoyer_email_changement_statut


@receiver(pre_save, sender=Candidature)
def candidature_pre_save(sender, instance, **kwargs):
	"""Store the previous statut on the instance before saving."""
	if instance.pk:
		try:
			previous = Candidature.objects.get(pk=instance.pk)
			instance._old_statut = previous.statut
		except Candidature.DoesNotExist:
			instance._old_statut = None
	else:
		instance._old_statut = None


@receiver(post_save, sender=Candidature)
def candidature_post_save(sender, instance, created, **kwargs):
	"""Send an email to the candidate when the `statut` field changes.

	Uses `envoyer_email_changement_statut` defined in `emails.py`.
	"""
	# Do not notify on creation
	if created:
		return

	ancien = getattr(instance, '_old_statut', None)
	nouveau = instance.statut

	if ancien != nouveau:
		try:
			envoyer_email_changement_statut(instance, ancien, nouveau)
		except Exception as e:
			# Avoid raising errors during save; log to stdout for now
			print(f"Erreur lors de l'envoi de l'email de changement de statut: {e}")

