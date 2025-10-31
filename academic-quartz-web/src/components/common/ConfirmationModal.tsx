import {
    Button,
    Dialog,
    DialogHeader,
    DialogBody,
    DialogFooter,
} from "@material-tailwind/react";

import type { ModalProps } from "../interfaces/ModalProps";

export const ConfirmationModal = ({
    open,
    onClose,
    onConfirm,
    title,
    body,
    confirmText = "Confirmar",
    cancelText = "Cancelar",
    confirmColor = "pink",
}: ModalProps) => {
    return (
        <Dialog open={open} size="xs" handler={onClose}>
            <DialogHeader>{title}</DialogHeader>
            <DialogBody>
                {typeof body === "string" ? <p className="text-gray-600">{body}</p> : body}
            </DialogBody>
            <DialogFooter>
                <Button
                    variant="text"
                    color="blue-gray"
                    onClick={onClose}
                    className="mr-1"
                >
                    <span>{cancelText}</span>
                </Button>
                <Button
                    variant="gradient"
                    color={confirmColor}
                    onClick={onConfirm}
                >
                    <span>{confirmText}</span>
                </Button>
            </DialogFooter>
        </Dialog>
    );
};