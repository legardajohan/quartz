import { Request, Response } from "express";
import { createLearning, updateLearning, deleteLearning } from './learning.service';

export async function createLearningController(req: Request, res: Response) {
  try {
    const { 
        institutionId, 
        subjectId, 
        periodId, 
        description, 
        grade 
    } = req.body;

    // Call the service to create expected learning
    const learning = await createLearning(
      institutionId,
      subjectId,
      periodId,
      description,
      grade
    );

    res.status(201).json({
      message: 'Aprendizaje esperado creado exitosamente.',
      learning
    });
  } catch (error: any) {
    // Manejo de errores de validación de referencias
    if (error.message && (error.message.includes('subjectId') || error.message.includes('periodId'))) {
      return res.status(400).json({ message: error.message });
    }
    console.error("Error en el controlador de Expected Learning: ", error);
    res.status(500).json({ message: 'Error al crear el Aprendizaje Esperado.' });
  }
}

export async function updateLearningController(req: Request, res: Response) {
    try {
        const { learningId } = req.params;
        const updateData = req.body;

        const updatedLearning = await updateLearning(learningId, updateData);

        if (!updatedLearning) {
            return res.status(404).json({ message: 'Aprendizaje esperado no encontrado.' });
        }

        res.status(200).json({
            message: 'Aprendizaje esperado actualizado exitosamente.',
            learning: updatedLearning
        });
    } catch (error: any) {
        if (error.message && (error.message.includes('subjectId') || error.message.includes('periodId'))) {
            return res.status(400).json({ message: error.message });
        }
        console.error("Error en el controlador de actualización de Expected Learning: ", error);
        res.status(500).json({ message: 'Error al actualizar el Aprendizaje Esperado.' });
    }
}

export async function deleteLearningController(req: Request, res: Response) {
    try {
        const { learningId } = req.params;

        const deletedLearning = await deleteLearning(learningId);

        if (!deletedLearning) {
            return res.status(404).json({ message: 'Aprendizaje esperado no encontrado.' });
        }

        res.status(200).json({ message: 'Aprendizaje esperado eliminado exitosamente.' });
    } catch (error: any) {
        console.error("Error en el controlador de eliminación de Expected Learning: ", error);
        res.status(500).json({ message: 'Error al eliminar el Aprendizaje Esperado.' });
    }
}