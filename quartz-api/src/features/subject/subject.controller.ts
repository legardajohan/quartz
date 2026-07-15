import { Request, Response } from 'express';
import {
    getSubjectsByInstitution,
    createSubject,
    updateSubject,
    deleteSubject,
} from './subject.service';
import { PlainSubjectObject } from './subject.model';
import { ISubjectDTO } from './subject.types';

function mapSubjectToDTO(subject: PlainSubjectObject): ISubjectDTO {
    return {
        _id: subject._id.toString(),
        name: subject.name,
        type: subject.type,
        evaluationMode: subject.evaluationMode,
    };
}

export const getSubjects = async (req: Request, res: Response) => {
    const institutionId = req.user!.institutionId.toString();
    const subjects = await getSubjectsByInstitution(institutionId);
    res.status(200).json(subjects.map(mapSubjectToDTO));
};

export const createSubjectController = async (req: Request, res: Response) => {
    const institutionId = req.user!.institutionId.toString();
    const subject = await createSubject(institutionId, req.body);
    res.status(201).json(mapSubjectToDTO(subject));
};

export const updateSubjectController = async (req: Request, res: Response) => {
    const { subjectId } = req.params;
    const institutionId = req.user!.institutionId.toString();
    const subject = await updateSubject(subjectId, institutionId, req.body);
    res.status(200).json(mapSubjectToDTO(subject));
};

export const deleteSubjectController = async (req: Request, res: Response) => {
    const { subjectId } = req.params;
    const institutionId = req.user!.institutionId.toString();
    await deleteSubject(subjectId, institutionId);
    res.status(204).send();
};
