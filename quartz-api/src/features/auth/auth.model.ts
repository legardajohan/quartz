import { Schema, model, Document } from 'mongoose';
import { GradeLevel, IdentificationType, UserRole } from './auth.types';

export interface IUser {
  institutionId: Schema.Types.ObjectId;
  role: UserRole;
  firstName: string;
  middleName?: string;
  lastName: string;
  secondLastName?: string;
  identificationType: IdentificationType;
  identificationNumber: number;
  phoneNumber?: string;
  email?: string;
  passwordHash?: string;
  schoolId: Schema.Types.ObjectId; // The user is associated with a specific school
  gradesTaught?: GradeLevel[]; // Optional. For students, it's an array with one grade. For teachers, it's an array of grades.
  createdAt?: Date;
  updatedAt?: Date;
};

export interface IUserDocument extends IUser, Document {
  toSafeUser(): SafeUser;
};

// Type for safe user data without password hash
// This is used to return user data without exposing sensitive information
export type SafeUser = Omit<IUser, 'passwordHash'> & { _id: Schema.Types.ObjectId };

const UserSchema = new Schema<IUserDocument>({
  institutionId: { type: Schema.Types.ObjectId, ref: 'EducationalInstitution', required: true },
  role: { type: String, enum: Object.values(UserRole), required: true },
  firstName: { type: String, required: true },
  middleName: { type: String }, 
  lastName: { type: String, required: true },
  secondLastName: { type: String }, 
  identificationType: { type: String, enum: Object.values(IdentificationType), required: true },
  identificationNumber: { type: Number, required: true, unique: true }, // Unique within the institution
  phoneNumber: { type: String }, // Optional for students
  email: { type: String }, // Optional for students
  passwordHash: { type: String, select: false }, // Optional for students 
  schoolId: { type: Schema.Types.ObjectId, ref: 'School', required: true }, // The user is associated with a specific school
  gradesTaught: [{ type: String, enum: Object.values(GradeLevel) }], // Optional. For students, an array with one grade. For teachers, an array of grades.
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Instance method to return a safe user object without password hash
UserSchema.methods.toSafeUser = function (): SafeUser {
  return {
    _id: this._id,
    institutionId: this.institutionId,
    role: this.role,
    firstName: this.firstName,
    middleName: this.middleName,
    lastName: this.lastName,
    secondLastName: this.secondLastName,
    identificationType: this.identificationType,
    identificationNumber: this.identificationNumber,
    phoneNumber: this.phoneNumber,
    email: this.email,
    schoolId: this.schoolId,
    gradesTaught: this.gradesTaught,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

export const User = model<IUserDocument>('User', UserSchema);
