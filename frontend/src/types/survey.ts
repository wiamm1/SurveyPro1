// ─── Enums ───────────────────────────────────────────────────────────────────
export type SurveyStatus = 'draft' | 'active' | 'inactive';

export type QuestionType =
  | 'single_choice'
  | 'multiple_choice'
  | 'text'
  | 'scale'
  | 'matrix'
  | 'date';

// ─── Conditional Logic ───────────────────────────────────────────────────────
export type ConditionalLogicAction = 'show' | 'skip_to';

export type ConditionalRule = {
  id?: number;
  question_id?: number;
  condition_option_id?: number | null;
  target_question_id: number;
  action: ConditionalLogicAction;
};

export type ConditionalRuleCreate = {
  condition_option_id?: number | null;
  target_question_id: number;
  action: ConditionalLogicAction;
};

// ─── Question Option ──────────────────────────────────────────────────────────
export type SurveyOption = {
  id?: number;
  /** Temporary client-side ID (negative integer) used before saving */
  clientId?: string;
  text: string;
  order_index: number;
};

// ─── Question ─────────────────────────────────────────────────────────────────
export type SurveyQuestion = {
  id?: number;
  /** Temporary client-side ID (negative integer) used before saving */
  clientId?: string;
  section_id?: number;
  survey_id?: number;
  text: string;
  type: QuestionType;
  is_required: boolean;
  order_index: number;
  settings?: Record<string, unknown> | null;
  options: SurveyOption[];
  conditional_rules: ConditionalRule[];
};

// ─── Section ──────────────────────────────────────────────────────────────────
export type SurveySection = {
  id?: number;
  /** Temporary client-side ID used before saving */
  clientId?: string;
  survey_id?: number;
  title: string;
  description?: string | null;
  order_index: number;
  created_at?: string;
  questions: SurveyQuestion[];
};

// ─── Survey List & Full ───────────────────────────────────────────────────────
export type SurveyListItem = {
  id: number;
  title: string;
  description?: string | null;
  status: SurveyStatus;
  company_id?: number | null;
  created_by?: number | null;
  template_id?: number | null;
  created_at?: string;
  updated_at?: string;
  sections_count: number;
  questions_count: number;
};

export type SurveyFull = SurveyListItem & {
  sections: SurveySection[];
};

// ─── Payloads ──────────────────────────────────────────────────────────────────
export type SurveyCreatePayload = {
  title: string;
  description?: string | null;
  template_id?: number | null;
  sections?: SurveySectionPayload[];
};

export type SurveyUpdatePayload = {
  title?: string;
  description?: string | null;
};

export type SurveyStatusPayload = {
  status: SurveyStatus;
};

export type SurveyOptionPayload = {
  id?: number | null;
  text: string;
  order_index: number;
};

export type ConditionalRulePayload = {
  condition_option_id?: number | null;
  target_question_id: number;
  action: ConditionalLogicAction;
};

export type SurveyQuestionPayload = {
  id?: number | null;
  text: string;
  type: QuestionType;
  is_required: boolean;
  order_index: number;
  settings?: Record<string, unknown> | null;
  options: SurveyOptionPayload[];
  conditional_rules: ConditionalRulePayload[];
};

export type SurveySectionPayload = {
  title: string;
  description?: string | null;
  order_index: number;
  questions: SurveyQuestionPayload[];
};

export type SectionCreatePayload = SurveySectionPayload;

export type SectionUpdatePayload = {
  title?: string;
  description?: string | null;
  order_index?: number;
};

export type QuestionCreatePayload = {
  id?: number | null;
  text: string;
  type: QuestionType;
  is_required: boolean;
  order_index: number;
  settings?: Record<string, unknown> | null;
  options: SurveyOptionPayload[];
  conditional_rules: ConditionalRulePayload[];
};

export type QuestionUpdatePayload = {
  text?: string;
  type?: QuestionType;
  is_required?: boolean;
  order_index?: number;
  settings?: Record<string, unknown> | null;
};

export type QuestionOptionPayload = {
  id?: number | null;
  text: string;
  order_index: number;
};

export type SurveyTemplatesResponse = {
  id: number;
  name: string;
  title: string;
  description?: string | null;
  structure: {
    sections?: SurveySection[];
  };
};
