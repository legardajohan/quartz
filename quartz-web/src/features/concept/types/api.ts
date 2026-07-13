import type { QualitativeValuation } from '../../student-valuation/types';

export type { QualitativeValuation };

export interface ConceptDto {
  _id: string;
  institutionId: string;
  description: string;
  valuationType: QualitativeValuation;
  subject: {
    _id: string;
    name: string;
  };
  period: {
    _id: string;
    name: string;
  };
  author: {
    _id: string;
    name: string;
    role: string;
  };
}

export interface NewConcept {
  description: string;
  valuationType: QualitativeValuation;
  subjectId: string;
  periodId: string;
}

export type UpdateConcept = Partial<NewConcept>;

export interface GetConceptsQuery {
  subjectId?: string;
  periodId?: string;
  valuationType?: QualitativeValuation;
}
