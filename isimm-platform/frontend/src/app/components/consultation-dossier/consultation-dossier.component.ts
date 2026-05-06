import { CommonModule, Location } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { CandidatureService } from '../../services/candidature.service';

interface DossierDocument {
  id: string;
  nom: string;
  dateDepot: string;
  taille: string;
  status: 'valid' | 'pending' | 'rejected';
  commentaire?: string;
  verifiedBy?: string;
  verifiedAt?: string;
  url?: string;
  urlSafe?: SafeResourceUrl;
  open?: boolean;
}

interface TimelineItem {
  title: string;
  subtitle: string;
  time: string;
  tone: 'blue' | 'green' | 'gray';
}

@Component({
  selector: 'app-consultation-dossier',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './consultation-dossier.component.html',
  styleUrl: './consultation-dossier.component.css',
})
export class ConsultationDossierComponent implements OnInit {
  candidatureId: number | null = null;
  sourceContext = '';
  sourceLabel = 'Consultation du dossier';
  isLoading = true;
  showCustomSnippet = true;
  toastShow = false;
  toastMsg = '';
  toastClass = 't-success';
  globalComment = '';
  decisionNote = 'Validez tous les documents avant de prendre une décision finale.';
  decisionResult = '';
  decisionResultClass = '';
  activeTab: 'docs' | 'history' | 'notes' = 'docs';
  consultationBackLabel = 'Retour';

  candidat: any = null;
  documents: DossierDocument[] = [];
  timeline: TimelineItem[] = [
    {
      title: 'Dossier soumis',
      subtitle: 'Le candidat a soumis son dossier complet',
      time: '15/02/2026 — 10:30 · Système',
      tone: 'blue',
    },
  ];

  docStates: Record<string, 'valid' | 'pending' | 'rejected'> = {
    d1: 'valid',
    d2: 'valid',
    d3: 'pending',
    d4: 'pending',
    d5: 'valid',
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private location: Location,
    private candidatureService: CandidatureService,
    private sanitizer: DomSanitizer,
  ) {}

  ngOnInit(): void {
    this.candidatureId = Number(this.route.snapshot.paramMap.get('id')) || null;
    this.sourceContext = this.route.snapshot.queryParamMap.get('source') || '';
    this.sourceLabel = this.getSourceLabel(this.sourceContext);
    this.loadDossier();
  }

  get candidatureScore(): string {
    return this.candidat?.score !== undefined && this.candidat?.score !== null
      ? Number(this.candidat.score).toFixed(1)
      : '--';
  }

  get scoreMention(): string {
    const score = Number(this.candidat?.score ?? 0);
    if (score >= 16) return 'Excellent';
    if (score >= 14) return 'Très bon';
    if (score >= 12) return 'Bon niveau';
    return 'À renforcer';
  }

  get completionPercent(): number {
    const total = this.documents.length || 1;
    const validCount = this.documents.filter((item) => item.status === 'valid').length;
    return Math.round((validCount / total) * 100);
  }

  get validCount(): number {
    return this.documents.filter((item) => item.status === 'valid').length;
  }

  get pendingCount(): number {
    return this.documents.filter((item) => item.status === 'pending').length;
  }

  get rejectedCount(): number {
    return this.documents.filter((item) => item.status === 'rejected').length;
  }

  get sourceIsReclamation(): boolean {
    return (
      this.sourceContext === 'reclamations' || this.route.snapshot.queryParamMap.has('reclamation')
    );
  }

  private getSourceLabel(source: string): string {
    if (source === 'liste-generation') return 'Ouvert depuis une liste générée';
    if (source === 'reclamations') return 'Ouvert depuis les réclamations';
    if (source === 'candidat') return 'Espace candidat';
    return 'Consultation du dossier';
  }

  private loadDossier(): void {
    const id = this.candidatureId;
    if (!id || Number.isNaN(id)) {
      this.showToast('Identifiant candidature invalide', 't-danger');
      this.isLoading = false;
      return;
    }

    this.candidatureService.getMesCandidatures().subscribe({
      next: (response: any) => {
        const candidatures = Array.isArray(response)
          ? response
          : (response?.results ?? response?.data ?? []);
        const candidat = candidatures.find((item: any) => Number(item?.id) === id) ?? null;
        if (!candidat) {
          this.showToast('Candidat introuvable pour cet identifiant', 't-danger');
        }
        this.candidat = candidat ?? this.buildFallbackCandidate(id);
        this.documents = this.buildDocuments(this.candidat);
        this.isLoading = false;
      },
      error: () => {
        this.candidat = this.buildFallbackCandidate(id);
        this.documents = this.buildDocuments(this.candidat);
        this.showToast('Chargement local de secours utilisé', 't-warn');
        this.isLoading = false;
      },
    });
  }

  private buildFallbackCandidate(id: number): any {
    return {
      id,
      first_name: 'Ahmed',
      last_name: 'Ben Ali',
      cin: '12345678',
      email: 'ahmed.benali@example.com',
      telephone: '+216 98 765 432',
      date_naissance: '2000-03-15',
      score: 17.5,
      type_candidature: 'master',
      source: this.sourceContext || 'commission-dashboard',
    };
  }

  private buildDocuments(candidate: any): DossierDocument[] {
    const prefix = candidate?.first_name?.charAt(0) || 'A';
    const suffix = candidate?.last_name?.charAt(0) || 'B';
    return [
      {
        id: 'd1',
        nom: "Carte d'identité nationale",
        dateDepot: '15/02/2026',
        taille: '1.2 MB',
        status: 'valid' as const,
        commentaire: 'Document conforme — CIN valide et lisible',
        verifiedBy: 'Dr. Ahmed Gharbi',
        verifiedAt: '16/02/2026 — 10:30',
        url: '/assets/docs/sample.pdf',
      },
      {
        id: 'd2',
        nom: 'Relevés de notes (L1, L2, L3)',
        dateDepot: '15/02/2026',
        taille: '3.5 MB',
        status: 'valid' as const,
        verifiedBy: 'Dr. Ahmed Gharbi',
        verifiedAt: '16/02/2026 — 10:35',
        url: '/assets/docs/sample.pdf',
      },
      {
        id: 'd3',
        nom: 'Diplôme de Licence',
        dateDepot: '16/02/2026',
        taille: '2.1 MB',
        status: 'pending' as const,
        url: '/assets/docs/sample.pdf',
      },
      {
        id: 'd4',
        nom: "Photo d'identité",
        dateDepot: '15/02/2026',
        taille: '420 KB',
        status: 'pending' as const,
        url: '/assets/images/photo-sample.jpg',
      },
      {
        id: 'd5',
        nom: 'Document synthèse — liste générée',
        dateDepot: '16/04/2026',
        taille: '180 KB',
        status: 'valid' as const,
        commentaire: 'Généré automatiquement depuis la liste de sélection',
        verifiedBy: 'Système commission',
        verifiedAt: '16/04/2026 — 09:15',
        url: '/assets/docs/sample.pdf',
      },
    ].map((item) => ({
      ...item,
      commentaire: item.commentaire,
      urlSafe: item.url ? this.sanitizer.bypassSecurityTrustResourceUrl(item.url) : undefined,
      nom: item.nom.replace('Ahmed Ben Ali', `${prefix}${suffix}`),
    })) as DossierDocument[];
  }

  retour(): void {
    this.location.back();
  }

  ouvrirFichier(): void {
    this.showToast('Aperçu document demandé', 't-success');
  }

  sendPrompt(message: string): void {
    this.showToast(message, 't-info');
  }

  switchTab(tab: 'docs' | 'history' | 'notes'): void {
    this.activeTab = tab;
  }

  toggleDoc(docId: string): void {
    const documentItem = this.documents.find((item) => item.id === docId);
    if (documentItem) {
      documentItem.open = !documentItem.open;
    }
  }

  validerDoc(docId: string, valid: boolean): void {
    const documentItem = this.documents.find((item) => item.id === docId);
    if (!documentItem) return;

    documentItem.status = valid ? 'valid' : 'rejected';
    this.docStates[docId] = valid ? 'valid' : 'rejected';
    this.updateProgress();
    this.addToTimeline(docId, valid);
    this.showToast(valid ? 'Document validé' : 'Document rejeté', valid ? 't-success' : 't-danger');
  }

  priseDecision(type: 'approve' | 'reject' | 'hold'): void {
    if (type === 'approve') {
      this.decisionResult = 'Dossier validé — décision finale enregistrée';
      this.decisionResultClass = 'dr-success';
      this.addToTimeline('final-approve', true);
      this.showToast(this.decisionResult, 't-success');
      return;
    }

    if (type === 'reject') {
      this.decisionResult = 'Dossier rejeté — notification envoyée au candidat';
      this.decisionResultClass = 'dr-danger';
      this.addToTimeline('final-reject', false);
      this.showToast(this.decisionResult, 't-danger');
      return;
    }

    this.decisionResult = 'Dossier mis en attente';
    this.decisionResultClass = 'dr-warn';
    this.addToTimeline('final-hold', false);
    this.showToast(this.decisionResult, 't-warn');
  }

  updateProgress(): void {
    const validCount = this.validCount;
    const rejectedCount = this.rejectedCount;
    const pendingCount = this.pendingCount;
    this.decisionNote =
      pendingCount > 0
        ? rejectedCount > 0
          ? 'Certains documents ont été rejetés. La décision finale est disponible.'
          : 'Des documents manquent, décision en attente.'
        : rejectedCount > 0
          ? 'Certains documents ont été rejetés. La décision finale est disponible.'
          : 'Tous les documents sont validés. Vous pouvez prendre une décision.';
    this.timeline = [
      {
        title: 'Dossier soumis',
        subtitle: 'Le candidat a soumis son dossier complet',
        time: '15/02/2026 — 10:30 · Système',
        tone: 'blue',
      },
      ...this.timeline.filter((item) => item.title !== 'Dossier soumis').slice(0, 50),
    ];
  }

  addToTimeline(docId: string, valid: boolean): void {
    const labelMap: Record<string, string> = {
      d1: 'CIN',
      d2: 'Relevés de notes',
      d3: 'Diplôme Licence',
      d4: 'Photo identité',
      d5: 'Document synthèse',
      'final-approve': 'Décision finale',
      'final-reject': 'Décision finale',
      'final-hold': 'Décision finale',
    };

    const tone: TimelineItem['tone'] = valid
      ? 'green'
      : docId.startsWith('final-')
        ? 'gray'
        : 'gray';
    const statusLabel = valid
      ? 'validé'
      : docId.startsWith('final-')
        ? 'mis en attente / rejeté'
        : 'rejeté';

    this.timeline = [
      {
        title: `${labelMap[docId] || docId} ${statusLabel}`,
        subtitle: valid ? 'Document conforme' : 'Rejeté par la commission',
        time:
          new Date().toLocaleDateString('fr-FR') +
          ' — ' +
          new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) +
          ' · Vous',
        tone,
      },
      ...this.timeline,
    ];
  }

  showToast(message: string, cls: string): void {
    this.toastMsg = message;
    this.toastClass = cls;
    this.toastShow = true;
    window.setTimeout(() => {
      this.toastShow = false;
    }, 2800);
  }
}
