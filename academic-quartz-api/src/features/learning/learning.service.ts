import { Learning, ILearningDocument } from "./learning.model";
import { Institution } from '../institution/institution.model';
import { Subject } from '../subject/subject.model';
import { Period } from '../period/period.model';

export async function createLearning(
    institutionId: string,
    subjectId: string,
    periodId: string,
    description: string,
    grade: string
): Promise<ILearningDocument> {

    // Validate existence of institutionId
    const institutionExists = await Institution.exists({ _id: institutionId });
    if (!institutionExists) {
        throw new Error('El institutionId proporcionado no existe.');
    }

    // Validate existence of subjectId
    const subjectExists = await Subject.exists({ _id: subjectId });
    if (!subjectExists) {
        throw new Error('El subjectId proporcionado no existe.');
    }

    // Validate existence of periodId
    const periodExists = await Period.exists({ _id: periodId });
    if (!periodExists) {
        throw new Error('El periodId proporcionado no existe.');
    }

    const learning = new Learning({
        institutionId,
        subjectId,
        periodId,
        description,
        grade
    });

    return await learning.save();
}

export async function updateLearning(
    learningId: string,
    updateData: Partial<ILearningDocument>
): Promise<ILearningDocument | null> {
    // Validate existence of subjectId if it is being updated
    if (updateData.subjectId) {
        const subjectExists = await Subject.exists({ _id: updateData.subjectId });
        if (!subjectExists) {
            throw new Error('El subjectId proporcionado no existe.');
        }
    }

    // Validate existence of periodId if it is being updated
    if (updateData.periodId) {
        const periodExists = await Period.exists({ _id: updateData.periodId });
        if (!periodExists) {
            throw new Error('El periodId proporcionado no existe.');
        }
    }

    const updatedLearning = await Learning.findByIdAndUpdate(
        learningId,
        updateData,
        { new: true }
    );

    return updatedLearning;
}

export async function deleteLearning(
    learningId: string
): Promise<ILearningDocument | null> {
    const deletedLearning = await Learning.findByIdAndDelete(learningId);
    return deletedLearning;
}