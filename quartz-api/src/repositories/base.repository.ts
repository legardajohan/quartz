import { Model, Document, FilterQuery, UpdateQuery, Types } from "mongoose";

type TenantId = string | Types.ObjectId;

// ─── Lecturas tenant-safe ─────────────────────────────────────────────────────
// Devuelven el Query sin ejecutar para que el llamador pueda encadenar
// .populate() / .sort() / .select() / .lean() antes de hacer await.
// institutionId siempre prevalece sobre cualquier valor en el filtro del llamador.

export function findScoped<T>(
  model: Model<T>,
  institutionId: TenantId,
  filter: FilterQuery<T> = {}
) {
  return model.find({ ...filter, institutionId } as FilterQuery<T>);
}

export function findOneScoped<T>(
  model: Model<T>,
  institutionId: TenantId,
  filter: FilterQuery<T> = {}
) {
  return model.findOne({ ...filter, institutionId } as FilterQuery<T>);
}

export function findByIdScoped<T>(
  model: Model<T>,
  institutionId: TenantId,
  id: string | Types.ObjectId
) {
  return model.findOne({ _id: id, institutionId } as FilterQuery<T>);
}

// ─── Escritura tenant-safe ────────────────────────────────────────────────────
// institutionId se fuerza en el payload al final, sobrescribiendo cualquier
// valor que el llamador pudiera haber incluido en data.

export async function createScoped<T extends Document>(
  model: Model<T>,
  institutionId: TenantId,
  data: Record<string, any>
): Promise<T> {
  const doc = new model({ ...data, institutionId });
  return doc.save() as unknown as Promise<T>;
}

// ─── Updates / Deletes tenant-safe ───────────────────────────────────────────

export function findOneAndUpdateScoped<T>(
  model: Model<T>,
  institutionId: TenantId,
  filter: FilterQuery<T>,
  update: UpdateQuery<T>,
  options: Record<string, any> = {}
) {
  return model.findOneAndUpdate(
    { ...filter, institutionId } as FilterQuery<T>,
    update,
    options
  );
}

export function findOneAndDeleteScoped<T>(
  model: Model<T>,
  institutionId: TenantId,
  filter: FilterQuery<T>
) {
  return model.findOneAndDelete({ ...filter, institutionId } as FilterQuery<T>);
}

export function deleteOneScoped<T>(
  model: Model<T>,
  institutionId: TenantId,
  filter: FilterQuery<T>
) {
  return model.deleteOne({ ...filter, institutionId } as FilterQuery<T>);
}
