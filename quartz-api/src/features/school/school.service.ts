import { SchoolModel } from "./school.model";
import { findScoped } from "../../repositories/base.repository";

export const getSchoolsByInstitution = async (institutionId: string) => {
    try {
        const schools = await findScoped(SchoolModel, institutionId).exec();
        return schools;
    } catch (error) {
        console.error("Error al obtener las escuelas: ", error);
        throw new Error('Error al obtener las escuelas');
    }
}