import { SchoolModel } from "./school.model";

export const getSchoolsByInstitution = async (institutionId: string) => {
    try {
        const schools = await SchoolModel.find({ institutionId });
        return schools;
    } catch (error) {
        console.error("Error al obtener las escuelas: ", error);
        throw new Error('Error al obtener las escuelas');
    }
}