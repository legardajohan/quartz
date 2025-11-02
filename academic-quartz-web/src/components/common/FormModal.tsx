import {
    Button,
    Dialog,
    DialogHeader,
    DialogBody,
    DialogFooter,
    Typography,
} from "@material-tailwind/react";
import type { FormModalProps } from "../interfaces/FormModalProps";

export const FormModal = ({
    open,
    onClose,
    onSubmit,
    title,
    subtitle,
    children,
    submitText = "Crear",
    cancelText = "Cancelar",
    submitColor = "purple",
    isSubmitting = false,
}: FormModalProps) => {
    return (
        <Dialog open={open} handler={onClose} size="sm" className="px-5 py-3" dismiss={{ enabled: false }}>
            <DialogHeader className="justify-between">
                <div>
                    <Typography variant="h4" className="text-purple-900">
                        {title}
                    </Typography>
                    {subtitle && (
                        <Typography className="mt-1 font-normal text-gray-600">
                            {subtitle}
                        </Typography>
                    )}
                </div>
            </DialogHeader>
            <form onSubmit={onSubmit}>
                <DialogBody className="space-y-4 pr-2">
                    {children}
                </DialogBody>
                <DialogFooter>
                    <Button
                        variant="text"
                        color="blue-gray"
                        onClick={onClose}
                        className="mr-1"
                        disabled={isSubmitting}
                    >
                        <span>{cancelText}</span>
                    </Button>
                    <Button
                        variant="gradient"
                        color={submitColor}
                        type="submit"
                        disabled={isSubmitting}
                        className="flex items-center justify-center"
                    >
                        {isSubmitting ? (
                            <>
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Procesando...
                            </>
                        ) : (
                            <span>{submitText}</span>
                        )}
                    </Button>
                </DialogFooter>
            </form>
        </Dialog>
    );
};
