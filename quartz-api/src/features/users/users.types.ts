import { UserRole, IdentificationType } from '../auth/auth.types';
import { GlobalValuationStatus } from '../student-valuation/student-valuation.types';

export interface School {
    _id: string;
    schoolNumber: number;
    name: string;
}

export interface ValuationSummary {
    _id: string;
    periodId: string;
    status: GlobalValuationStatus | null;
}

export type UserWithValuations = {
    _id: string;
    role: UserRole;
    firstName: string;
    middleName?: string;
    lastName: string;
    secondLastName?: string;
    identificationType: IdentificationType;
    identificationNumber: number;
    school: School;
    gradesTaught: string[];
    valuations: ValuationSummary[];
};
