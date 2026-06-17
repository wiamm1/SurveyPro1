export type SurveyStatus = 'draft' | 'active' | 'inactive';
export type QuestionType =
  | 'radio'
  | 'checkbox'
  | 'text_short'
  | 'text_long'
  | 'scale'
  | 'matrix'
  | 'date';

export type SurveyOption = {
  id?: number;
  clientId?: string;
  text: string;
  order_index: number;
};

export type SurveyQuestion = {
  id?: number;
  clientId?: string;
  section_id?: number;
  survey_id?: number;
  text: string;
  type: QuestionType;
  is_required: boolean;
  order_index: number;
  settings?: Record<string, unknown> | null;
  options: SurveyOption[];
};

export type SurveySection = {
  id?: number;
  clientId?: string;
  survey_id?: number;
  title: string;
  order_index: number;
  created_at?: string;
  questions: SurveyQuestion[];
};

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

export type SurveyCreatePayload = {
  title: string;
  description?: string | null;
  template_id?: number | null;
  sections?: SurveySection[];
};

export type SurveyUpdatePayload = {
  title?: string;
  description?: string | null;
};

export type SurveyStatusPayload = {
  status: SurveyStatus;
};

export type SectionCreatePayload = {
  title: string;
  order_index: number;
  questions?: SurveyQuestion[];
};

export type SectionUpdatePayload = {
  title?: string;
  order_index?: number;
};

export type QuestionCreatePayload = {
  text: string;
  type: QuestionType;
  is_required: boolean;
  order_index: number;
  settings?: Record<string, unknown> | null;
  options: SurveyOption[];
};

export type QuestionUpdatePayload = {
  text?: string;
  type?: QuestionType;
  is_required?: boolean;
  order_index?: number;
  settings?: Record<string, unknown> | null;
};

export type QuestionOptionPayload = {
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
