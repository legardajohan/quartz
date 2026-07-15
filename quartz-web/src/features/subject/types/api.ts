import type { SubjectType, SubjectEvaluationMode } from '@/types/domain';
import type { SubjectDto } from './store';

export type SubjectsResponse = SubjectDto[];

export interface NewSubject {
  name: string;
  type: SubjectType;
  evaluationMode?: SubjectEvaluationMode;
}

export type UpdateSubject = Partial<NewSubject>;
