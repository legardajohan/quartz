import { Types } from 'mongoose';
import { IValuationBySubject } from './student-valuation.model';

export type StudentValuationCreationData = {
  institutionId: Types.ObjectId;
  studentId: Types.ObjectId;
  teacherId: Types.ObjectId;
  checklistTemplateId: Types.ObjectId;
  periodId: Types.ObjectId;
  globalStatus: 'Completado' | 'En desarrollo' | 'Sin iniciar';
  valuationsBySubject: IValuationBySubject[];
};

type LearningValuationUpdate = {
  learningId: Types.ObjectId | string;
  qualitativeValuation: 'Logrado' | 'En proceso' | 'Con dificultad' | null;
};

type ValuationBySubjectUpdate = {
  subjectId: Types.ObjectId | string;
  learningValuations: LearningValuationUpdate[];
};

export type StudentValuationUpdateData = {
  valuationsBySubject: ValuationBySubjectUpdate[];
};