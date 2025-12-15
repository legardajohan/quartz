import { UserRole, IdentificationType } from '../auth/auth.types';
import { GlobalValuationStatus } from '../student-valuation/student-valuation.types';

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
    schoolId: string;
    valuations: ValuationSummary[];
};
