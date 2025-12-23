import { Model, Types } from 'mongoose';

/**
 * Checks if a document with the given ID exists in the specified Mongoose model.
 * Throws a standardized error if the document is not found.
 * @param model The Mongoose model to query.
 * @param id The ID of the document to check.
 * @param documentName A user-friendly name for the document type (e.g., 'Institution').
 */
export async function ensureDocumentExists<T>(
    model: Model<T>,
    id: string | Types.ObjectId,
    documentName: string
): Promise<void> {
    const exists = await model.exists({ _id: id });
    if (!exists) {
        throw new Error(`El ${documentName} con el ID proporcionado no existe.`);
    }
}

type ValidationArgs = [Model<any>, string | Types.ObjectId, string];

/**
 * Executes multiple document existence checks in parallel.
 * Throws an error if any of the documents are not found.
 * @param validations An array of tuples, each containing [model, id, documentName].
 */
export async function validateAllExist(validations: ValidationArgs[]): Promise<void> {
    const validationPromises = validations.map(([model, id, name]) => 
        ensureDocumentExists(model, id, name)
    );
    await Promise.all(validationPromises);
}