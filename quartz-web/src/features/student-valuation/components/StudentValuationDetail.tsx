import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate, useBlocker } from "react-router-dom";
import { Button, IconButton, Typography, Avatar } from "@material-tailwind/react";
import { useStudentValuationStore } from "../useStudentValuationStore";
import { useAuthStore } from "../../auth/useAuthStore";
import ValuationChecklist from "./ValuationChecklist";
import type { StudentValuationUpdateData, LearningValuationUpdate } from "../types";
import { ConfirmationModal } from "../../../components/common/ConfirmationModal";
import toast from "react-hot-toast";
import userImage from "../../../assets/images/default-user.jpg";
import { TrashIcon } from "@heroicons/react/24/solid";

export default function StudentValuationDetail() {
    const { studentId } = useParams();
    const navigate = useNavigate();
    const {
        currentValuation,
        fetchValuation,
        updateValuation,
        deleteValuation,
        clearValuation,
        isLoading
    } = useStudentValuationStore();
    const { sessionData } = useAuthStore();

    const [openSubjectId, setOpenSubjectId] = useState<string | null>(null);
    const [localValuation, setLocalValuation] = useState(currentValuation);
    const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        const activePeriod = sessionData?.periods?.find((p) => p.isActive);
        if (studentId && activePeriod) {
            fetchValuation(studentId, activePeriod._id);
        }
        return () => {
            clearValuation();
        };
    }, [studentId, sessionData, fetchValuation, clearValuation]);

    useEffect(() => {
        setLocalValuation(currentValuation);
        // Open first subject by default if not already open
        if (currentValuation?.valuationsBySubject?.[0]?.subjectId && !openSubjectId) {
            setOpenSubjectId(currentValuation.valuationsBySubject[0].subjectId);
        }
    }, [currentValuation]);

    const handleSave = async () => {
        if (!localValuation) return;
        try {
            const payload: StudentValuationUpdateData = {
                valuationsBySubject: localValuation.valuationsBySubject
                    .map((subject) => ({
                        subjectId: subject.subjectId,
                        learningValuations: subject.learningValuations.filter(
                            (lv) => lv.qualitativeValuation !== null
                        ),
                    }))
                    .filter((subject) => subject.learningValuations.length > 0),
            };

            await updateValuation(localValuation._id, payload);
            toast.success("Evaluación guardada correctamente");
        } catch (error) {
            toast.error("Error al guardar la Evaluación");
            console.error(error);
        }
    };

    const handleDelete = () => {
        setDeleteModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!localValuation) return;

        try {
            await deleteValuation(localValuation._id);
            setIsDeleting(true);
            setDeleteModalOpen(false);
            toast.success(<b>Evaluación eliminada con éxito</b>);
            navigate('/evaluacion');
        } catch (err: any) {
            toast.error(<b>Error al eliminar la evaluación: {err.message}</b>);
        }
    };

    const hasChanges = useCallback(() => {
        if (!localValuation || !currentValuation) return false;
        return JSON.stringify(localValuation.valuationsBySubject) !== JSON.stringify(currentValuation.valuationsBySubject);
    }, [localValuation, currentValuation]);

    const blocker = useBlocker(
        ({ currentLocation, nextLocation }) =>
            !isDeleting && hasChanges() && currentLocation.pathname !== nextLocation.pathname
    );

    if (isLoading) {
        return <div className="p-6">Cargando valoración...</div>;
    }

    if (!localValuation) {
        return <div className="p-6">No se encontró la valoración.</div>;
    }

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex flex-col w-full gap-4">
                <div className="flex items-center gap-2">
                    <IconButton variant="text" size="md" onClick={() => navigate('/evaluacion')}>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                        </svg>
                    </IconButton>
                    <h1 className="text-2xl font-semibold text-purple-900">
                        Evaluación de Lista de Chequeo
                    </h1>
                </div>
                <div className="flex w-full items-center justify-between mx-2 mb-6">
                    <div className="flex items-center gap-4">
                        <Avatar src={userImage} alt="user_image" size="md" />
                        <div>
                            <h1 className="text-lg font-semibold text-gray-700">
                                {localValuation.studentName.lastName} {localValuation.studentName.secondLastName}
                            </h1>
                            <Typography color="gray" className="font-normal text-md">
                                {localValuation.studentName.firstName} {localValuation.studentName.middleName}
                            </Typography>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="gradient"
                            onClick={handleSave}
                            color="purple"
                        >
                            Guardar Cambios
                        </Button>
                        <Button
                            variant="text"
                            className="text-gray-400 hover:text-pink-400 transition-colors duration-200"
                            onClick={handleDelete}
                        >
                            <TrashIcon className="h-6 w-6" />
                        </Button>
                    </div>
                </div>
            </div>
            <ConfirmationModal
                open={isDeleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                onConfirm={handleConfirmDelete}
                title="¿Deseas eliminar la Evaluación?"
                body={
                    <p className="text-gray-600">
                        Lista de Chequeo de{" "}
                        <span className="font-bold">
                            {localValuation?.studentName.firstName}{" "}
                            {localValuation?.studentName.lastName}{" "}
                            {localValuation?.studentName.secondLastName}
                        </span>
                    </p>
                }
                confirmColor="pink"
            />

            {blocker.state === "blocked" ? (
                <ConfirmationModal
                    open={true}
                    onClose={() => blocker.reset()}
                    onConfirm={async () => {
                        await handleSave();
                        blocker.proceed();
                    }}
                    onDiscard={() => blocker.proceed()}
                    title="¿Deseas guardar los cambios?"
                    confirmText="Guardar"
                    cancelText="Cancelar"
                    discardText="No guardar"
                    confirmColor="purple"
                    body={
                        <p className="text-gray-600">
                            Hay cambios en la Lista de Chequeo de{" "}
                            <span className="font-bold">
                                {localValuation?.studentName.firstName}{" "}
                                {localValuation?.studentName.lastName}{" "}
                            </span>
                        </p>
                    }
                />
            ) : null}

            <div className="space-y-4">
                {localValuation.valuationsBySubject.map((subject) => (
                    <div key={subject.subjectId}>
                        <ValuationChecklist
                            subject={subject}
                            open={openSubjectId === subject.subjectId}
                            onToggle={() =>
                                setOpenSubjectId(
                                    openSubjectId === subject.subjectId
                                        ? null
                                        : subject.subjectId
                                )
                            }
                            initialSelections={subject.learningValuations.reduce(
                                (acc, lv) => {
                                    acc[lv.learningId] = lv.qualitativeValuation;
                                    return acc;
                                },
                                {} as Record<string, string | null>
                            )}
                            onChange={(learningId, qualitativeValuation) => {
                                setLocalValuation((prev) => {
                                    if (!prev) return prev;
                                    const next = {
                                        ...prev,
                                        valuationsBySubject: prev.valuationsBySubject.map((s) => {
                                            if (s.subjectId !== subject.subjectId) return s;
                                            return {
                                                ...s,
                                                learningValuations: s.learningValuations.map((lv) =>
                                                    lv.learningId === learningId
                                                        ? {
                                                            ...lv,
                                                            qualitativeValuation:
                                                                qualitativeValuation as LearningValuationUpdate["qualitativeValuation"],
                                                        }
                                                        : lv
                                                ),
                                            };
                                        }),
                                    };
                                    return next;
                                });
                            }}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
}
