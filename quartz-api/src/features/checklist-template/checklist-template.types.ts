import { Types } from 'mongoose';

export interface IChecklistTemplate {
  _id: Types.ObjectId;
  institutionId: Types.ObjectId;
  periodId: Types.ObjectId;
  teacherId: Types.ObjectId;
  name: string;
  subjects: {
    subject: {
      _id: Types.ObjectId;
      name: string;
    };
    learnings: {
      _id?: Types.ObjectId;
      description: string;
    }[];
  }[];
}

export type CreateChecklistTemplateData = {
  name: string;
  periodId: Types.ObjectId;
};

export interface IChecklistTemplateResponse {
  _id: string;
  institutionId: string;
  periodId: string;
  teacherId: string;
  name: string;
  subjects: {
    subject: {
      _id: string;
      name: string;
    };
    learnings: {
      _id: string;
      description: string;
    }[];
  }[];
}

export interface IChecklistTemplateForSession {
  _id: string;
  name: string;
  periodId: string;
}