import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Plus, Trash2, AlertCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";

interface CandidateProfileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface ExperienciaLaboral {
  empresa: string;
  puesto: string;
  fecha_inicio: string; // MMAAAA
  fecha_fin: string; // MMAAAA o "Actual"
  descripcion: string;
  tags: string;
}

interface Educacion {
  tipo: string; // Licenciatura, Maestría, Curso, Diplomado
  titulo: string;
  institucion: string;
  fecha_inicio: string;
  fecha_fin: string;
}

const nivelesSeniority = ["junior", "mid", "senior", "lead"];
const modalidades = ["remoto", "presencial", "hibrido"];
const disponibilidad = ["inmediata", "2_semanas", "1_mes"];
const tiposEducacion = ["Licenciatura", "Maestría", "Doctorado", "Curso", "Diplomado", "Certificación"];

const calcularDuracion = (inicio: string, fin: string): string => {
  if (!inicio) return "";
  if (fin.toLowerCase() === "actual" || !fin) return "Actual";
  
  const mesInicio = parseInt(inicio.substring(0, 2));
  const anioInicio = parseInt(inicio.substring(2));
  const mesFin = parseInt(fin.substring(0, 2));
  const anioFin = parseInt(fin.substring(2));
  
  const meses = (anioFin - anioInicio) * 12 + (mesFin - mesInicio);
  const anios = Math.floor(meses / 12);
  const mesesRestantes = meses % 12;
  
  if (anios === 0) return `${meses} ${meses === 1 ? 'mes' : 'meses'}`;
  if (mesesRestantes === 0) return `${anios} ${anios === 1 ? 'año' : 'años'}`;
  return `${anios} ${anios === 1 ? 'año' : 'años'} ${mesesRestantes} ${mesesRestantes === 1 ? 'mes' : 'meses'}`;
};

const calcularPorcentajeLlenado = (data: any): number => {
  let filled = 0;
  let total = 0;

  // Campos básicos (20 puntos)
  const basicFields = ['nombre_completo', 'email', 'telefono', 'ubicacion'];
  basicFields.forEach(field => {
    total += 5;
    if (data[field]) filled += 5;
  });

  // Experiencia laboral (30 puntos)
  total += 30;
  if (data.experiencia_laboral && data.experiencia_laboral.length >= 3) {
    filled += 30;
  } else if (data.experiencia_laboral && data.experiencia_laboral.length > 0) {
    filled += (data.experiencia_laboral.length / 3) * 30;
  }

  // Educación (20 puntos)
  total += 20;
  if (data.educacion && data.educacion.length >= 3) {
    filled += 20;
  } else if (data.educacion && data.educacion.length > 0) {
    filled += (data.educacion.length / 3) * 20;
  }

  // Habilidades (15 puntos)
  total += 15;
  if (data.habilidades_tecnicas && data.habilidades_tecnicas.length > 0) filled += 8;
  if (data.habilidades_blandas && data.habilidades_blandas.length > 0) filled += 7;

  // Resumen profesional (10 puntos)
  total += 10;
  if (data.resumen_profesional && data.resumen_profesional.length > 100) filled += 10;

  // Enlaces profesionales (5 puntos)
  total += 5;
  if (data.linkedin_url || data.github_url || data.portfolio_url) filled += 5;

  return Math.round((filled / total) * 100);
};

export const CandidateProfileModal = ({ open, onOpenChange, onSuccess }: CandidateProfileModalProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [porcentajeLlenado, setPorcentajeLlenado] = useState(0);
  
  const [formData, setFormData] = useState({
    nombre_completo: "",
    email: "",
    telefono: "",
    ubicacion: "",
    resumen_profesional: "",
    anos_experiencia: 0,
    nivel_seniority: "",
    habilidades_tecnicas: "",
    habilidades_blandas: "",
    salario_esperado_min: 0,
    salario_esperado_max: 0,
    modalidad_preferida: "",
    disponibilidad: "",
    linkedin_url: "",
    github_url: "",
    portfolio_url: "",
  });

  const [experiencias, setExperiencias] = useState<ExperienciaLaboral[]>([
    { empresa: "", puesto: "", fecha_inicio: "", fecha_fin: "", descripcion: "", tags: "" },
    { empresa: "", puesto: "", fecha_inicio: "", fecha_fin: "", descripcion: "", tags: "" },
    { empresa: "", puesto: "", fecha_inicio: "", fecha_fin: "", descripcion: "", tags: "" },
  ]);

  const [educaciones, setEducaciones] = useState<Educacion[]>([
    { tipo: "", titulo: "", institucion: "", fecha_inicio: "", fecha_fin: "" },
    { tipo: "", titulo: "", institucion: "", fecha_inicio: "", fecha_fin: "" },
    { tipo: "", titulo: "", institucion: "", fecha_inicio: "", fecha_fin: "" },
  ]);

  useEffect(() => {
    if (open) {
      loadProfile();
    }
  }, [open]);

  useEffect(() => {
    const profileData = {
      ...formData,
      experiencia_laboral: experiencias,
      educacion: educaciones,
    };
    setPorcentajeLlenado(calcularPorcentajeLlenado(profileData));
  }, [formData, experiencias, educaciones]);

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
        resumen_profesional: data.resumen_profesional || "",
        anos_experiencia: data.anos_experiencia || 0,
        nivel_seniority: data.nivel_seniority || "",
        habilidades_tecnicas: data.habilidades_tecnicas?.join(", ") || "",
        habilidades_blandas: data.habilidades_blandas?.join(", ") || "",
        salario_esperado_min: data.salario_esperado_min || 0,
        salario_esperado_max: data.salario_esperado_max || 0,
        modalidad_preferida: data.modalidad_preferida || "",
        disponibilidad: data.disponibilidad || "",
        linkedin_url: data.linkedin_url || "",
        github_url: data.github_url || "",
        portfolio_url: data.portfolio_url || "",
      });

      if (data.experiencia_laboral && Array.isArray(data.experiencia_laboral) && data.experiencia_laboral.length > 0) {
        setExperiencias(data.experiencia_laboral as unknown as ExperienciaLaboral[]);
      }

      if (data.educacion && Array.isArray(data.educacion) && data.educacion.length > 0) {
        setEducaciones(data.educacion as unknown as Educacion[]);
      }
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
        resumen_profesional: formData.resumen_profesional,
        anos_experiencia: formData.anos_experiencia,
        nivel_seniority: formData.nivel_seniority,
        habilidades_tecnicas: formData.habilidades_tecnicas.split(",").map(h => h.trim()).filter(h => h),
        habilidades_blandas: formData.habilidades_blandas.split(",").map(h => h.trim()).filter(h => h),
        salario_esperado_min: formData.salario_esperado_min,
        salario_esperado_max: formData.salario_esperado_max,
        modalidad_preferida: formData.modalidad_preferida,
        disponibilidad: formData.disponibilidad,
        linkedin_url: formData.linkedin_url,
        github_url: formData.github_url,
        portfolio_url: formData.portfolio_url,
        experiencia_laboral: experiencias.filter(exp => exp.empresa || exp.puesto),
        educacion: educaciones.filter(edu => edu.titulo || edu.institucion),
      };

      const { error } = await supabase
        .from("perfil_candidato")
        .upsert([profileData] as any);

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

  const agregarExperiencia = () => {
    setExperiencias([...experiencias, { empresa: "", puesto: "", fecha_inicio: "", fecha_fin: "", descripcion: "", tags: "" }]);
  };

  const eliminarExperiencia = (index: number) => {
    setExperiencias(experiencias.filter((_, i) => i !== index));
  };

  const actualizarExperiencia = (index: number, field: keyof ExperienciaLaboral, value: string) => {
    const nuevas = [...experiencias];
    nuevas[index] = { ...nuevas[index], [field]: value };
    setExperiencias(nuevas);
  };

  const agregarEducacion = () => {
    setEducaciones([...educaciones, { tipo: "", titulo: "", institucion: "", fecha_inicio: "", fecha_fin: "" }]);
  };

  const eliminarEducacion = (index: number) => {
    setEducaciones(educaciones.filter((_, i) => i !== index));
  };

  const actualizarEducacion = (index: number, field: keyof Educacion, value: string) => {
    const nuevas = [...educaciones];
    nuevas[index] = { ...nuevas[index], [field]: value };
    setEducaciones(nuevas);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Mi Perfil de Candidato</DialogTitle>
          <DialogDescription>
            No usamos documentos por cuestiones de espacio y eficiencia. El reclutador puede descargar tu perfil como PDF. No es necesario subir ningún documento.
          </DialogDescription>
        </DialogHeader>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Completitud del perfil</span>
            <span className="text-sm font-bold">{porcentajeLlenado}%</span>
          </div>
          <Progress value={porcentajeLlenado} className="h-2" />
        </div>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Un perfil completo aumenta tus posibilidades de ser seleccionado por los reclutadores.
          </AlertDescription>
        </Alert>

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
                  placeholder="Ciudad, País"
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Resumen Profesional */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Resumen Profesional</h3>
            <div>
              <Label htmlFor="resumen_profesional">Resumen</Label>
              <Textarea
                id="resumen_profesional"
                rows={4}
                placeholder="Describe brevemente tu experiencia y objetivos profesionales..."
                value={formData.resumen_profesional}
                onChange={(e) => setFormData({ ...formData, resumen_profesional: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="anos_experiencia">Años de Experiencia Total</Label>
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
            </div>
          </div>

          <Separator />

          {/* Experiencia Laboral */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-lg">Experiencia Laboral</h3>
              <Button type="button" variant="outline" size="sm" onClick={agregarExperiencia}>
                <Plus className="h-4 w-4 mr-1" /> Agregar
              </Button>
            </div>
            
            {experiencias.map((exp, index) => (
              <div key={index} className="border rounded-lg p-4 space-y-3 bg-muted/30">
                <div className="flex justify-between items-start">
                  <h4 className="font-medium text-sm">Experiencia #{index + 1}</h4>
                  {experiencias.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => eliminarExperiencia(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <Label>Empresa</Label>
                    <Input
                      value={exp.empresa}
                      onChange={(e) => actualizarExperiencia(index, 'empresa', e.target.value)}
                      placeholder="Nombre de la empresa"
                    />
                  </div>
                  <div>
                    <Label>Puesto</Label>
                    <Input
                      value={exp.puesto}
                      onChange={(e) => actualizarExperiencia(index, 'puesto', e.target.value)}
                      placeholder="Título del puesto"
                    />
                  </div>
                  <div>
                    <Label>Fecha Inicio (MMAAAA)</Label>
                    <Input
                      value={exp.fecha_inicio}
                      onChange={(e) => actualizarExperiencia(index, 'fecha_inicio', e.target.value)}
                      placeholder="012020"
                      maxLength={6}
                    />
                  </div>
                  <div>
                    <Label>Fecha Fin (MMAAAA o "Actual")</Label>
                    <Input
                      value={exp.fecha_fin}
                      onChange={(e) => actualizarExperiencia(index, 'fecha_fin', e.target.value)}
                      placeholder="122023 o Actual"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label>Duración (calculada automáticamente)</Label>
                    <Input
                      value={calcularDuracion(exp.fecha_inicio, exp.fecha_fin)}
                      disabled
                      className="bg-muted"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label>Descripción de la experiencia</Label>
                    <Textarea
                      value={exp.descripcion}
                      onChange={(e) => actualizarExperiencia(index, 'descripcion', e.target.value)}
                      placeholder="Describe tus logros y responsabilidades. Resalta palabras clave relevantes como tecnologías, herramientas y metodologías que dominaste."
                      rows={3}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      💡 Tip: Incluye logros cuantificables y palabras clave relevantes
                    </p>
                  </div>
                  <div className="md:col-span-2">
                    <Label>Etiquetas de habilidades</Label>
                    <Input
                      value={exp.tags}
                      onChange={(e) => actualizarExperiencia(index, 'tags', e.target.value)}
                      placeholder="#Python #SAP #LIDERAZGO #ASPEL #NOI #Scrum"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Usa # para separar cada habilidad o tecnología
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <Separator />

          {/* Educación */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-lg">Educación, Cursos y Certificaciones</h3>
              <Button type="button" variant="outline" size="sm" onClick={agregarEducacion}>
                <Plus className="h-4 w-4 mr-1" /> Agregar
              </Button>
            </div>
            
            {educaciones.map((edu, index) => (
              <div key={index} className="border rounded-lg p-4 space-y-3 bg-muted/30">
                <div className="flex justify-between items-start">
                  <h4 className="font-medium text-sm">Educación #{index + 1}</h4>
                  {educaciones.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => eliminarEducacion(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <Label>Tipo</Label>
                    <Select 
                      value={edu.tipo} 
                      onValueChange={(value) => actualizarEducacion(index, 'tipo', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        {tiposEducacion.map((tipo) => (
                          <SelectItem key={tipo} value={tipo}>{tipo}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Título / Nombre del curso</Label>
                    <Input
                      value={edu.titulo}
                      onChange={(e) => actualizarEducacion(index, 'titulo', e.target.value)}
                      placeholder="Ej: Ingeniería en Sistemas"
                    />
                  </div>
                  <div>
                    <Label>Institución</Label>
                    <Input
                      value={edu.institucion}
                      onChange={(e) => actualizarEducacion(index, 'institucion', e.target.value)}
                      placeholder="Nombre de la institución"
                    />
                  </div>
                  <div>
                    <Label>Periodo (MMAAAA - MMAAAA)</Label>
                    <div className="flex gap-2">
                      <Input
                        value={edu.fecha_inicio}
                        onChange={(e) => actualizarEducacion(index, 'fecha_inicio', e.target.value)}
                        placeholder="082015"
                        maxLength={6}
                      />
                      <span className="self-center">-</span>
                      <Input
                        value={edu.fecha_fin}
                        onChange={(e) => actualizarEducacion(index, 'fecha_fin', e.target.value)}
                        placeholder="052019"
                        maxLength={6}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <Separator />

          {/* Habilidades */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Habilidades</h3>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label htmlFor="habilidades_tecnicas">Habilidades Técnicas (separadas por coma)</Label>
                <Input
                  id="habilidades_tecnicas"
                  placeholder="React, TypeScript, Node.js, Python, SQL"
                  value={formData.habilidades_tecnicas}
                  onChange={(e) => setFormData({ ...formData, habilidades_tecnicas: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="habilidades_blandas">Habilidades Blandas (separadas por coma)</Label>
                <Input
                  id="habilidades_blandas"
                  placeholder="Comunicación, Trabajo en equipo, Liderazgo, Resolución de problemas"
                  value={formData.habilidades_blandas}
                  onChange={(e) => setFormData({ ...formData, habilidades_blandas: e.target.value })}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Preferencias Laborales */}
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
                  placeholder="0"
                />
              </div>
              <div>
                <Label htmlFor="salario_esperado_max">Salario Máximo Esperado</Label>
                <Input
                  id="salario_esperado_max"
                  type="number"
                  value={formData.salario_esperado_max}
                  onChange={(e) => setFormData({ ...formData, salario_esperado_max: parseFloat(e.target.value) || 0 })}
                  placeholder="0"
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

          <Separator />

          {/* Enlaces Profesionales */}
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
                  placeholder="https://..."
                  value={formData.portfolio_url}
                  onChange={(e) => setFormData({ ...formData, portfolio_url: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
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