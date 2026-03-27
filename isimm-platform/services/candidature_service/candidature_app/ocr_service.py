"""Module OCR/IA simplifie pour verifier la coherence dossier <-> donnees saisies.

Ce module sert de brique intelligente d'assistance commission (etape 4),
avec validation automatique en cas de correspondance fiable et alertes sinon.
"""

import json
from urllib import request as urllib_request
from urllib.error import URLError, HTTPError

from django.conf import settings


def _call_external_ocr(payload):
	"""Appel OCR externe optionnel. Retourne None si non configure ou echec."""
	provider = (getattr(settings, 'OCR_PROVIDER', 'none') or 'none').lower().strip()
	api_url = getattr(settings, 'OCR_API_URL', '') or ''
	api_key = getattr(settings, 'OCR_API_KEY', '') or ''

	if provider in {'', 'none'} or not api_url:
		return None

	body = json.dumps(payload).encode('utf-8')
	req = urllib_request.Request(api_url, data=body, method='POST')
	req.add_header('Content-Type', 'application/json')
	if api_key:
		req.add_header('Authorization', f'Bearer {api_key}')

	try:
		with urllib_request.urlopen(req, timeout=10) as resp:
			raw = resp.read().decode('utf-8')
			data = json.loads(raw)
			if isinstance(data, dict):
				return data
	except (HTTPError, URLError, TimeoutError, json.JSONDecodeError):
		return None

	return None


def _line_by_line_diff(declared_lines, extracted_lines):
	"""Comparaison ligne par ligne simple pour relevés/diplômes."""
	anomalies = []
	total = max(len(declared_lines), len(extracted_lines))

	for idx in range(total):
		declared = declared_lines[idx] if idx < len(declared_lines) else ''
		extracted = extracted_lines[idx] if idx < len(extracted_lines) else ''
		if str(declared).strip() != str(extracted).strip():
			anomalies.append(
				{
					'type': 'line_mismatch',
					'line': idx + 1,
					'declared': declared,
					'extracted': extracted,
					'message': 'Ecart detecte entre donnees saisies et extraction OCR.',
				}
			)

	return anomalies


def verifier_concordance_dossier(candidature, formulaire_payload):
	"""
	Retourne un diagnostic de coherence entre informations saisies et pieces declarees.
	Le traitement OCR reel n'est pas encore branche; on utilise ici une verification
	heuristique exploitable en production comme garde-fou initial.
	"""
	formulaire_payload = formulaire_payload or {}
	anomalies = []

	cin_saisi = str(formulaire_payload.get('cin') or '').strip()
	cin_compte = str(getattr(candidature.candidat, 'cin', '') or '').strip()
	if cin_saisi and cin_compte and cin_saisi != cin_compte:
		anomalies.append(
			{
				'type': 'cin_mismatch',
				'champ': 'cin',
				'saisi': cin_saisi,
				'officiel': cin_compte,
				'message': 'Incoherence CIN entre la fiche et les donnees compte.',
			}
		)

	notes_detaillees = {}
	if hasattr(candidature, 'donnees_academiques') and candidature.donnees_academiques:
		notes_detaillees = candidature.donnees_academiques.notes_detaillees or {}

	moyenne_saisie = formulaire_payload.get('moyenne_generale')
	moyenne_ref = notes_detaillees.get('moyenne_generale')
	if moyenne_saisie not in [None, ''] and moyenne_ref not in [None, '']:
		try:
			if abs(float(moyenne_saisie) - float(moyenne_ref)) > 0.5:
				anomalies.append(
					{
						'type': 'moyenne_mismatch',
						'champ': 'moyenne_generale',
						'saisi': moyenne_saisie,
						'officiel': moyenne_ref,
						'message': 'Ecart significatif detecte sur la moyenne generale.',
					}
				)
		except Exception:
			anomalies.append(
				{
					'type': 'moyenne_format',
					'champ': 'moyenne_generale',
					'message': 'Format non interpretable pour la moyenne generale.',
				}
			)

	documents = formulaire_payload.get('documents', [])
	if isinstance(documents, list):
		docs_norm = {str(doc).strip().lower() for doc in documents if str(doc).strip()}
		requis_min = {'releve_notes', 'diplome'}
		manquants = sorted(list(requis_min - docs_norm))
		if manquants:
			anomalies.append(
				{
					'type': 'documents_manquants',
					'champ': 'documents',
					'manquants': manquants,
					'message': 'Documents academiques minimaux manquants.',
				}
			)

	# Score de confiance simple: 100 sans anomalies, puis penalite lineaire.
	declared_lines = formulaire_payload.get('declared_lines', []) if isinstance(formulaire_payload, dict) else []
	extracted_lines = formulaire_payload.get('extracted_lines', []) if isinstance(formulaire_payload, dict) else []
	if isinstance(declared_lines, list) and isinstance(extracted_lines, list) and (declared_lines or extracted_lines):
		anomalies.extend(_line_by_line_diff(declared_lines, extracted_lines))

	external_payload = {
		'candidature_id': candidature.id,
		'cin': cin_saisi or cin_compte,
		'declared_lines': declared_lines,
		'extracted_lines': extracted_lines,
	}
	external_result = _call_external_ocr(external_payload)
	if external_result and isinstance(external_result, dict):
		ext_anomalies = external_result.get('anomalies', [])
		if isinstance(ext_anomalies, list):
			anomalies.extend(ext_anomalies)

	confiance = max(0, 100 - (len(anomalies) * 35))
	validation_auto = len(anomalies) == 0 and confiance >= 80

	return {
		'module': 'ocr_ia_assistant_v2',
		'validation_auto': validation_auto,
		'confiance': confiance,
		'anomalies': anomalies,
		'external_provider': getattr(settings, 'OCR_PROVIDER', 'none'),
		'external_used': bool(external_result),
		'decision': 'auto_valide' if validation_auto else 'revision_manuelle_requise',
	}
