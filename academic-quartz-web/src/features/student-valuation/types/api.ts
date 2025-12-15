export type GlobalValuationStatus = 'Evaluado' | 'Evaluando' | 'Creado';

export type QualitativeValuation = 'Logrado' | 'En proceso' | 'Con dificultad';

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
  globalStatus: GlobalValuationStatus | null;
  valuationsBySubject: IValuationBySubjectDTO[];
}

// Update payload types
export type LearningValuationUpdate = {
  learningId: string;
  qualitativeValuation: QualitativeValuation | null;
};

export type ValuationBySubjectUpdate = {
  subjectId: string;
  learningValuations: LearningValuationUpdate[];
};

export type StudentValuationUpdateData = {
  valuationsBySubject: ValuationBySubjectUpdate[];
};