import { Request, Response } from 'express';
import { IConceptResponse, IConceptFilter, ConceptData, UpdateConceptData } from './concept.types';
import { IConceptDocument } from './concept.model';
import {
  getConcepts,
  createConcept,
  updateConcept,
  deleteConcept,
} from './concept.service';

function mapConceptToResponse(concept: IConceptDocument): IConceptResponse {
  const conceptObject = concept.toObject();

  return {
    _id: conceptObject._id.toString(),
    institutionId: conceptObject.institutionId.toString(),
    description: conceptObject.description,
    valuationType: conceptObject.valuationType,
    subject: {
      _id: conceptObject.subjectId._id.toString(),
      name: conceptObject.subjectId.name,
    },
    period: {
      _id: conceptObject.periodId._id.toString(),
      name: conceptObject.periodId.name,
    },
    author: {
      _id: conceptObject.authorId._id.toString(),
      name: `${conceptObject.authorId.firstName} ${conceptObject.authorId.lastName}`,
      role: conceptObject.authorId.role,
    },
  };
}

export async function getConceptsController(req: Request, res: Response) {
  const institutionId = req.user!.institutionId.toString();
  const concepts = await getConcepts(institutionId, req.query as IConceptFilter);
  res.status(200).json(concepts.map(mapConceptToResponse));
}

export async function createConceptController(req: Request, res: Response) {
  const institutionId = req.user!.institutionId.toString();
  const authorId = req.user!._id.toString();
  const newConcept = await createConcept(institutionId, authorId, req.body as ConceptData);
  res.status(201).json(mapConceptToResponse(newConcept));
}

export async function updateConceptController(req: Request, res: Response) {
  const { id } = req.params;
  const institutionId = req.user!.institutionId.toString();
  const userId = req.user!._id.toString();
  const userRole = req.user!.role;
  const updatedConcept = await updateConcept(id, institutionId, userId, userRole, req.body as UpdateConceptData);
  res.status(200).json(mapConceptToResponse(updatedConcept));
}

export async function deleteConceptController(req: Request, res: Response) {
  const { id } = req.params;
  const institutionId = req.user!.institutionId.toString();
  const userId = req.user!._id.toString();
  const userRole = req.user!.role;
  await deleteConcept(id, institutionId, userId, userRole);
  res.status(200).json({ message: 'Concepto eliminado exitosamente.' });
}
