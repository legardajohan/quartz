import { useEffect, useState, useCallback } from "react";
import { Dialog, DialogHeader, DialogBody } from "@material-tailwind/react";
import { PlusIcon } from "@heroicons/react/24/outline";
import toast from "react-hot-toast";

import { useChecklistTemplateStore } from "../useChecklistTemplateStore";
import { useAuthStore } from "../../auth/useAuthStore";
import { ConfirmationModal } from "../../../components/common/ConfirmationModal";
import { FormModal } from "../../../components/common/FormModal";
import ChecklistCard from "../components/ChecklistCard";
import ChecklistEditor from "../components/ChecklistEditor";
import { ChecklistCreateForm } from "../components/ChecklistCreateForm";
import type {
  ChecklistTemplateDto,
  NewChecklistTemplate,
  UpdateChecklistTemplate,
  SubjectSnapshot,
} from "../types";

type CreateFormData = { name: string; periodId: string; grade: string };

export default function ChecklistsPage() {
  const {
    templates,
    isLoading,
    isSubmitting,
    error,
    createTemplate,
    updateTemplate,
    deleteTemplate,
  } = useChecklistTemplateStore();

  const { sessionData } = useAuthStore();
  const periods = sessionData?.periods ?? [];
  const currentUser = sessionData?.user;

  // — Create modal state —
  const [isCreateOpen, setCreateOpen] = useState(false);
  const [createFormData, setCreateFormData] = useState<CreateFormData | null>(null);
  const [isCreateReady, setIsCreateReady] = useState(false);

  // — Edit modal state —
  const [isEditorOpen, setEditorOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<ChecklistTemplateDto | null>(null);
  const [editorName, setEditorName] = useState("");

  // — Delete modal state —
  const [isDeleteOpen, setDeleteOpen] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<ChecklistTemplateDto | null>(null);

  useEffect(() => {
    useChecklistTemplateStore.getState().fetchTemplates();
  }, []);

  const canManage = useCallback(
    (template: ChecklistTemplateDto): boolean => {
      if (!currentUser) return false;
      return (
        currentUser.role === "Jefe de Área" ||
        template.author._id === currentUser._id
      );
    },
    [currentUser]
  );

  // Handlers — create
  const handleOpenCreate = () => {
    setCreateFormData(null);
    setIsCreateReady(false);
    setCreateOpen(true);
  };

  const handleCreateFormChange = useCallback(
    (data: CreateFormData, isReady: boolean) => {
      setCreateFormData(data);
      setIsCreateReady(isReady);
    },
    []
  );

  const handleCreateSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!createFormData) return;
    const payload: NewChecklistTemplate = createFormData;
    const promise = createTemplate(payload);
    toast.promise(promise, {
      loading: "Creando plantilla…",
      success: <b>¡Plantilla creada!</b>,
      error: (err) => <b>{err.toString()}</b>,
    });
    setCreateOpen(false);
  };

  // Handlers — edit
  const handleEdit = (template: ChecklistTemplateDto) => {
    setSelectedTemplate(template);
    setEditorName(template.name);
    setEditorOpen(true);
  };

  const handleCloseEditor = () => {
    setEditorOpen(false);
    setSelectedTemplate(null);
    setEditorName("");
  };

  const handleEditorSave = (subjects: SubjectSnapshot[]) => {
    if (!selectedTemplate) return;
    const payload: UpdateChecklistTemplate = { name: editorName, subjects };
    const promise = updateTemplate(selectedTemplate._id, payload);
    toast.promise(promise, {
      loading: "Guardando cambios…",
      success: <b>¡Plantilla actualizada!</b>,
      error: (err) => <b>{err.toString()}</b>,
    });
    handleCloseEditor();
  };

  // Handlers — delete
  const handleDelete = (template: ChecklistTemplateDto) => {
    setTemplateToDelete(template);
    setDeleteOpen(true);
  };

  const handleCloseDelete = () => {
    setDeleteOpen(false);
    setTemplateToDelete(null);
  };

  const handleConfirmDelete = () => {
    if (!templateToDelete) return;
    const promise = deleteTemplate(templateToDelete._id);
    toast.promise(promise, {
      loading: "Eliminando plantilla…",
      success: <b>Plantilla eliminada.</b>,
      error: (err) => <b>{err.toString()}</b>,
    });
    handleCloseDelete();
  };

  return (
    <>
      <div className="w-full">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold text-purple-900">Lista de Chequeo</h1>
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-full transition-colors flex-shrink-0"
          >
            <PlusIcon className="h-6 w-6" strokeWidth={2} />
            Crear
          </button>
        </div>

        {error && <p className="mt-2 text-red-500 text-sm">{error}</p>}

        {isLoading ? (
          <p className="text-gray-400 text-sm">Cargando plantillas…</p>
        ) : templates.length === 0 ? (
          <div className="text-center py-16 text-gray-300">
            <p className="text-lg">No tienes plantillas aún.</p>
            <p className="text-sm mt-1">Crea una usando el botón "Crear".</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map((t) => (
              <ChecklistCard
                key={t._id}
                template={t}
                canManage={canManage(t)}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modal crear — pequeño, como "Nuevo Aprendizaje" */}
      <FormModal
        open={isCreateOpen}
        onClose={() => setCreateOpen(false)}
        onSubmit={handleCreateSubmit}
        title="Nueva Plantilla"
        subtitle="Completa los datos para crear la lista de chequeo."
        submitText="Crear Plantilla"
        isSubmitting={isSubmitting}
        isSubmitDisabled={!isCreateReady}
      >
        <ChecklistCreateForm periods={periods} onFormChange={handleCreateFormChange} />
      </FormModal>

      {/* Modal editar — grande, con acordeones */}
      {selectedTemplate && (
        <Dialog
          open={isEditorOpen}
          handler={handleCloseEditor}
          size="lg"
          className="px-5 py-3"
          dismiss={{ enabled: false }}
        >
          {/* Título editable — mismo estilo Google Forms */}
          <DialogHeader className="pb-0">
            <input
              value={editorName}
              onChange={(e) => setEditorName(e.target.value)}
              placeholder="Nombre de la plantilla…"
              className="w-full text-2xl font-bold text-purple-900 bg-transparent border-b-2 border-purple-200 focus:border-purple-500 focus:outline-none pb-1 placeholder:text-gray-300 placeholder:font-normal transition-colors"
            />
          </DialogHeader>

          <DialogBody className="overflow-y-auto max-h-[70vh] px-1 pt-4">
            <ChecklistEditor
              initialTemplate={selectedTemplate}
              name={editorName}
              isSubmitting={isSubmitting}
              onSave={handleEditorSave}
              onCancel={handleCloseEditor}
            />
          </DialogBody>
        </Dialog>
      )}

      {/* Confirmación eliminación */}
      <ConfirmationModal
        open={isDeleteOpen}
        onClose={handleCloseDelete}
        onConfirm={handleConfirmDelete}
        title="¿Eliminar plantilla?"
        body={`Se eliminará "${templateToDelete?.name}". Esta acción no se puede deshacer.`}
        confirmColor="pink"
        confirmText="Eliminar"
      />
    </>
  );
}
