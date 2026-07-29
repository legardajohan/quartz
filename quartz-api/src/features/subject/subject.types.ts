export enum SubjectType {
  DIMENSION = 'Dimensión',
  ASIGNATURA = 'Asignatura',
  AREA = 'Área',
  MATERIA = 'Materia',
}

export enum SubjectEvaluationMode {
  CHECKLIST = 'checklist',
  DESCRIPTION = 'description',
}

export interface ISubjectDTO {
  _id: string;
  name: string;
  type: SubjectType;
  evaluationMode: SubjectEvaluationMode;
}

export type CreateSubjectData = {
  name: string;
  type: SubjectType;
  evaluationMode?: SubjectEvaluationMode;
};

export type UpdateSubjectData = Partial<CreateSubjectData>;
