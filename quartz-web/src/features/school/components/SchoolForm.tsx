import { useState, useEffect } from 'react';
import { Input, Typography } from '@material-tailwind/react';
import type { SchoolDto } from '../types';

export interface SchoolFormData {
    name: string;
}

interface SchoolFormProps {
    initialData?: SchoolDto | null;
    onFormChange: (formData: SchoolFormData, isDirty: boolean) => void;
}

export const SchoolForm = ({ initialData, onFormChange }: SchoolFormProps) => {
    const [name, setName] = useState('');

    useEffect(() => {
        setName(initialData?.name ?? '');
    }, [initialData]);

    useEffect(() => {
        const isDirty = !initialData || initialData.name !== name;
        onFormChange({ name }, isDirty);
    }, [name, initialData, onFormChange]);

    return (
        <div className="space-y-6">
            {initialData && (
                <div>
                    <Typography variant="small" color="blue-gray" className="font-bold">
                        Sede {initialData.schoolNumber}
                    </Typography>
                    <Typography variant="small" className="text-xs text-gray-400">
                        El número de sede se asigna automáticamente y no se puede editar.
                    </Typography>
                </div>
            )}

            <Input
                name="name"
                color="purple"
                label="Nombre"
                value={name}
                onChange={(e) => setName(e.target.value)}
                crossOrigin="anonymous"
            />
        </div>
    );
};
