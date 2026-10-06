export const MODULE_NAME = 'OpenMRC Year 5 NAPLAN Practice';
export const MODULE_VERSION = 1;
export const NAPLAN_DEV_PORT = 4017;

export type NaplanDomain = 'Language Conventions' | 'Numeracy' | 'Reading';
export type ResponseKind = 'single' | 'multi' | 'text';
export type KeyStatus = 'capture_suggestion' | 'missing';

export interface NaplanResource {
  id: string;
  domain: NaplanDomain;
  title: string;
  source: string;
  path: string;
  year_level: number;
  level: string;
  strand: string;
  skill_tags: string[];
  question_count: number;
  minutes: number;
  passage_title: string | null;
  passage: string | null;
  image_heavy: boolean;
}

export interface NaplanQuestion {
  id: string;
  resource_id: string;
  number: number;
  domain: NaplanDomain;
  strand: string;
  skill_tag: string;
  difficulty: string;
  prompt: string;
  options: string[];
  response_kind: ResponseKind;
  correct_answer: string | string[] | null;
  key_status: KeyStatus;
  image_heavy: boolean;
}

export interface QuestionBankFile {
  version: number;
  note: string;
  resources: NaplanResource[];
  questions: NaplanQuestion[];
}

/** Student payload. Capture keys stay on the server until a scored mark is returned. */
export interface StudentQuestion {
  id: string;
  resource_id: string;
  number: number;
  domain: NaplanDomain;
  strand: string;
  skill_tag: string;
  difficulty: string;
  prompt: string;
  options: string[];
  response_kind: ResponseKind;
  image_heavy: boolean;
  scoreable: boolean;
}

export type AnswerValue = string | string[];

export interface ItemMark {
  question_id: string;
  strand: string;
  skill_tag: string;
  domain: NaplanDomain;
  given: AnswerValue | null;
  expected: string | null;
  correct: boolean | null;
  scored: boolean;
  prompt: string;
}

export interface StrandSummary {
  strand: string;
  correct: number;
  scored: number;
}

export interface SkillSummary {
  skill_tag: string;
  domain: NaplanDomain;
  strand: string;
  correct: number;
  scored: number;
  accuracy: number;
}

export interface AttemptRecord {
  id: string;
  kind: 'practice' | 'placement';
  resource_id: string | null;
  title: string;
  submitted_at: string;
  correct: number;
  scored: number;
  total: number;
  marks: ItemMark[];
}

export interface ProgressFile {
  student: string;
  module: string;
  version: number;
  updated_at: string | null;
  attempts: AttemptRecord[];
  placements: AttemptRecord[];
}

export interface WrongItem {
  id: string;
  resource_id: string;
  question_id: string;
  title: string;
  prompt: string;
  given: AnswerValue | null;
  expected: string | null;
  skill_tag: string;
  domain: NaplanDomain;
  strand: string;
  saved_at: string;
  reason: 'incorrect' | 'bookmarked';
}

export interface WrongBankFile {
  version: number;
  updated_at: string | null;
  items: WrongItem[];
}

export interface PracticeRecommendation {
  resource_id: string;
  title: string;
  domain: NaplanDomain;
  strand: string;
  reason: string;
}

export interface WeakSpotReport {
  skills: SkillSummary[];
  weak: SkillSummary[];
  recommendations: PracticeRecommendation[];
}

/** One practice-test row from the OpenMRC main-page pack, joined to its Word file. */
export interface OpenMrcEntry {
  id: string;
  title: string;
  topic: string;
  subject: string;
  level: string;
  question_count: number;
  bank_id: string;
  path: string | null;
  minutes: number;
  passage_title: string | null;
  image_heavy: boolean;
}

/** One placement item sent to the browser. `correct_answer` stays on the server. */
export interface PlacementStudentQuestion {
  id: string;
  number: number;
  strand: string;
  level: string;
  subject: string;
  prompt: string;
  options: string[];
  scoreable: boolean;
  source_id: string;
  source_title: string;
}

export interface PlacementStrandReport {
  strand: string;
  subject: string;
  answered: number;
  total: number;
  correct: number;
  scored: number;
  accuracy: number | null;
  pending_keys: number;
  weak: boolean;
  levels: string[];
}

export interface PlacementRecommendation {
  catalog_id: string;
  resource_id: string;
  title: string;
  strand: string;
  level: string;
  subject: string;
  reason: string;
}

export interface PlacementReport {
  answered: number;
  total: number;
  keyed: number;
  strands: PlacementStrandReport[];
  weak: PlacementStrandReport[];
  recommendations: PlacementRecommendation[];
}

export interface EnginePaths {
  bankPath: string;
  progressPath: string;
  wrongBankPath: string;
}
