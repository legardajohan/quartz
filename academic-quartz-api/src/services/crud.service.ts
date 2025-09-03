import { Model, Document, FilterQuery, UpdateQuery } from "mongoose";

// Create document
export async function create<T extends Document>(
  model: Model<T>, 
  data: Omit<T, keyof Document>
): Promise<T> {
  const newDocument = new model(data);
  return await newDocument.save();
}

// Update by ID
export async function updateById<T extends Document>(
  model: Model<T>,
  id: string,
  data: UpdateQuery<T>
): Promise<T | null> {
  return await model.findByIdAndUpdate(id, data, { new: true }).exec();
}

// Delete by ID
export async function deleteById<T extends Document>(
  model: Model<T>,
  id: string
): Promise<T | null> {
  return await model.findByIdAndDelete(id).exec();
}

// Get by ID
export async function getById<T extends Document>(
  model: Model<T>,
  id: string
): Promise<T | null> {
  return await model.findById(id).exec();
}

// Get all with optional filtering
export async function getAll<T extends Document>(
  model: Model<T>,
  filter: FilterQuery<T> = {}
): Promise<T[]> {
  return await model.find(filter).exec();
}
