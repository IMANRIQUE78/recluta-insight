import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { FileUp, FileCheck, Loader2, Trash2, Eye, Pencil, Download, X } from "lucide-react";
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
  const [deleting, setDeleting] = useState(false);
  const [hasCV, setHasCV] = useState(false);
  const [cvFilename, setCvFilename] = useState<string | null>(null);
  const [cvPath, setCvPath] = useState<string | null>(null);
  const [cvUrl, setCvUrl] = useState<string | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    checkExistingCV();
  }, []);

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
      setCvPath(data.cv_url);
      
      // Generar URL firmada para visualización
      const { data: signedUrlData } = await supabase.storage
        .from("candidate-cvs")
        .createSignedUrl(data.cv_url, 3600); // 1 hora
      
      if (signedUrlData?.signedUrl) {
        setCvUrl(signedUrlData.signedUrl);
      }
    }
  }

  function handleButtonClick() {
    if (hasCV) {
      // Si ya tiene CV, abrir modal de visualización
      setShowViewDialog(true);
    } else {
      // Si no tiene CV, abrir selector de archivo
      fileInputRef.current?.click();
    }
  }

  function handleEditClick() {
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

      // Generar URL firmada para visualización
      const { data: signedUrlData } = await supabase.storage
        .from("candidate-cvs")
        .createSignedUrl(filePath, 3600);

      setHasCV(true);
      setCvFilename(file.name);
      setCvPath(filePath);
      if (signedUrlData?.signedUrl) {
        setCvUrl(signedUrlData.signedUrl);
      }

      toast({
        title: "CV subido exitosamente",
        description: `Tu CV "${file.name}" ha sido guardado`,
      });

      setShowViewDialog(false);
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

  async function handleDeleteCV() {
    setDeleting(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const userId = session.user.id;

      // Eliminar archivo del storage
      if (cvPath) {
        await supabase.storage.from("candidate-cvs").remove([cvPath]);
      }

      // Limpiar referencia en la base de datos
      const { error: updateError } = await supabase
        .from("perfil_candidato")
        .update({
          cv_url: null,
          cv_filename: null,
        })
        .eq("user_id", userId);

      if (updateError) {
        throw updateError;
      }

      setHasCV(false);
      setCvFilename(null);
      setCvPath(null);
      setCvUrl(null);
      setShowDeleteDialog(false);
      setShowViewDialog(false);

      toast({
        title: "CV eliminado",
        description: "Tu CV ha sido eliminado correctamente",
      });
    } catch (error: any) {
      console.error("Error al eliminar CV:", error);
      toast({
        title: "Error al eliminar CV",
        description: error.message || "Ocurrió un error inesperado",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  }

  async function handleDownloadCV() {
    if (!cvPath) return;

    const { data, error } = await supabase.storage
      .from("candidate-cvs")
      .download(cvPath);

    if (error) {
      toast({
        title: "Error al descargar",
        description: "No se pudo descargar el archivo",
        variant: "destructive",
      });
      return;
    }

    // Crear enlace de descarga
    const url = URL.createObjectURL(data);
    const a = document.createElement("a");
    a.href = url;
    a.download = cvFilename || "CV.pdf";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function handleConfirmReplace() {
    setShowConfirmDialog(false);
    if (pendingFile) {
      uploadFile(pendingFile);
      setPendingFile(null);
    }
  }

  function handleCancelReplace() {
    setShowConfirmDialog(false);
    setPendingFile(null);
  }

  const isPDF = cvFilename?.toLowerCase().endsWith(".pdf");

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

      {/* Modal de visualización del CV */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileCheck className="h-5 w-5 text-primary" />
              Mi CV
            </DialogTitle>
            <DialogDescription>
              {cvFilename && (
                <span className="font-medium text-foreground">{cvFilename}</span>
              )}
            </DialogDescription>
          </DialogHeader>

          {/* Visor del documento */}
          <div className="flex-1 min-h-[400px] bg-muted rounded-lg overflow-hidden">
            {isPDF && cvUrl ? (
              <iframe
                src={cvUrl}
                className="w-full h-full min-h-[400px]"
                title="Vista previa del CV"
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center p-6">
                <FileCheck className="h-16 w-16 text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-2">
                  Vista previa no disponible para archivos Word
                </p>
                <p className="text-sm text-muted-foreground">
                  Descarga el archivo para visualizarlo
                </p>
              </div>
            )}
          </div>

          {/* Acciones */}
          <DialogFooter className="flex-row justify-between sm:justify-between gap-2 pt-4">
            <Button
              variant="destructive"
              onClick={() => setShowDeleteDialog(true)}
              disabled={deleting}
              className="gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Eliminar
            </Button>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleDownloadCV}
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                Descargar
              </Button>
              <Button
                onClick={handleEditClick}
                disabled={uploading}
                className="gap-2"
              >
                {uploading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Pencil className="h-4 w-4" />
                )}
                Actualizar
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo de confirmación para reemplazar */}
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

      {/* Diálogo de confirmación para eliminar */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar CV</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar tu CV? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancelar
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteCV}
              disabled={deleting}
            >
              {deleting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Eliminando...
                </>
              ) : (
                "Eliminar"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
