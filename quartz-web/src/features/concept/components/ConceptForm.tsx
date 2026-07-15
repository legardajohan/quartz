import { useState, useEffect } from 'react';
import { Subject, Period } from '@/types/domain';
import { ConceptDto, QualitativeValuation } from '../types';
import {
    Textarea,
    Select,
    Option,
} from '@material-tailwind/react';

const VALUATION_TYPES: QualitativeValuation[] = ['Logrado', 'En proceso', 'Con dificultad'];

export interface ConceptFormData {
    subjectId: string;
    periodId: string;
    valuationType: QualitativeValuation | '';
    description: string;
}

interface ConceptFormProps {
    subjects: Subject[];
    periods: Period[];
    initialData?: ConceptDto | null;
    onFormChange: (formData: ConceptFormData, isDirty: boolean) => void;
}

export const ConceptForm = ({ subjects, periods, initialData, onFormChange }: ConceptFormProps) => {
    const [subjectId, setSubjectId] = useState('');
    const [periodId, setPeriodId] = useState('');
    const [valuationType, setValuationType] = useState<QualitativeValuation | ''>('');
    const [description, setDescription] = useState('');

    useEffect(() => {
        if (initialData) {
            setSubjectId(initialData.subject._id);
            setPeriodId(initialData.period._id);
            setValuationType(initialData.valuationType);
            setDescription(initialData.description);
        } else {
            setSubjectId('');
            setPeriodId('');
            setValuationType('');
            setDescription('');
        }
    }, [initialData]);

    useEffect(() => {
        const isDirty = !initialData ||
            initialData.subject._id !== subjectId ||
            initialData.period._id !== periodId ||
            initialData.valuationType !== valuationType ||
            initialData.description !== description;

        onFormChange({ subjectId, periodId, valuationType, description }, isDirty);
    }, [subjectId, periodId, valuationType, description, initialData, onFormChange]);

    return (
        <div className="space-y-6">
            <Select
                name="periodId"
                color="purple"
                label="Periodo académico"
                value={periodId}
                onChange={(val) => setPeriodId(val || '')}
                key={initialData?._id ? `period-${initialData._id}` : periods.length}
            >
                {periods.map((period) => (
                    <Option key={period._id} value={period._id}>
                        {period.name}
                    </Option>
                ))}
            </Select>

            <Select
                name="subjectId"
                color="purple"
                label="Dimensión"
                value={subjectId}
                onChange={(val) => setSubjectId(val || '')}
                key={initialData?._id ? `subject-${initialData._id}` : subjects.length}
            >
                {subjects.map((subject) => (
                    <Option key={subject._id} value={subject._id}>
                        {subject.name}
                    </Option>
                ))}
            </Select>

            <Select
                name="valuationType"
                color="purple"
                label="Valoración"
                value={valuationType}
                onChange={(val) => setValuationType((val as QualitativeValuation) || '')}
            >
                {VALUATION_TYPES.map((type) => (
                    <Option key={type} value={type}>
                        {type}
                    </Option>
                ))}
            </Select>

            <Textarea
                name="description"
                color="purple"
                label="Descripción del Concepto"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={5}
            />
        </div>
    );
};
