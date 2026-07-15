import type { SubjectEvaluationMode } from "@/types/domain";

export type GlobalValuationStatus = 'Evaluado' | 'Evaluando' | 'Por diligenciar';

export type QualitativeValuation = 'Logrado' | 'En proceso' | 'Con dificultad';

export interface SchoolDto {
  _id: string;
  schoolNumber: number;
  name: string;
}

export interface ValuationSummary {
  _id: string;
  periodId: string;
  status: GlobalValuationStatus | null;
}

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
};

export type IValuationBySubjectDTO =
  | (ValuationBySubjectBase & {
      evaluationMode: Extract<SubjectEvaluationMode, 'checklist'>;
      learningValuations: ILearningValuationDTO[];
      performanceDescription: null;
    })
  | (ValuationBySubjectBase & {
      evaluationMode: Extract<SubjectEvaluationMode, 'description'>;
      learningValuations: [];
      performanceDescription: string | null;
    });

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
  globalStatus: GlobalValuationStatus | null;
  valuationsBySubject: IValuationBySubjectDTO[];
  observations: string | null;
}

// Update payload types
export type LearningValuationUpdate = {
  learningId: string;
  qualitativeValuation: QualitativeValuation | null;
};

export type ValuationBySubjectUpdate = {
  subjectId: string;
  learningValuations: LearningValuationUpdate[];
  performanceDescription?: string | null;
};

export type StudentValuationUpdateData = {
  valuationsBySubject: ValuationBySubjectUpdate[];
  observations?: string | null;
};