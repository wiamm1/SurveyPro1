import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Plus, Save, Send } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';

import { QuestionEditor } from '../components/surveys/QuestionEditor';
import { SectionEditor } from '../components/surveys/SectionEditor';
import { SurveyStatusBadge } from '../components/surveys/SurveyStatusBadge';
import { surveyApi } from '../services/surveyApi';
import { useSurveyStore } from '../store/useSurveyStore';
import type {
  SurveyFull,
  SurveyQuestion,
  SurveySection,
} from '../types/survey';
import { surveyPublishEligibilitySchema } from '../validations/surveySchemas';

const createDefaultQuestion = (orderIndex: number): SurveyQuestion => ({
  clientId: crypto.randomUUID(),
  text: '',
  type: 'radio',
  is_required: false,
  order_index: orderIndex,
  settings: null,
  options: [
    { text: 'Option 1', order_index: 0 },
    { text: 'Option 2', order_index: 1 },
  ],
});

const createDefaultSection = (orderIndex: number): SurveySection => ({
  clientId: crypto.randomUUID(),
  title: `Section ${orderIndex + 1}`,
  description: '',
  order_index: orderIndex,
  questions: [createDefaultQuestion(0)],
});

const createClientId = () => crypto.randomUUID();

const getSectionId = (section: SurveySection) =>
  `section:${section.clientId ?? section.id}`;

const getQuestionId = (section: SurveySection, question: SurveyQuestion) =>
  `question:${section.clientId ?? section.id}:${question.clientId ?? question.id}`;

const attachDraftClientIds = (survey: SurveyFull): SurveyFull => ({
  ...survey,
  sections: survey.sections.map((section) => ({
    ...section,
    clientId: section.clientId ?? createClientId(),
    questions: section.questions.map((question) => ({
      ...question,
      clientId: question.clientId ?? createClientId(),
    })),
  })),
});

export const SurveyEditorPage = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const currentSurvey = useSurveyStore((state) => state.currentSurvey);
  const fetchSurveyById = useSurveyStore((state) => state.fetchSurveyById);
  const [draft, setDraft] = useState<SurveyFull | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const surveyId = id ? Number(id) : null;

  useEffect(() => {
    const loadSurvey = async () => {
      if (!surveyId || Number.isNaN(surveyId)) {
        navigate('/surveys', { replace: true });
        return;
      }

      setLoading(true);
      await fetchSurveyById(surveyId);
      setLoading(false);
    };

    loadSurvey();
  }, [fetchSurveyById, navigate, surveyId]);

  useEffect(() => {
    if (currentSurvey) {
      setDraft(attachDraftClientIds(currentSurvey));
    }
  }, [currentSurvey]);

  const publishEligibility = useMemo(() => {
    if (!draft) {
      return false;
    }
    return surveyPublishEligibilitySchema.safeParse({
      sections: draft.sections,
    }).success;
  }, [draft]);

  const updateSection = (
    sectionIndex: number,
    updater: (section: SurveySection) => SurveySection
  ) => {
    setDraft((current) => {
      if (!current) {
        return current;
      }
      const nextSections = current.sections.map((section, index) =>
        index === sectionIndex ? updater(section) : section
      );
      return { ...current, sections: nextSections };
    });
  };

  const updateQuestion = (
    sectionIndex: number,
    questionIndex: number,
    updater: (question: SurveyQuestion) => SurveyQuestion
  ) => {
    setDraft((current) => {
      if (!current) {
        return current;
      }
      const nextSections = current.sections.map((section, index) => {
        if (index !== sectionIndex) {
          return section;
        }
        return {
          ...section,
          questions: section.questions.map((question, qIndex) =>
            qIndex === questionIndex ? updater(question) : question
          ),
        };
      });
      return { ...current, sections: nextSections };
    });
  };

  const addSection = () => {
    setDraft((current) => {
      if (!current) return current;
      return {
        ...current,
        sections: [
          ...current.sections,
          {
            ...createDefaultSection(current.sections.length),
            clientId: createClientId(),
          },
        ],
      };
    });
  };

  const addQuestion = (sectionIndex: number) => {
    setDraft((current) => {
      if (!current) return current;
      const nextSections = current.sections.map((section, index) => {
        if (index !== sectionIndex) {
          return section;
        }
        return {
          ...section,
          questions: [
            ...section.questions,
            {
              ...createDefaultQuestion(section.questions.length),
              clientId: createClientId(),
            },
          ],
        };
      });
      return { ...current, sections: nextSections };
    });
  };

  const deleteSection = (sectionIndex: number) => {
    setDraft((current) => {
      if (!current) return current;
      return {
        ...current,
        sections: current.sections.filter((_, index) => index !== sectionIndex),
      };
    });
  };

  const deleteQuestion = (sectionIndex: number, questionIndex: number) => {
    setDraft((current) => {
      if (!current) return current;
      const nextSections = current.sections.map((section, index) => {
        if (index !== sectionIndex) {
          return section;
        }
        return {
          ...section,
          questions: section.questions.filter(
            (_, qIndex) => qIndex !== questionIndex
          ),
        };
      });
      return { ...current, sections: nextSections };
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || !draft) {
      return;
    }

    const activeId = String(active.id);
    const overId = String(over.id);

    if (activeId === overId) {
      return;
    }

    if (activeId.startsWith('section:') && overId.startsWith('section:')) {
      setDraft((current) => {
        if (!current) return current;
        const oldIndex = current.sections.findIndex(
          (section) => getSectionId(section) === activeId
        );
        const newIndex = current.sections.findIndex(
          (section) => getSectionId(section) === overId
        );
        if (oldIndex < 0 || newIndex < 0) {
          return current;
        }
        const sections = arrayMove(current.sections, oldIndex, newIndex).map(
          (section, index) => ({
            ...section,
            order_index: index,
          })
        );
        return { ...current, sections };
      });
      return;
    }

    if (activeId.startsWith('question:') && overId.startsWith('question:')) {
      const activeParts = activeId.split(':');
      const overParts = overId.split(':');
      if (activeParts.length < 3 || overParts.length < 3) {
        return;
      }

      const activeSectionId = activeParts[1];
      const overSectionId = overParts[1];
      if (activeSectionId !== overSectionId) {
        return;
      }

      setDraft((current) => {
        if (!current) return current;
        const sectionIndex = current.sections.findIndex(
          (section) =>
            String(section.clientId ?? section.id) === activeSectionId
        );
        if (sectionIndex < 0) {
          return current;
        }

        const section = current.sections[sectionIndex];
        const oldIndex = section.questions.findIndex(
          (question) => getQuestionId(section, question) === activeId
        );
        const newIndex = section.questions.findIndex(
          (question) => getQuestionId(section, question) === overId
        );
        if (oldIndex < 0 || newIndex < 0) {
          return current;
        }

        const questions = arrayMove(section.questions, oldIndex, newIndex).map(
          (question, index) => ({
            ...question,
            order_index: index,
          })
        );

        const sections = current.sections.map((item, index) =>
          index === sectionIndex ? { ...item, questions } : item
        );
        return { ...current, sections };
      });
    }
  };

  const saveDraft = async () => {
    if (!draft || !surveyId) {
      return null;
    }

    setSaving(true);
    try {
      const saved = await surveyApi.saveFullSurvey(surveyId, {
        title: draft.title,
        description: draft.description,
        template_id: draft.template_id ?? null,
        sections: draft.sections.map((section, sectionIndex) => ({
          title: section.title,
          description: section.description,
          order_index: sectionIndex,
          questions: section.questions.map((question, questionIndex) => ({
            text: question.text,
            type: question.type,
            is_required: question.is_required,
            order_index: questionIndex,
            settings: question.settings ?? null,
            options: question.options.map((option, optionIndex) => ({
              text: option.text,
              order_index: optionIndex,
            })),
          })),
        })),
      });
      setDraft(attachDraftClientIds(saved));
      toast.success(t('survey.messages.saved'));
      return saved;
    } catch {
      toast.error(t('survey.messages.saveFailed'));
      return null;
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!draft) return;
    if (!publishEligibility) {
      toast.error(t('survey.messages.publishBlocked'));
      return;
    }
    const saved = await saveDraft();
    if (!saved) return;
    try {
      const updated = await surveyApi.toggleStatus(saved.id, {
        status: 'active',
      });
      setDraft(attachDraftClientIds(updated));
      toast.success(t('survey.messages.published'));
    } catch {
      toast.error(t('survey.messages.publishFailed'));
    }
  };

  const handleUnpublish = async () => {
    if (!draft) return;
    try {
      const updated = await surveyApi.toggleStatus(draft.id, {
        status: 'inactive',
      });
      setDraft(attachDraftClientIds(updated));
      toast.success(t('survey.messages.unpublished'));
    } catch {
      toast.error(t('survey.messages.publishFailed'));
    }
  };

  if (loading || !draft) {
    return (
      <div className="mx-auto max-w-4xl rounded-3xl border border-slate-200 bg-white p-8 text-sm text-slate-500 shadow-sm">
        {t('survey.editor.loading')}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8 pb-32">
      {/* Fixed/Sticky Top Header */}
      <div className="sticky top-4 z-20 rounded-3xl border border-slate-200 bg-white/90 p-4 shadow-sm backdrop-blur-md">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <button
              type="button"
              onClick={() => navigate('/surveys')}
              className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900"
            >
              <ArrowLeft className="h-4 w-4" />
              {t('common.back')}
            </button>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-xl font-bold text-slate-900 line-clamp-1 max-w-sm">
                {draft.title || t('survey.editor.title')}
              </h1>
              <SurveyStatusBadge status={draft.status} />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={saveDraft}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Save className="h-4 w-4" />
              {saving ? t('survey.editor.saving') : t('survey.editor.save')}
            </button>
            <button
              type="button"
              onClick={
                draft.status === 'active' ? handleUnpublish : handlePublish
              }
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
            >
              <Send className="h-4 w-4" />
              {draft.status === 'active'
                ? t('survey.editor.unpublish')
                : t('survey.editor.publish')}
            </button>
          </div>
        </div>
      </div>

      <main className="space-y-8">
        {/* Bloc 1: Informations générales */}
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 mb-4">
            {t('survey.editor.generalInfo')}
          </h2>
          <div className="space-y-4">
            <label className="block">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                {t('survey.form.title', { defaultValue: "Titre de l'enquête (FR)" })}
              </span>
              <input
                value={draft.title}
                onChange={(event) =>
                  setDraft({ ...draft, title: event.target.value })
                }
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-base font-semibold outline-none transition focus:border-indigo-500 focus:bg-white"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                {t('survey.form.description', { defaultValue: 'Description (FR)' })}
              </span>
              <textarea
                value={draft.description || ''}
                onChange={(event) =>
                  setDraft({ ...draft, description: event.target.value })
                }
                rows={3}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:bg-white"
              />
            </label>
          </div>
        </section>

        {/* Bloc 2: Sections */}
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">
              {t('survey.editor.sections', { defaultValue: 'Sections' })}
            </h2>
            <button
              type="button"
              onClick={addSection}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
            >
              <Plus className="h-4 w-4" />
              {t('survey.editor.addSection', { defaultValue: 'Ajouter une section' })}
            </button>
          </div>

          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={draft.sections.map((section) => getSectionId(section))}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-6">
                {draft.sections.length === 0 ? (
                  <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500 shadow-sm">
                    {t('survey.editor.empty')}
                  </div>
                ) : (
                  draft.sections.map((section, sectionIndex) => (
                    <SectionEditor
                      key={getSectionId(section)}
                      id={getSectionId(section)}
                      section={section}
                      onTitleChange={(title) =>
                        updateSection(sectionIndex, (currentSection) => ({
                          ...currentSection,
                          title,
                        }))
                      }
                      onDescriptionChange={(description) =>
                        updateSection(sectionIndex, (currentSection) => ({
                          ...currentSection,
                          description,
                        }))
                      }
                      onAddQuestion={() => addQuestion(sectionIndex)}
                      onDelete={() => deleteSection(sectionIndex)}
                    >
                      <SortableContext
                        items={section.questions.map((question) =>
                          getQuestionId(section, question)
                        )}
                        strategy={verticalListSortingStrategy}
                      >
                        {section.questions.length === 0 ? (
                          <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-4 text-center text-sm text-slate-500">
                            {t('survey.editor.noQuestions')}
                          </div>
                        ) : (
                          section.questions.map((question, questionIndex) => (
                            <QuestionEditor
                              key={getQuestionId(section, question)}
                              id={getQuestionId(section, question)}
                              question={question}
                              onChange={(updatedQuestion) =>
                                updateQuestion(
                                  sectionIndex,
                                  questionIndex,
                                  () => updatedQuestion
                                )
                              }
                              onDelete={() =>
                                deleteQuestion(sectionIndex, questionIndex)
                              }
                            />
                          ))
                        )}
                      </SortableContext>
                    </SectionEditor>
                  ))
                )}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      </main>
    </div>
  );
};
