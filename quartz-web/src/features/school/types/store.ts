import type { NewSchool, UpdateSchool } from './api';

export interface SchoolDto {
  _id: string;
  schoolNumber: number;
  name: string;
}

export interface SchoolState {
  schools: SchoolDto[];
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;
  fetchSchools: () => Promise<void>;
  createSchool: (data: NewSchool) => Promise<void>;
  updateSchool: (id: string, data: UpdateSchool) => Promise<void>;
  deleteSchool: (id: string) => Promise<void>;
}
