import { useMemo } from "react";
import { useSubjectsQuery } from "./queries/useSubjectsQuery";
import {
  resolveSubjectAxisLabel,
  SUBJECT_TYPE_LABELS,
  type Subject,
  type SubjectAxisLabel,
} from "@/types/domain";

const EMPTY_SUBJECTS: Subject[] = [];

export function useSubjectAxisLabel(): SubjectAxisLabel {
  const { data: subjects = EMPTY_SUBJECTS } = useSubjectsQuery();

  return useMemo(() => resolveSubjectAxisLabel(subjects), [subjects]);
}

export function useSubjectTypeLabel(subjectId?: string): string {
  const { data: subjects = EMPTY_SUBJECTS } = useSubjectsQuery();
  const axis = useSubjectAxisLabel();

  return useMemo(() => {
    const subject = subjects.find((s) => s._id === subjectId);
    return subject ? SUBJECT_TYPE_LABELS[subject.type].singular : axis.singular;
  }, [subjects, subjectId, axis]);
}
