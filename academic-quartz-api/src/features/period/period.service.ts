import { Period, PlainPeriodObject } from './period.model';

export const getPeriodsByInstitution = async (institutionId: string): Promise<PlainPeriodObject[]> => {
    try {
        const periods = await Period.find({ institutionId }).sort({ startDate: -1 }).lean<PlainPeriodObject[]>();
        return periods;
    } catch (error) {
        console.error('Error fetching periods by institution:', error);
        throw new Error('Failed to fetch periods.');
    }
};
