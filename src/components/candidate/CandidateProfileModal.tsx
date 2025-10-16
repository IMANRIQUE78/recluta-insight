import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";

interface CandidateProfileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const nivelesEducacion = ["Secundaria", "Preparatoria", "Licenciatura", "Maestría", "Doctorado"];
const nivelesSeniority = ["junior", "mid", "senior", "lead"];
const modalidades = ["remoto", "presencial", "hibrido"];
const disponibilidad = ["inmediata", "2_semanas", "1_mes"];

export const CandidateProfileModal = ({ open, onOpenChange, onSuccess }: CandidateProfileModalProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nombre_completo: "",
    email: "",
    telefono: "",
    ubicacion: "",
    linkedin_url: "",
    github_url: "",
    portfolio_url: "",
    nivel_educacion: "",
    carrera: "",
    institucion: "",
    anos_experiencia: 0,
    puesto_actual: "",
    empresa_actual: "",
    nivel_seniority: "",
    habilidades_tecnicas: "",
    habilidades_blandas: "",
    idiomas: "",
    salario_esperado_min: 0,
    salario_esperado_max: 0,
    modalidad_preferida: "",
    disponibilidad: "",
    resumen_profesional: "",
  });

  useEffect(() => {
    if (open) {
      loadProfile();
    }
  }, [open]);

  const loadProfile = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data } = await supabase
      .from("perfil_candidato")
      .select("*")
      .eq("user_id", session.user.id)
      .maybeSingle();

    if (data) {
      setFormData({
        nombre_completo: data.nombre_completo || "",
        email: data.email || session.user.email || "",
        telefono: data.telefono || "",
        ubicacion: data.ubicacion || "",
        linkedin_url: data.linkedin_url || "",
        github_url: data.github_url || "",
        portfolio_url: data.portfolio_url || "",
        nivel_educacion: data.nivel_educacion || "",
        carrera: data.carrera || "",
        institucion: data.institucion || "",
        anos_experiencia: data.anos_experiencia || 0,
        puesto_actual: data.puesto_actual || "",
        empresa_actual: data.empresa_actual || "",
        nivel_seniority: data.nivel_seniority || "",
        habilidades_tecnicas: data.habilidades_tecnicas?.join(", ") || "",
        habilidades_blandas: data.habilidades_blandas?.join(", ") || "",
        idiomas: data.idiomas ? JSON.stringify(data.idiomas) : "",
        salario_esperado_min: data.salario_esperado_min || 0,
        salario_esperado_max: data.salario_esperado_max || 0,
        modalidad_preferida: data.modalidad_preferida || "",
        disponibilidad: data.disponibilidad || "",
        resumen_profesional: data.resumen_profesional || "",
      });
    } else {
      setFormData(prev => ({ ...prev, email: session.user.email || "" }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("No hay sesión activa");

      const profileData = {
        user_id: session.user.id,
        nombre_completo: formData.nombre_completo,
        email: formData.email,
        telefono: formData.telefono,
        ubicacion: formData.ubicacion,
        linkedin_url: formData.linkedin_url,
        github_url: formData.github_url,
        portfolio_url: formData.portfolio_url,
        nivel_educacion: formData.nivel_educacion,
        carrera: formData.carrera,
        institucion: formData.institucion,
        anos_experiencia: formData.anos_experiencia,
        puesto_actual: formData.puesto_actual,
        empresa_actual: formData.empresa_actual,
        nivel_seniority: formData.nivel_seniority,
        habilidades_tecnicas: formData.habilidades_tecnicas.split(",").map(h => h.trim()),
        habilidades_blandas: formData.habilidades_blandas.split(",").map(h => h.trim()),
        idiomas: formData.idiomas ? JSON.parse(formData.idiomas) : null,
        salario_esperado_min: formData.salario_esperado_min,
        salario_esperado_max: formData.salario_esperado_max,
        modalidad_preferida: formData.modalidad_preferida,
        disponibilidad: formData.disponibilidad,
        resumen_profesional: formData.resumen_profesional,
      };

      const { error } = await supabase
        .from("perfil_candidato")
        .upsert(profileData);

      if (error) throw error;

      toast({
        title: "Perfil guardado",
        description: "Tu perfil se ha actualizado correctamente",
      });

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Mi Perfil de Candidato</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Información Personal */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Información Personal</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="nombre_completo">Nombre Completo *</Label>
                <Input
                  id="nombre_completo"
                  required
                  value={formData.nombre_completo}
                  onChange={(e) => setFormData({ ...formData, nombre_completo: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="telefono">Teléfono</Label>
                <Input
                  id="telefono"
                  value={formData.telefono}
                  onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="ubicacion">Ubicación</Label>
                <Input
                  id="ubicacion"
                  value={formData.ubicacion}
                  onChange={(e) => setFormData({ ...formData, ubicacion: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Enlaces */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Enlaces Profesionales</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="linkedin_url">LinkedIn</Label>
                <Input
                  id="linkedin_url"
                  placeholder="https://linkedin.com/in/..."
                  value={formData.linkedin_url}
                  onChange={(e) => setFormData({ ...formData, linkedin_url: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="github_url">GitHub</Label>
                <Input
                  id="github_url"
                  placeholder="https://github.com/..."
                  value={formData.github_url}
                  onChange={(e) => setFormData({ ...formData, github_url: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="portfolio_url">Portfolio</Label>
                <Input
                  id="portfolio_url"
                  value={formData.portfolio_url}
                  onChange={(e) => setFormData({ ...formData, portfolio_url: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Educación */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Educación</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="nivel_educacion">Nivel</Label>
                <Select value={formData.nivel_educacion} onValueChange={(value) => setFormData({ ...formData, nivel_educacion: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent>
                    {nivelesEducacion.map((nivel) => (
                      <SelectItem key={nivel} value={nivel}>{nivel}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="carrera">Carrera</Label>
                <Input
                  id="carrera"
                  value={formData.carrera}
                  onChange={(e) => setFormData({ ...formData, carrera: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="institucion">Institución</Label>
                <Input
                  id="institucion"
                  value={formData.institucion}
                  onChange={(e) => setFormData({ ...formData, institucion: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Experiencia */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Experiencia Laboral</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="anos_experiencia">Años de Experiencia</Label>
                <Input
                  id="anos_experiencia"
                  type="number"
                  value={formData.anos_experiencia}
                  onChange={(e) => setFormData({ ...formData, anos_experiencia: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div>
                <Label htmlFor="nivel_seniority">Nivel de Seniority</Label>
                <Select value={formData.nivel_seniority} onValueChange={(value) => setFormData({ ...formData, nivel_seniority: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent>
                    {nivelesSeniority.map((nivel) => (
                      <SelectItem key={nivel} value={nivel}>{nivel}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="puesto_actual">Puesto Actual</Label>
                <Input
                  id="puesto_actual"
                  value={formData.puesto_actual}
                  onChange={(e) => setFormData({ ...formData, puesto_actual: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="empresa_actual">Empresa Actual</Label>
                <Input
                  id="empresa_actual"
                  value={formData.empresa_actual}
                  onChange={(e) => setFormData({ ...formData, empresa_actual: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Habilidades */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Habilidades</h3>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label htmlFor="habilidades_tecnicas">Habilidades Técnicas (separadas por coma)</Label>
                <Input
                  id="habilidades_tecnicas"
                  placeholder="React, TypeScript, Node.js"
                  value={formData.habilidades_tecnicas}
                  onChange={(e) => setFormData({ ...formData, habilidades_tecnicas: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="habilidades_blandas">Habilidades Blandas (separadas por coma)</Label>
                <Input
                  id="habilidades_blandas"
                  placeholder="Comunicación, Trabajo en equipo, Liderazgo"
                  value={formData.habilidades_blandas}
                  onChange={(e) => setFormData({ ...formData, habilidades_blandas: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Preferencias */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Preferencias Laborales</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="salario_esperado_min">Salario Mínimo Esperado</Label>
                <Input
                  id="salario_esperado_min"
                  type="number"
                  value={formData.salario_esperado_min}
                  onChange={(e) => setFormData({ ...formData, salario_esperado_min: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div>
                <Label htmlFor="salario_esperado_max">Salario Máximo Esperado</Label>
                <Input
                  id="salario_esperado_max"
                  type="number"
                  value={formData.salario_esperado_max}
                  onChange={(e) => setFormData({ ...formData, salario_esperado_max: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div>
                <Label htmlFor="modalidad_preferida">Modalidad Preferida</Label>
                <Select value={formData.modalidad_preferida} onValueChange={(value) => setFormData({ ...formData, modalidad_preferida: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent>
                    {modalidades.map((mod) => (
                      <SelectItem key={mod} value={mod}>{mod}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="disponibilidad">Disponibilidad</Label>
                <Select value={formData.disponibilidad} onValueChange={(value) => setFormData({ ...formData, disponibilidad: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent>
                    {disponibilidad.map((disp) => (
                      <SelectItem key={disp} value={disp}>{disp}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Resumen */}
          <div>
            <Label htmlFor="resumen_profesional">Resumen Profesional</Label>
            <Textarea
              id="resumen_profesional"
              rows={4}
              placeholder="Describe brevemente tu experiencia y objetivos profesionales..."
              value={formData.resumen_profesional}
              onChange={(e) => setFormData({ ...formData, resumen_profesional: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Guardar Perfil
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};