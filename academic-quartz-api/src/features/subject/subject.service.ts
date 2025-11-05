import { Subject, ISubjectDocument } from './subject.model';

export const getSubjectsByInstitution = async (institutionId: string): Promise<ISubjectDocument[]> => {
    try {
        const subjects = await Subject.find({ institutionId }).sort({ name: 1 }).lean();
        return subjects;
    } catch (error) {
        console.error('Error fetching subjects by institution:', error);
        throw new Error('Failed to fetch subjects.');
    }
};