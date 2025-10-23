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
        const user = req.user;
        if (!user || !user._id || !user.institutionId) {
            console.error('Critical: User object on request is missing required properties (_id or institutionId).');
            return res.status(500).json({ message: 'Error interno del servidor: información de usuario corrupta o incompleta.' });
        }

        const institutionId = user.institutionId.toString();
        const learnings = await getAllLearnings(institutionId, req.query);

        const responseLearnings = learnings.map(mapLearningToResponse);

        res.status(200).json(responseLearnings);
    } catch (error: any) {
        console.error("Error in controller to get all Learnings: ", error);
        res.status(500).json({ message: 'Error getting Learnings.' });
    }
}

export async function createLearningController(req: Request, res: Response) {
    try {
        const learningData = req.body;
        const user = req.user;

        // Defensive check for a malformed user object on the request
        if (!user || !user._id || !user.institutionId) {
            console.error('Critical: User object on request is missing required properties (_id or institutionId).');
            return res.status(500).json({ message: 'Error interno del servidor: información de usuario corrupta o incompleta.' });
        }

        // Extract primitive types from the user object to pass to the service layer
        const institutionId = user.institutionId.toString();
        const userId = user._id.toString();

        const learning = await createLearning(
            institutionId,
            userId,
            learningData
        );

        // To map the response, we need to fetch the created document with populated fields
        const populatedLearning = await getAllLearnings(institutionId, { _id: learning._id });

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
        const user = req.user;

        if (!user || !user._id || !user.institutionId) {
            console.error('Critical: User object on request is missing required properties (_id or institutionId).');
            return res.status(500).json({ message: 'Error interno del servidor: información de usuario corrupta o incompleta.' });
        }

        const institutionId = user.institutionId.toString(); // conts intitutionId = req.user.institutionId.toString();
        const updateData = req.body;

        const updatedLearning = await updateLearning(learningId, institutionId, updateData);

        if (!updatedLearning) {
            return res.status(404).json({ message: 'Learning not found.' });
        }

        // To map the response, we need to fetch the updated document with populated fields
        const populatedLearning = await getAllLearnings(institutionId, { _id: updatedLearning._id });

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
        const { institutionId } = req.user!;

        const deletedLearning = await deleteLearning(learningId, institutionId.toString());

        if (!deletedLearning) {
            return res.status(404).json({ message: 'Learning not found.' });
        }

        res.status(200).json({ message: 'Learning successfully deleted.' });
    } catch (error: any) {
        console.error("Error in Learning deletion controller: ", error);
        res.status(500).json({ message: 'Error deleting Learning.' });
    }
}