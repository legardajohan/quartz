import { NewLearning } from ".";

export interface Learning {
  _id: string;
  description: string;
  subject: {
    _id: string;
    name: string;
  };
  period: {
    _id: string;
    name: string;
  };
}

export interface LearningState {
  learnings: Learning[];
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;
  fetchLearnings: () => Promise<void>;
  createLearning: (learningData: NewLearning) => Promise<void>;
  deleteLearning: (id: string) => Promise<void>;
}
