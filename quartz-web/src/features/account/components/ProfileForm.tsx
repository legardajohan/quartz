import { useEffect, useId, useMemo, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { Button, Input, Option, Select, Typography } from "@material-tailwind/react";
import { Lock } from "lucide-react";
import { ImageCropUploader } from "@/components/common/ImageCropUploader";
import { IDENTIFICATION_TYPES } from "@/types/domain";
import type { IdentificationType } from "@/types/domain";
import type { UserSchool } from "@/features/users/types";
import type { OwnProfile, UpdateOwnProfile } from "../types";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface ProfileFormData {
  firstName: string;
  middleName: string;
  lastName: string;
  secondLastName: string;
  identificationType: IdentificationType;
  identificationNumber: string;
  phoneNumber: string;
  email: string;
  schoolId: string;
}

type ProfileFormErrors = Partial<Record<keyof ProfileFormData, string>>;

function formDataFromProfile(profile: OwnProfile): ProfileFormData {
  return {
    firstName: profile.firstName,
    middleName: profile.middleName ?? "",
    lastName: profile.lastName,
    secondLastName: profile.secondLastName ?? "",
    identificationType: profile.identificationType,
    identificationNumber: String(profile.identificationNumber),
    phoneNumber: profile.phoneNumber ?? "",
    email: profile.email ?? "",
    schoolId: profile.school._id,
  };
}

function validate(data: ProfileFormData, canEditInstitutional: boolean): ProfileFormErrors {
  const errors: ProfileFormErrors = {};
  if (!data.firstName.trim()) errors.firstName = "Escribe tu primer nombre.";
  if (!data.lastName.trim()) errors.lastName = "Escribe tu primer apellido.";
  if (!/^[1-9]\d*$/.test(data.identificationNumber.trim())) {
    errors.identificationNumber = "Solo números, sin puntos ni espacios.";
  }
  if (canEditInstitutional && !EMAIL_PATTERN.test(data.email.trim())) {
    errors.email = "Escribe un correo válido, p. ej. nombre@colegio.edu.co.";
  }
  return errors;
}

// Solo viajan los campos que cambiaron; `email` y `schoolId` nunca salen si el rol no puede tocarlos.
function buildPayload(
  data: ProfileFormData,
  initial: ProfileFormData,
  canEditInstitutional: boolean
): UpdateOwnProfile {
  const payload: UpdateOwnProfile = {};
  const text = ["firstName", "middleName", "lastName", "secondLastName", "phoneNumber"] as const;
  for (const key of text) {
    if (data[key].trim() !== initial[key]) payload[key] = data[key].trim();
  }
  if (data.identificationType !== initial.identificationType) {
    payload.identificationType = data.identificationType;
  }
  if (data.identificationNumber.trim() !== initial.identificationNumber) {
    payload.identificationNumber = Number(data.identificationNumber.trim());
  }
  if (canEditInstitutional) {
    if (data.email.trim().toLowerCase() !== initial.email) payload.email = data.email.trim().toLowerCase();
    if (data.schoolId !== initial.schoolId) payload.schoolId = data.schoolId;
  }
  return payload;
}

interface FieldGroupProps {
  title: string;
  description?: string;
  children: ReactNode;
}

function FieldGroup({ title, description, children }: FieldGroupProps) {
  const headingId = useId();
  return (
    <section
      aria-labelledby={headingId}
      className="grid gap-x-8 gap-y-4 border-t border-gray-100 py-6 first:border-t-0 first:pt-0 md:grid-cols-[12rem_1fr]"
    >
      <div className="md:pt-2">
        <Typography id={headingId} as="h3" variant="small" className="font-semibold text-blue-gray-900">
          {title}
        </Typography>
        {description && (
          <Typography variant="small" className="mt-1 text-[13px] leading-snug text-gray-600">
            {description}
          </Typography>
        )}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">{children}</div>
    </section>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <Typography variant="small" className="mt-1.5 text-xs text-red-600">
      {message}
    </Typography>
  );
}

export interface ProfileFormProps {
  profile: OwnProfile;
  isAreaLead: boolean;
  schools: UserSchool[];
  onSubmit: (payload: UpdateOwnProfile) => Promise<void>;
  onUploadPhoto: (blob: Blob) => Promise<void>;
  isSubmitting: boolean;
  isUploading: boolean;
}

export default function ProfileForm({
  profile,
  isAreaLead,
  schools,
  onSubmit,
  onUploadPhoto,
  isSubmitting,
  isUploading,
}: ProfileFormProps) {
  const initial = useMemo(() => formDataFromProfile(profile), [profile]);
  const [formData, setFormData] = useState<ProfileFormData>(initial);
  const [showErrors, setShowErrors] = useState(false);

  // Un perfil nuevo (guardado o foto subida) es la nueva línea base del formulario.
  useEffect(() => {
    setFormData(initial);
    setShowErrors(false);
  }, [initial]);

  const payload = buildPayload(formData, initial, isAreaLead);
  const isDirty = Object.keys(payload).length > 0;
  const errors = validate(formData, isAreaLead);
  const visibleErrors = showErrors ? errors : {};

  const update = <K extends keyof ProfileFormData>(key: K, value: ProfileFormData[K]) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (Object.keys(errors).length > 0) {
      setShowErrors(true);
      return;
    }
    await onSubmit(payload);
  };

  const handleDiscard = () => {
    setFormData(initial);
    setShowErrors(false);
  };

  const fullName = [profile.firstName, profile.middleName, profile.lastName, profile.secondLastName]
    .filter(Boolean)
    .join(" ");
  const lockedHint = "Solo el Jefe de Área puede cambiarlo.";

  return (
    <div className="grid gap-10 lg:grid-cols-[15rem_1fr]">
      <aside className="flex flex-col items-center gap-4 text-center lg:items-start lg:text-left">
        <ImageCropUploader
          currentUrl={profile.avatarUrl}
          label="Tu foto de perfil"
          onUpload={onUploadPhoto}
          isUploading={isUploading}
          shape="circle"
          size="xl"
        />
        <div className="min-w-0 max-w-full">
          <Typography variant="h6" className="text-balance break-words text-blue-gray-900">
            {fullName}
          </Typography>
          <span className="mt-2 inline-flex items-center rounded-full bg-purple-50 px-2.5 py-0.5 text-xs font-medium text-purple-800">
            {profile.role}
          </span>
          <Typography variant="small" className="mt-3 text-gray-600">
            {profile.school.name}
          </Typography>
        </div>
        <Typography variant="small" className="text-xs leading-relaxed text-gray-600">
          Toca la foto para cambiarla. Se recorta en círculo y se guarda al confirmar.
        </Typography>
      </aside>

      <form onSubmit={handleSubmit} noValidate className="min-w-0">
        <FieldGroup title="Nombre">
          <div>
            <Input
              color="purple"
              label="Primer nombre"
              value={formData.firstName}
              onChange={(e) => update("firstName", e.target.value)}
              error={Boolean(visibleErrors.firstName)}
              autoComplete="given-name"
              crossOrigin="anonymous"
            />
            <FieldError message={visibleErrors.firstName} />
          </div>
          <Input
            color="purple"
            label="Segundo nombre (opcional)"
            value={formData.middleName}
            onChange={(e) => update("middleName", e.target.value)}
            autoComplete="additional-name"
            crossOrigin="anonymous"
          />
          <div>
            <Input
              color="purple"
              label="Primer apellido"
              value={formData.lastName}
              onChange={(e) => update("lastName", e.target.value)}
              error={Boolean(visibleErrors.lastName)}
              autoComplete="family-name"
              crossOrigin="anonymous"
            />
            <FieldError message={visibleErrors.lastName} />
          </div>
          <Input
            color="purple"
            label="Segundo apellido (opcional)"
            value={formData.secondLastName}
            onChange={(e) => update("secondLastName", e.target.value)}
            crossOrigin="anonymous"
          />
        </FieldGroup>

        <FieldGroup title="Identificación">
          <Select
            color="purple"
            label="Tipo de documento"
            value={formData.identificationType}
            onChange={(val) => val && update("identificationType", val as IdentificationType)}
            menuProps={{ placement: "bottom" }}
          >
            {IDENTIFICATION_TYPES.map((type) => (
              <Option key={type} value={type}>
                {type}
              </Option>
            ))}
          </Select>
          <div>
            <Input
              color="purple"
              label="Número de documento"
              inputMode="numeric"
              value={formData.identificationNumber}
              onChange={(e) => update("identificationNumber", e.target.value)}
              error={Boolean(visibleErrors.identificationNumber)}
              crossOrigin="anonymous"
            />
            <FieldError message={visibleErrors.identificationNumber} />
          </div>
        </FieldGroup>

        <FieldGroup
          title="Contacto e institución"
          description={isAreaLead ? "Tu correo es también tu usuario para iniciar sesión." : undefined}
        >
          <Input
            color="purple"
            type="tel"
            label="Teléfono (opcional)"
            value={formData.phoneNumber}
            onChange={(e) => update("phoneNumber", e.target.value)}
            autoComplete="tel"
            crossOrigin="anonymous"
          />
          <div>
            <Input
              color="purple"
              type="email"
              label="Correo"
              value={formData.email}
              onChange={(e) => update("email", e.target.value)}
              disabled={!isAreaLead}
              error={Boolean(visibleErrors.email)}
              icon={isAreaLead ? undefined : <Lock className="h-4 w-4 text-gray-500" aria-hidden />}
              autoComplete="email"
              crossOrigin="anonymous"
            />
            <FieldError message={visibleErrors.email} />
            {!isAreaLead && (
              <Typography variant="small" className="mt-1.5 text-xs text-gray-600">
                {lockedHint}
              </Typography>
            )}
          </div>
          <div className="sm:col-span-2 sm:max-w-[calc(50%-0.5rem)]">
            {/* `key`: Material Tailwind no pinta la etiqueta si las opciones llegan después del valor. */}
            {isAreaLead ? (
              <Select
                color="purple"
                label="Sede"
                value={formData.schoolId}
                onChange={(val) => val && update("schoolId", val)}
                menuProps={{ placement: "bottom", className: "max-h-[40vh] overflow-y-auto" }}
                key={schools.length}
              >
                {schools.map((school) => (
                  <Option key={school._id} value={school._id}>
                    {school.name}
                  </Option>
                ))}
              </Select>
            ) : (
              <>
                <Input
                  color="purple"
                  label="Sede"
                  value={profile.school.name}
                  disabled
                  icon={<Lock className="h-4 w-4 text-gray-500" aria-hidden />}
                  crossOrigin="anonymous"
                />
                <Typography variant="small" className="mt-1.5 text-xs text-gray-600">
                  {lockedHint}
                </Typography>
              </>
            )}
          </div>
        </FieldGroup>

        <div className="flex flex-col-reverse gap-3 border-t border-gray-100 pt-6 sm:flex-row sm:items-center sm:justify-end">
          <Button
            type="button"
            variant="text"
            color="blue-gray"
            onClick={handleDiscard}
            disabled={!isDirty || isSubmitting}
            className="transition-transform duration-150 active:scale-[0.97]"
          >
            Descartar cambios
          </Button>
          <Button
            type="submit"
            variant="gradient"
            color="purple"
            disabled={!isDirty || isSubmitting}
            loading={isSubmitting}
            className="flex items-center justify-center transition-transform duration-150 active:scale-[0.97]"
          >
            {isSubmitting ? "Guardando…" : "Guardar cambios"}
          </Button>
        </div>
      </form>
    </div>
  );
}
