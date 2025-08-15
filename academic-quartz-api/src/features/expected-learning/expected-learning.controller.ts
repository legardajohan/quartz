import { Request, Response } from "express";
import { createExpectedLearning } from './expected-learning.service';

export async function expectedLearningController(req: Request, res: Response) {
  try {
    const { 
        institutionId, 
        subjectId, 
        periodId, 
        description, 
        grade 
    } = req.body;

    // Call the service to create expected learning
    const expectedLearning = await createExpectedLearning(
      institutionId,
      subjectId,
      periodId,
      description,
      grade
    );

    res.status(201).json({
      message: 'Aprendizaje esperado creado exitosamente.',
      expectedLearning
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