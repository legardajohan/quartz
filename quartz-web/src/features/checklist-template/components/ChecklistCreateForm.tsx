import { useState, useEffect } from 'react';
import { Input, Select, Option } from '@material-tailwind/react';
import { useOfferedLevels } from '@/features/institution/queries/useOfferedLevels';
import type { GradeLevel } from '@/types/domain';

type Period = { _id: string; name: string; isActive: boolean };

type CreateFormData = { name: string; periodId: string; grade: GradeLevel | '' };

type ChecklistCreateFormProps = {
  periods: Period[];
  onFormChange: (data: CreateFormData, isReady: boolean) => void;
};

export function ChecklistCreateForm({ periods, onFormChange }: ChecklistCreateFormProps) {
  const [name, setName] = useState('');
  const [periodId, setPeriodId] = useState('');
  const [pickedGrade, setPickedGrade] = useState<GradeLevel | ''>('');
  const { levels: offeredLevels, isSingle: isSingleLevel } = useOfferedLevels();

  // Con un único nivel ofertado no hay selector: la plantilla toma ese nivel.
  const grade: GradeLevel | '' = isSingleLevel
    ? offeredLevels[0]
    : pickedGrade && offeredLevels.includes(pickedGrade) ? pickedGrade : '';

  useEffect(() => {
    const isReady = !!name.trim() && !!periodId && !!grade;
    onFormChange({ name: name.trim(), periodId, grade }, isReady);
  }, [name, periodId, grade, onFormChange]);

  return (
    <div className="space-y-6">
      <Input
        color="purple"
        label="Nombre de la plantilla"
        value={name}
        onChange={(e) => setName(e.target.value)}
        crossOrigin="anonymous"
      />

      <Select
        color="purple"
        label="Período académico"
        value={periodId}
        onChange={(val) => setPeriodId(val ?? '')}
        key={periods.length}
        menuProps={{ placement: "bottom", className: "max-h-[60vh] overflow-y-auto" }}
      >
        {periods.map((p) => (
          <Option key={p._id} value={p._id}>
            {p.name}
          </Option>
        ))}
      </Select>

      {!isSingleLevel && (
        <Select
          color="purple"
          label="Nivel"
          value={grade}
          onChange={(val) => setPickedGrade((val as GradeLevel) ?? '')}
          menuProps={{ placement: "bottom" }}
        >
          {offeredLevels.map((level) => (
            <Option key={level} value={level}>
              {level}
            </Option>
          ))}
        </Select>
      )}
    </div>
  );
}
