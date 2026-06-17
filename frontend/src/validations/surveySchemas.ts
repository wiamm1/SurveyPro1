import { z } from 'zod';

import type { QuestionType } from '../types/survey';

export const questionTypeValues: QuestionType[] = [
  'radio',
  'checkbox',
  'text_short',
  'text_long',
  'scale',
  'matrix',
  'date',
];

export const surveyFormSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, 'Le titre doit contenir au moins 3 caractères.'),
  description: z.string().trim().optional().or(z.literal('')),
  templateId: z.coerce.number().int().positive().optional(),
});

export const surveySectionSchema = z.object({
  title: z.string().trim().min(1, 'Le titre de section est requis.'),
});

export const surveyQuestionOptionSchema = z.object({
  text: z.string().trim().min(1, 'Option requise.'),
  order_index: z.number().int().nonnegative(),
});

export const surveyQuestionSchema = z.object({
  text: z.string().trim().min(1, 'Le texte de la question est requis.'),
  type: z.enum(questionTypeValues),
  is_required: z.boolean(),
  order_index: z.number().int().nonnegative(),
  settings: z.record(z.string(), z.unknown()).optional().nullable(),
  options: z.array(surveyQuestionOptionSchema),
});

export const surveyPublishEligibilitySchema = z.object({
  sections: z
    .array(
      z.object({
        questions: z
          .array(
            z.object({
              type: z.enum(questionTypeValues),
              options: z.array(surveyQuestionOptionSchema),
            })
          )
          .min(1, 'Chaque section doit contenir au moins une question.'),
      })
    )
    .min(1, 'Une enquête doit contenir au moins une section.'),
});
