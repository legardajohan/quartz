import React from "react";

export interface FormModalProps {
    open: boolean;
    onClose: () => void;
    onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
    title: string;
    subtitle?: string;
    children: React.ReactNode;
    submitText?: string;
    cancelText?: string;
    submitColor?: "pink" | "green" | "purple" | "blue";
    isSubmitting?: boolean;
    isSubmitDisabled?: boolean;
}
