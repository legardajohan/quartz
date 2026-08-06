import { GlobalValuationStatus, IValuationBySubjectDTO, QualitativeValuation } from "../student-valuation/student-valuation.types";
import { SubjectEvaluationMode } from "../subject/subject.types";

// Definicion de interfaces de evaluacion de estudiante

export interface IInstitution {
    _id: string;
    name: string;
    daneCode: string;
    address: string;
    rectorName: string;
    email: string;
    shield?: string; // URL del escudo. Sin mecanismo de subida aun: el informe reserva el espacio.
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

// Interfaces de la Carta Comunicativa

export interface ILetterConceptOption {
    _id: string;
    description: string;
}

export interface ILetterSubjectBlock {
    subjectId: string;
    subjectName: string;
    evaluationMode: SubjectEvaluationMode;
    valuationType: QualitativeValuation | null; // null en modo description
    subjectPercentage: number;
    assignedConceptId: string | null;
    conceptText: string; // texto del concepto asignado, o performanceDescription en modo description
    availableConcepts: ILetterConceptOption[]; // [] en modo description
}

export interface ICommunicativeLetterTemplate {
    _id: string;
    institution: IInstitution;
    period: IPeriod;
    teacher: ITeacher;
    student: IStudent;
    subjects: ILetterSubjectBlock[];
    observations: string | null;
    generatedAt: string;
}

export interface IMissingConceptCoverage {
    subjectId: string;
    subjectName: string;
    missingValuationTypes: QualitativeValuation[];
}

export interface ILetterAvailability {
    periodId: string;
    isAvailable: boolean;
    missing: IMissingConceptCoverage[];
}
