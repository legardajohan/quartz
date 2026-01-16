import React from "react";

export interface ConfirmationModalProps {
    open: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    body: React.ReactNode;
    confirmText?: string;
    cancelText?: string;
    onDiscard?: () => void;
    discardText?: string;
    confirmColor?: "pink" | "green" | "purple" | "blue";
}