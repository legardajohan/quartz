import { Schema, model, Document } from 'mongoose';
import { GradeLevel, IdentificationType, UserAccountStatus, UserRole } from './auth.types';

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
  shiftId?: Schema.Types.ObjectId; // Optional, students only. Sin `ref`: apunta a Institution.settings.shifts[]._id, subdocumento embebido no poblable.
  avatarUrl?: string;
  accountStatus?: UserAccountStatus; // Docente/Jefe de Área. Ausente ⇒ Activo.
  activationTokenHash?: string; // SHA-256 del token de invitación vigente.
  activationTokenExpiresAt?: Date;
  invitationSentAt?: Date; // Último envío de la invitación (enfriamiento de reenvío).
  createdAt?: Date;
  updatedAt?: Date;
};

export interface IUserDocument extends IUser, Document {
  toSafeUser(): SafeUser;
};

// Type for safe user data without password hash nor activation token hash
// This is used to return user data without exposing sensitive information
export type SafeUser = Omit<IUser, 'passwordHash' | 'activationTokenHash'> & { _id: Schema.Types.ObjectId };

const UserSchema = new Schema<IUserDocument>({
  institutionId: { type: Schema.Types.ObjectId, ref: 'Institution', required: true },
  role: { type: String, enum: Object.values(UserRole), required: true },
  firstName: { type: String, required: true },
  middleName: { type: String },
  lastName: { type: String, required: true },
  secondLastName: { type: String },
  identificationType: { type: String, enum: Object.values(IdentificationType), required: true },
  identificationNumber: { type: Number, required: true },
  phoneNumber: { type: String }, // Optional for students
  email: { type: String }, // Optional for students
  passwordHash: { type: String, select: false }, // Optional for students
  schoolId: { type: Schema.Types.ObjectId, ref: 'School', required: true }, // The user is associated with a specific school
  gradesTaught: [{ type: String, enum: Object.values(GradeLevel) }], // Optional. For students, an array with one grade. For teachers, an array of grades.
  shiftId: { type: Schema.Types.ObjectId }, // Optional, students only. Sin `ref`: referencia no poblable a Institution.settings.shifts[]._id.
  avatarUrl: { type: String },
  // Sin default: los usuarios previos a USR-04 no tienen el campo y se tratan como Activos.
  accountStatus: { type: String, enum: Object.values(UserAccountStatus) },
  activationTokenHash: { type: String, select: false },
  activationTokenExpiresAt: { type: Date },
  invitationSentAt: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Unicidad de la identificación por institución, no global.
UserSchema.index({ institutionId: 1, identificationNumber: 1 }, { unique: true });

// Soporta la resolución de cohorte del dashboard: estudiantes por sede (INF-04).
UserSchema.index({ institutionId: 1, role: 1, schoolId: 1 });

// Lookup de la activación por hash del token (pre-tenant). Sparse: solo usuarios Pendientes lo tienen.
UserSchema.index({ activationTokenHash: 1 }, { unique: true, sparse: true });

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
    avatarUrl: this.avatarUrl,
    accountStatus: this.accountStatus,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

export const User = model<IUserDocument>('User', UserSchema);
