import type { SchoolDto } from './store';

export type SchoolsResponse = SchoolDto[];

export interface NewSchool {
  name: string;
}

export type UpdateSchool = Partial<NewSchool>;
