import { Request, Response } from "express";
import { ILearningResponse } from "./learning.types";
import { ILearningDocument } from "./learning.model";
import { 
    getAllLearnings, 
    createLearning, 
    updateLearning, 
    deleteLearning
} from './learning.service';

function mapLearningToResponse(learning: ILearningDocument): ILearningResponse {
    const learningObject = learning.toObject();

    return {
        _id: learningObject._id.toString(),
        description: learningObject.description,
        subject: {
            _id: learningObject.subjectId._id.toString(),
            name: learningObject.subjectId.name,
        },
        period: {
            _id: learningObject.periodId._id.toString(),
            name: learningObject.periodId.name,
        }
    };
}

export async function getAllLearningsController(req: Request, res: Response) {
    try {
        const learnings = await getAllLearnings(req.query);
        
        const responseLearnings = learnings.map(mapLearningToResponse);

        res.status(200).json(responseLearnings);
    } catch (error: any) {
        console.error("Error in controller to get all Learnings: ", error);
        res.status(500).json({ message: 'Error getting Learnings.' });
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

    // To map the response, we need to fetch the created document with populated fields
    const populatedLearning = await getAllLearnings({ _id: learning._id });

    res.status(201).json(mapLearningToResponse(populatedLearning[0]));

  } catch (error: any) {
    if (error.message && (error.message.includes('subjectId') || error.message.includes('periodId'))) {
      return res.status(400).json({ message: error.message });
    }
    console.error("Error in Learning controller: ", error);
    res.status(500).json({ message: 'Error creating Learning.' });
  }
}

export async function updateLearningController(req: Request, res: Response) {
    try {
        const { learningId } = req.params;
        const updateData = req.body;

        const updatedLearning = await updateLearning(learningId, updateData);

        if (!updatedLearning) {
            return res.status(404).json({ message: 'Learning not found.' });
        }

        // To map the response, we need to fetch the updated document with populated fields
        const populatedLearning = await getAllLearnings({ _id: updatedLearning._id });

        res.status(200).json(mapLearningToResponse(populatedLearning[0]));

    } catch (error: any) {
        if (error.message && (error.message.includes('subjectId') || error.message.includes('periodId'))) {
            return res.status(400).json({ message: error.message });
        }
        console.error("Error in Learning update controller: ", error);
        res.status(500).json({ message: 'Error updating Learning.' });
    }
}

export async function deleteLearningController(req: Request, res: Response) {
    try {
        const { learningId } = req.params;

        const deletedLearning = await deleteLearning(learningId);

        if (!deletedLearning) {
            return res.status(404).json({ message: 'Learning not found.' });
        }

        res.status(200).json({ message: 'Learning successfully deleted.' });
    } catch (error: any) {
        console.error("Error in Learning deletion controller: ", error);
        res.status(500).json({ message: 'Error deleting Learning.' });
    }
}