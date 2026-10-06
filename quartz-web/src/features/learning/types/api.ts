import type { GradeLevel } from '@/types/domain';

export interface Learning {
  _id: string;
  description: string;
  author: {
    _id: string;
    name: string;
    role: string;
  };
  grade: GradeLevel;
  subject: {
    _id: string;
    name: string;
  };
  period: {
    _id: string;
    name: string;
  };
  version: number;
}

export type LearningsResponse = Learning[];

export interface NewLearning {
    subjectId: string;
    periodId: string;
    description: string;
    grade: GradeLevel;
}

export type UpdateLearning = Partial<NewLearning> & { version: number };
