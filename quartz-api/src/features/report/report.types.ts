import { GlobalValuationStatus, IValuationBySubjectDTO } from "../student-valuation/student-valuation.types";

// Definicion de interfaces de evaluacion de estudiante

export interface IInstitution {
    _id: string;
    name: string;
    daneCode: string;
    address: string;
    rectorName: string;
    email: string;
    shield?: string;
}

export interface IPeriod {
    _id: string;
    name: string;
    year: number;
    isActive: boolean;
}

export interface ITeacher {
    _id: string;
    firstName: string;
    middleName?: string;
    lastName: string;
    secondLastName?: string;
    school: string;
}

export interface IStudent {
    _id: string;
    identificationType: string;
    identificationNumber: number;
    firstName: string;
    middleName?: string;
    lastName: string;
    secondLastName?: string;
    school: {
        _id: string;
        schoolNumber: number;
        name: string;
    }
    grade: string;
    avatarUrl?: string;
}

export interface IStudentValuation {
    _id: string;
    name: string; // Nombre de la plantilla de Lista de Chequeo
    globalStatus: GlobalValuationStatus | null;
    valuationsBySubject: IValuationBySubjectDTO[];
    observations: string | null;
}

// Interface padre de Reportes

export interface IReportTemplate {
    _id: string;
    institution: IInstitution;
    period: IPeriod;
    teacher: ITeacher;
    student: IStudent;
    valuation: IStudentValuation;
    generatedAt: string; // Fecha de generación/impresión (ISO), calculada al momento de la petición
}
