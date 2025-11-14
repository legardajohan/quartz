import { useState, useEffect } from 'react';
import { Subject, Period } from '@/types/domain';
import {
    Textarea,
    Select,
    Option,
} from '@material-tailwind/react';

interface LearningFormProps {
    subjects: Subject[];
    periods: Period[];
    onFormChange: (formData: { subjectId: string; periodId: string; description: string }) => void;
}

export const LearningForm = ({ subjects, periods, onFormChange }: LearningFormProps) => {
    const [subjectId, setSubjectId] = useState('');
    const [periodId, setPeriodId] = useState('');
    const [description, setDescription] = useState('');

    useEffect(() => {
        onFormChange({ subjectId, periodId, description });
    }, [subjectId, periodId, description, onFormChange]);

    return (
        <div className="space-y-6">
            <Select
                name="periodId"
                color="purple"
                label="Periodo académico"
                value={periodId}
                onChange={(val) => setPeriodId(val || '')}
                key={periods.length}
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
                key={subjects.length}
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
