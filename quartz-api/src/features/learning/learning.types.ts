export interface ILearningResponse {
  _id: string;
  description: string;
  author: {
    _id: string;
    name: string;
    role: string;
  };
  grade: string;
  period: {
    _id: string;
    name: string;
  };
  subject: {
    _id: string;
    name: string;
  };
}

export type LearningData = {
  subjectId: string;
  periodId: string;
  description: string;
  grade: string;
};

export type UpdateLearningData = Partial<LearningData>;