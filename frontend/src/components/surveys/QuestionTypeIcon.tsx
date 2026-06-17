import {
  CalendarDays,
  CheckSquare,
  Circle,
  Hash,
  ListChecks,
  RectangleHorizontal,
  Type,
} from 'lucide-react';

import type { QuestionType } from '../../types/survey';

type QuestionTypeIconProps = {
  type: QuestionType;
  className?: string;
};

const iconByType: Record<QuestionType, JSX.Element> = {
  radio: <Circle className="h-4 w-4" />,
  checkbox: <CheckSquare className="h-4 w-4" />,
  text_short: <Type className="h-4 w-4" />,
  text_long: <RectangleHorizontal className="h-4 w-4" />,
  scale: <Hash className="h-4 w-4" />,
  matrix: <ListChecks className="h-4 w-4" />,
  date: <CalendarDays className="h-4 w-4" />,
};

export const QuestionTypeIcon = ({
  type,
  className = '',
}: QuestionTypeIconProps) => {
  return <span className={className}>{iconByType[type]}</span>;
};
