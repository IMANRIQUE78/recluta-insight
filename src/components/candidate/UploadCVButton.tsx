import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { FileUp, FileCheck, Loader2, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface UploadCVButtonProps {
  codigoCandidato: string;
  onUploadSuccess?: () => void;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
];

export function UploadCVButton({ codigoCandidato, onUploadSuccess }: UploadCVButtonProps) {
  const [uploading, setUploading] = useState(false);
  const [hasCV, setHasCV] = useState(false);
  const [cvFilename, setCvFilename] = useState<string | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Verificar si ya tiene CV al montar
  useState(() => {
    checkExistingCV();
  });

  async function checkExistingCV() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data } = await supabase
      .from("perfil_candidato")
      .select("cv_url, cv_filename")
      .eq("user_id", session.user.id)
      .maybeSingle();

    if (data?.cv_url) {
      setHasCV(true);
      setCvFilename(data.cv_filename);
    }
  }

  function handleButtonClick() {
    fileInputRef.current?.click();
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo de archivo
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast({
        title: "Tipo de archivo no permitido",
        description: "Solo se permiten archivos PDF o Word (.pdf, .doc, .docx)",
        variant: "destructive",
      });
      return;
    }

    // Validar tamaño
    if (file.size > MAX_FILE_SIZE) {
      toast({
        title: "Archivo demasiado grande",
        description: "El tamaño máximo permitido es 5MB",
        variant: "destructive",
      });
      return;
    }

    // Si ya tiene CV, pedir confirmación
    if (hasCV) {
      setPendingFile(file);
      setShowConfirmDialog(true);
    } else {
      await uploadFile(file);
    }

    // Limpiar input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  async function uploadFile(file: File) {
    setUploading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: "Error",
          description: "Debes iniciar sesión para subir tu CV",
          variant: "destructive",
        });
        return;
      }

      const userId = session.user.id;
      const fileExt = file.name.split(".").pop();
      const fileName = `${codigoCandidato}_CV.${fileExt}`;
      const filePath = `${userId}/${fileName}`;

      // Si ya existe un CV, eliminarlo primero
      if (hasCV) {
        const { data: existingFiles } = await supabase.storage
          .from("candidate-cvs")
          .list(userId);
        
        if (existingFiles && existingFiles.length > 0) {
          const filesToDelete = existingFiles.map(f => `${userId}/${f.name}`);
          await supabase.storage.from("candidate-cvs").remove(filesToDelete);
        }
      }

      // Subir el nuevo archivo
      const { error: uploadError } = await supabase.storage
        .from("candidate-cvs")
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
        throw uploadError;
      }

      // Obtener la URL del archivo
      const { data: urlData } = supabase.storage
        .from("candidate-cvs")
        .getPublicUrl(filePath);

      // Actualizar perfil con la URL del CV
      const { error: updateError } = await supabase
        .from("perfil_candidato")
        .update({
          cv_url: filePath,
          cv_filename: file.name,
        })
        .eq("user_id", userId);

      if (updateError) {
        throw updateError;
      }

      setHasCV(true);
      setCvFilename(file.name);

      toast({
        title: "CV subido exitosamente",
        description: `Tu CV "${file.name}" ha sido guardado`,
      });

      onUploadSuccess?.();
    } catch (error: any) {
      console.error("Error al subir CV:", error);
      toast({
        title: "Error al subir CV",
        description: error.message || "Ocurrió un error inesperado",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  }

  async function handleConfirmReplace() {
    setShowConfirmDialog(false);
    if (pendingFile) {
      await uploadFile(pendingFile);
      setPendingFile(null);
    }
  }

  function handleCancelReplace() {
    setShowConfirmDialog(false);
    setPendingFile(null);
  }

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        onChange={handleFileChange}
        className="hidden"
      />
      
      <Button
        onClick={handleButtonClick}
        disabled={uploading}
        variant={hasCV ? "outline" : "default"}
        className="gap-2"
      >
        {uploading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Subiendo...
          </>
        ) : hasCV ? (
          <>
            <FileCheck className="h-4 w-4" />
            <span className="hidden md:inline">CV Cargado</span>
            <span className="md:hidden">CV</span>
          </>
        ) : (
          <>
            <FileUp className="h-4 w-4" />
            <span className="hidden md:inline">Subir CV</span>
            <span className="md:hidden">CV</span>
          </>
        )}
      </Button>

      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reemplazar CV</DialogTitle>
            <DialogDescription>
              Ya tienes un CV guardado{cvFilename && `: "${cvFilename}"`}. 
              ¿Deseas reemplazarlo con el nuevo archivo?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={handleCancelReplace}>
              Cancelar
            </Button>
            <Button onClick={handleConfirmReplace}>
              Reemplazar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
