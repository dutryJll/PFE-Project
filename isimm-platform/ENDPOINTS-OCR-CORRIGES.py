# ═══════════════════════════════════════════════════════════════════════════
# ENDPOINTS OCR CORRIGÉS — views.py
# ═══════════════════════════════════════════════════════════════════════════
#
# COPIER-COLLER CES FONCTIONS DANS:
# isimm-platform/services/candidature_service/candidature_app/views.py
# (Remplacer les anciennes fonctions au même endroit)
#
# ═══════════════════════════════════════════════════════════════════════════


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def analyser_ocr_lot(request):
    """
    ✅ ENDPOINT CORRIGÉ — Lance l'analyse OCR RÉELLE sur une liste de candidatures

    Utilise OCRService avec pdfplumber (pas simulation)
    Implémente Req-3: Actions automatiques (conforme/suspect)

    POST /api/candidatures/ocr/analyser-lot/
    Body: {"candidature_ids": [1, 2, 3]}

    Response:
    {
        "success": true,
        "message": "Analyse OCR complétée: 2 conforme(s), 1 incohérence(s)",
        "nb_total": 3,
        "nb_conformes": 2,
        "nb_incoherences": 1,
        "nb_erreurs": 0,
        "resultats": [
            {
                "candidature_id": 1,
                "candidat_nom": "Ahmed BEN ALI",
                "numero": "CND-001",
                "master": "Master Génie Logiciel",
                "success": true,
                "statut": "ok",                          ✅ Conforme
                "score_extrait": 14.17,                 ✅ Vrai du PDF
                "score_declare": 14.17,
                "ecart": 0.0,
                "confiance": 95,
                "moteur": "pdfplumber",                 ✅ Pas "simulation"
                "alerte": null,
                "fichier": "diplome_licence.pdf",
                "nb_anomalies": 0
            },
            {
                "candidature_id": 2,
                "candidat_nom": "Fatima SLIMANI",
                "numero": "CND-002",
                "master": "Master Data Science",
                "success": true,
                "statut": "anomalie",                    ⚠️ Incohérence
                "score_extrait": 14.17,
                "score_declare": 18.0,
                "ecart": 3.83,
                "confiance": 40,
                "moteur": "pdfplumber",
                "alerte": "Dossier Suspect — Écart de 3.83 pts entre déclaré (18.0) et extrait (14.17)",
                "fichier": "diplome_licence.pdf",
                "nb_anomalies": 1
            }
        ]
    }
    """
    import os as _os
    from django.conf import settings as _settings
    from .ocr_service import OCRService  # ✅ NOUVEAU: pdfplumber

    role = getattr(request.user, 'role', None)
    if role not in ('admin', 'responsable_commission', 'commission'):
        return Response({'error': 'Permission refusee'}, status=status.HTTP_403_FORBIDDEN)

    ids = request.data.get('candidature_ids') or []
    if not isinstance(ids, list) or not ids:
        return Response(
            {'error': 'Le champ candidature_ids doit etre une liste non vide.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    media_root = str(getattr(_settings, 'MEDIA_ROOT', ''))
    resultats = []
    erreurs = 0
    incoherences = 0

    for cand_id in ids:
        try:
            cand = Candidature.objects.select_related('candidat').get(pk=int(cand_id))
        except (Candidature.DoesNotExist, ValueError, TypeError):
            resultats.append({
                'candidature_id': cand_id,
                'candidat_nom': '',
                'success': False,
                'error': 'Candidature introuvable',
            })
            erreurs += 1
            continue

        # Cherche le 1er PDF dans le dossier
        cand_dir = _os.path.join(media_root, 'dossiers', str(cand.id))
        pdf_path = None
        if _os.path.isdir(cand_dir):
            for subdir in sorted(_os.listdir(cand_dir)):
                full_subdir = _os.path.join(cand_dir, subdir)
                if _os.path.isdir(full_subdir):
                    for fname in sorted(_os.listdir(full_subdir)):
                        if fname.lower().endswith('.pdf'):
                            pdf_path = _os.path.join(full_subdir, fname)
                            break
                    if pdf_path:
                        break

        if not pdf_path:
            resultats.append({
                'candidature_id': cand.id,
                'candidat_nom': cand.candidat.get_full_name(),
                'success': False,
                'error': 'Aucun PDF depose',
            })
            erreurs += 1
            continue

        try:
            score_declare = float(cand.score or 0) or None

            # ✅ APPEL À OCRService RÉEL (pdfplumber + Req-3)
            result = OCRService.analyser_releve_notes(pdf_path, score_declare)

            # Convertir statut OCRService → statut frontend
            statut = 'ok' if result['statut'] == 'conforme' else (
                'anomalie' if result['statut'] == 'incoherence' else 'erreur'
            )

            if statut == 'anomalie':
                incoherences += 1

            resultats.append({
                'candidature_id': cand.id,
                'candidat_nom': cand.candidat.get_full_name(),
                'numero': cand.numero,
                'master': cand.master.nom if cand.master else '',
                'success': True,
                'statut': statut,
                'score_extrait': result.get('score_extrait'),      # ✅ 14.17 (vrai du PDF)
                'score_declare': result.get('score_declare'),
                'ecart': result.get('ecart'),
                'confiance': result.get('confiance'),               # ✅ 95%
                'moteur': result.get('moteur'),                    # ✅ "pdfplumber"
                'alerte': result.get('alerte'),
                'fichier': _os.path.basename(pdf_path),
                'nb_anomalies': len(result.get('anomalies', [])),
            })
        except Exception as exc:
            logger.exception('OCR lot réel — erreur sur candidature %s', cand.id)
            resultats.append({
                'candidature_id': cand.id,
                'candidat_nom': cand.candidat.get_full_name(),
                'success': False,
                'statut': 'erreur',
                'error': str(exc)[:200],
            })
            erreurs += 1

    conformes = sum(1 for r in resultats if r.get('statut') == 'ok')

    return Response({
        'success': True,
        'message': f'Analyse OCR complétée: {conformes} conforme(s), {incoherences} incohérence(s)',
        'nb_total': len(ids),
        'nb_conformes': conformes,
        'nb_incoherences': incoherences,
        'nb_erreurs': erreurs,
        'resultats': resultats,
    })


# ═══════════════════════════════════════════════════════════════════════════


def _build_rapport_data(request, candidature_ids):
    """
    ✅ HELPER CORRIGÉ — Exécute l'OCR RÉELLE et retourne les données pour les rapports

    Utilise OCRService avec pdfplumber (Req-3) — pas simulation.
    Utilisé par:
        - /api/candidatures/rapport-conformite-ocr/excel/
        - /api/candidatures/rapport-conformite-ocr/pdf/

    Return: list of dicts with columns:
        numero, candidat_nom, candidat_email, master,
        score_declare, score_extrait, ecart, moteur, statut, fichier
    """
    import os as _os
    from django.conf import settings as _settings
    from .ocr_service import OCRService  # ✅ NOUVEAU: pdfplumber

    media_root = str(getattr(_settings, 'MEDIA_ROOT', ''))
    data = []

    for cand_id in candidature_ids:
        try:
            cand = Candidature.objects.select_related('candidat', 'master').get(pk=int(cand_id))
        except (Candidature.DoesNotExist, ValueError, TypeError):
            continue

        cand_dir = _os.path.join(media_root, 'dossiers', str(cand.id))
        pdf_path = None
        if _os.path.isdir(cand_dir):
            for subdir in sorted(_os.listdir(cand_dir)):
                full_subdir = _os.path.join(cand_dir, subdir)
                if _os.path.isdir(full_subdir):
                    for fname in sorted(_os.listdir(full_subdir)):
                        if fname.lower().endswith('.pdf'):
                            pdf_path = _os.path.join(full_subdir, fname)
                            break
                    if pdf_path:
                        break

        score_declare = float(cand.score or 0)
        row = {
            'numero':         cand.numero or '',
            'candidat_nom':   cand.candidat.get_full_name() or cand.candidat.email,
            'candidat_email': cand.candidat.email,
            'master':         cand.master.nom if cand.master else '',
            'score_declare':  score_declare,
            'score_extrait':  None,
            'ecart':          None,
            'moteur':         '—',
            'statut':         'Pas de PDF',
            'fichier':        '',
        }
        if pdf_path:
            try:
                # ✅ APPEL OCRService RÉEL (pdfplumber)
                result = OCRService.analyser_releve_notes(pdf_path, score_declare)

                row['score_extrait'] = result.get('score_extrait')      # ✅ 14.17 (vrai)
                row['ecart'] = result.get('ecart')
                row['moteur'] = result.get('moteur') or '—'            # ✅ "pdfplumber"

                if result['statut'] == 'conforme':
                    row['statut'] = 'Conforme'
                elif result['statut'] == 'incoherence':
                    row['statut'] = 'INCOHÉRENCE'
                else:
                    row['statut'] = 'Erreur OCR'

            except Exception as exc:
                logger.exception('OCR rapport — erreur cand %s', cand.id)
                row['statut'] = f'Erreur: {str(exc)[:80]}'
        data.append(row)
    return data


# ═══════════════════════════════════════════════════════════════════════════
# FIN DES ENDPOINTS CORRIGÉS
# ═══════════════════════════════════════════════════════════════════════════
