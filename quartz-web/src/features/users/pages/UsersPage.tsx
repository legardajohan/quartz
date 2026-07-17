import { useState, useMemo, useCallback, useEffect } from "react";
import { Tabs, TabsHeader, Tab } from "@material-tailwind/react";
import { PlusIcon, AcademicCapIcon, BriefcaseIcon } from "@heroicons/react/24/outline";
import toast from "react-hot-toast";

import { extractErrorMessage } from "@/api/apiClient";
import type { GradeLevel, IdentificationType } from "@/types/domain";
import { useAuthStore } from "../../auth/useAuthStore";
import { ConfirmationModal } from "@/components/common/ConfirmationModal";
import { FormModal } from "@/components/common/FormModal";
import { ITEMS_PER_PAGE } from "@/components/common/DataTable";
import {
  useUsersQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useDeleteUserMutation,
  useUploadStudentPhotoMutation,
} from "../queries/useUsersQuery";
import { useSchoolsQuery } from "../queries/useSchoolsQuery";
import type { UserDto, NewUser, UpdateUser, WritableUserRole } from "../types";
import { UsersTable } from "../components/UsersTable";
import { UsersToolbar } from "../components/UsersToolbar";
import { UserForm, type UserFormData } from "../components/UserForm";

const ROLE_TABS = [
  { value: "Estudiante" as const, label: "Estudiantes", icon: AcademicCapIcon },
  { value: "Docente" as const, label: "Docentes", icon: BriefcaseIcon },
];

export default function UsersPage() {
  const { sessionData } = useAuthStore();
  const canManage = sessionData?.user.role === "Jefe de Área";

  const [activeRole, setActiveRole] = useState<WritableUserRole>("Estudiante");
  const { data: users = [], isLoading, isError, error } = useUsersQuery({ role: activeRole });
  const { data: schools = [] } = useSchoolsQuery();

  const createMutation = useCreateUserMutation();
  const updateMutation = useUpdateUserMutation();
  const deleteMutation = useDeleteUserMutation();
  const uploadPhotoMutation = useUploadStudentPhotoMutation();

  const [search, setSearch] = useState("");
  const [selectedSchools, setSelectedSchools] = useState<string[]>([]);
  const [selectedGrades, setSelectedGrades] = useState<GradeLevel[]>([]);
  const [currentPage, setCurrentPage] = useState(1);

  const [isFormModalOpen, setFormModalOpen] = useState(false);
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserDto | null>(null);
  const [userToDelete, setUserToDelete] = useState<UserDto | null>(null);
  const [formData, setFormData] = useState<UserFormData | null>(null);
  const [isFormDirty, setIsFormDirty] = useState(false);
  const [pendingAvatarBlob, setPendingAvatarBlob] = useState<Blob | null>(null);
  const [pendingAvatarPreview, setPendingAvatarPreview] = useState<string | null>(null);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeRole]);

  const handleOpenCreateModal = () => {
    setSelectedUser(null);
    setPendingAvatarBlob(null);
    setPendingAvatarPreview(null);
    setFormModalOpen(true);
  };

  const handleEdit = (user: UserDto) => {
    setSelectedUser(user);
    setFormModalOpen(true);
  };

  const handleDelete = (user: UserDto) => {
    setUserToDelete(user);
    setDeleteModalOpen(true);
  };

  const handleCloseModals = () => {
    setFormModalOpen(false);
    setDeleteModalOpen(false);
    setSelectedUser(null);
    setUserToDelete(null);
    setFormData(null);
    setIsFormDirty(false);
    if (pendingAvatarPreview) URL.revokeObjectURL(pendingAvatarPreview);
    setPendingAvatarBlob(null);
    setPendingAvatarPreview(null);
  };

  const handleFormChange = useCallback((data: UserFormData, dirty: boolean) => {
    setFormData(data);
    setIsFormDirty(dirty);
  }, []);

  const handleAvatarChange = async (blob: Blob) => {
    if (selectedUser) {
      const updated = await uploadPhotoMutation.mutateAsync({ studentId: selectedUser._id, blob });
      setSelectedUser(updated);
      return;
    }
    if (pendingAvatarPreview) URL.revokeObjectURL(pendingAvatarPreview);
    setPendingAvatarBlob(blob);
    setPendingAvatarPreview(URL.createObjectURL(blob));
  };

  const toggleSchoolFilter = (schoolId: string) => {
    setSelectedSchools((prev) =>
      prev.includes(schoolId) ? prev.filter((id) => id !== schoolId) : [...prev, schoolId]
    );
    setCurrentPage(1);
  };

  const toggleGradeFilter = (grade: GradeLevel) => {
    setSelectedGrades((prev) =>
      prev.includes(grade) ? prev.filter((g) => g !== grade) : [...prev, grade]
    );
    setCurrentPage(1);
  };

  const filteredUsers = useMemo(() => {
    const term = search.trim().toLowerCase();
    return users.filter((user) => {
      const fullName = [user.firstName, user.middleName, user.lastName, user.secondLastName]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      const matchesSearch = term === "" || fullName.includes(term) || String(user.identificationNumber).includes(term);
      const matchesSchool = selectedSchools.length === 0 || selectedSchools.includes(user.school?._id ?? "");
      const matchesGrade = selectedGrades.length === 0 || user.gradesTaught.some((g) => selectedGrades.includes(g as GradeLevel));
      return matchesSearch && matchesSchool && matchesGrade;
    });
  }, [users, search, selectedSchools, selectedGrades]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / ITEMS_PER_PAGE));
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const isEditMode = !!selectedUser;
  const formRole: WritableUserRole = (selectedUser?.role as WritableUserRole) ?? activeRole;
  const isSubmitting = createMutation.isPending || updateMutation.isPending;
  const isSubmitDisabled = isSubmitting || (isEditMode && !isFormDirty);

  const handleConfirmDelete = () => {
    if (!userToDelete) return;
    const promise = deleteMutation.mutateAsync(userToDelete._id);
    toast.promise(promise, {
      loading: "Eliminando usuario...",
      success: <b>Usuario eliminado con éxito</b>,
      error: (err) => <b>{extractErrorMessage(err, "No se pudo eliminar el usuario.")}</b>,
    });
    handleCloseModals();
  };

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!formData) return;

    const identificationNumber = Number(formData.identificationNumber);
    if (
      !formData.firstName.trim() ||
      !formData.lastName.trim() ||
      !formData.identificationType ||
      !identificationNumber ||
      !formData.schoolId ||
      formData.gradesTaught.length === 0
    ) {
      toast.error("Por favor, completa todos los campos obligatorios.");
      return;
    }

    if (formRole === "Docente" && !isEditMode && (!formData.email.trim() || !formData.password.trim())) {
      toast.error("El docente requiere correo y contraseña.");
      return;
    }

    if (isEditMode && selectedUser) {
      const payload: UpdateUser = {
        firstName: formData.firstName.trim(),
        middleName: formData.middleName.trim() || undefined,
        lastName: formData.lastName.trim(),
        secondLastName: formData.secondLastName.trim() || undefined,
        identificationType: formData.identificationType as IdentificationType,
        identificationNumber,
        phoneNumber: formData.phoneNumber.trim() || undefined,
        schoolId: formData.schoolId,
        gradesTaught: formData.gradesTaught,
      };
      if (formData.email.trim()) payload.email = formData.email.trim();
      if (formData.password.trim()) payload.password = formData.password.trim();

      const promise = updateMutation.mutateAsync({ userId: selectedUser._id, data: payload });
      toast.promise(promise, {
        loading: "Actualizando usuario...",
        success: <b>¡Usuario actualizado con éxito!</b>,
        error: (err) => <b>{extractErrorMessage(err, "No se pudo actualizar el usuario.")}</b>,
      });
      handleCloseModals();
      return;
    }

    const payload: NewUser = {
      role: activeRole,
      firstName: formData.firstName.trim(),
      middleName: formData.middleName.trim() || undefined,
      lastName: formData.lastName.trim(),
      secondLastName: formData.secondLastName.trim() || undefined,
      identificationType: formData.identificationType as IdentificationType,
      identificationNumber,
      phoneNumber: formData.phoneNumber.trim() || undefined,
      schoolId: formData.schoolId,
      gradesTaught: formData.gradesTaught,
      ...(activeRole === "Docente"
        ? { email: formData.email.trim(), password: formData.password.trim() }
        : {}),
    };

    const promise = createMutation.mutateAsync(payload).then(async (created) => {
      if (pendingAvatarBlob) {
        await uploadPhotoMutation.mutateAsync({ studentId: created._id, blob: pendingAvatarBlob });
      }
      return created;
    });
    toast.promise(promise, {
      loading: "Creando usuario...",
      success: <b>¡Usuario creado con éxito!</b>,
      error: (err) => <b>{extractErrorMessage(err, "No se pudo crear el usuario.")}</b>,
    });
    handleCloseModals();
  };

  return (
    <>
      <div className="w-full relative">
        <div className="flex justify-between items-start mb-6">
          <div className="flex flex-col gap-4">
            <h1 className="text-2xl font-semibold text-purple-900">Gestión de Usuarios</h1>

            <Tabs value={activeRole} className="w-full max-w-md">
              <TabsHeader className="bg-purple-50/60 p-1.5">
                {ROLE_TABS.map(({ value, label, icon: Icon }) => {
                  const isActive = activeRole === value;
                  return (
                    <Tab
                      key={value}
                      value={value}
                      onClick={() => setActiveRole(value)}
                      className="px-10 py-2.5 transition-transform duration-150 active:scale-[0.98]"
                    >
                      <div
                        className={`flex items-center gap-2 text-sm font-medium transition-colors duration-150 ${
                          isActive ? "text-purple-900" : "text-gray-600"
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        {label}
                      </div>
                    </Tab>
                  );
                })}
              </TabsHeader>
            </Tabs>

            <UsersToolbar
              search={search}
              onSearchChange={(value) => {
                setSearch(value);
                setCurrentPage(1);
              }}
              schools={schools}
              selectedSchools={selectedSchools}
              onToggleSchool={toggleSchoolFilter}
              selectedGrades={selectedGrades}
              onToggleGrade={toggleGradeFilter}
            />
          </div>

          {canManage && (
            <button
              onClick={handleOpenCreateModal}
              aria-label="Crear nuevo usuario"
              className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-full transition-colors flex-shrink-0"
            >
              <PlusIcon className="h-6 w-6" strokeWidth={2} />
              Crear
            </button>
          )}
        </div>

        {isError && <p className="mt-4 text-red-500">{extractErrorMessage(error, "Error al cargar usuarios.")}</p>}

        <UsersTable
          users={paginatedUsers}
          currentPage={currentPage}
          totalPages={totalPages}
          onNextPage={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
          onPrevPage={() => setCurrentPage((p) => Math.max(1, p - 1))}
          isLoading={isLoading}
          canManage={canManage}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </div>

      <ConfirmationModal
        open={isDeleteModalOpen}
        onClose={handleCloseModals}
        onConfirm={handleConfirmDelete}
        title="¿Deseas eliminar el usuario?"
        body={userToDelete ? `${userToDelete.firstName} ${userToDelete.lastName}` : ""}
        confirmColor="pink"
      />

      <FormModal
        open={isFormModalOpen}
        onClose={handleCloseModals}
        onSubmit={handleFormSubmit}
        title={!isEditMode ? `Nuevo ${activeRole}` : "Editar Usuario"}
        submitText={!isEditMode ? "Crear Usuario" : "Actualizar"}
        isSubmitting={isSubmitting}
        isSubmitDisabled={isSubmitDisabled}
        size="md"
      >
        <UserForm
          role={formRole}
          initialData={selectedUser}
          schools={schools}
          avatarUrl={selectedUser ? selectedUser.avatarUrl : pendingAvatarPreview ?? undefined}
          onAvatarChange={handleAvatarChange}
          isUploadingAvatar={uploadPhotoMutation.isPending}
          onFormChange={handleFormChange}
        />
      </FormModal>
    </>
  );
}
