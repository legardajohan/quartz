import type { Learning } from './store';

export type LearningsResponse = Learning[];

export interface NewLearning {
    subjectId: string;
    periodId: string;
    description: string;
    grade: string;
}

export type UpdateLearning = Partial<NewLearning>;