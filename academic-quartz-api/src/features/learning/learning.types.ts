import { Types } from 'mongoose';

export interface ILearningResponse {
  _id: string;
  description: string;
  subject: {
    _id: string;
    name: string;
  };
  period: {
    _id: string;
    name: string;
  };
}
