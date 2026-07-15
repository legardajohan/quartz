import { useState, useEffect, useCallback } from 'react';
import { Input, Switch, Typography } from '@material-tailwind/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import type { PeriodDto } from '../types';

const CLOSING_ALERT_GRACE_DAYS = 7;

function toDateInputValue(iso: string): string {
    return iso.slice(0, 10);
}

function addDays(dateStr: string, days: number): string {
    const date = new Date(`${dateStr}T00:00:00`);
    date.setDate(date.getDate() + days);
    return date.toISOString().slice(0, 10);
}

export interface PeriodFormData {
    name: string;
    year: string;
    startDate: string;
    endDate: string;
    closingAlertDate: string;
    isActive: boolean;
}

interface PeriodFormProps {
    initialData?: PeriodDto | null;
    onFormChange: (formData: PeriodFormData, isDirty: boolean) => void;
}

export const PeriodForm = ({ initialData, onFormChange }: PeriodFormProps) => {
    const [name, setName] = useState('');
    const [year, setYear] = useState(String(new Date().getFullYear()));
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [closingAlertDate, setClosingAlertDate] = useState('');
    const [isActive, setIsActive] = useState(false);
    const [alertTouched, setAlertTouched] = useState(false);

    useEffect(() => {
        if (initialData) {
            setName(initialData.name);
            setYear(String(initialData.year));
            setStartDate(toDateInputValue(initialData.startDate));
            setEndDate(toDateInputValue(initialData.endDate));
            setClosingAlertDate(initialData.closingAlertDate ? toDateInputValue(initialData.closingAlertDate) : '');
            setIsActive(initialData.isActive);
            setAlertTouched(true);
        } else {
            setName('');
            setYear(String(new Date().getFullYear()));
            setStartDate('');
            setEndDate('');
            setClosingAlertDate('');
            setIsActive(false);
            setAlertTouched(false);
        }
    }, [initialData]);

    const handleEndDateChange = useCallback((value: string) => {
        setEndDate(value);
        if (!alertTouched && value) {
            setClosingAlertDate(addDays(value, CLOSING_ALERT_GRACE_DAYS));
        }
    }, [alertTouched]);

    const handleAlertDateChange = (value: string) => {
        setAlertTouched(true);
        setClosingAlertDate(value);
    };

    const handleClearAlert = () => {
        setAlertTouched(true);
        setClosingAlertDate('');
    };

    useEffect(() => {
        const isDirty = !initialData ||
            initialData.name !== name ||
            String(initialData.year) !== year ||
            toDateInputValue(initialData.startDate) !== startDate ||
            toDateInputValue(initialData.endDate) !== endDate ||
            (initialData.closingAlertDate ? toDateInputValue(initialData.closingAlertDate) : '') !== closingAlertDate ||
            initialData.isActive !== isActive;

        onFormChange({ name, year, startDate, endDate, closingAlertDate, isActive }, isDirty);
    }, [name, year, startDate, endDate, closingAlertDate, isActive, initialData, onFormChange]);

    return (
        <div className="space-y-6">
            <Input
                name="name"
                color="purple"
                label="Nombre del periodo"
                value={name}
                onChange={(e) => setName(e.target.value)}
                crossOrigin="anonymous"
            />

            <Input
                name="year"
                type="number"
                color="purple"
                label="Año"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                crossOrigin="anonymous"
            />

            <div className="grid grid-cols-2 gap-4">
                <Input
                    name="startDate"
                    type="date"
                    color="purple"
                    label="Fecha de inicio"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    crossOrigin="anonymous"
                />
                <Input
                    name="endDate"
                    type="date"
                    color="purple"
                    label="Fecha de fin"
                    value={endDate}
                    onChange={(e) => handleEndDateChange(e.target.value)}
                    crossOrigin="anonymous"
                />
            </div>

            <div>
                <div className="flex items-center gap-2">
                    <Input
                        name="closingAlertDate"
                        type="date"
                        color="purple"
                        label="Alerta de cierre de plataforma"
                        value={closingAlertDate}
                        onChange={(e) => handleAlertDateChange(e.target.value)}
                        crossOrigin="anonymous"
                        containerProps={{ className: "min-w-0" }}
                    />
                    {closingAlertDate && (
                        <button
                            type="button"
                            onClick={handleClearAlert}
                            aria-label="Quitar alerta de cierre"
                            className="shrink-0 rounded-full p-1.5 text-gray-400 transition-all duration-150 hover:bg-gray-100 hover:text-gray-600 active:scale-90"
                        >
                            <XMarkIcon className="h-4 w-4" />
                        </button>
                    )}
                </div>
                <Typography variant="small" className="mt-1.5 text-gray-500 text-xs">
                    Opcional. Se sugiere una semana después del cierre para acabar de subir notas.
                </Typography>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3">
                <div>
                    <Typography variant="small" color="blue-gray" className="font-medium">
                        Periodo activo
                    </Typography>
                    <Typography variant="small" className="text-gray-500 text-xs">
                        Desactiva automáticamente los demás periodos de la institución.
                    </Typography>
                </div>
                <Switch
                    color="purple"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    crossOrigin="anonymous"
                />
            </div>
        </div>
    );
};
