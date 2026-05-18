#!/usr/bin/env python3
"""Seed realistic commission demo data for the multi-commission workflow.

Creates two commissions, three commission members with one shared across both
commissions, 15 candidatures per commission, sample dossiers/documents, and a
past-deadline commission used to exercise the auto-validation path.
"""

from __future__ import annotations

import hashlib
import os
import sys
from datetime import timedelta
from decimal import Decimal

from django.core.files.uploadedfile import SimpleUploadedFile
from django.utils import timezone


BASE_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, BASE_DIR)
sys.path.insert(0, os.path.join(os.path.dirname(BASE_DIR), "auth-service"))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "candidature_service.settings")

import django  # noqa: E402

django.setup()

from candidature_app.models import (  # noqa: E402
    AvisSelection,
    Candidature,
    Commission,
    Dossier,
    Document,
    DocumentType,
    Master,
    MembreCommission,
)
from django.contrib.auth.models import User  # noqa: E402


def get_or_create_user(email: str, first_name: str, last_name: str, user_id: int | None = None) -> User:
    lookup = {"pk": user_id} if user_id is not None else {"username": email}
    user, created = User.objects.update_or_create(
        **lookup,
        defaults={
            "email": email,
            "username": email,
            "first_name": first_name,
            "last_name": last_name,
        },
    )
    if created:
        user.set_password("TestPassword123!")
        user.first_name = first_name
        user.last_name = last_name
        user.save()
    return user


def ensure_master(name: str, specialite: str, type_master: str, deadline_days: int) -> Master:
    master, _ = Master.objects.get_or_create(
        nom=name,
        defaults={
            "type_master": type_master,
            "description": f"Programme de démonstration pour {name}.",
            "specialite": specialite,
            "places_disponibles": 30,
            "date_limite_candidature": timezone.localdate() + timedelta(days=deadline_days),
            "annee_universitaire": "2025/2026",
            "actif": True,
        },
    )
    return master


def ensure_document_types(master: Master) -> dict[str, DocumentType]:
    types: dict[str, DocumentType] = {}
    for code, description in [
        ("diplome", "Diplôme"),
        ("releve_notes", "Relevé de notes"),
        ("cv", "Curriculum vitae"),
    ]:
        doc_type, _ = DocumentType.objects.get_or_create(
            master=master,
            type_document=code,
            defaults={
                "obligatoire": True,
                "description": description,
                "taille_max_mb": 5,
                "formats_acceptes": ["pdf"],
            },
        )
        types[code] = doc_type
    return types


def build_minimal_pdf(title: str) -> bytes:
    def obj(number: int, body: str) -> bytes:
        return f"{number} 0 obj\n{body}\nendobj\n".encode("utf-8")

    content = f"BT /F1 18 Tf 72 120 Td ({title}) Tj ET"
    objects = [
        obj(1, "<< /Type /Catalog /Pages 2 0 R >>"),
        obj(2, "<< /Type /Pages /Kids [3 0 R] /Count 1 >>"),
        obj(3, "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 300 180] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>"),
        obj(4, f"<< /Length {len(content.encode('utf-8'))} >>\nstream\n{content}\nendstream"),
        obj(5, "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>"),
    ]

    output = bytearray(b"%PDF-1.4\n")
    offsets = [0]
    for item in objects:
        offsets.append(len(output))
        output.extend(item)
    xref_offset = len(output)
    output.extend(f"xref\n0 {len(offsets)}\n".encode("utf-8"))
    output.extend(b"0000000000 65535 f \n")
    for offset in offsets[1:]:
        output.extend(f"{offset:010d} 00000 n \n".encode("utf-8"))
    output.extend(
        (
            "trailer\n"
            f"<< /Size {len(offsets)} /Root 1 0 R >>\n"
            "startxref\n"
            f"{xref_offset}\n"
            "%%EOF\n"
        ).encode("utf-8")
    )
    return bytes(output)


def ensure_dossier_package(candidature: Candidature, doc_types: dict[str, DocumentType], label: str) -> None:
    dossier, _ = Dossier.objects.get_or_create(
        candidature=candidature,
        defaults={
            "statut": "complet",
            "nb_documents_attendus": 2,
            "nb_documents_soumis": 0,
            "score_completude": Decimal("100.00"),
            "feedback": "Dossier de démonstration.",
            "date_depot": timezone.now(),
            "date_limite_depot": timezone.now() + timedelta(days=7),
        },
    )

    if candidature.documents.exists():
        return

    for code in ["diplome", "releve_notes"]:
        pdf_bytes = build_minimal_pdf(f"{label} - {code}")
        uploaded = SimpleUploadedFile(
            f"{label}-{code}.pdf",
            pdf_bytes,
            content_type="application/pdf",
        )
        digest = hashlib.sha256(pdf_bytes).hexdigest()
        Document.objects.create(
            candidature=candidature,
            type_document=doc_types[code],
            fichier=uploaded,
            nom_fichier_original=f"{label}-{code}.pdf",
            taille_bytes=len(pdf_bytes),
            format_fichier="pdf",
            statut="valide",
            description=f"{code} de démonstration",
            checksum_sha256=digest,
        )

    dossier.nb_documents_attendus = 2
    dossier.nb_documents_soumis = candidature.documents.exclude(statut__in=["en_attente", "erreur_ocr"]).count()
    dossier.score_completude = Decimal("100.00")
    dossier.statut = "complet"
    dossier.save()


def ensure_commission_members(commission: Commission, shared: User, local: User, responsible: User, other_commission: Commission) -> tuple[MembreCommission, MembreCommission, MembreCommission]:
    shared_link, _ = MembreCommission.objects.get_or_create(
        commission=commission,
        user=shared,
        defaults={"role": "membre", "actif": True},
    )
    local_link, _ = MembreCommission.objects.get_or_create(
        commission=commission,
        user=local,
        defaults={"role": "membre", "actif": True},
    )
    responsible_link, _ = MembreCommission.objects.get_or_create(
        commission=commission,
        user=responsible,
        defaults={"role": "responsable", "actif": True},
    )

    for link in [shared_link, local_link, responsible_link]:
        link.commissions.add(commission)
        if other_commission:
            link.commissions.add(other_commission)

    return shared_link, local_link, responsible_link


def seed_commission_package(master: Master, commission_name: str, deadline_offset_days: int, shared_user: User, local_user: User, responsible_user: User, other_commission: Commission | None = None) -> Commission:
    commission, _ = Commission.objects.get_or_create(
        nom=commission_name,
        defaults={
            "master": master,
            "description": f"Commission de démonstration {commission_name}.",
            "actif": True,
            "deadline_avis": timezone.now() + timedelta(days=deadline_offset_days),
        },
    )
    commission.master = master
    commission.description = f"Commission de démonstration {commission_name}."
    commission.actif = True
    commission.deadline_avis = timezone.now() + timedelta(days=deadline_offset_days)
    commission.save()

    ensure_commission_members(commission, shared_user, local_user, responsible_user, other_commission)
    return commission


def seed_candidatures(master: Master, prefix: str, doc_types: dict[str, DocumentType], limit: int = 15) -> list[Candidature]:
    candidatures: list[Candidature] = []
    for index in range(1, limit + 1):
        email = f"{prefix}.candidate{index:02d}@isimm.tn"
        user = get_or_create_user(
            email=email,
            first_name=f"{prefix.capitalize()}",
            last_name=f"Candidate {index:02d}",
        )

        candidature, _ = Candidature.objects.get_or_create(
            candidat=user,
            master=master,
            defaults={
                "statut": "preselectionne" if index <= 8 else "sous_examen",
                "score": Decimal(f"{18 - (index * 0.4):.2f}"),
                "classement": index,
                "choix_priorite": 1,
                "dossier_depose": index <= 3,
                "dossier_valide": index <= 3,
            },
        )
        candidature.statut = "preselectionne" if index <= 8 else "sous_examen"
        candidature.score = Decimal(f"{18 - (index * 0.4):.2f}")
        candidature.classement = index
        candidature.choix_priorite = 1
        candidature.dossier_depose = index <= 3
        candidature.dossier_valide = index <= 3
        candidature.save()
        candidatures.append(candidature)

        if index <= 3:
            ensure_dossier_package(candidature, doc_types, f"{prefix}-{index:02d}")

    return candidatures


def seed_deadline_avis(commission: Commission, shared_link: MembreCommission, local_link: MembreCommission, responsible_link: MembreCommission) -> None:
    AvisSelection.objects.update_or_create(
        commission=commission,
        membre=responsible_link,
        is_global=True,
        defaults={"statut": "favorable", "commentaire": "Profil aligné avec les besoins du master."},
    )
    AvisSelection.objects.update_or_create(
        commission=commission,
        membre=local_link,
        is_global=True,
        defaults={"statut": "defavorable", "commentaire": "Dossier insuffisant sur l'expérience."},
    )
    AvisSelection.objects.filter(commission=commission, membre=shared_link, is_global=True).delete()


def main() -> None:
    shared_user = get_or_create_user("commission@isimm.tn", "Samir", "Mokni", user_id=39)
    local_user_one = get_or_create_user("local.member1@isimm.tn", "Nadia", "Bouzid")
    local_user_two = get_or_create_user("local.member2@isimm.tn", "Walid", "Jaziri")
    responsible_user = get_or_create_user("responsable.member@isimm.tn", "Meriem", "Sfar")

    master_one = ensure_master("Master Genie Logiciel Demo", "Genie Logiciel", "professionnel", 45)
    master_two = ensure_master("Master Data Science Demo", "Data Science", "recherche", 45)

    doc_types_one = ensure_document_types(master_one)
    doc_types_two = ensure_document_types(master_two)

    commission_one = seed_commission_package(
        master_one,
        "Commission Genie Logiciel Demo",
        10,
        shared_user,
        local_user_one,
        responsible_user,
    )
    commission_two = seed_commission_package(
        master_two,
        "Commission Data Science Demo",
        -1,
        shared_user,
        local_user_two,
        responsible_user,
        other_commission=commission_one,
    )

    shared_link_commission_two = MembreCommission.objects.get(commission=commission_two, user=shared_user)
    shared_link_commission_one = MembreCommission.objects.get(commission=commission_one, user=shared_user)
    local_link_commission_two = MembreCommission.objects.get(commission=commission_two, user=local_user_two)
    responsible_link_commission_two = MembreCommission.objects.get(commission=commission_two, user=responsible_user)

    shared_link_commission_two.role = "membre"
    shared_link_commission_two.save(update_fields=["role"])

    seed_candidatures(master_one, "gl", doc_types_one)
    seed_candidatures(master_two, "ds", doc_types_two)
    seed_deadline_avis(commission_two, shared_link_commission_two, local_link_commission_two, responsible_link_commission_two)

    # Keep the shared member linked to both commissions from both perspectives.
    shared_link_commission_one.commissions.add(commission_two)
    shared_link_commission_two.commissions.add(commission_one)

    print("Seed complete")
    print(f"- Commission 1: {commission_one.id} / {commission_one.nom}")
    print(f"- Commission 2: {commission_two.id} / {commission_two.nom}")
    print(f"- Shared member: {shared_user.email}")
    print(f"- Past-deadline commission: {commission_two.id}")


if __name__ == "__main__":
    main()