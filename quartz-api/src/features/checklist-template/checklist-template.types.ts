import { Types } from 'mongoose';

export interface IChecklistTemplate {
  _id: Types.ObjectId;
  institutionId: Types.ObjectId;
  periodId: Types.ObjectId;
  teacherId: Types.ObjectId;
  grade: string;
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

export interface SubjectSnapshotData {
  subject: { _id: string; name: string };
  learnings: { description: string }[];
}

export interface CreateChecklistTemplateData {
  name: string;
  periodId: string;
  grade: string;
}

export interface UpdateChecklistTemplateData {
  name?: string;
  subjects?: SubjectSnapshotData[];
}

export interface IChecklistTemplateResponse {
  _id: string;
  institutionId: string;
  grade: string;
  name: string;
  period: {
    _id: string;
    name: string;
  };
  author: {
    _id: string;
    firstName: string;
    lastName: string;
  };
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
