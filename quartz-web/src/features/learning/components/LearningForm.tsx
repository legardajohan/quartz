import { useState, useEffect } from 'react';
import { Subject, Period, type GradeLevel } from '@/types/domain';
import { useSubjectAxisLabel } from '../../subject/useSubjectAxisLabel';
import { useOfferedLevels } from '../../institution/queries/useOfferedLevels';
import { Learning, NewLearning } from '../types';
import {
    Textarea,
    Select,
    Option,
} from '@material-tailwind/react';

interface LearningFormProps {
    subjects: Subject[];
    periods: Period[];
    initialData?: Learning | null;
    onFormChange: (formData: LearningFormData, isDirty: boolean) => void;
}

export type LearningFormData = Omit<NewLearning, 'grade'> & { grade: GradeLevel | '' };

export const LearningForm = ({ subjects, periods, initialData, onFormChange }: LearningFormProps) => {
    const axis = useSubjectAxisLabel();
    const [subjectId, setSubjectId] = useState('');
    const [periodId, setPeriodId] = useState('');
    const [description, setDescription] = useState('');
    const [pickedGrade, setPickedGrade] = useState<GradeLevel | ''>('');
    const { levels: offeredLevels, isSingle: isSingleLevel } = useOfferedLevels();

    // Con un único nivel ofertado no hay selector: el aprendizaje toma ese nivel.
    const grade: GradeLevel | '' = isSingleLevel
        ? offeredLevels[0]
        : pickedGrade && offeredLevels.includes(pickedGrade) ? pickedGrade : '';

    useEffect(() => {
        if (initialData) {
            setSubjectId(initialData.subject._id);
            setPeriodId(initialData.period._id);
            setDescription(initialData.description);
            setPickedGrade(initialData.grade);
        } else {
            setSubjectId('');
            setPeriodId('');
            setDescription('');
            setPickedGrade('');
        }
    }, [initialData]);

    useEffect(() => {
        const isDirty = !initialData ||
            initialData.subject._id !== subjectId ||
            initialData.period._id !== periodId ||
            initialData.description !== description ||
            initialData.grade !== grade;

        onFormChange({ subjectId, periodId, description, grade }, isDirty);
    }, [subjectId, periodId, description, grade, initialData, onFormChange]);

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
                label={axis.singular}
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

            {!isSingleLevel && (
                <Select
                    name="grade"
                    color="purple"
                    label="Nivel"
                    value={grade}
                    onChange={(val) => setPickedGrade((val as GradeLevel) || '')}
                    key={initialData?._id ? `grade-${initialData._id}` : 'grade-new'}
                >
                    {offeredLevels.map((level) => (
                        <Option key={level} value={level}>
                            {level}
                        </Option>
                    ))}
                </Select>
            )}

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
