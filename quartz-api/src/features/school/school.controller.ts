import { Request, Response } from "express";
import {
    getSchoolsByInstitution,
    createSchool,
    updateSchool,
    deleteSchool,
    PlainSchoolObject,
} from "./school.service";
import { ISchoolDTO } from "./school.types";

function mapSchoolToDTO(school: PlainSchoolObject): ISchoolDTO {
    return {
        _id: school._id.toString(),
        schoolNumber: school.schoolNumber,
        name: school.name,
    };
}

export const getSchoolsByInstitutionController = async (req: Request, res: Response) => {
    const institutionId = req.user!.institutionId.toString();
    const schools = await getSchoolsByInstitution(institutionId);
    res.status(200).json(schools.map(mapSchoolToDTO));
};

export const createSchoolController = async (req: Request, res: Response) => {
    const institutionId = req.user!.institutionId.toString();
    const school = await createSchool(institutionId, req.body);
    res.status(201).json(mapSchoolToDTO(school));
};

export const updateSchoolController = async (req: Request, res: Response) => {
    const { schoolId } = req.params;
    const institutionId = req.user!.institutionId.toString();
    const school = await updateSchool(schoolId, institutionId, req.body);
    res.status(200).json(mapSchoolToDTO(school));
};

export const deleteSchoolController = async (req: Request, res: Response) => {
    const { schoolId } = req.params;
    const institutionId = req.user!.institutionId.toString();
    await deleteSchool(schoolId, institutionId);
    res.status(204).send();
};
