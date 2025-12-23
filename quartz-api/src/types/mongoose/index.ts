import { Schema } from 'mongoose';

export type LeanDocument<T> = T & {
    _id: Schema.Types.ObjectId;
    createdAt?: Date;
    updatedAt?: Date;
};