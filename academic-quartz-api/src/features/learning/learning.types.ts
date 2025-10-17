import { Types } from 'mongoose';

export interface ILearningResponse {
  _id: Types.ObjectId;
  institutionId: Types.ObjectId;
  description: string;
  grade: string;
  createdAt?: string; 
  updatedAt?: string; 
  __v?: number;

  // Populated and transformed fields
  user: {
    _id: Types.ObjectId;
    name: string;
    role: string;
  };
  subject: {
    _id: Types.ObjectId;
    name: string;
    type?: 'Dimensión' | 'Asignatura';
  };
  period: {
    _id: Types.ObjectId;
    name: string;
    startDate: Date;
    endDate: Date;
    isActive: boolean;
  };
}
