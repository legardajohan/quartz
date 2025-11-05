import { Period, IPeriodDocument } from './period.model';

export const getPeriodsByInstitution = async (institutionId: string): Promise<IPeriodDocument[]> => {
    try {
        const periods = await Period.find({ institutionId }).sort({ startDate: -1 }).lean();
        return periods;
    } catch (error) {
        console.error('Error fetching periods by institution:', error);
        throw new Error('Failed to fetch periods.');
    }
};
