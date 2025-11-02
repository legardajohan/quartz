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

export interface Subject {
  _id: string;
  name: string;
}

export interface Period {
  _id: string;
  name: string;
  isActive: boolean;
}

export interface LearningState {
  learnings: Learning[];
  subjects: Subject[];
  periods: Period[];
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;
  fetchLearnings: () => Promise<void>;
  fetchSubjects: () => Promise<void>;
  fetchPeriods: () => Promise<void>;
  createLearning: (learningData: NewLearning) => Promise<void>;
  deleteLearning: (id: string) => Promise<void>;
}
