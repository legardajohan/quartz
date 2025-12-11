import { Types } from 'mongoose';
import { IStudentValuationDocument, IValuationBySubject, ILearningValuation } from './student-valuation.model';
import { IUserDocument } from '../auth/auth.model';
import { IPeriodDocument } from '../period/period.model';
import { ISubjectDocument } from '../subject/subject.model';
import { ILearningDocument } from '../learning/learning.model';

// -----------------------------------------------------------------------------
// I. DATA TRANSFER OBJECTS (DTOs) for enriched data
// -----------------------------------------------------------------------------

export interface ILearningValuationDTO {
  learningId: string;
  learningDescription: string;
  qualitativeValuation: 'Logrado' | 'En proceso' | 'Con dificultad' | null;
  pointsObtained: number;
}

export interface IValuationBySubjectDTO {
  subjectId: string;
  subjectName: string;
  learningValuations: ILearningValuationDTO[];
  totalSubjectScore: number;
  maxSubjectScore: number;
  subjectPercentage: number;
  assignedConceptId?: string;
}

type StudentName = {
  firstName: string;
  middleName?: string;
  lastName: string;
  secondLastName?: string;
};

export interface IStudentValuationDTO {
  _id: string;
  institutionId: string;
  studentId: string;
  studentName: StudentName;
  teacherId: string;
  checklistTemplateId: string;
  periodId: string;
  periodName: string;
  globalStatus: 'Completado' | 'En desarrollo' | 'Sin iniciar';
  valuationsBySubject: IValuationBySubjectDTO[];
}


// -----------------------------------------------------------------------------
// II. POPULATED DOCUMENT TYPES (for service-layer transformations)
// -----------------------------------------------------------------------------

// Populated version of ILearningValuation
interface IPopulatedLearningValuation extends Omit<ILearningValuation, 'learningId'> {
  learningId: ILearningDocument;
}

// Populated version of IValuationBySubject
interface IPopulatedValuationBySubject extends Omit<IValuationBySubject, 'subjectId' | 'learningValuations'> {
  subjectId: ISubjectDocument;
  learningValuations: IPopulatedLearningValuation[];
}

// Fully populated StudentValuation document
export type PopulatedValuation = Omit<IStudentValuationDocument, 'studentId' | 'periodId' | 'valuationsBySubject'> & {
  studentId: IUserDocument;
  periodId: IPeriodDocument;
  valuationsBySubject: IPopulatedValuationBySubject[];
};


// -----------------------------------------------------------------------------
// III. Service Layer data structures
// -----------------------------------------------------------------------------

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