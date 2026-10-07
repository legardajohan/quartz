import { GradeLevel, UserRole } from '../auth/auth.types';
import { QualitativeValuation } from '../student-valuation/student-valuation.types';

export interface DashboardFilters {
  institutionId: string;
  periodId?: string;
  schoolId?: string;
  shiftId?: string;
  grade?: GradeLevel;
  requestorRole: UserRole;
  requestorSchoolId?: string;
}

export interface IPeriodContext {
  _id: string;
  name: string;
  year: number;
  startDate: string;
  endDate: string;
  closingAlertDate: string | null;
  isActive: boolean;
  daysToClose: number;
}

export interface ICohortSummary {
  totalStudents: number;
  evaluated: number;
  inProgress: number;
  created: number;
  notStarted: number;
  coveragePercentage: number;
}

export interface IItemProgress {
  valuedItems: number;
  totalItems: number;
  percentage: number;
}

export interface ISubjectPerformanceRow {
  subjectId: string;
  subjectName: string;
  achieved: number;
  inProcess: number;
  withDificulty: number;
  pending: number;
  total: number;
}

export interface ISubjectConceptRow {
  subjectId: string;
  subjectName: string;
  achieved: number;
  inProcess: number;
  withDificulty: number;
  scoredStudents: number;
}

export interface ITeacherProgressRow {
  teacherId: string;
  teacherName: string;
  total: number;
  evaluated: number;
  pending: number;
  percentage: number;
}

export interface ISchoolProgressRow {
  schoolId: string;
  schoolName: string;
  totalStudents: number;
  evaluated: number;
  percentage: number;
}

export interface ICurriculumHealth {
  subjectsWithoutLearnings: { subjectId: string; subjectName: string }[];
  learningsBySubject: { subjectId: string; subjectName: string; count: number }[];
  missingConcepts: { subjectId: string; subjectName: string; missing: QualitativeValuation[] }[];
  totalLearnings: number;
  totalConcepts: number;
  totalChecklistTemplates: number;
}

export interface IPeriodTrendPoint {
  periodId: string;
  periodName: string;
  year: number;
  averagePercentage: number;
  scoredStudents: number;
}

export interface IAtRiskStudentRow {
  studentId: string;
  studentName: string;
  avatarUrl: string | null;
  subjectsWithDificulty: number;
  subjectNames: string[];
}

export interface IDashboardResponse {
  period: IPeriodContext | null;
  scope: {
    role: UserRole;
    schoolId: string | null;
    schoolName: string | null;
    grade: GradeLevel | null;
    shiftId: string | null;
    isInstitutionWide: boolean;
  };
  cohort: ICohortSummary;
  itemProgress: IItemProgress;
  performanceBySubject: ISubjectPerformanceRow[];
  conceptBySubject: ISubjectConceptRow[];
  teacherProgress: ITeacherProgressRow[] | null;
  schoolProgress: ISchoolProgressRow[] | null;
  curriculumHealth: ICurriculumHealth | null;
  periodTrend: IPeriodTrendPoint[];
  atRiskStudents: IAtRiskStudentRow[];
  generatedAt: string;
}
