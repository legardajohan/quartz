import { Request, Response } from "express";
import { getSchoolsByInstitution } from "./school.service";

export const getSchoolsByInstitutionController = async (req: Request, res: Response) => {
    try {
        const user = req.user;
        if (!user || !user.institutionId) {
            return res.status(401).json({ message: "Usuario no autenticado" });
        }

        const institutionId = user.institutionId.toString();
        const schools = await getSchoolsByInstitution(institutionId);
        res.status(200).json(schools);
    } catch (error) {
        console.error("Error al obtener las escuelas: ", error);
        res.status(500).json({
            message: "Error al obtener las escuelas",
            error: error instanceof Error ? error.message : String(error)
        });
    }
}