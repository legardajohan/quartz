import type { SubjectEvaluationMode } from "@/types/domain";

export interface LearningSnapshot {
  _id?: string;
  description: string;
}

export interface SubjectSnapshot {
  subject: {
    _id: string;
    name: string;
    evaluationMode: SubjectEvaluationMode;
  };
  learnings: LearningSnapshot[];
}

export interface ChecklistTemplateDto {
  _id: string;
  institutionId: string;
  grade: string;
  name: string;
  period: {
    _id: string;
    name: string;
  };
  author: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  subjects: SubjectSnapshot[];
}

export interface NewChecklistTemplate {
  name: string;
  periodId: string;
  grade: string;
}

export interface UpdateChecklistTemplate {
  name?: string;
  subjects?: SubjectSnapshot[];
}
