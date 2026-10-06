import { ISubjectDTO } from '../subject/subject.types';
import { IPeriodDTO } from '../period/period.types';
import { ReportKind, IShiftDTO } from '../institution/institution.types';

export enum UserRole {
  JEFE_DE_AREA = 'Jefe de Área',
  DOCENTE = 'Docente',
  ESTUDIANTE = 'Estudiante',
}

// Solo aplica a Docente y Jefe de Área. Ausente ⇒ Activo (usuarios previos a USR-04).
export enum UserAccountStatus {
  PENDIENTE = 'Pendiente',
  ACTIVO = 'Activo',
}

export interface IActivationPreview {
  email: string;
  firstName: string;
  institutionName: string;
}

export enum IdentificationType {
  CC = 'CC',
  TI = 'TI',
  RC = 'RC',
}

// Niveles de Preescolar (Decreto 2247/97). Grados 1°–11° quedan fuera de alcance.
export enum GradeLevel {
  PREJARDIN = 'Prejardín',
  JARDIN = 'Jardín',
  TRANSICION = 'Transición',
}

// Orden canónico 3→5 años: los listados de la UI lo respetan.
export const GRADE_LEVELS: readonly GradeLevel[] = [
  GradeLevel.PREJARDIN,
  GradeLevel.JARDIN,
  GradeLevel.TRANSICION,
];

export interface ISessionData {
  user: {
    _id: string;
    institutionId: string;
    role: UserRole;
    firstName: string;
    lastName: string;
    secondLastName?: string;
    schoolId?: string;
    avatarUrl?: string;
  };
  // Mismo DTO que `GET /periods` y `GET /subjects`: el front siembra su caché con ellos.
  periods: IPeriodDTO[];
  subjects: ISubjectDTO[];
  enabledReports: ReportKind[];
  multipleShifts: boolean;
  shifts: IShiftDTO[];
  offeredLevels: GradeLevel[];
}
