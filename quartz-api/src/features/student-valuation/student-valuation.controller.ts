import { Request, Response } from 'express';
import {
  initializeStudentValuation,
  updateStudentValuation,
  updateValuationConcepts,
  deleteStudentValuation,
  getStudentValuationById,
  getStudentValuations
} from './student-valuation.service';
import type { RequestorScope } from './student-valuation.types';

function buildRequestorScope(req: Request): RequestorScope {
  return {
    role: req.user!.role,
    schoolId: req.user!.schoolId?.toString(),
  };
}

export async function getValuationByIdController(req: Request, res: Response) {
  const { valuationId } = req.params;
  const institutionId = req.user!.institutionId.toString();

  const valuation = await getStudentValuationById(valuationId, institutionId, buildRequestorScope(req));
  res.status(200).json(valuation);
}

export async function getValuationsByStudentController(req: Request, res: Response) {
  const { studentId } = req.params;
  const institutionId = req.user!.institutionId.toString();

  const valuations = await getStudentValuations(studentId, institutionId, buildRequestorScope(req));
  res.status(200).json(valuations);
}

export async function initializeValuationController(req: Request, res: Response) {
  const { studentId, periodId } = req.params;
  const teacherId = req.user!._id.toString();
  const institutionId = req.user!.institutionId.toString();

  const valuation = await initializeStudentValuation(studentId, teacherId, institutionId, periodId, buildRequestorScope(req));
  res.status(200).json(valuation);
}

export async function updateValuationController(req: Request, res: Response) {
  const { valuationId } = req.params;
  const updateData = req.body;
  const institutionId = req.user!.institutionId.toString();

  const updatedValuation = await updateStudentValuation(valuationId, institutionId, updateData, buildRequestorScope(req));
  res.status(200).json(updatedValuation);
}

export async function updateValuationConceptsController(req: Request, res: Response) {
  const { valuationId } = req.params;
  const institutionId = req.user!.institutionId.toString();

  const updatedValuation = await updateValuationConcepts(valuationId, institutionId, req.body, buildRequestorScope(req));
  res.status(200).json(updatedValuation);
}

export async function deleteValuationController(req: Request, res: Response) {
  const { valuationId } = req.params;
  const institutionId = req.user!.institutionId.toString();

  await deleteStudentValuation(valuationId, institutionId, buildRequestorScope(req));
  res.status(200).json({ message: 'Valoración eliminada exitosamente.' });
}
