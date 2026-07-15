import { useState, useEffect } from 'react';
import type { SubjectType, SubjectEvaluationMode } from '@/types/domain';
import type { SubjectDto } from '../types';
import {
    Input,
    Select,
    Option,
} from '@material-tailwind/react';

const SUBJECT_TYPES: SubjectType[] = ['Dimensión', 'Asignatura'];

const EVALUATION_MODES: { value: SubjectEvaluationMode; label: string }[] = [
    { value: 'checklist', label: 'Lista de chequeo' },
    { value: 'description', label: 'Descripción personalizada del desempeño' },
];

export interface SubjectFormData {
    name: string;
    type: SubjectType | '';
    evaluationMode: SubjectEvaluationMode;
}

interface SubjectFormProps {
    initialData?: SubjectDto | null;
    onFormChange: (formData: SubjectFormData, isDirty: boolean) => void;
}

export const SubjectForm = ({ initialData, onFormChange }: SubjectFormProps) => {
    const [name, setName] = useState('');
    const [type, setType] = useState<SubjectType | ''>('');
    const [evaluationMode, setEvaluationMode] = useState<SubjectEvaluationMode>('checklist');

    useEffect(() => {
        if (initialData) {
            setName(initialData.name);
            setType(initialData.type);
            setEvaluationMode(initialData.evaluationMode);
        } else {
            setName('');
            setType('');
            setEvaluationMode('checklist');
        }
    }, [initialData]);

    useEffect(() => {
        const isDirty = !initialData ||
            initialData.name !== name ||
            initialData.type !== type ||
            initialData.evaluationMode !== evaluationMode;

        onFormChange({ name, type, evaluationMode }, isDirty);
    }, [name, type, evaluationMode, initialData, onFormChange]);

    return (
        <div className="space-y-6">
            <Input
                name="name"
                color="purple"
                label="Nombre de la dimensión"
                value={name}
                onChange={(e) => setName(e.target.value)}
                crossOrigin="anonymous"
            />

            <Select
                name="type"
                color="purple"
                label="Tipo"
                value={type}
                onChange={(val) => setType((val as SubjectType) || '')}
            >
                {SUBJECT_TYPES.map((t) => (
                    <Option key={t} value={t}>
                        {t}
                    </Option>
                ))}
            </Select>

            <Select
                name="evaluationMode"
                color="purple"
                label="Modo de evaluación"
                value={evaluationMode}
                onChange={(val) => setEvaluationMode((val as SubjectEvaluationMode) || 'checklist')}
            >
                {EVALUATION_MODES.map((mode) => (
                    <Option key={mode.value} value={mode.value}>
                        {mode.label}
                    </Option>
                ))}
            </Select>
        </div>
    );
};
