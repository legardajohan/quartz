// import { StudentValuationModel, IStudentValuationDocument } from './student-valuation.model';
// import { Period, PlainPeriodObject } from '../period/period.model';
// import { ChecklistTemplateModel } from '../checklist-template/checklist-template.model';
// import AppError from '../../utils/AppError';

// export class StudentValuationService {

//   public async getOrCreateStudentValuation(
//     studentId: string,
//     teacherId: string,
//     institutionId: string,
//     periodId?: string
//   ): Promise<IStudentValuationDocument> {
//     let activePeriod: PlainPeriodObject | null = null;
    
//     // 1. Determine the active period
//     if (periodId) {
//       // If a periodId is provided, validate it.
//       const potentialPeriod = await Period.findOne({
//         _id: periodId,
//         institutionId,
//         isActive: true
//       }).lean();
//       if (potentialPeriod) {
//         activePeriod = potentialPeriod;
//       }
//     } else {
//       // If no periodId is provided, find the active one for the institution.
//       activePeriod = await Period.findOne({
//         institutionId,
//         isActive: true,
//       }).lean();
//     }

//     if (!activePeriod) {
//       throw new AppError('No hay un período académico activo configurado o el ID proporcionado no es válido.', 404);
//     }

//     // 2. Check if a valuation already exists for this student in the active period
//     const existingValuation = await StudentValuationModel.findOne({
//       studentId,
//       periodId: activePeriod._id,
//       institutionId,
//     }).lean();

//     if (existingValuation) {
//       return existingValuation as IStudentValuationDocument;
//     }

//     // 3. If not, find the teacher's checklist template for the active period
//     const template = await ChecklistTemplateModel.findOne({
//       teacherId,
//       periodId: activePeriod._id,
//       institutionId,
//     }).lean();

//     if (!template) {
//       throw new AppError('El docente debe crear una plantilla de checklist para el período activo primero.', 404);
//     }

//     // 4. Construct and save the new StudentValuation document
//     const newValuation = new StudentValuationModel({
//       institutionId,
//       studentId,
//       teacherId,
//       checklistTemplateId: template._id,
//       periodId: activePeriod._id, // Use the validated active period ID
//       globalStatus: 'No iniciado',
//       valuationsBySubject: template.subjects.map(subjectInTemplate => {
//         const maxScore = (subjectInTemplate.learnings || []).length * 3;
//         return {
//           subjectId: subjectInTemplate.subjectId,
//           maxSubjectScore: maxScore,
//           learningValuations: (subjectInTemplate.learnings || []).map(learningId => ({
//             learningId: learningId,
//             qualitativeValuation: null,
//             pointsObtained: 0,
//           })),
//         };
//       }),
//     });

//     const savedValuation = await newValuation.save();
//     return savedValuation.toObject();
//   }
// }