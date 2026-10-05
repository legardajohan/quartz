import { Types } from 'mongoose';
import { IStudentValuationDocument, IValuationBySubject, ILearningValuation } from './student-valuation.model';
import { IUserDocument } from '../auth/auth.model';
import { IPeriodDocument } from '../period/period.model';
import { ISubjectDocument } from '../subject/subject.model';
import { SubjectEvaluationMode } from '../subject/subject.types';
import { ILearningDocument } from '../learning/learning.model';
import { UserRole } from '../auth/auth.types';

export interface RequestorScope {
  role: UserRole;
  schoolId?: string;
}

// -----------------------------------------------------------------------------
// I. DATA TRANSFER OBJECTS (DTOs) for enriched data
// -----------------------------------------------------------------------------

export enum QualitativeValuation {
  ACHIEVED = 'Logrado',
  IN_PROCESS = 'En proceso',
  WITH_DIFICULTY = 'Con dificultad',
}

export enum GlobalValuationStatus {
  COMPLETED = 'Evaluado',
  IN_PROGRESS = 'Evaluando',
  CREATED = 'Por diligenciar',
}

/** Puntos por nivel de valoración cualitativa (docs/domain.md §Valoración por ítem). */
export const VALUATION_POINTS: Record<QualitativeValuation, number> = {
  [QualitativeValuation.ACHIEVED]: 3,
  [QualitativeValuation.IN_PROCESS]: 2,
  [QualitativeValuation.WITH_DIFICULTY]: 1,
};

/** Umbrales de `resolveQualitativeValuation` (docs/domain.md §Concepto por dimensión). */
export const CONCEPT_THRESHOLDS = { ACHIEVED: 80, IN_PROCESS: 46 } as const;

export interface ILearningValuationDTO {
  learningId: string;
  learningDescription: string;
  qualitativeValuation: QualitativeValuation | null;
  pointsObtained: number;
}

type ValuationBySubjectBase = {
  subjectId: string;
  subjectName: string;
  totalSubjectScore: number;
  maxSubjectScore: number;
  subjectPercentage: number;
  assignedConceptId?: string;
  assignedConceptText?: string | null;
};

export type IValuationBySubjectDTO =
  | (ValuationBySubjectBase & {
      evaluationMode: SubjectEvaluationMode.CHECKLIST;
      learningValuations: ILearningValuationDTO[];
      performanceDescription: null;
    })
  | (ValuationBySubjectBase & {
      evaluationMode: SubjectEvaluationMode.DESCRIPTION;
      learningValuations: [];
      performanceDescription: string | null;
    });

export type StudentNameFields = {
  firstName: string;
  middleName?: string;
  lastName: string;
  secondLastName?: string;
};

export interface IStudentValuationDTO {
  _id: string;
  institutionId: string;
  studentId: string;
  studentName: StudentNameFields;
  teacherId: string;
  checklistTemplateId: string;
  periodId: string;
  periodName: string;
  globalStatus: GlobalValuationStatus | null;
  valuationsBySubject: IValuationBySubjectDTO[];
  observations: string | null;
}


/**
 * Forma sin poblar de una StudentValuation (p. ej. de `findScoped(...).lean()`), consumida por
 * `mapValuationToDTO` para armar el DTO sin `populate()` (RPT-07: resolución por lote).
 */
export type IStudentValuationLean = Pick<
  IStudentValuationDocument,
  '_id' | 'institutionId' | 'studentId' | 'teacherId' | 'checklistTemplateId' | 'periodId' | 'globalStatus' | 'valuationsBySubject' | 'observations'
>;

// -----------------------------------------------------------------------------
// II. POPULATED DOCUMENT TYPES (for service-layer transformations)
// -----------------------------------------------------------------------------

// Populated version of IValuationBySubject
interface IPopulatedValuationBySubject extends Omit<IValuationBySubject, 'subjectId'> {
  subjectId: ISubjectDocument;
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
  globalStatus: GlobalValuationStatus | null;
  valuationsBySubject: IValuationBySubject[];
};

type LearningValuationUpdate = {
  learningId: Types.ObjectId | string;
  qualitativeValuation: QualitativeValuation | null;
};

type ValuationBySubjectUpdate = {
  subjectId: Types.ObjectId | string;
  learningValuations: LearningValuationUpdate[];
  performanceDescription?: string | null;
};

export type StudentValuationUpdateData = {
  valuationsBySubject: ValuationBySubjectUpdate[];
  observations?: string | null;
};

export type ConceptAssignmentUpdate = {
  subjectId: string;
  conceptId: string;
  conceptText: string;
};

export type StudentValuationConceptsUpdateData = {
  assignments: ConceptAssignmentUpdate[];
};