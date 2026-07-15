import { Types } from 'mongoose';
import { QualitativeValuation } from '../student-valuation/student-valuation.types';

export { QualitativeValuation };

export interface IConcept {
  institutionId: Types.ObjectId;
  description: string;
  valuationType: QualitativeValuation;
  subjectId: Types.ObjectId;
  periodId: Types.ObjectId;
  authorId: Types.ObjectId;
}

export type ConceptData = {
  description: string;
  valuationType: QualitativeValuation;
  subjectId: string;
  periodId: string;
};

export type UpdateConceptData = Partial<ConceptData>;

export interface IConceptFilter {
  subjectId?: string;
  periodId?: string;
  valuationType?: QualitativeValuation;
}

export interface IConceptResponse {
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
