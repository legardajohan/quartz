import { useCallback, useRef, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";
import { Dialog, DialogBody, DialogFooter, DialogHeader, Typography, Button } from "@material-tailwind/react";
import { CameraIcon } from "@heroicons/react/24/solid";
import toast from "react-hot-toast";
import { ACCEPTED_IMAGE_LABEL, ACCEPTED_IMAGE_TYPES, cropToWebp, isPng } from "../../utils/imageToWebp";

export interface ImageCropUploaderProps {
  currentUrl?: string;
  label: string;
  onUpload: (blob: Blob) => Promise<void>;
  isUploading?: boolean;
  shape?: "circle" | "square";
  size?: "sm" | "lg" | "xl";
}

export function ImageCropUploader({
  currentUrl,
  label,
  onUpload,
  isUploading = false,
  shape = "circle",
  size = "sm",
}: ImageCropUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const isOpen = Boolean(objectUrl);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      toast.error(`Formato no permitido. Formatos aceptados: ${ACCEPTED_IMAGE_LABEL}.`);
      return;
    }

    setSelectedFile(file);
    setObjectUrl(URL.createObjectURL(file));
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
  };

  const closeDialog = useCallback(() => {
    if (isProcessing) return;
    setObjectUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setSelectedFile(null);
  }, [isProcessing]);

  const handleCropComplete = useCallback((_croppedArea: Area, areaPixels: Area) => {
    setCroppedAreaPixels(areaPixels);
  }, []);

  const handleConfirm = async () => {
    if (!objectUrl || !croppedAreaPixels || !selectedFile) return;
    setIsProcessing(true);
    try {
      const blob = await cropToWebp(objectUrl, croppedAreaPixels, { whiteBg: isPng(selectedFile) });
      await onUpload(blob);
      closeDialog();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo subir la imagen. Intenta nuevamente.");
    } finally {
      setIsProcessing(false);
    }
  };

  const dimensions = size === "xl" ? "h-32 w-32" : size === "lg" ? "h-24 w-24" : "h-12 w-12";
  const placeholderIconSize = size === "xl" ? "h-10 w-10" : "h-6 w-6";
  const hoverIconSize = size === "xl" ? "h-8 w-8" : "h-5 w-5";
  const roundedClass = shape === "circle" ? "rounded-full" : "rounded-xl";
  const imagePadding = shape === "square" ? "p-2" : "";

  return (
    <>
      <div className="relative inline-block group">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className={`relative ${dimensions} ${roundedClass} ${imagePadding} overflow-hidden border border-gray-200 bg-gray-50 transition-transform duration-150 active:scale-[0.97]`}
          aria-label={label}
        >
          {currentUrl ? (
            <img src={currentUrl} alt={label} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-gray-300">
              <CameraIcon className={placeholderIconSize} />
            </div>
          )}
          <span className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-opacity duration-150 group-hover:bg-black/40 group-hover:opacity-100">
            <CameraIcon className={`${hoverIconSize} text-white`} />
          </span>
        </button>
        <input
          ref={inputRef}
          type="file"
          accept=".jpg,.jpeg,.png,.webp,image/*"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      <Dialog open={isOpen} handler={closeDialog} size="sm" dismiss={{ enabled: !isProcessing }}>
        <DialogHeader>
          <Typography variant="h5" className="text-purple-900">
            {label}
          </Typography>
        </DialogHeader>
        <DialogBody className="space-y-4">
          <div className="relative h-72 w-full overflow-hidden rounded-xl bg-gray-900">
            {objectUrl && (
              <Cropper
                image={objectUrl}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape={shape === "circle" ? "round" : "rect"}
                showGrid={false}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={handleCropComplete}
              />
            )}
          </div>
          <div className="flex items-center gap-3">
            <Typography variant="small" className="shrink-0 text-gray-500">
              Zoom
            </Typography>
            <input
              type="range"
              min={1}
              max={3}
              step={0.01}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="w-full accent-purple-600"
            />
          </div>
          <Typography variant="small" className="text-xs text-gray-400">
            Formatos aceptados: {ACCEPTED_IMAGE_LABEL}. Se recorta en cuadrado y se optimiza automáticamente.
          </Typography>
        </DialogBody>
        <DialogFooter>
          <Button
            variant="text"
            color="blue-gray"
            onClick={closeDialog}
            disabled={isProcessing}
            className="mr-1 transition-transform duration-150 active:scale-[0.97]"
          >
            Cancelar
          </Button>
          <Button
            variant="gradient"
            color="purple"
            onClick={handleConfirm}
            disabled={isProcessing || isUploading || !croppedAreaPixels}
            className="transition-transform duration-150 active:scale-[0.97]"
          >
            {isProcessing || isUploading ? "Guardando..." : "Guardar"}
          </Button>
        </DialogFooter>
      </Dialog>
    </>
  );
}
