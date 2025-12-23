import React from "react";
import type { DialogProps } from "@material-tailwind/react";

export interface FormModalProps {
    open: boolean;
    onClose: () => void;
    onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
    size?: DialogProps["size"];
    title: string;
    subtitle?: string;
    children: React.ReactNode;
    submitText?: string;
    cancelText?: string;
    submitColor?: "pink" | "green" | "purple" | "blue";
    isSubmitting?: boolean;
    isSubmitDisabled?: boolean;
}
