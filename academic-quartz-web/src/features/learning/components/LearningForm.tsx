import { useState, useEffect } from 'react';
import { Subject, Period } from '@/types/domain';
import { Learning } from '../types';
import {
    Textarea,
    Select,
    Option,
} from '@material-tailwind/react';

interface LearningFormProps {
    subjects: Subject[];
    periods: Period[];
    initialData?: Learning | null;
    onFormChange: (formData: { subjectId: string; periodId: string; description: string }, isDirty: boolean) => void;
}

export const LearningForm = ({ subjects, periods, initialData, onFormChange }: LearningFormProps) => {
    const [subjectId, setSubjectId] = useState('');
    const [periodId, setPeriodId] = useState('');
    const [description, setDescription] = useState('');

    useEffect(() => {
        if (initialData) {
            setSubjectId(initialData.subject._id);
            setPeriodId(initialData.period._id);
            setDescription(initialData.description);
        } else {
            setSubjectId('');
            setPeriodId('');
            setDescription('');
        }
    }, [initialData]);

    useEffect(() => {
        const isDirty = !initialData ||
            initialData.subject._id !== subjectId ||
            initialData.period._id !== periodId ||
            initialData.description !== description;

        onFormChange({ subjectId, periodId, description }, isDirty);
    }, [subjectId, periodId, description, initialData, onFormChange]);

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

            <Textarea
                name="description"
                color="purple"
                label="Descripción del Aprendizaje"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={5}
            />
        </div>
    );
};
