import { Request, Response } from 'express';
import {
  initializeStudentValuation,
  updateStudentValuation,
  deleteStudentValuation,
  getStudentValuationById,
  getStudentValuations
} from './student-valuation.service';
import AppError from '../../utils/AppError';

/**
 * @description Get a single student valuation by its ID
 */
export async function getValuationByIdController(req: Request, res: Response) {
  try {
    const user = req.user;
    if (!user || !user.institutionId) {
      console.error('Critical: User object on request is missing institutionId.');
      return res.status(500).json({ message: 'Error interno del servidor: información de usuario corrupta.' });
    }

    const { valuationId } = req.params;
    const institutionId = user.institutionId.toString();

    const valuation = await getStudentValuationById(valuationId, institutionId);

    res.status(200).json(valuation);
  } catch (error: any) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    console.error("Error in controller to get StudentValuation by ID: ", error);
    res.status(500).json({ message: 'Error al obtener la valoración del estudiante.' });
  }
}

/**
 * @description Get all student valuations for a specific student
 */
export async function getValuationsByStudentController(req: Request, res: Response) {
  try {
    const user = req.user;
    if (!user || !user.institutionId) {
      console.error('Critical: User object on request is missing institutionId.');
      return res.status(500).json({ message: 'Error interno del servidor: información de usuario corrupta.' });
    }

    const { studentId } = req.params;
    const institutionId = user.institutionId.toString();

    const valuations = await getStudentValuations(studentId, institutionId);

    res.status(200).json(valuations);
  } catch (error: any) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    console.error("Error in controller to get StudentValuations by student: ", error);
    res.status(500).json({ message: 'Error al obtener las valoraciones del estudiante.' });
  }
}

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
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    if (error.message && error.message.includes('plantilla de lista de chequeo')) {
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

    const { valuationId } = req.params; // Changed from id to valuationId
    const updateData = req.body;
    const institutionId = user.institutionId.toString();

    const updatedValuation = await updateStudentValuation(
      valuationId, // Changed from id to valuationId
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

export async function deleteValuationController(req: Request, res: Response) {
  try {
    const user = req.user;
    if (!user || !user.institutionId) {
      console.error('Critical: User object on request is missing institutionId.');
      return res.status(500).json({ message: 'Error interno del servidor: información de usuario corrupta.' });
    }

    const { valuationId } = req.params;
    const institutionId = user.institutionId.toString();

    await deleteStudentValuation(valuationId, institutionId);

    res.status(200).json({ message: 'Valoración eliminada exitosamente.' });
  } catch (error: any) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    console.error("Error in controller to delete StudentValuation: ", error);
    res.status(500).json({ message: 'Error al eliminar la valoración del estudiante.' });
  }
}
