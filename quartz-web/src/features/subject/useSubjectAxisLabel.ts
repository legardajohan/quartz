import { useMemo } from "react";
import { useAuthStore } from "../auth/useAuthStore";
import {
  resolveSubjectAxisLabel,
  SUBJECT_TYPE_LABELS,
  type SubjectAxisLabel,
} from "@/types/domain";

export function useSubjectAxisLabel(): SubjectAxisLabel {
  const subjects = useAuthStore((state) => state.sessionData?.subjects);

  return useMemo(() => resolveSubjectAxisLabel(subjects ?? []), [subjects]);
}

export function useSubjectTypeLabel(subjectId?: string): string {
  const subjects = useAuthStore((state) => state.sessionData?.subjects);
  const axis = useSubjectAxisLabel();

  return useMemo(() => {
    const subject = subjects?.find((s) => s._id === subjectId);
    return subject ? SUBJECT_TYPE_LABELS[subject.type].singular : axis.singular;
  }, [subjects, subjectId, axis]);
}
