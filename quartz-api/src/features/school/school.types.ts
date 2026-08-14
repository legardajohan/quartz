export interface ISchoolDTO {
  _id: string;
  schoolNumber: number;
  name: string;
}

export type CreateSchoolData = {
  name: string;
};

export type UpdateSchoolData = Partial<CreateSchoolData>;
