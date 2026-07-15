import React from "react";

export interface PerformanceTextareaProps {
    title: string;
    subtitle?: string;
    placeholder?: string;
    value: string;
    onChange: (value: string) => void;
    maxLength?: number;
    rows?: number;
    icon?: React.ReactNode;
    disabled?: boolean;
}
