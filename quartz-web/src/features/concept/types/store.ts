import type { ConceptDto, NewConcept, UpdateConcept, GetConceptsQuery } from './api';

export interface ConceptState {
  concepts: ConceptDto[];
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;
  fetchConcepts: (query?: GetConceptsQuery) => Promise<void>;
  createConcept: (data: NewConcept) => Promise<void>;
  updateConcept: (id: string, data: UpdateConcept) => Promise<void>;
  deleteConcept: (id: string) => Promise<void>;
}
