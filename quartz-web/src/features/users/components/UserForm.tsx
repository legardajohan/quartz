import { useState, useEffect } from "react";
import { Input, Select, Option, Checkbox, Typography } from "@material-tailwind/react";
import { ImageCropUploader } from "@/components/common/ImageCropUploader";
import type { IdentificationType, GradeLevel, Shift } from "@/types/domain";
import type { UserDto, UserSchool, WritableUserRole } from "../types";

const IDENTIFICATION_TYPES: IdentificationType[] = ["CC", "TI", "RC"];

const GRADE_LEVELS: GradeLevel[] = [
  "Transición"
];

export interface UserFormData {
  firstName: string;
  middleName: string;
  lastName: string;
  secondLastName: string;
  identificationType: IdentificationType | "";
  identificationNumber: string;
  phoneNumber: string;
  schoolId: string;
  gradesTaught: GradeLevel[];
  email: string;
  password: string;
  shiftId: string;
}

const EMPTY_FORM: UserFormData = {
  firstName: "",
  middleName: "",
  lastName: "",
  secondLastName: "",
  identificationType: "",
  identificationNumber: "",
  phoneNumber: "",
  schoolId: "",
  gradesTaught: [],
  email: "",
  password: "",
  shiftId: "",
};

function formDataFromUser(user: UserDto): UserFormData {
  return {
    firstName: user.firstName,
    middleName: user.middleName ?? "",
    lastName: user.lastName,
    secondLastName: user.secondLastName ?? "",
    identificationType: user.identificationType,
    identificationNumber: String(user.identificationNumber),
    phoneNumber: user.phoneNumber ?? "",
    schoolId: user.school?._id ?? "",
    gradesTaught: (user.gradesTaught ?? []) as GradeLevel[],
    email: user.email ?? "",
    password: "",
    shiftId: user.shift?._id ?? "",
  };
}

interface UserFormProps {
  role: WritableUserRole;
  initialData?: UserDto | null;
  schools: UserSchool[];
  shifts: Shift[];
  multipleShifts: boolean;
  avatarUrl?: string;
  onAvatarChange: (blob: Blob) => Promise<void>;
  isUploadingAvatar?: boolean;
  onFormChange: (formData: UserFormData, isDirty: boolean) => void;
}

export function UserForm({
  role,
  initialData,
  schools,
  shifts,
  multipleShifts,
  avatarUrl,
  onAvatarChange,
  isUploadingAvatar,
  onFormChange,
}: UserFormProps) {
  const [formData, setFormData] = useState<UserFormData>(EMPTY_FORM);
  const isTeacher = role === "Docente";

  useEffect(() => {
    setFormData(initialData ? formDataFromUser(initialData) : EMPTY_FORM);
  }, [initialData]);

  useEffect(() => {
    const initial = initialData ? formDataFromUser(initialData) : EMPTY_FORM;
    const isDirty =
      !initialData ||
      formData.firstName !== initial.firstName ||
      formData.middleName !== initial.middleName ||
      formData.lastName !== initial.lastName ||
      formData.secondLastName !== initial.secondLastName ||
      formData.identificationType !== initial.identificationType ||
      formData.identificationNumber !== initial.identificationNumber ||
      formData.phoneNumber !== initial.phoneNumber ||
      formData.schoolId !== initial.schoolId ||
      formData.email !== initial.email ||
      formData.password !== "" ||
      formData.shiftId !== initial.shiftId ||
      JSON.stringify(formData.gradesTaught) !== JSON.stringify(initial.gradesTaught);

    onFormChange(formData, isDirty);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData, initialData]);

  const update = <K extends keyof UserFormData>(key: K, value: UserFormData[K]) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const toggleGrade = (grade: GradeLevel) => {
    setFormData((prev) => ({
      ...prev,
      gradesTaught: prev.gradesTaught.includes(grade)
        ? prev.gradesTaught.filter((g) => g !== grade)
        : [...prev.gradesTaught, grade],
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-center">
        <ImageCropUploader
          currentUrl={avatarUrl}
          label="Foto de perfil"
          onUpload={onAvatarChange}
          isUploading={isUploadingAvatar}
          shape="circle"
          size="xl"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Select
          name="identificationType"
          color="purple"
          label="Tipo de identificación"
          value={formData.identificationType}
          onChange={(val) => update("identificationType", (val as IdentificationType) || "")}
        >
          {IDENTIFICATION_TYPES.map((type) => (
            <Option key={type} value={type}>
              {type}
            </Option>
          ))}
        </Select>
        <Input
          type="number"
          color="purple"
          label="Número de identificación"
          value={formData.identificationNumber}
          onChange={(e) => update("identificationNumber", e.target.value)}
          crossOrigin="anonymous"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input
          color="purple"
          label="Primer nombre"
          value={formData.firstName}
          onChange={(e) => update("firstName", e.target.value)}
          crossOrigin="anonymous"
        />
        <Input
          color="purple"
          label="Segundo nombre"
          value={formData.middleName}
          onChange={(e) => update("middleName", e.target.value)}
          crossOrigin="anonymous"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input
          color="purple"
          label="Primer apellido"
          value={formData.lastName}
          onChange={(e) => update("lastName", e.target.value)}
          crossOrigin="anonymous"
        />
        <Input
          color="purple"
          label="Segundo apellido"
          value={formData.secondLastName}
          onChange={(e) => update("secondLastName", e.target.value)}
          crossOrigin="anonymous"
        />
      </div>

      {isTeacher ? (
        <div className="grid grid-cols-2 gap-4">
          <Select
            name="schoolId"
            color="purple"
            label="Sede"
            value={formData.schoolId}
            onChange={(val) => update("schoolId", val || "")}
            key={initialData?._id ? `school-${initialData._id}` : schools.length}
          >
            {schools.map((school) => (
              <Option key={school._id} value={school._id}>
                {school.name}
              </Option>
            ))}
          </Select>

          <Select
            name="gradesTaught"
            color="purple"
            label="Cursos a cargo"
            value={formData.gradesTaught.join(", ")}
            selected={() => formData.gradesTaught.join(", ")}
            onChange={() => {}}
          >
            {GRADE_LEVELS.map((grade) => (
              <Option key={grade} value={grade} className="p-0">
                <label
                  htmlFor={`grade-taught-${grade}`}
                  className="flex w-full cursor-pointer items-center gap-2 px-3 py-2"
                >
                  <Checkbox
                    crossOrigin={undefined}
                    id={`grade-taught-${grade}`}
                    ripple={false}
                    className="hover:before:opacity-0"
                    containerProps={{ className: "p-0" }}
                    checked={formData.gradesTaught.includes(grade)}
                    onChange={() => toggleGrade(grade)}
                  />
                  <Typography color="blue-gray" className="font-normal">
                    {grade}
                  </Typography>
                </label>
              </Option>
            ))}
          </Select>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4">
            <Select
              name="schoolId"
              color="purple"
              label="Sede"
              value={formData.schoolId}
              onChange={(val) => update("schoolId", val || "")}
              key={initialData?._id ? `school-${initialData._id}` : schools.length}
            >
              {schools.map((school) => (
                <Option key={school._id} value={school._id}>
                  {school.name}
                </Option>
              ))}
            </Select>

            <Select
              color="purple"
              label="Grado"
              value={formData.gradesTaught[0] ?? ""}
              onChange={(val) => update("gradesTaught", val ? [val as GradeLevel] : [])}
              key={initialData?._id ? `grade-${initialData._id}` : "grade-new"}
            >
              {GRADE_LEVELS.map((grade) => (
                <Option key={grade} value={grade}>
                  {grade}
                </Option>
              ))}
            </Select>
          </div>

          {multipleShifts && shifts.length > 0 && (
            <Select
              name="shiftId"
              color="purple"
              label="Jornada (opcional)"
              value={formData.shiftId}
              onChange={(val) => update("shiftId", val || "")}
              menuProps={{ placement: "bottom" }}
              key={initialData?._id ? `shift-${initialData._id}` : shifts.length}
            >
              <Option value="">Sin jornada</Option>
              {shifts.map((shift) => (
                <Option key={shift._id} value={shift._id}>
                  {shift.name}
                </Option>
              ))}
            </Select>
          )}
        </>
      )}

      <Input
        color="purple"
        label="Teléfono"
        value={formData.phoneNumber}
        onChange={(e) => update("phoneNumber", e.target.value)}
        crossOrigin="anonymous"
      />

      {isTeacher && (
        <>
          <Input
            type="email"
            color="purple"
            label="Correo electrónico"
            value={formData.email}
            onChange={(e) => update("email", e.target.value)}
            crossOrigin="anonymous"
          />
          <Input
            type="password"
            color="purple"
            label={initialData ? "Nueva contraseña (opcional)" : "Contraseña"}
            value={formData.password}
            onChange={(e) => update("password", e.target.value)}
            crossOrigin="anonymous"
          />
        </>
      )}
    </div>
  );
}
