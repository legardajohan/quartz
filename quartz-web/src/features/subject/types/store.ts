import type { Subject } from '@/types/domain';
import type { NewSubject, UpdateSubject } from './api';

export type SubjectDto = Subject;

export interface SubjectState {
  subjects: SubjectDto[];
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;
  fetchSubjects: () => Promise<void>;
  createSubject: (data: NewSubject) => Promise<void>;
  updateSubject: (id: string, data: UpdateSubject) => Promise<void>;
  deleteSubject: (id: string) => Promise<void>;
}
