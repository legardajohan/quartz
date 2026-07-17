import { useEffect } from "react";
import { Typography } from "@material-tailwind/react";
import toast from "react-hot-toast";

import { useInstitutionStore } from "../useInstitutionStore";
import { ImageCropUploader } from "../../../components/common/ImageCropUploader";

export function InstitutionShieldPanel() {
  const { institution, isSubmitting, fetchInstitution, uploadShield } = useInstitutionStore();

  useEffect(() => {
    fetchInstitution();
  }, [fetchInstitution]);

  const handleUpload = async (blob: Blob) => {
    const promise = uploadShield(blob);
    toast.promise(promise, {
      loading: "Subiendo escudo...",
      success: <b>Escudo actualizado con éxito</b>,
      error: (err) => <b>{err.toString()}</b>,
    });
    await promise;
  };

  return (
    <div className="w-full max-w-xl space-y-6">
      <div>
        <Typography variant="h6" color="blue-gray" className="font-bold">
          Escudo institucional
        </Typography>
        <Typography variant="small" className="text-gray-500">
          Aparece en los informes generados para tu institución.
        </Typography>
      </div>

      <div className="flex items-center gap-4 rounded-xl border border-gray-200 p-4">
        <ImageCropUploader
          currentUrl={institution?.shieldUrl}
          label="Escudo institucional"
          onUpload={handleUpload}
          isUploading={isSubmitting}
          shape="square"
          size="lg"
        />
        <div>
          <Typography variant="small" color="blue-gray" className="font-medium">
            {institution?.shieldUrl ? "Escudo cargado" : "Sin escudo"}
          </Typography>
          <Typography variant="small" className="text-xs text-gray-400">
            Haz clic sobre la imagen para {institution?.shieldUrl ? "reemplazarla" : "cargarla"}.
          </Typography>
        </div>
      </div>
    </div>
  );
}
