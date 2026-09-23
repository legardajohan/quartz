import { useState, useMemo, useCallback, useEffect } from "react";
import { Tabs, TabsHeader, Tab } from "@material-tailwind/react";
import { PlusIcon, AcademicCapIcon, BriefcaseIcon, ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import toast from "react-hot-toast";

import { extractErrorMessage } from "@/api/apiClient";
import type { GradeLevel, IdentificationType } from "@/types/domain";
import { useAuthStore } from "../../auth/useAuthStore";
import { usePermissions } from "../../auth/usePermissions";
import { ConfirmationModal } from "@/components/common/ConfirmationModal";
import { FormModal } from "@/components/common/FormModal";
import { ITEMS_PER_PAGE } from "@/components/common/DataTable";
import SearchFilterBar, { type FilterGroup } from "@/components/common/SearchFilterBar";
import {
  useUsersQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useDeleteUserMutation,
  useUploadStudentPhotoMutation,
  useResendInvitationMutation,
} from "../queries/useUsersQuery";
import { useSchoolsQuery } from "../queries/useSchoolsQuery";
import { STAFF_ROLES } from "../types";
import type { UserDto, NewUser, UpdateUser, WritableUserRole, StaffRole, GetUsersQuery } from "../types";
import { UsersTable } from "../components/UsersTable";
import { UserForm, type UserFormData } from "../components/UserForm";

type UsersTab = "students" | "staff";

// "Equipo docente" agrupa Docentes y Jefes de Área (USR-04); solo lo ve el Jefe de Área.
const ROLE_TABS: { value: UsersTab; label: string; icon: typeof AcademicCapIcon }[] = [
  { value: "students", label: "Estudiantes", icon: AcademicCapIcon },
  { value: "staff", label: "Equipo docente", icon: BriefcaseIcon },
];

const TAB_QUERY: Record<UsersTab, GetUsersQuery> = {
  students: { role: "Estudiante" },
  staff: { roles: STAFF_ROLES },
};

// Fase actual del sistema: solo Grado Transición (ver CLAUDE.md raíz).
const GRADE_LEVELS: GradeLevel[] = ["Transición"];

export default function UsersPage() {
  const { sessionData } = useAuthStore();
  const { isAreaLead, userId: currentUserId } = usePermissions();
  const canCreate = isAreaLead;
  const canDelete = isAreaLead;
  const canEdit = true; // ambos roles; el backend acota al Docente a su sede
  const multipleShifts = sessionData?.multipleShifts ?? false;
  const shifts = sessionData?.shifts ?? [];

  const [activeTab, setActiveTab] = useState<UsersTab>("students");
  const [newStaffRole, setNewStaffRole] = useState<StaffRole>("Docente");
  const isStaffTab = activeTab === "staff";
  const visibleRoleTabs = isAreaLead ? ROLE_TABS : ROLE_TABS.filter((tab) => tab.value === "students");
  const { data: users = [], isLoading, isError, error } = useUsersQuery(TAB_QUERY[activeTab]);
  const { data: schools = [] } = useSchoolsQuery();

  const createMutation = useCreateUserMutation();
  const updateMutation = useUpdateUserMutation();
  const deleteMutation = useDeleteUserMutation();
  const uploadPhotoMutation = useUploadStudentPhotoMutation();
  const resendInvitationMutation = useResendInvitationMutation();

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
  }, [activeTab]);

  const handleOpenCreateModal = () => {
    setSelectedUser(null);
    setNewStaffRole("Docente");
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

  const handleResendInvitation = (user: UserDto) => {
    const promise = resendInvitationMutation.mutateAsync(user._id);
    toast.promise(promise, {
      loading: "Enviando invitación...",
      success: <b>Invitación enviada a {user.email}</b>,
      error: (err) => <b>{extractErrorMessage(err, "No se pudo reenviar la invitación.")}</b>,
    });
  };

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

  const filterGroups: FilterGroup[] = [
    ...(isAreaLead
      ? [
          {
            id: "school",
            label: "Sede",
            options: schools.map((school) => ({ value: school._id, label: school.name })),
            selected: selectedSchools,
            onToggle: toggleSchoolFilter,
          } satisfies FilterGroup,
        ]
      : []),
    {
      id: "grade",
      label: "Grado",
      options: GRADE_LEVELS.map((grade) => ({ value: grade, label: grade })),
      selected: selectedGrades,
      onToggle: (value) => toggleGradeFilter(value as GradeLevel),
    },
  ];

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / ITEMS_PER_PAGE));
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const isEditMode = !!selectedUser;
  const formRole: WritableUserRole =
    (selectedUser?.role as WritableUserRole) ?? (isStaffTab ? newStaffRole : "Estudiante");
  const isStaffForm = formRole !== "Estudiante";
  const resendingUserId = resendInvitationMutation.isPending ? resendInvitationMutation.variables : null;
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
      (formRole !== "Jefe de Área" && formData.gradesTaught.length === 0)
    ) {
      toast.error("Por favor, completa todos los campos obligatorios.");
      return;
    }

    if (isStaffForm && !formData.email.trim()) {
      toast.error("El correo es obligatorio: allí se envía el enlace de activación.");
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
        gradesTaught: formData.gradesTaught,
      };
      // El Select de sede queda deshabilitado para el Docente (UserForm): no se envía el campo,
      // porque el backend rechaza con 403 cualquier intento de un Docente de cambiar la sede,
      // incluso a su mismo valor actual.
      if (isAreaLead) payload.schoolId = formData.schoolId;
      if (formData.email.trim()) payload.email = formData.email.trim().toLowerCase();
      if (formRole === "Estudiante") payload.shiftId = formData.shiftId || null;

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
      role: formRole,
      firstName: formData.firstName.trim(),
      middleName: formData.middleName.trim() || undefined,
      lastName: formData.lastName.trim(),
      secondLastName: formData.secondLastName.trim() || undefined,
      identificationType: formData.identificationType as IdentificationType,
      identificationNumber,
      phoneNumber: formData.phoneNumber.trim() || undefined,
      schoolId: formData.schoolId,
      gradesTaught: formData.gradesTaught,
      ...(isStaffForm
        ? { email: formData.email.trim().toLowerCase() }
        : { shiftId: formData.shiftId || undefined }),
    };

    const promise = createMutation.mutateAsync(payload).then(async (created) => {
      if (pendingAvatarBlob) {
        await uploadPhotoMutation.mutateAsync({ studentId: created._id, blob: pendingAvatarBlob });
      }
      return created;
    });
    toast.promise(promise, {
      loading: isStaffForm ? "Creando usuario y enviando invitación..." : "Creando usuario...",
      success: (created) =>
        isStaffForm && created.invitationEmailSent ? (
          <b>Invitación enviada a {created.email}</b>
        ) : (
          <b>¡Usuario creado con éxito!</b>
        ),
      error: (err) => <b>{extractErrorMessage(err, "No se pudo crear el usuario.")}</b>,
    });
    // El alta se conserva aunque el correo falle: se avisa para que el Jefe de Área reenvíe.
    promise
      .then((created) => {
        if (isStaffForm && !created.invitationEmailSent) {
          toast(
            <span>
              <b>No se pudo enviar la invitación.</b> Usa "Reenviar invitación" en la fila de {created.firstName}.
            </span>,
            {
              duration: 8000,
              icon: <ExclamationTriangleIcon className="h-5 w-5 shrink-0 text-amber-600" />,
              style: { background: "#FFFBEB", color: "#78350F" },
            }
          );
        }
      })
      .catch(() => undefined);
    handleCloseModals();
  };

  return (
    <>
      <div className="w-full relative">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-semibold text-purple-900">Gestión de Usuarios</h1>

          {canCreate && (
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

        <div className="flex items-center gap-4 mb-6">
          <Tabs value={activeTab} className="w-auto shrink-0">
            <TabsHeader className="bg-purple-50/60 p-1.5">
              {visibleRoleTabs.map(({ value, label, icon: Icon }) => {
                const isActive = activeTab === value;
                return (
                  <Tab
                    key={value}
                    value={value}
                    onClick={() => setActiveTab(value)}
                    className="px-8 py-2 transition-transform duration-150 active:scale-[0.98]"
                  >
                    <div
                      className={`flex items-center gap-2 text-sm font-medium whitespace-nowrap transition-colors duration-150 ${
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

          <SearchFilterBar
            search={search}
            onSearchChange={(value) => {
              setSearch(value);
              setCurrentPage(1);
            }}
            placeholder="Buscar por nombre o identificación"
            groups={filterGroups}
          />
        </div>

        {isError && <p className="mt-4 text-red-500">{extractErrorMessage(error, "Error al cargar usuarios.")}</p>}

        <UsersTable
          users={paginatedUsers}
          currentPage={currentPage}
          totalPages={totalPages}
          onNextPage={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
          onPrevPage={() => setCurrentPage((p) => Math.max(1, p - 1))}
          isLoading={isLoading}
          canEdit={canEdit}
          canDelete={canDelete}
          multipleShifts={multipleShifts}
          isStaffView={isStaffTab}
          currentUserId={currentUserId}
          resendingUserId={resendingUserId}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onResendInvitation={handleResendInvitation}
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
        title={!isEditMode ? `Nuevo ${formRole}` : "Editar Usuario"}
        submitText={!isEditMode ? (isStaffForm ? "Crear y enviar invitación" : "Crear Usuario") : "Actualizar"}
        isSubmitting={isSubmitting}
        isSubmitDisabled={isSubmitDisabled}
        size="md"
      >
        <UserForm
          role={formRole}
          onRoleChange={!isEditMode && isStaffTab ? setNewStaffRole : undefined}
          initialData={selectedUser}
          schools={schools}
          shifts={shifts}
          multipleShifts={multipleShifts}
          isAreaLead={isAreaLead}
          avatarUrl={selectedUser ? selectedUser.avatarUrl : pendingAvatarPreview ?? undefined}
          onAvatarChange={handleAvatarChange}
          isUploadingAvatar={uploadPhotoMutation.isPending}
          onFormChange={handleFormChange}
        />
      </FormModal>
    </>
  );
}
