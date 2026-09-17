import { useCallback } from "react";
import { useAuthStore } from "./useAuthStore";
import type { UserRole } from "@/types/domain";

export interface Permissions {
  role: UserRole | undefined;
  userId: string | undefined;
  schoolId: string | undefined;
  isAreaLead: boolean;
  isTeacher: boolean;
  canManageOwned: (authorId: string) => boolean;
}

export function usePermissions(): Permissions {
  const role = useAuthStore((state) => state.sessionData?.user.role);
  const userId = useAuthStore((state) => state.sessionData?.user._id);
  const schoolId = useAuthStore((state) => state.sessionData?.user.schoolId);

  const isAreaLead = role === "Jefe de Área";
  const isTeacher = role === "Docente";

  const canManageOwned = useCallback(
    (authorId: string): boolean => isAreaLead || authorId === userId,
    [isAreaLead, userId]
  );

  return { role, userId, schoolId, isAreaLead, isTeacher, canManageOwned };
}
