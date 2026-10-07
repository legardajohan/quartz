export interface SchoolDto {
  _id: string;
  schoolNumber: number;
  name: string;
}

export type SchoolsResponse = SchoolDto[];

export interface NewSchool {
  name: string;
}

export type UpdateSchool = Partial<NewSchool>;
