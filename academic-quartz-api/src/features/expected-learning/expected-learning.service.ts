import { ExpectedLearning, IExpectedLearningDocument } from "./expected-learning.model";
import { Institution } from '../institution/institution.model';
import { Subject } from '../subject/subject.model';
import { Period } from '../period/period.model';

export async function createExpectedLearning(
    institutionId: string,
    subjectId: string,
    periodId: string,
    description: string,
    grade: string
): Promise<IExpectedLearningDocument> {

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

    const expectedLearning = new ExpectedLearning({
        institutionId,
        subjectId,
        periodId,
        description,
        grade
    });

    return await expectedLearning.save();
}