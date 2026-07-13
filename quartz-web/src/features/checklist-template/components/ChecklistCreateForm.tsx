import { useState, useEffect } from 'react';
import { Input, Select, Option } from '@material-tailwind/react';

type Period = { _id: string; name: string; isActive: boolean };

type CreateFormData = { name: string; periodId: string; grade: string };

type ChecklistCreateFormProps = {
  periods: Period[];
  onFormChange: (data: CreateFormData, isReady: boolean) => void;
};

const GRADES = ['Transición'];

export function ChecklistCreateForm({ periods, onFormChange }: ChecklistCreateFormProps) {
  const [name, setName] = useState('');
  const [periodId, setPeriodId] = useState('');
  const [grade, setGrade] = useState('Transición');

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
      >
        {periods.map((p) => (
          <Option key={p._id} value={p._id}>
            {p.name}
          </Option>
        ))}
      </Select>

      <Select
        color="purple"
        label="Grado"
        value={grade}
        onChange={(val) => setGrade(val ?? '')}
      >
        {GRADES.map((g) => (
          <Option key={g} value={g}>
            {g}
          </Option>
        ))}
      </Select>
    </div>
  );
}
