import { NewLearning, UpdateLearning } from ".";

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
  updateLearning: (id: string, learningData: UpdateLearning) => Promise<void>;
  deleteLearning: (id: string) => Promise<void>;
}
