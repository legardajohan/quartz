export enum UserRole {
  JEFE_DE_AREA = 'Jefe de Área',
  DOCENTE = 'Docente',
  ESTUDIANTE = 'Estudiante',
}

export enum IdentificationType {
  CC = 'CC',
  TI = 'TI',
  RC = 'RC',
}

export enum GradeLevel {
  TRANSICION = 'Transición',
  PRIMERO = '1ro',
  SEGUNDO = '2do',
  TERCERO = '3ro',
  CUARTO = '4to',
  QUINTO = '5to',
  SEXTO = '6to',
  SEPTIMO = '7mo',
  OCTAVO = '8vo',
  NOVENO = '9no',
  DECIMO = '10mo',
  ONCEMO = '11mo',
}

export interface ISessionData {
  user: {
    _id: string;
    institutionId: string;
    role: UserRole;
    firstName: string;
    lastName: string;
    secondLastName?: string;
    schoolId?: string;
  };
  periods: {
    _id: string;
    name: string;
    isActive: boolean;
  }[];
  subjects: {
    _id: string;
    name: string;
  }[];
  checklistTemplates: {
    _id: string;
    periodId: string;
    name: string;
  }[];
}
