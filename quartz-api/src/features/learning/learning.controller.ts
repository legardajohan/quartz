import { Request, Response } from "express";
import { ILearningResponse } from "./learning.types";
import { ILearningDocument } from "./learning.model";
import {
    getAllLearnings,
    createLearning,
    updateLearning,
    deleteLearning
} from './learning.service';
import AppError from '../../utils/AppError';

function mapLearningToResponse(learning: ILearningDocument): ILearningResponse {
    const learningObject = learning.toObject();

    return {
        _id: learningObject._id.toString(),
        description: learningObject.description,
        grade: learningObject.grade,
        author: {
            _id: learningObject.userId._id.toString(),
            name: `${learningObject.userId.firstName} ${learningObject.userId.lastName}`,
            role: learningObject.userId.role,
        },
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
    const institutionId = req.user!.institutionId.toString();
    const learnings = await getAllLearnings(institutionId, req.query);
    res.status(200).json(learnings.map(mapLearningToResponse));
}

export async function createLearningController(req: Request, res: Response) {
    const institutionId = req.user!.institutionId.toString();
    const userId = req.user!._id.toString();
    const populatedLearning = await createLearning(institutionId, userId, req.body);
    res.status(201).json(mapLearningToResponse(populatedLearning));
}

export async function updateLearningController(req: Request, res: Response) {
    const { learningId } = req.params;
    const institutionId = req.user!.institutionId.toString();
    const populatedLearning = await updateLearning(learningId, institutionId, req.body);
    if (!populatedLearning) {
        throw new AppError('Learning not found.', 404);
    }
    res.status(200).json(mapLearningToResponse(populatedLearning));
}

export async function deleteLearningController(req: Request, res: Response) {
    const { learningId } = req.params;
    const institutionId = req.user!.institutionId.toString();
    const deletedLearning = await deleteLearning(learningId, institutionId);
    if (!deletedLearning) {
        throw new AppError('Learning not found.', 404);
    }
    res.status(200).json({ message: 'Learning successfully deleted.' });
}
