import type { ConflictChange } from '@/components/common/ConflictNotice';
import type { Learning } from '@/features/learning/types';
import type { IStudentValuationDTO } from '@/features/student-valuation/types';
import type { ICommunicativeLetterTemplate } from '@/features/report/types';

export function diffLearning(base: Learning, current: Learning): ConflictChange[] {
  const changes: ConflictChange[] = [];
  if (base.subject._id !== current.subject._id) {
    changes.push({ label: 'Dimensión', from: base.subject.name, to: current.subject.name });
  }
  if (base.period._id !== current.period._id) {
    changes.push({ label: 'Periodo', from: base.period.name, to: current.period.name });
  }
  if (base.description !== current.description) {
    changes.push({ label: 'Descripción', detail: current.description });
  }
  return changes;
}

export interface ValuationDiff {
  itemIds: Set<string>;
  subjectIds: Set<string>;
  summary: string;
}

function plural(n: number, singular: string, pluralForm: string): string {
  return `${n} ${n === 1 ? singular : pluralForm}`;
}

export function diffValuationItems(base: IStudentValuationDTO, current: IStudentValuationDTO): ValuationDiff {
  const itemIds = new Set<string>();
  const subjectIds = new Set<string>();

  const baseSubjects = new Map(base.valuationsBySubject.map((s) => [s.subjectId, s]));

  for (const subject of current.valuationsBySubject) {
    const before = baseSubjects.get(subject.subjectId);
    if (!before) {
      subjectIds.add(subject.subjectId);
      continue;
    }
    if (before.performanceDescription !== subject.performanceDescription) {
      subjectIds.add(subject.subjectId);
    }
    const baseItems = new Map(before.learningValuations.map((lv) => [lv.learningId, lv.qualitativeValuation]));
    for (const lv of subject.learningValuations) {
      if (baseItems.get(lv.learningId) !== lv.qualitativeValuation) {
        itemIds.add(lv.learningId);
        subjectIds.add(subject.subjectId);
      }
    }
  }

  const parts: string[] = [];
  if (itemIds.size > 0) parts.push(plural(itemIds.size, 'ítem', 'ítems'));
  if (subjectIds.size > 0) parts.push(plural(subjectIds.size, 'dimensión', 'dimensiones'));
  if (base.observations !== current.observations) parts.push('las observaciones');

  const summary =
    parts.length === 0
      ? ''
      : `${parts.join(' y ')} ${parts.length === 1 && (itemIds.size + subjectIds.size) <= 1 ? 'fue actualizado' : 'fueron actualizados'}`;

  return { itemIds, subjectIds, summary };
}

export function diffLetterConcepts(
  base: ICommunicativeLetterTemplate,
  current: ICommunicativeLetterTemplate,
): Set<string> {
  const baseConcepts = new Map(base.subjects.map((s) => [s.subjectId, s]));
  const changed = new Set<string>();
  for (const subject of current.subjects) {
    const before = baseConcepts.get(subject.subjectId);
    if (before?.assignedConceptId !== subject.assignedConceptId || before?.conceptText !== subject.conceptText) {
      changed.add(subject.subjectId);
    }
  }
  return changed;
}
