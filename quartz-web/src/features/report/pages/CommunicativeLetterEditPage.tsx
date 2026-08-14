import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useNavigate, useBlocker } from "react-router-dom";
import { Button, IconButton, Typography, Avatar } from "@material-tailwind/react";
import { ExclamationTriangleIcon, BookmarkSquareIcon } from "@heroicons/react/24/outline";
import { BookmarkSquareIcon as BookmarkSquareIconSolid } from "@heroicons/react/24/solid";
import toast from "react-hot-toast";
import { useReportStore } from "../useReportStore";
import LetterConceptPicker from "../components/LetterConceptPicker";
import { ConfirmationModal } from "../../../components/common/ConfirmationModal";
import { Loading } from "../../../components/ui/Loading";
import { useUsersQuery } from "../../users/queries/useUsersQuery";
import { AVATAR_FALLBACK } from "@/constants/assets";
import type { ConceptAssignmentUpdate, ICommunicativeLetterTemplate } from "../types";

interface PersonName {
  firstName: string;
  middleName?: string;
  lastName: string;
  secondLastName?: string;
}

function formatFullName(person: PersonName): string {
  return [person.firstName, person.middleName, person.lastName, person.secondLastName]
    .filter(Boolean)
    .join(" ");
}

function buildServerSelection(letter: ICommunicativeLetterTemplate | null): Record<string, string> {
  const serverSelection: Record<string, string> = {};
  if (!letter) return serverSelection;
  letter.subjects.forEach((subject) => {
    if (subject.evaluationMode === "checklist" && subject.assignedConceptId) {
      serverSelection[subject.subjectId] = subject.assignedConceptId;
    }
  });
  return serverSelection;
}

function buildServerConceptText(letter: ICommunicativeLetterTemplate | null): Record<string, string> {
  const serverConceptText: Record<string, string> = {};
  if (!letter) return serverConceptText;
  letter.subjects.forEach((subject) => {
    if (subject.evaluationMode === "checklist") {
      serverConceptText[subject.subjectId] = subject.conceptText ?? "";
    }
  });
  return serverConceptText;
}

export default function CommunicativeLetterEditPage() {
  const { studentId, valuationId } = useParams();
  const navigate = useNavigate();
  const { currentLetter, isLetterLoading, letterError, fetchCommunicativeLetter, saveLetterConcepts, clearLetter } =
    useReportStore();

  const [selection, setSelection] = useState<Record<string, string>>({});
  const [conceptText, setConceptText] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  const { data: studentUsers } = useUsersQuery(studentId ? { id: studentId } : undefined);
  const studentAvatarUrl = studentUsers?.[0]?.avatarUrl;

  useEffect(() => {
    if (valuationId) {
      fetchCommunicativeLetter(valuationId);
    }
    return () => {
      clearLetter();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [valuationId]);

  useEffect(() => {
    setSelection(buildServerSelection(currentLetter));
    setConceptText(buildServerConceptText(currentLetter));
  }, [currentLetter]);

  const isDirty = useMemo(() => {
    if (!currentLetter) return false;
    return currentLetter.subjects.some((subject) => {
      if (subject.evaluationMode !== "checklist") return false;
      const selectionChanged = (selection[subject.subjectId] ?? "") !== (subject.assignedConceptId ?? "");
      const textChanged = (conceptText[subject.subjectId] ?? "") !== (subject.conceptText ?? "");
      return selectionChanged || textChanged;
    });
  }, [currentLetter, selection, conceptText]);

  const isCoverageError = !!letterError && letterError.toLowerCase().includes("faltan conceptos");

  const handleSelect = (subjectId: string, conceptId: string) => {
    setSelection((prev) => ({ ...prev, [subjectId]: conceptId }));

    const concept = currentLetter?.subjects
      .find((subject) => subject.subjectId === subjectId)
      ?.availableConcepts.find((option) => option._id === conceptId);
    if (concept) {
      setConceptText((prev) => ({ ...prev, [subjectId]: concept.description }));
    }
  };

  const handleTextChange = (subjectId: string, text: string) => {
    setConceptText((prev) => ({ ...prev, [subjectId]: text }));
  };

  const handleDiscard = () => {
    setSelection(buildServerSelection(currentLetter));
    setConceptText(buildServerConceptText(currentLetter));
  };

  const handleSave = useCallback(async () => {
    if (!valuationId || !currentLetter) return;

    const assignments: ConceptAssignmentUpdate[] = currentLetter.subjects
      .filter((subject) => subject.evaluationMode === "checklist")
      .map((subject) => ({
        subjectId: subject.subjectId,
        conceptId: selection[subject.subjectId] ?? subject.assignedConceptId ?? "",
        conceptText: (conceptText[subject.subjectId] ?? subject.conceptText ?? "").trim(),
      }))
      .filter((assignment) => assignment.conceptId && assignment.conceptText.length > 0);

    setIsSaving(true);
    try {
      await saveLetterConcepts(valuationId, assignments);
      toast.success("Conceptos guardados");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error desconocido";
      toast.error(`Error al guardar: ${message}`);
      throw err;
    } finally {
      setIsSaving(false);
    }
  }, [valuationId, currentLetter, selection, conceptText, saveLetterConcepts]);

  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) => isDirty && currentLocation.pathname !== nextLocation.pathname
  );

  if (isLetterLoading) {
    return <Loading message="Cargando Carta Comunicativa…" />;
  }

  if (letterError) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 flex flex-col items-center justify-center gap-2 text-center">
          <ExclamationTriangleIcon className="h-10 w-10 text-amber-500" />
          <Typography color="red" className="font-medium">
            {isCoverageError ? "Faltan conceptos por dimensión" : "No se pudo cargar la Carta Comunicativa"}
          </Typography>
          <Typography variant="small" className="max-w-md text-gray-600">
            {letterError}
          </Typography>
          {isCoverageError && (
            <Typography variant="small" className="text-gray-500">
              Carga los conceptos que faltan desde{" "}
              <span className="font-semibold text-purple-700">Académico · Conceptos</span>.
            </Typography>
          )}
          <Button variant="text" size="sm" color="blue-gray" onClick={() => navigate("/evaluacion")}>
            Volver
          </Button>
        </div>
      </div>
    );
  }

  if (!currentLetter) {
    return <div className="p-6">No se encontró la Carta Comunicativa.</div>;
  }

  const studentName = formatFullName(currentLetter.student);

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex flex-col w-full gap-4">
        <div className="flex items-center gap-2 mb-2">
          <IconButton variant="text" size="md" onClick={() => navigate("/evaluacion")}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
          </IconButton>
          <div className="flex">
            <h1 className="text-2xl font-semibold text-purple-900 mr-1">Carta Comunicativa</h1>
            <div className="bg-pink-500 rounded-md text-white font-medium text-sm px-2 py-2 h-[18px] flex items-center justify-center w-fit">
              {currentLetter.period.name} {currentLetter.period.year}
            </div>
          </div>
        </div>
        <div className="flex w-full items-center gap-4 mb-4 border border-gray-200 p-4 rounded-lg">
          <Avatar src={studentAvatarUrl || AVATAR_FALLBACK} alt={studentName} size="lg" />
          <div>
            <h1 className="text-lg font-semibold text-gray-700">
              {currentLetter.student.lastName} {currentLetter.student.secondLastName}
            </h1>
            <Typography color="gray" className="font-normal text-md">
              {currentLetter.student.firstName} {currentLetter.student.middleName}
            </Typography>
          </div>
        </div>
      </div>

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
              Hay cambios sin guardar en la Carta Comunicativa de <span className="font-bold">{studentName}</span>
            </p>
          }
        />
      ) : null}

      <LetterConceptPicker
        subjects={currentLetter.subjects}
        selection={selection}
        onSelect={handleSelect}
        conceptText={conceptText}
        onTextChange={handleTextChange}
        disabled={isSaving}
      />

      <div
        className={`fixed bottom-6 inset-x-0 mx-auto max-w-3xl z-50 transition-all duration-300 transform ${
          isDirty ? "translate-y-0 opacity-100" : "translate-y-20 opacity-0 pointer-events-none"
        }`}
      >
        <div className="bg-white p-4 rounded-xl shadow-lg flex items-center justify-between px-8 mx-auto container">
          <div className="flex items-center gap-2">
            <div className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
            </div>
            <Typography variant="small" className="font-semibold text-gray-700">
              Hay cambios pendientes
            </Typography>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="text" size="sm" color="blue-gray" onClick={handleDiscard} className="hover:bg-gray-100">
              Deshacer cambios
            </Button>
            <Button
              variant="gradient"
              color="purple"
              size="sm"
              loading={isSaving}
              onClick={handleSave}
              className="flex items-center gap-2 shadow-purple-500/20 hover:shadow-purple-500/40"
            >
              {isSaving ? <BookmarkSquareIcon className="w-4 h-4" /> : <BookmarkSquareIconSolid className="w-4 h-4" />}
              Guardar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
