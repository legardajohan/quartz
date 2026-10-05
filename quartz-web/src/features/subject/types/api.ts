import type { Subject, SubjectType, SubjectEvaluationMode } from '@/types/domain';

export type SubjectDto = Subject;

export type SubjectsResponse = SubjectDto[];

export interface NewSubject {
  name: string;
  type: SubjectType;
  evaluationMode?: SubjectEvaluationMode;
}

export type UpdateSubject = Partial<NewSubject>;
