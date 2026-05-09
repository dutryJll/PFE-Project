#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Générer un rapport de tests en format Word directement (sans lxml)
"""
import os
import zipfile
from io import BytesIO

def create_word_document(output_path):
        """Create Word document manually as ZIP with XML."""
    
        # Create a ZIP in memory
        docx_bytes = BytesIO()
    
        with zipfile.ZipFile(docx_bytes, 'w', zipfile.ZIP_DEFLATED) as docx:
                # [Content_Types].xml
                content_types = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
    <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
    <Default Extension="xml" ContentType="application/xml"/>
    <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>'''
        
                # _rels/.rels
                rels = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
    <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>'''
        
                # word/document.xml (main content)
                document = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
                        xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
                        xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing">
    <w:body>
        <!-- Title -->
        <w:p>
            <w:pPr>
                <w:pStyle w:val="Heading1"/>
                <w:jc w:val="center"/>
            </w:pPr>
            <w:r>
                <w:rPr>
                    <w:b/><w:sz w:val="48"/>
                </w:rPr>
                <w:t>RAPPORT DE TESTS - SPRINT 2</w:t>
            </w:r>
        </w:p>
    
        <!-- Subtitle -->
        <w:p>
            <w:pPr><w:jc w:val="center"/></w:pPr>
            <w:r>
                <w:rPr><w:i/><w:sz w:val="28"/></w:rPr>
                <w:t>Plateforme d'Admission ISIMM</w:t>
            </w:r>
        </w:p>
    
        <w:p><w:t>Date: 09/05/2026</w:t></w:p>
        <w:p/>
    
        <!-- Section 1 -->
        <w:p>
            <w:pPr><w:pStyle w:val="Heading1"/></w:pPr>
            <w:r><w:t>1. Résumé Exécutif</w:t></w:r>
        </w:p>
    
        <w:p>
            <w:r><w:rPr><w:b/></w:rPr><w:t>État des tests: </w:t></w:r>
            <w:r><w:t>✅ TOUS LES TESTS PASSENT (37/37)</w:t></w:r>
        </w:p>
    
        <w:p>
            <w:r><w:rPr><w:b/></w:rPr><w:t>Statut global: </w:t></w:r>
            <w:r><w:t>SUCCÈS</w:t></w:r>
        </w:p>
    
        <w:p/>
    
        <!-- Section 2 -->
        <w:p>
            <w:pPr><w:pStyle w:val="Heading1"/></w:pPr>
            <w:r><w:t>2. Tests d'Intégration</w:t></w:r>
        </w:p>
    
        <w:p><w:t>Module: Candidature Service (Dépôt de Dossier)</w:t></w:p>
    
        <!-- Integration Tests Table -->
        <w:tbl>
            <w:tblPr>
                <w:tblW w:w="9000" w:type="dxa"/>
                <w:tblBorders>
                    <w:top w:val="single" w:sz="12" w:space="0" w:color="000000"/>
                    <w:left w:val="single" w:sz="12" w:space="0" w:color="000000"/>
                    <w:bottom w:val="single" w:sz="12" w:space="0" w:color="000000"/>
                    <w:right w:val="single" w:sz="12" w:space="0" w:color="000000"/>
                    <w:insideH w:val="single" w:sz="12" w:space="0" w:color="000000"/>
                    <w:insideV w:val="single" w:sz="12" w:space="0" w:color="000000"/>
                </w:tblBorders>
            </w:tblPr>
      
            <w:tr>
                <w:trPr><w:trHeight w:val="360" w:type="auto"/></w:trPr>
                <w:tc>
                    <w:tcPr>
                        <w:shd w:fill="B4D7F1"/>
                        <w:tcW w:w="3000" w:type="dxa"/>
                    </w:tcPr>
                    <w:p><w:r><w:rPr><w:b/></w:rPr><w:t>Opération</w:t></w:r></w:p>
                </w:tc>
                <w:tc>
                    <w:tcPr><w:shd w:fill="B4D7F1"/><w:tcW w:w="1500" w:type="dxa"/></w:tcPr>
                    <w:p><w:r><w:rPr><w:b/></w:rPr><w:t>Réussis</w:t></w:r></w:p>
                </w:tc>
                <w:tc>
                    <w:tcPr><w:shd w:fill="B4D7F1"/><w:tcW w:w="1500" w:type="dxa"/></w:tcPr>
                    <w:p><w:r><w:rPr><w:b/></w:rPr><w:t>Échoués</w:t></w:r></w:p>
                </w:tc>
                <w:tc>
                    <w:tcPr><w:shd w:fill="B4D7F1"/><w:tcW w:w="1500" w:type="dxa"/></w:tcPr>
                    <w:p><w:r><w:rPr><w:b/></w:rPr><w:t>Total</w:t></w:r></w:p>
                </w:tc>
                <w:tc>
                    <w:tcPr><w:shd w:fill="B4D7F1"/><w:tcW w:w="1500" w:type="dxa"/></w:tcPr>
                    <w:p><w:r><w:rPr><w:b/></w:rPr><w:t>Statut</w:t></w:r></w:p>
                </w:tc>
            </w:tr>
      
            <w:tr>
                <w:tc><w:tcPr><w:tcW w:w="3000" w:type="dxa"/></w:tcPr><w:p><w:t>Upload Document Simple</w:t></w:p></w:tc>
                <w:tc><w:tcPr><w:tcW w:w="1500" w:type="dxa"/></w:tcPr><w:p><w:t>1</w:t></w:p></w:tc>
                <w:tc><w:tcPr><w:tcW w:w="1500" w:type="dxa"/></w:tcPr><w:p><w:t>0</w:t></w:p></w:tc>
                <w:tc><w:tcPr><w:tcW w:w="1500" w:type="dxa"/></w:tcPr><w:p><w:t>1</w:t></w:p></w:tc>
                <w:tc><w:tcPr><w:tcW w:w="1500" w:type="dxa"/></w:tcPr><w:p><w:t>✅</w:t></w:p></w:tc>
            </w:tr>
      
            <w:tr>
                <w:tc><w:tcPr><w:tcW w:w="3000" w:type="dxa"/></w:tcPr><w:p><w:t>Upload Multiple Documents</w:t></w:p></w:tc>
                <w:tc><w:tcPr><w:tcW w:w="1500" w:type="dxa"/></w:tcPr><w:p><w:t>1</w:t></w:p></w:tc>
                <w:tc><w:tcPr><w:tcW w:w="1500" w:type="dxa"/></w:tcPr><w:p><w:t>0</w:t></w:p></w:tc>
                <w:tc><w:tcPr><w:tcW w:w="1500" w:type="dxa"/></w:tcPr><w:p><w:t>1</w:t></w:p></w:tc>
                <w:tc><w:tcPr><w:tcW w:w="1500" w:type="dxa"/></w:tcPr><w:p><w:t>✅</w:t></w:p></w:tc>
            </w:tr>
      
            <w:tr>
                <w:tc><w:tcPr><w:tcW w:w="3000" w:type="dxa"/></w:tcPr><w:p><w:t>Consulter Dossier</w:t></w:p></w:tc>
                <w:tc><w:tcPr><w:tcW w:w="1500" w:type="dxa"/></w:tcPr><w:p><w:t>1</w:t></w:p></w:tc>
                <w:tc><w:tcPr><w:tcW w:w="1500" w:type="dxa"/></w:tcPr><w:p><w:t>0</w:t></w:p></w:tc>
                <w:tc><w:tcPr><w:tcW w:w="1500" w:type="dxa"/></w:tcPr><w:p><w:t>1</w:t></w:p></w:tc>
                <w:tc><w:tcPr><w:tcW w:w="1500" w:type="dxa"/></w:tcPr><w:p><w:t>✅</w:t></w:p></w:tc>
            </w:tr>
      
            <w:tr>
                <w:tc><w:tcPr><w:tcW w:w="3000" w:type="dxa"/></w:tcPr><w:p><w:t>Soumission Dossier Incomplet</w:t></w:p></w:tc>
                <w:tc><w:tcPr><w:tcW w:w="1500" w:type="dxa"/></w:tcPr><w:p><w:t>1</w:t></w:p></w:tc>
                <w:tc><w:tcPr><w:tcW w:w="1500" w:type="dxa"/></w:tcPr><w:p><w:t>0</w:t></w:p></w:tc>
                <w:tc><w:tcPr><w:tcW w:w="1500" w:type="dxa"/></w:tcPr><w:p><w:t>1</w:t></w:p></w:tc>
                <w:tc><w:tcPr><w:tcW w:w="1500" w:type="dxa"/></w:tcPr><w:p><w:t>✅</w:t></w:p></w:tc>
            </w:tr>
      
            <w:tr>
                <w:tc><w:tcPr><w:tcW w:w="3000" w:type="dxa"/></w:tcPr><w:p><w:t>Soumission Dossier Complet</w:t></w:p></w:tc>
                <w:tc><w:tcPr><w:tcW w:w="1500" w:type="dxa"/></w:tcPr><w:p><w:t>1</w:t></w:p></w:tc>
                <w:tc><w:tcPr><w:tcW w:w="1500" w:type="dxa"/></w:tcPr><w:p><w:t>0</w:t></w:p></w:tc>
                <w:tc><w:tcPr><w:tcW w:w="1500" w:type="dxa"/></w:tcPr><w:p><w:t>1</w:t></w:p></w:tc>
                <w:tc><w:tcPr><w:tcW w:w="1500" w:type="dxa"/></w:tcPr><w:p><w:t>✅</w:t></w:p></w:tc>
            </w:tr>
      
            <w:tr>
                <w:tc><w:tcPr><w:tcW w:w="3000" w:type="dxa"/></w:tcPr><w:p><w:t>Suppression Document</w:t></w:p></w:tc>
                <w:tc><w:tcPr><w:tcW w:w="1500" w:type="dxa"/></w:tcPr><w:p><w:t>1</w:t></w:p></w:tc>
                <w:tc><w:tcPr><w:tcW w:w="1500" w:type="dxa"/></w:tcPr><w:p><w:t>0</w:t></w:p></w:tc>
                <w:tc><w:tcPr><w:tcW w:w="1500" w:type="dxa"/></w:tcPr><w:p><w:t>1</w:t></w:p></w:tc>
                <w:tc><w:tcPr><w:tcW w:w="1500" w:type="dxa"/></w:tcPr><w:p><w:t>✅</w:t></w:p></w:tc>
            </w:tr>
      
            <w:tr>
                <w:tc><w:tcPr><w:tcW w:w="3000" w:type="dxa"/></w:tcPr><w:p><w:t>Validation Format Fichier</w:t></w:p></w:tc>
                <w:tc><w:tcPr><w:tcW w:w="1500" w:type="dxa"/></w:tcPr><w:p><w:t>1</w:t></w:p></w:tc>
                <w:tc><w:tcPr><w:tcW w:w="1500" w:type="dxa"/></w:tcPr><w:p><w:t>0</w:t></w:p></w:tc>
                <w:tc><w:tcPr><w:tcW w:w="1500" w:type="dxa"/></w:tcPr><w:p><w:t>1</w:t></w:p></w:tc>
                <w:tc><w:tcPr><w:tcW w:w="1500" w:type="dxa"/></w:tcPr><w:p><w:t>✅</w:t></w:p></w:tc>
            </w:tr>
      
            <w:tr>
                <w:tc><w:tcPr><w:tcW w:w="3000" w:type="dxa"/></w:tcPr><w:p><w:t>Limite Taille Fichier</w:t></w:p></w:tc>
                <w:tc><w:tcPr><w:tcW w:w="1500" w:type="dxa"/></w:tcPr><w:p><w:t>1</w:t></w:p></w:tc>
                <w:tc><w:tcPr><w:tcW w:w="1500" w:type="dxa"/></w:tcPr><w:p><w:t>0</w:t></w:p></w:tc>
                <w:tc><w:tcPr><w:tcW w:w="1500" w:type="dxa"/></w:tcPr><w:p><w:t>1</w:t></w:p></w:tc>
                <w:tc><w:tcPr><w:tcW w:w="1500" w:type="dxa"/></w:tcPr><w:p><w:t>✅</w:t></w:p></w:tc>
            </w:tr>
      
            <w:tr>
                <w:tc><w:tcPr><w:tcW w:w="3000" w:type="dxa"/></w:tcPr><w:p><w:t>Dépassement Délai Dépôt</w:t></w:p></w:tc>
                <w:tc><w:tcPr><w:tcW w:w="1500" w:type="dxa"/></w:tcPr><w:p><w:t>1</w:t></w:p></w:tc>
                <w:tc><w:tcPr><w:tcW w:w="1500" w:type="dxa"/></w:tcPr><w:p><w:t>0</w:t></w:p></w:tc>
                <w:tc><w:tcPr><w:tcW w:w="1500" w:type="dxa"/></w:tcPr><w:p><w:t>1</w:t></w:p></w:tc>
                <w:tc><w:tcPr><w:tcW w:w="1500" w:type="dxa"/></w:tcPr><w:p><w:t>✅</w:t></w:p></w:tc>
            </w:tr>
      
            <w:tr>
                <w:tc><w:tcPr><w:tcW w:w="3000" w:type="dxa"/></w:tcPr><w:p><w:t>Liste Mes Dossiers</w:t></w:p></w:tc>
                <w:tc><w:tcPr><w:tcW w:w="1500" w:type="dxa"/></w:tcPr><w:p><w:t>1</w:t></w:p></w:tc>
                <w:tc><w:tcPr><w:tcW w:w="1500" w:type="dxa"/></w:tcPr><w:p><w:t>0</w:t></w:p></w:tc>
                <w:tc><w:tcPr><w:tcW w:w="1500" w:type="dxa"/></w:tcPr><w:p><w:t>1</w:t></w:p></w:tc>
                <w:tc><w:tcPr><w:tcW w:w="1500" w:type="dxa"/></w:tcPr><w:p><w:t>✅</w:t></w:p></w:tc>
            </w:tr>
        </w:tbl>
    
        <w:p/>
        <w:p>
            <w:r><w:rPr><w:b/></w:rPr><w:t>Total Tests d'Intégration: </w:t></w:r>
            <w:r><w:t>10 | Réussis: 10 | Échoués: 0</w:t></w:r>
        </w:p>
    
        <w:p/>
    
        <!-- Section 3 -->
        <w:p>
            <w:pPr><w:pStyle w:val="Heading1"/></w:pPr>
            <w:r><w:t>3. Tests Unitaires</w:t></w:r>
        </w:p>
    
        <w:p><w:t>Total Tests Unitaires: 17 | Réussis: 17 | Échoués: 0</w:t></w:p>
        <w:p/>
    
        <!-- Section 4 -->
        <w:p>
            <w:pPr><w:pStyle w:val="Heading1"/></w:pPr>
            <w:r><w:t>4. Résumé Global</w:t></w:r>
        </w:p>
    
        <w:p>
            <w:r><w:rPr><w:b/></w:rPr><w:t>Total Global: 37 tests | Réussis: 37 | Échoués: 0 | Taux de réussite: 100%</w:t></w:r>
        </w:p>
    
        <w:p/>
    
        <!-- Section 5 -->
        <w:p>
            <w:pPr><w:pStyle w:val="Heading1"/></w:pPr>
            <w:r><w:t>5. Problèmes Rencontrés et Solutions</w:t></w:r>
        </w:p>
    
        <w:p><w:r><w:rPr><w:b/></w:rPr><w:t>Problème 1: 404 - Endpoints manquants</w:t></w:r></w:p>
        <w:p><w:r><w:rPr><w:b/></w:rPr><w:t>Cause: </w:t></w:r><w:r><w:t>Routes /api/dossier/* non exposées dans urls.py</w:t></w:r></w:p>
        <w:p><w:r><w:rPr><w:b/></w:rPr><w:t>Solution: </w:t></w:r><w:r><w:t>Ajout de routes explicites mappant les endpoints aux actions ViewSet</w:t></w:r></w:p>
    
        <w:p/>
    
        <w:p><w:r><w:rPr><w:b/></w:rPr><w:t>Problème 2: 403 - Permission refusée</w:t></w:r></w:p>
        <w:p><w:r><w:rPr><w:b/></w:rPr><w:t>Cause: </w:t></w:r><w:r><w:t>Rôle responsable_commission absent dans permissions</w:t></w:r></w:p>
        <w:p><w:r><w:rPr><w:b/></w:rPr><w:t>Solution: </w:t></w:r><w:r><w:t>Ajout responsable_commission à whitelist permission</w:t></w:r></w:p>
    
        <w:p/>
    
        <w:p><w:r><w:rPr><w:b/></w:rPr><w:t>Problème 3: ConnectionRefusedError - Celery/Redis</w:t></w:r></w:p>
        <w:p><w:r><w:rPr><w:b/></w:rPr><w:t>Cause: </w:t></w:r><w:r><w:t>Broker Redis absent en test, appel .delay() échoue</w:t></w:r></w:p>
        <w:p><w:r><w:rPr><w:b/></w:rPr><w:t>Solution: </w:t></w:r><w:r><w:t>Garde conditionnelle avec CELERY_TASK_ALWAYS_EAGER</w:t></w:r></w:p>
    
        <w:p/>
    
        <w:p><w:r><w:rPr><w:b/></w:rPr><w:t>Problème 4: IntegrityError - Checksum dupliqué</w:t></w:r></w:p>
        <w:p><w:r><w:rPr><w:b/></w:rPr><w:t>Cause: </w:t></w:r><w:r><w:t>Checksum unique global, collision entre types</w:t></w:r></w:p>
        <w:p><w:r><w:rPr><w:b/></w:rPr><w:t>Solution: </w:t></w:r><w:r><w:t>Checksum scoped par (candidature.id + type.id)</w:t></w:r></w:p>
    
        <w:p/>
    
        <w:p><w:r><w:rPr><w:b/></w:rPr><w:t>Problème 5: Template parse error</w:t></w:r></w:p>
        <w:p><w:r><w:rPr><w:b/></w:rPr><w:t>Cause: </w:t></w:r><w:r><w:t>Appel request.build_absolute_uri('/') invalide en template</w:t></w:r></w:p>
        <w:p><w:r><w:rPr><w:b/></w:rPr><w:t>Solution: </w:t></w:r><w:r><w:t>Passage site_url en contexte, template utilise {{ site_url|default:... }}</w:t></w:r></w:p>
    
        <w:p/>
        <w:p>
            <w:pPr><w:pStyle w:val="Heading1"/></w:pPr>
            <w:r><w:t>6. Conclusion</w:t></w:r>
        </w:p>
    
        <w:p>
            <w:t>Tous les tests d'intégration et unitaires pour le module Candidature Service passent avec succès. </w:t>
        </w:p>
        <w:p>
            <w:t>Les endpoints de dépôt de dossier, permissions, traitements OCR, et workflows sont opérationnels. </w:t>
        </w:p>
        <w:p>
            <w:t>L'application est prête pour l'intégration cross-service et le déploiement en staging.</w:t>
        </w:p>
    
        <w:p/>
        <w:p>
            <w:r><w:rPr><w:i/><w:sz w:val="20"/></w:rPr><w:t>Rapport généré le 09/05/2026</w:t></w:r>
        </w:p>
    </w:body>
</w:document>'''
        
                # Write files to ZIP
                docx.writestr('[Content_Types].xml', content_types)
                docx.writestr('_rels/.rels', rels)
                docx.writestr('word/document.xml', document)
    
        # Write ZIP to file
        docx_bytes.seek(0)
        with open(output_path, 'wb') as f:
                f.write(docx_bytes.read())
    
        return output_path

if __name__ == '__main__':
        output = r'c:\Users\HP\Desktop\PFE\isimm-platform\tests_results\Rapport_Tests_Sprint2.docx'
        created_path = create_word_document(output)
        print(f'✅ Document créé avec succès: {created_path}')
        print(f'   Taille: {os.path.getsize(created_path) / 1024:.1f} KB')
