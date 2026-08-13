export type UserRole = 'Jefe de Área' | 'Docente' | 'Estudiante';

export type IdentificationType = 'CC' | 'TI' | 'RC';

export type GradeLevel = 'Transición' | '1ro' | '2do' | '3ro' | '4to' | '5to' | '6to' | '7mo' | '8vo' | '9no' | '10mo' | '11mo';

export const SUBJECT_TYPES = ['Dimensión', 'Asignatura', 'Área', 'Materia'] as const;
export type SubjectType = typeof SUBJECT_TYPES[number];

export interface SubjectAxisLabel {
  singular: string;
  plural: string;
}

export const SUBJECT_TYPE_LABELS: Record<SubjectType, SubjectAxisLabel> = {
  'Dimensión': { singular: 'Dimensión', plural: 'Dimensiones' },
  'Asignatura': { singular: 'Asignatura', plural: 'Asignaturas' },
  'Área': { singular: 'Área', plural: 'Áreas' },
  'Materia': { singular: 'Materia', plural: 'Materias' },
};

export const SUBJECT_AXIS_FALLBACK: SubjectAxisLabel = {
  singular: 'Eje de Valoración',
  plural: 'Ejes de Valoración',
};

export function resolveSubjectAxisLabel(subjects: Pick<Subject, 'type'>[]): SubjectAxisLabel {
  const types = new Set(subjects.map((s) => s.type));
  if (types.size === 1) {
    const [onlyType] = types;
    return SUBJECT_TYPE_LABELS[onlyType];
  }
  return SUBJECT_AXIS_FALLBACK;
}

export type SubjectEvaluationMode = 'checklist' | 'description';

export type ReportKind = 'checklist' | 'communicative-letter';

export interface Subject {
  _id: string;
  name: string;
  type: SubjectType;
  evaluationMode: SubjectEvaluationMode;
}

export interface Period {
  _id: string;
  name: string;
  isActive: boolean;
}

export interface Shift {
  _id: string;
  name: string;
}

export interface ChecklistTemplates {
    _id: string;
    periodId: string;
    name: string;
  }

export interface User {
  _id: string;
  institutionId: string;
  role: UserRole;
  firstName: string;
  middleName?: string;
  lastName: string;
  secondLastName?: string;
  identificationType?: IdentificationType;
  identificationNumber?: number;
  email: string;
  schoolId: string;
  gradesTaught?: GradeLevel[];
  avatarUrl?: string; 
}

export interface ISessionData {
  user: Pick<User, 
    '_id' | 
    'institutionId' | 
    'role' | 
    'firstName' | 
    'lastName' | 
    'secondLastName' | 
    'schoolId' | 
    'avatarUrl'
    >;
  periods: Period[];
  subjects: Subject[];
  checklistTemplates: ChecklistTemplates[];
  enabledReports: ReportKind[];
  multipleShifts: boolean;
  shifts: Shift[];
}