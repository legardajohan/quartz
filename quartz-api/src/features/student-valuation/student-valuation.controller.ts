import { Request, Response } from 'express';
import {
  initializeStudentValuation,
  updateStudentValuation,
  deleteStudentValuation,
  getStudentValuationById,
  getStudentValuations
} from './student-valuation.service';

export async function getValuationByIdController(req: Request, res: Response) {
  const { valuationId } = req.params;
  const institutionId = req.user!.institutionId.toString();

  const valuation = await getStudentValuationById(valuationId, institutionId);
  res.status(200).json(valuation);
}

export async function getValuationsByStudentController(req: Request, res: Response) {
  const { studentId } = req.params;
  const institutionId = req.user!.institutionId.toString();

  const valuations = await getStudentValuations(studentId, institutionId);
  res.status(200).json(valuations);
}

export async function initializeValuationController(req: Request, res: Response) {
  const { studentId, periodId } = req.params;
  const teacherId = req.user!._id.toString();
  const institutionId = req.user!.institutionId.toString();

  const valuation = await initializeStudentValuation(studentId, teacherId, institutionId, periodId);
  res.status(200).json(valuation);
}

export async function updateValuationController(req: Request, res: Response) {
  const { valuationId } = req.params;
  const updateData = req.body;
  const institutionId = req.user!.institutionId.toString();

  const updatedValuation = await updateStudentValuation(valuationId, institutionId, updateData);
  res.status(200).json(updatedValuation);
}

export async function deleteValuationController(req: Request, res: Response) {
  const { valuationId } = req.params;
  const institutionId = req.user!.institutionId.toString();

  await deleteStudentValuation(valuationId, institutionId);
  res.status(200).json({ message: 'Valoración eliminada exitosamente.' });
}
