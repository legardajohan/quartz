export interface Learning {
  _id: string;
  description: string;
  author: {
    _id: string;
    name: string;
    role: string;
  };
  grade: string;
  subject: {
    _id: string;
    name: string;
  };
  period: {
    _id: string;
    name: string;
  };
}

export type LearningsResponse = Learning[];

export interface NewLearning {
    subjectId: string;
    periodId: string;
    description: string;
    grade: string;
}

export type UpdateLearning = Partial<NewLearning>;
