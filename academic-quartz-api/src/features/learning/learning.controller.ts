import { Request, Response } from "express";
import { 
    getAllLearnings, 
    createLearning, 
    updateLearning, 
    deleteLearning, 
    mapLearningToResponse 
} from './learning.service';

export async function getAllLearningsController(req: Request, res: Response) {
    try {
        const learnings = await getAllLearnings(req.query);
        
        // Map each learning to the final response format
        const responseLearnings = learnings.map(mapLearningToResponse);

        res.status(200).json(responseLearnings);
    } catch (error: any) {
        console.error("Error en el controlador para obtener todos los Aprendizajes Esperados: ", error);
        res.status(500).json({ message: 'Error al obtener los Aprendizajes Esperados.' });
    }
}

export async function createLearningController(req: Request, res: Response) {
  try {
    const { 
        institutionId, 
        subjectId, 
        periodId,
        userId, 
        description, 
        grade 
    } = req.body;

    const learning = await createLearning(
      institutionId,
      subjectId,
      periodId,
      userId,
      description,
      grade
    );

    // TODO: Consider mapping this response as well if consistency is needed
    res.status(201).json({
      message: 'Aprendizaje esperado creado exitosamente.',
      learning
    });
  } catch (error: any) {
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

        // TODO: Consider mapping this response as well
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