export type ParcoursSousType = 'professionnel' | 'recherche' | '';
export type ParcoursTypeFormation = 'master' | 'cycle_ingenieur' | 'ingenieur';

export interface ParcoursSpecialiteOption {
  code: string;
  label: string;
  typeFormation: ParcoursTypeFormation;
  sousType: ParcoursSousType;
  defaultSpecialitesDemandees: string[];
}

const MPGL_DIPLOMES = [
  "Licence en Sciences de l'Informatique - Génie Logiciel",
  'Licence en Informatique de Gestion (uniquement)',
  "Génie logiciel et systèmes d'information",
  'Génie logiciel',
  'Licence appliquée en développement des systèmes informatiques',
  'Big Data et Analyse de données',
  'Business Computing',
];

const MPDS_DIPLOMES = [
  "Mathématiques Appliquées - Spécialité Statistique de l'Environnement",
  'Mathématiques Appliquées - Spécialité Sciences de Données',
  'Mathématiques et Applications',
];

const MP3I_DIPLOMES = [
  'Licence en Électronique, Électrotechnique et Automatique (MIM)',
  'Licence en Électronique, Électrotechnique et Automatique (SE)',
  "Licence en Technologies de l'Information et de la Communication (TIC)",
  'Licence en Mesures et Instrumentation',
  'Licence en EEA (Spécialité Automatique et Informatique Industrielle ou Mesures et Métrologie)',
  'Licence en Génie Électrique (Spécialité Automatique et Informatique Industrielle)',
];

const MRGL_DIPLOMES = [
  'Licence en Informatique',
  'Maîtrise en Informatique',
  'Licence en Informatique ou Informatique de Gestion',
  'Maîtrise en Informatique ou Informatique de Gestion',
];

const MRMI_DIPLOMES = [
  'Licence en EEA, MIM (Électronique, Systèmes Embarqués, Métrologie) ou TIC (Réseaux et IoT)',
  'Licence en Électronique, Automatique ou Mesures et Instrumentation',
  "Réussite en 1ère année du cycle ingénieur (Électronique/Instrumentation) ou équivalent",
];

const INGGL_DIPLOMES = [
  'Génie Logiciel (Informatique)',
  "Diplôme en ingénierie systèmes d'information",
  'Diplôme en ingénierie systèmes informatiques',
];

export const PARCOURS_SPECIALITE_CATALOG: ParcoursSpecialiteOption[] = [
  {
    code: 'MPGL',
    label: 'Génie Logiciel',
    typeFormation: 'master',
    sousType: 'professionnel',
    defaultSpecialitesDemandees: MPGL_DIPLOMES,
  },
  {
    code: 'MPDS',
    label: 'Sciences de Données',
    typeFormation: 'master',
    sousType: 'professionnel',
    defaultSpecialitesDemandees: MPDS_DIPLOMES,
  },
  {
    code: 'MP3I',
    label: 'Instrumentation Industrielle',
    typeFormation: 'master',
    sousType: 'professionnel',
    defaultSpecialitesDemandees: MP3I_DIPLOMES,
  },
  {
    code: 'MRGL',
    label: 'Génie Logiciel',
    typeFormation: 'master',
    sousType: 'recherche',
    defaultSpecialitesDemandees: MRGL_DIPLOMES,
  },
  {
    code: 'MRMI',
    label: 'Micro-Électronique et Instrumentation',
    typeFormation: 'master',
    sousType: 'recherche',
    defaultSpecialitesDemandees: MRMI_DIPLOMES,
  },
  {
    code: 'ING-GL',
    label: 'Génie Logiciel',
    typeFormation: 'cycle_ingenieur',
    sousType: '',
    defaultSpecialitesDemandees: INGGL_DIPLOMES,
  },
];

export function resolveParcoursByCode(code: string): ParcoursSpecialiteOption | undefined {
  return PARCOURS_SPECIALITE_CATALOG.find((p) => p.code === code);
}

export function resolveParcoursByOffreId(id: number): ParcoursSpecialiteOption | undefined {
  const byOffreId: Record<number, string> = {
    1: 'MPGL',
    2: 'MPDS',
    3: 'MP3I',
    4: 'MRGL',
    5: 'MRMI',
    6: 'ING-GL',
  };
  const code = byOffreId[id];
  return code ? resolveParcoursByCode(code) : undefined;
}

export function getParcoursOptionsForType(
  typeFormation: ParcoursTypeFormation,
  sousType?: string,
): ParcoursSpecialiteOption[] {
  return PARCOURS_SPECIALITE_CATALOG.filter((p) => {
    if (typeFormation === 'cycle_ingenieur' || typeFormation === 'ingenieur') {
      return p.typeFormation === 'cycle_ingenieur';
    }
    if (p.typeFormation !== 'master') return false;
    if (sousType) return p.sousType === sousType;
    return true;
  });
}
