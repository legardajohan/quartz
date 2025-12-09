import { Request, Response } from 'express';
import { initializeStudentValuation, updateStudentValuation } from './student-valuation.service';
import AppError from '../../utils/AppError';

export async function initializeValuationController(req: Request, res: Response) {
  try {
    const user = req.user;
    if (!user || !user._id || !user.institutionId) {
      console.error('Critical: User object on request is missing required properties (_id or institutionId).');
      return res.status(500).json({ message: 'Error interno del servidor: información de usuario corrupta o incompleta.' });
    }

    const { studentId, periodId } = req.params;
    const teacherId = user._id.toString();
    const institutionId = user.institutionId.toString();

    const valuation = await initializeStudentValuation(
      studentId,
      teacherId,
      institutionId,
      periodId
    );

    res.status(200).json(valuation);
  } catch (error: any) {
      if (error.message.includes('plantilla de lista de chequeo')) {
      return res.status(400).json({ message: error.message });
    }
    console.error("Error in controller to initialize StudentValuation: ", error);
    res.status(500).json({ message: 'Error al inicializar la valoración del estudiante.' });
  }
};

export async function updateValuationController(req: Request, res: Response) {
  try {
    const user = req.user;
    if (!user || !user.institutionId) {
      console.error('Critical: User object on request is missing institutionId.');
      return res.status(500).json({ message: 'Error interno del servidor: información de usuario corrupta.' });
    }

    const { id } = req.params;
    const updateData = req.body;
    const institutionId = user.institutionId.toString();

    const updatedValuation = await updateStudentValuation(
      id,
      institutionId,
      updateData
    );

    res.status(200).json(updatedValuation);
  } catch (error: any) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    console.error("Error in controller to update StudentValuation: ", error);
    res.status(500).json({ message: 'Error al actualizar la valoración del estudiante.' });
  }
}
