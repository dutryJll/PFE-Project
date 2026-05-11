#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""Generate a valid Word report for sprint test results without external DOCX helpers."""

from datetime import date
import os
import zipfile
from xml.sax.saxutils import escape


def _paragraph_xml(text, bold=False, italic=False, center=False):
    props = []
    if center:
        props.append('<w:jc w:val="center"/>')
    if bold or italic:
        run_props = ''.join([
            '<w:b/>' if bold else '',
            '<w:i/>' if italic else '',
        ])
        run = f'<w:r><w:rPr>{run_props}</w:rPr><w:t>{escape(text)}</w:t></w:r>'
    else:
        run = f'<w:r><w:t>{escape(text)}</w:t></w:r>'
    p_pr = f'<w:pPr>{"".join(props)}</w:pPr>' if props else ''
    return f'<w:p>{p_pr}{run}</w:p>'


def create_word_document(output_path):
    paragraphs = []
    paragraphs.append(_paragraph_xml('RAPPORT DE TESTS - SPRINT 2', bold=True, center=True))
    paragraphs.append(_paragraph_xml("Plateforme d'Admission ISIMM", italic=True, center=True))
    paragraphs.append(_paragraph_xml(f'Date: {date.today().strftime("%d/%m/%Y")}'))
    paragraphs.append(_paragraph_xml(''))
    paragraphs.append(_paragraph_xml('1. Tests effectués', bold=True))
    paragraphs.append(_paragraph_xml(
        "À la fin du sprint 2, nous procédons à la revue des tâches de finalisation. Cette étape vise à présenter l'avancement du projet et à vérifier si les objectifs fixés ont été atteints."
    ))
    paragraphs.append(_paragraph_xml(
        "Les tests d'application jouent un rôle crucial pour garantir le bon fonctionnement de la plateforme. Le tableau suivant présente les tests effectués au cours de ce sprint."
    ))
    paragraphs.append(_paragraph_xml(''))
    paragraphs.append(_paragraph_xml('Tableau des tests - Sprint 2 (Candidature Service)', bold=True))
    paragraphs.append(_paragraph_xml('Module | Opération | Réussis | Échoués | Totaux', bold=True))
    paragraphs.append(_paragraph_xml('Intégration | Upload Document Simple | 1 | 0 | 1'))
    paragraphs.append(_paragraph_xml('Intégration | Upload Multiple Documents | 1 | 0 | 1'))
    paragraphs.append(_paragraph_xml('Intégration | Consulter Dossier | 1 | 0 | 1'))
    paragraphs.append(_paragraph_xml('Intégration | Soumission Dossier Incomplet | 1 | 0 | 1'))
    paragraphs.append(_paragraph_xml('Intégration | Soumission Dossier Complet | 1 | 0 | 1'))
    paragraphs.append(_paragraph_xml('Intégration | Suppression Document | 1 | 0 | 1'))
    paragraphs.append(_paragraph_xml('Intégration | Validation Format Fichier | 1 | 0 | 1'))
    paragraphs.append(_paragraph_xml('Intégration | Limite Taille Fichier | 1 | 0 | 1'))
    paragraphs.append(_paragraph_xml('Intégration | Dépassement Délai Dépôt | 1 | 0 | 1'))
    paragraphs.append(_paragraph_xml('Intégration | Liste Mes Dossiers | 1 | 0 | 1'))
    paragraphs.append(_paragraph_xml('Unitaire | Modèles, serializers, permissions et services métier | 27 | 0 | 27'))
    paragraphs.append(_paragraph_xml('Total | Sprint 2 | 37 | 0 | 37', bold=True))
    paragraphs.append(_paragraph_xml(''))
    paragraphs.append(_paragraph_xml('2. Problèmes rencontrés', bold=True))
    paragraphs.append(_paragraph_xml('Parmi les erreurs rencontrées, un point critique concernait la cohérence entre routes API, permissions et données de test simulées.'))
    paragraphs.append(_paragraph_xml('Cette incohérence provoquait des échecs (404/403 et erreurs de validation) lors de la soumission et du suivi des dossiers.'))
    paragraphs.append(_paragraph_xml(''))
    paragraphs.append(_paragraph_xml('3. Solution détaillée pour corriger le problème', bold=True))
    paragraphs.append(_paragraph_xml('La solution a consisté à corriger les routes exposées, aligner les rôles autorisés et fiabiliser les scénarios de test pour garantir des données cohérentes.'))
    paragraphs.append(_paragraph_xml('Nous avons également sécurisé le comportement asynchrone en mode test et corrigé la logique de checksum/document pour éviter les collisions.'))
    paragraphs.append(_paragraph_xml(''))
    paragraphs.append(_paragraph_xml('4. Résumé Exécutif', bold=True))
    paragraphs.append(_paragraph_xml('État des tests: TOUS LES TESTS PASSENT (37/37)'))
    paragraphs.append(_paragraph_xml('Statut global: SUCCÈS'))
    paragraphs.append(_paragraph_xml(''))
    paragraphs.append(_paragraph_xml('5. Problèmes Rencontrés et Solutions (Détail)', bold=True))
    problems = [
        ('404 - Endpoints manquants', 'Routes /api/dossier/* non exposées dans urls.py', 'Ajout de routes explicites mappant les endpoints aux actions ViewSet'),
        ('403 - Permission refusée', 'Rôle responsable_commission absent dans permissions', 'Ajout responsable_commission à la whitelist des permissions'),
        ('ConnectionRefusedError - Celery/Redis', 'Broker Redis absent en test, appel .delay() échoue', 'Configuration test avec CELERY_TASK_ALWAYS_EAGER'),
        ('IntegrityError - Checksum dupliqué', 'Checksum unique global, collision entre types', 'Checksum scope par candidature et type de document'),
        ('Template parse error', "Appel request.build_absolute_uri('/') invalide en template", 'Passage de site_url en contexte'),
    ]
    for title, cause, solution in problems:
        paragraphs.append(_paragraph_xml(f'Problème: {title}', bold=True))
        paragraphs.append(_paragraph_xml(f'Cause: {cause}'))
        paragraphs.append(_paragraph_xml(f'Solution: {solution}'))
        paragraphs.append(_paragraph_xml(''))
    paragraphs.append(_paragraph_xml('6. Conclusion', bold=True))
    paragraphs.append(_paragraph_xml("Tous les tests d'intégration et unitaires pour le module Candidature Service passent avec succès."))
    paragraphs.append(_paragraph_xml('Les endpoints de dépôt de dossier, permissions, traitements OCR, et workflows sont opérationnels.'))
    paragraphs.append(_paragraph_xml("L'application est prête pour l'intégration cross-service et le déploiement en staging."))
    paragraphs.append(_paragraph_xml(f'Rapport généré le {date.today().strftime("%d/%m/%Y")}', italic=True))

    document_xml = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
            xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <w:body>
    {body}
    <w:sectPr>
      <w:pgSz w:w="11906" w:h="16838"/>
      <w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440" w:header="708" w:footer="708" w:gutter="0"/>
    </w:sectPr>
  </w:body>
</w:document>'''.format(body=''.join(paragraphs))

    content_types = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>'''

    rels = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>'''

    with zipfile.ZipFile(output_path, 'w', zipfile.ZIP_DEFLATED) as docx:
        docx.writestr('[Content_Types].xml', content_types)
        docx.writestr('_rels/.rels', rels)
        docx.writestr('word/document.xml', document_xml)

    return output_path


if __name__ == '__main__':
    output = r'c:\Users\HP\Desktop\PFE\isimm-platform\tests_results\Rapport_Tests_Sprint2.docx'
    created_path = create_word_document(output)
    print(f'✅ Document créé avec succès: {created_path}')
    print(f'   Taille: {os.path.getsize(created_path) / 1024:.1f} KB')
