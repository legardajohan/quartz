// Query params aceptados al consumir el endpoint
export interface GetUsersQuery {
  id?: string; // ObjectId (24 hex)
  role?: string; // "Estudiante" -> efectivo; otros valores devuelven array vacío
  schoolId?: string; // ObjectId (24 hex)
}

// DTO devuelto por el backend
export interface UserDto {
  _id: string;
  role: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  secondLastName?: string;
  identificationType: string;
  identificationNumber: number;
  phoneNumber?: string;
  schoolId: string;
}

// Tipo de respuesta
export type GetUsersResponse = UserDto[];
