import { Types } from "mongoose";
import { GlobalValuationStatus, IValuationBySubjectDTO } from "../student-valuation/student-valuation.types";

// Definicion de interfaces de evaluacion de estudiante

export interface IInstitution {
    _id: Types.ObjectId;
    name: string;
    daneCode: string;
    address: string;
    rectorName: string;
    email: string;
    shield?: string; // URL del escudo
}

export interface IPeriod {
    _id: Types.ObjectId;
    name: string;
    isActive: boolean; // Verificar la Evaluación activa
}

export interface ITeacher {
    _id: Types.ObjectId;
    firstName: string;
    middleName?: string;
    lastName: string;
    secondLastName?: string;
    school: string;
}

export interface IStudent {
    _id: Types.ObjectId;
    identificationType: string;
    identificationNumber: number;
    firstName: string;
    middleName?: string;
    lastName: string;
    secondLastName?: string;
    school: {
        _id: Types.ObjectId;
        schoolNumber: number;
        name: string;
    }
    grade: string;
}

export interface IStudentValuation {
    _id: Types.ObjectId;
    name: string;
    globalStatus: GlobalValuationStatus | null;
    valuationsBySubject: IValuationBySubjectDTO[];
    // timestamp
}

// Interface padre de Reportes

export interface IReportTemplate {
    _id: Types.ObjectId;
    institution: IInstitution;
    period: IPeriod;
    teacher: ITeacher;
    student: IStudent;
    valuation: IStudentValuation;
    // timestamp
}