from datetime import date, timedelta
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIRequestFactory, force_authenticate

from .models import CandidatListe, Candidature, ListeAdmission, Master
from .views import create_candidature, changer_statut_candidature, publier_liste


class CandidatureWorkflowTests(TestCase):
	def setUp(self):
		self.factory = APIRequestFactory()
		self.user_model = get_user_model()

		self.candidat = self.user_model.objects.create_user(
			username='candidat1',
			email='candidat@example.com',
			password='test12345',
			first_name='Test',
			last_name='Candidat',
		)
		self.candidat.role = 'candidat'

		self.commission = self.user_model.objects.create_user(
			username='commission1',
			email='commission@example.com',
			password='test12345',
			first_name='Test',
			last_name='Commission',
		)
		self.commission.role = 'commission'

		self.responsable = self.user_model.objects.create_user(
			username='responsable1',
			email='responsable@example.com',
			password='test12345',
			first_name='Test',
			last_name='Responsable',
		)
		self.responsable.role = 'responsable_commission'

		self.master = Master.objects.create(
			nom='Master Test',
			type_master='recherche',
			description='Master de test',
			specialite='Genie Logiciel',
			places_disponibles=20,
			date_limite_candidature=date.today() + timedelta(days=30),
			annee_universitaire='2025-2026',
			actif=True,
		)

	@patch('candidature_app.views.envoyer_email_confirmation_candidature')
	def test_create_candidature_sends_confirmation_email(self, mock_confirmation_email):
		request = self.factory.post('/api/candidatures/create/', {'master_id': self.master.id}, format='json')
		force_authenticate(request, user=self.candidat)

		response = create_candidature(request)

		self.assertEqual(response.status_code, 201)
		self.assertEqual(Candidature.objects.count(), 1)
		mock_confirmation_email.assert_called_once()

	@patch('candidature_app.views.envoyer_email_changement_statut')
	def test_changer_statut_refuses_invalid_transition(self, mock_email_statut):
		candidature = Candidature.objects.create(candidat=self.candidat, master=self.master, statut='soumis')

		request = self.factory.post(
			f'/api/candidatures/{candidature.id}/changer-statut/',
			{'statut': 'inscrit'},
			format='json',
		)
		force_authenticate(request, user=self.commission)

		response = changer_statut_candidature(request, candidature.id)

		self.assertEqual(response.status_code, 400)
		candidature.refresh_from_db()
		self.assertEqual(candidature.statut, 'soumis')
		mock_email_statut.assert_not_called()

	@patch('candidature_app.views.envoyer_email_changement_statut')
	def test_changer_statut_valid_transition_updates_and_sends_email(self, mock_email_statut):
		candidature = Candidature.objects.create(candidat=self.candidat, master=self.master, statut='soumis')

		request = self.factory.post(
			f'/api/candidatures/{candidature.id}/changer-statut/',
			{'statut': 'sous_examen'},
			format='json',
		)
		force_authenticate(request, user=self.commission)

		response = changer_statut_candidature(request, candidature.id)

		self.assertEqual(response.status_code, 200)
		candidature.refresh_from_db()
		self.assertEqual(candidature.statut, 'sous_examen')
		self.assertTrue(candidature.date_changement_statut is not None)
		self.assertGreaterEqual(len(candidature.historique), 1)
		mock_email_statut.assert_called_once_with(candidature, 'soumis', 'sous_examen')

	@patch('candidature_app.views.envoyer_notifications_masse')
	def test_publier_liste_calls_mass_notifications(self, mock_notifications):
		mock_notifications.return_value = {'envoyes': 1, 'echoues': 0, 'total': 1}

		candidature = Candidature.objects.create(
			candidat=self.candidat,
			master=self.master,
			statut='dossier_depose',
			score=15.5,
		)
		liste = ListeAdmission.objects.create(
			master=self.master,
			type_liste='principale',
			iteration=1,
			annee_universitaire='2025-2026',
			capacite_accueil=20,
			places_restantes=20,
		)
		CandidatListe.objects.create(liste=liste, candidature=candidature, position=1, score=15.5)

		request = self.factory.post(f'/api/candidatures/listes/{liste.id}/publier/', {}, format='json')
		force_authenticate(request, user=self.responsable)

		response = publier_liste(request, liste.id)

		self.assertEqual(response.status_code, 200)
		liste.refresh_from_db()
		self.assertTrue(liste.publiee)
		self.assertIsNotNone(liste.date_publication)
		mock_notifications.assert_called_once_with(liste)
