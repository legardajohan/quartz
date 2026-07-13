export type GlobalValuationStatus = 'Evaluado' | 'Evaluando' | 'Por diligenciar';

export type QualitativeValuation = 'Logrado' | 'En proceso' | 'Con dificultad';

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

export interface IReportInstitution {
  _id: string;
  name: string;
  daneCode: string;
  address: string;
  rectorName: string;
  email: string;
  shield?: string;
}

export interface IReportPeriod {
  _id: string;
  name: string;
  year: number;
  isActive: boolean;
}

export interface IReportTeacher {
  _id: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  secondLastName?: string;
  school: string;
}

export interface IReportStudent {
  _id: string;
  identificationType: string;
  identificationNumber: number;
  firstName: string;
  middleName?: string;
  lastName: string;
  secondLastName?: string;
  school: {
    _id: string;
    schoolNumber: number;
    name: string;
  };
  grade: string;
}

export interface IReportValuation {
  _id: string;
  name: string;
  globalStatus: GlobalValuationStatus | null;
  valuationsBySubject: IValuationBySubjectDTO[];
}

export interface IReportTemplate {
  _id: string;
  institution: IReportInstitution;
  period: IReportPeriod;
  teacher: IReportTeacher;
  student: IReportStudent;
  valuation: IReportValuation;
  generatedAt: string;
}
