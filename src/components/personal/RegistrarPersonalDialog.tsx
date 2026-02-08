import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { User, Briefcase, MapPin, Phone, Mail, CreditCard, GraduationCap, HeartPulse, DollarSign, Crown } from "lucide-react";

interface RegistrarPersonalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  empresaId: string;
  onSuccess: () => void;
}

const ESCOLARIDAD_OPTIONS = [
  "Primaria",
  "Secundaria",
  "Preparatoria/Bachillerato",
  "Carrera Técnica",
  "Licenciatura",
  "Maestría",
  "Doctorado",
  "Otro"
];

const ESTADO_CIVIL_OPTIONS = [
  "Soltero/a",
  "Casado/a",
  "Divorciado/a",
  "Viudo/a",
  "Unión Libre"
];

const GENERO_OPTIONS = [
  "Masculino",
  "Femenino",
  "No binario",
  "Prefiero no decir"
];

interface Supervisor {
  id: string;
  nombre_completo: string;
}

export const RegistrarPersonalDialog = ({
  open,
  onOpenChange,
  empresaId,
  onSuccess,
}: RegistrarPersonalDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [supervisores, setSupervisores] = useState<Supervisor[]>([]);
  const [formData, setFormData] = useState({
    nombre_completo: "",
    genero: "",
    puesto: "",
    area: "",
    jefe_directo: "",
    fecha_nacimiento: "",
    fecha_ingreso: "",
    domicilio: "",
    colonia: "",
    alcaldia_municipio: "",
    codigo_postal: "",
    telefono_movil: "",
    telefono_emergencia: "",
    estado_civil: "",
    email_personal: "",
    email_corporativo: "",
    nss: "",
    cuenta_bancaria: "",
    curp: "",
    rfc: "",
    escolaridad: "",
    enfermedades_alergias: "",
    reclutador_asignado: "",
    sueldo_asignado: "",
    observaciones: "",
    es_supervisor: false,
    // Campos NOM-035
    centro_trabajo: "",
    tipo_jornada: "completa",
    modalidad_contratacion: "indefinido",
    fecha_fin_contrato: "",
  });

  // Cargar supervisores al abrir el dialog
  useEffect(() => {
    if (open && empresaId) {
      loadSupervisores();
    }
  }, [open, empresaId]);

  const loadSupervisores = async () => {
    try {
      const { data, error } = await supabase
        .from("personal_empresa")
        .select("id, nombre_completo")
        .eq("empresa_id", empresaId)
        .eq("es_supervisor", true)
        .eq("estatus", "activo")
        .order("nombre_completo", { ascending: true });

      if (error) {
        console.error("Error loading supervisores:", error);
        throw error;
      }
      
      console.log("Supervisores cargados:", data);
      setSupervisores(data || []);
    } catch (error) {
      console.error("Error loading supervisores:", error);
      setSupervisores([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nombre_completo.trim()) {
      toast.error("El nombre es obligatorio");
      return;
    }

    setLoading(true);
    try {
      const insertData = {
        empresa_id: empresaId,
        nombre_completo: formData.nombre_completo.trim(),
        genero: formData.genero || null,
        puesto: formData.puesto || null,
        area: formData.area || null,
        jefe_directo: formData.jefe_directo || null,
        fecha_nacimiento: formData.fecha_nacimiento || null,
        fecha_ingreso: formData.fecha_ingreso || null,
        domicilio: formData.domicilio || null,
        colonia: formData.colonia || null,
        alcaldia_municipio: formData.alcaldia_municipio || null,
        codigo_postal: formData.codigo_postal || null,
        telefono_movil: formData.telefono_movil || null,
        telefono_emergencia: formData.telefono_emergencia || null,
        estado_civil: formData.estado_civil || null,
        email_personal: formData.email_personal || null,
        email_corporativo: formData.email_corporativo || null,
        nss: formData.nss || null,
        cuenta_bancaria: formData.cuenta_bancaria || null,
        curp: formData.curp?.toUpperCase() || null,
        rfc: formData.rfc?.toUpperCase() || null,
        escolaridad: formData.escolaridad || null,
        enfermedades_alergias: formData.enfermedades_alergias || null,
        reclutador_asignado: formData.reclutador_asignado || null,
        sueldo_asignado: formData.sueldo_asignado ? parseFloat(formData.sueldo_asignado) : null,
        observaciones: formData.observaciones || null,
        estatus: "activo",
        es_supervisor: formData.es_supervisor,
        codigo_empleado: "", // Will be auto-generated by database trigger
        // Campos NOM-035
        centro_trabajo: formData.centro_trabajo || null,
        tipo_jornada: formData.tipo_jornada || null,
        modalidad_contratacion: formData.modalidad_contratacion || null,
        fecha_fin_contrato: (formData.modalidad_contratacion === "temporal" || formData.modalidad_contratacion === "obra_determinada") && formData.fecha_fin_contrato ? formData.fecha_fin_contrato : null,
      };
      
      const { error } = await supabase
        .from("personal_empresa")
        .insert(insertData);


      if (error) throw error;

      toast.success("Empleado registrado exitosamente");
      onSuccess();
      onOpenChange(false);
      
      // Reset form
      setFormData({
        nombre_completo: "",
        genero: "",
        puesto: "",
        area: "",
        jefe_directo: "",
        fecha_nacimiento: "",
        fecha_ingreso: "",
        domicilio: "",
        colonia: "",
        alcaldia_municipio: "",
        codigo_postal: "",
        telefono_movil: "",
        telefono_emergencia: "",
        estado_civil: "",
        email_personal: "",
        email_corporativo: "",
        nss: "",
        cuenta_bancaria: "",
        curp: "",
        rfc: "",
        escolaridad: "",
        enfermedades_alergias: "",
        reclutador_asignado: "",
        sueldo_asignado: "",
        observaciones: "",
        es_supervisor: false,
        centro_trabajo: "",
        tipo_jornada: "completa",
        modalidad_contratacion: "indefinido",
        fecha_fin_contrato: "",
      });
    } catch (error: any) {
      console.error("Error registering employee:", error);
      toast.error("Error al registrar el empleado");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Registrar Nuevo Empleado
          </DialogTitle>
          <DialogDescription>
            Completa la información del empleado. Los datos sensibles serán encriptados automáticamente.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[70vh] pr-4">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Datos Personales */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-primary">
                <User className="h-4 w-4" />
                Datos Personales
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="nombre_completo">Nombre Completo *</Label>
                  <Input
                    id="nombre_completo"
                    value={formData.nombre_completo}
                    onChange={(e) => setFormData({ ...formData, nombre_completo: e.target.value })}
                    placeholder="Nombre completo del empleado"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="genero">Género</Label>
                  <Select value={formData.genero} onValueChange={(v) => setFormData({ ...formData, genero: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar género" />
                    </SelectTrigger>
                    <SelectContent>
                      {GENERO_OPTIONS.map(g => (
                        <SelectItem key={g} value={g}>{g}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fecha_nacimiento">Fecha de Nacimiento</Label>
                  <Input
                    id="fecha_nacimiento"
                    type="date"
                    value={formData.fecha_nacimiento}
                    onChange={(e) => setFormData({ ...formData, fecha_nacimiento: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="estado_civil">Estado Civil</Label>
                  <Select value={formData.estado_civil} onValueChange={(v) => setFormData({ ...formData, estado_civil: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar estado civil" />
                    </SelectTrigger>
                    <SelectContent>
                      {ESTADO_CIVIL_OPTIONS.map(e => (
                        <SelectItem key={e} value={e}>{e}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <Separator />

            {/* Datos Laborales */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-primary">
                <Briefcase className="h-4 w-4" />
                Datos Laborales
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="puesto">Puesto</Label>
                  <Input
                    id="puesto"
                    value={formData.puesto}
                    onChange={(e) => setFormData({ ...formData, puesto: e.target.value })}
                    placeholder="Puesto del empleado"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="area">Área</Label>
                  <Input
                    id="area"
                    value={formData.area}
                    onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                    placeholder="Área o departamento"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="jefe_directo">Jefe Directo</Label>
                  <Select 
                    value={formData.jefe_directo} 
                    onValueChange={(v) => setFormData({ ...formData, jefe_directo: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar supervisor" />
                    </SelectTrigger>
                    <SelectContent>
                      {supervisores.length === 0 ? (
                        <SelectItem value="sin_supervisor" disabled>
                          No hay supervisores registrados
                        </SelectItem>
                      ) : (
                        supervisores.map((sup) => (
                          <SelectItem key={sup.id} value={sup.nombre_completo}>
                            <div className="flex items-center gap-2">
                              <Crown className="h-3 w-3 text-amber-500" />
                              {sup.nombre_completo}
                            </div>
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fecha_ingreso">Fecha de Ingreso</Label>
                  <Input
                    id="fecha_ingreso"
                    type="date"
                    value={formData.fecha_ingreso}
                    onChange={(e) => setFormData({ ...formData, fecha_ingreso: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reclutador_asignado">Reclutador Asignado</Label>
                  <Input
                    id="reclutador_asignado"
                    value={formData.reclutador_asignado}
                    onChange={(e) => setFormData({ ...formData, reclutador_asignado: e.target.value })}
                    placeholder="Nombre del reclutador"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sueldo_asignado">Sueldo Asignado</Label>
                  <Input
                    id="sueldo_asignado"
                    type="number"
                    step="0.01"
                    value={formData.sueldo_asignado}
                    onChange={(e) => setFormData({ ...formData, sueldo_asignado: e.target.value })}
                    placeholder="$0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="centro_trabajo">Centro de Trabajo</Label>
                  <Input
                    id="centro_trabajo"
                    value={formData.centro_trabajo}
                    onChange={(e) => setFormData({ ...formData, centro_trabajo: e.target.value })}
                    placeholder="Ej: Oficinas Corporativas CDMX"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="tipo_jornada">Tipo de Jornada</Label>
                  <Select
                    value={formData.tipo_jornada}
                    onValueChange={(value) => setFormData({ ...formData, tipo_jornada: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar jornada" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="completa">Jornada Completa</SelectItem>
                      <SelectItem value="parcial">Jornada Parcial</SelectItem>
                      <SelectItem value="nocturna">Jornada Nocturna</SelectItem>
                      <SelectItem value="mixta">Jornada Mixta</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="modalidad_contratacion">Modalidad de Contratación</Label>
                  <Select
                    value={formData.modalidad_contratacion}
                    onValueChange={(value) => setFormData({ ...formData, modalidad_contratacion: value, fecha_fin_contrato: value === "indefinido" || value === "capacitacion" ? "" : formData.fecha_fin_contrato })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar modalidad" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="indefinido">Contrato Indefinido</SelectItem>
                      <SelectItem value="temporal">Contrato Temporal</SelectItem>
                      <SelectItem value="obra_determinada">Obra Determinada</SelectItem>
                      <SelectItem value="capacitacion">Capacitación Inicial</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Fecha fin de contrato - solo para temporal u obra determinada */}
              {(formData.modalidad_contratacion === "temporal" || formData.modalidad_contratacion === "obra_determinada") && (
                <div className="space-y-2 p-3 rounded-lg border border-orange-200 dark:border-orange-800 bg-orange-50/50 dark:bg-orange-950/20">
                  <Label htmlFor="fecha_fin_contrato" className="flex items-center gap-2">
                    <span className="text-orange-600">📅</span>
                    Fecha de Término de Contrato
                  </Label>
                  <Input
                    id="fecha_fin_contrato"
                    type="date"
                    value={formData.fecha_fin_contrato}
                    onChange={(e) => setFormData({ ...formData, fecha_fin_contrato: e.target.value })}
                    className="bg-white dark:bg-background"
                  />
                  <p className="text-xs text-muted-foreground">
                    Fecha en que finaliza el contrato temporal. Recibirás alertas antes del vencimiento.
                  </p>
                </div>
              )}

              {/* Checkbox de Supervisor */}
              <div className="flex items-center space-x-3 p-3 rounded-lg border bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800">
                <Checkbox
                  id="es_supervisor"
                  checked={formData.es_supervisor}
                  onCheckedChange={(checked) => setFormData({ ...formData, es_supervisor: checked === true })}
                />
                <div className="flex-1">
                  <Label htmlFor="es_supervisor" className="flex items-center gap-2 cursor-pointer">
                    <Crown className="h-4 w-4 text-amber-500" />
                    Este trabajador es supervisor
                  </Label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Los supervisores aparecerán en la lista de "Jefe Directo" al registrar otros trabajadores
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Dirección */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-primary">
                <MapPin className="h-4 w-4" />
                Dirección
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="domicilio">Domicilio</Label>
                  <Input
                    id="domicilio"
                    value={formData.domicilio}
                    onChange={(e) => setFormData({ ...formData, domicilio: e.target.value })}
                    placeholder="Calle, número, interior"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="colonia">Colonia</Label>
                  <Input
                    id="colonia"
                    value={formData.colonia}
                    onChange={(e) => setFormData({ ...formData, colonia: e.target.value })}
                    placeholder="Colonia"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="alcaldia_municipio">Alcaldía/Municipio</Label>
                  <Input
                    id="alcaldia_municipio"
                    value={formData.alcaldia_municipio}
                    onChange={(e) => setFormData({ ...formData, alcaldia_municipio: e.target.value })}
                    placeholder="Alcaldía o Municipio"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="codigo_postal">Código Postal</Label>
                  <Input
                    id="codigo_postal"
                    value={formData.codigo_postal}
                    onChange={(e) => setFormData({ ...formData, codigo_postal: e.target.value.replace(/\D/g, '').slice(0, 5) })}
                    placeholder="00000"
                    maxLength={5}
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Contacto */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-primary">
                <Phone className="h-4 w-4" />
                Contacto
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="telefono_movil">Teléfono Móvil</Label>
                  <Input
                    id="telefono_movil"
                    value={formData.telefono_movil}
                    onChange={(e) => setFormData({ ...formData, telefono_movil: e.target.value })}
                    placeholder="10 dígitos"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="telefono_emergencia">Teléfono de Emergencia</Label>
                  <Input
                    id="telefono_emergencia"
                    value={formData.telefono_emergencia}
                    onChange={(e) => setFormData({ ...formData, telefono_emergencia: e.target.value })}
                    placeholder="Contacto de emergencia"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email_personal">Email Personal</Label>
                  <Input
                    id="email_personal"
                    type="email"
                    value={formData.email_personal}
                    onChange={(e) => setFormData({ ...formData, email_personal: e.target.value })}
                    placeholder="correo@personal.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email_corporativo">Email Corporativo</Label>
                  <Input
                    id="email_corporativo"
                    type="email"
                    value={formData.email_corporativo}
                    onChange={(e) => setFormData({ ...formData, email_corporativo: e.target.value })}
                    placeholder="correo@empresa.com"
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Datos Fiscales/Bancarios */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-primary">
                <CreditCard className="h-4 w-4" />
                Datos Fiscales y Bancarios (Encriptados)
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="nss">NSS (Número de Seguro Social)</Label>
                  <Input
                    id="nss"
                    value={formData.nss}
                    onChange={(e) => setFormData({ ...formData, nss: e.target.value })}
                    placeholder="11 dígitos"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cuenta_bancaria">Cuenta o Tarjeta Bancaria</Label>
                  <Input
                    id="cuenta_bancaria"
                    value={formData.cuenta_bancaria}
                    onChange={(e) => setFormData({ ...formData, cuenta_bancaria: e.target.value })}
                    placeholder="CLABE o número de tarjeta"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="curp">CURP</Label>
                  <Input
                    id="curp"
                    value={formData.curp}
                    onChange={(e) => setFormData({ ...formData, curp: e.target.value.toUpperCase() })}
                    placeholder="18 caracteres"
                    maxLength={18}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rfc">RFC</Label>
                  <Input
                    id="rfc"
                    value={formData.rfc}
                    onChange={(e) => setFormData({ ...formData, rfc: e.target.value.toUpperCase() })}
                    placeholder="13 caracteres"
                    maxLength={13}
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Educación y Salud */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-primary">
                <GraduationCap className="h-4 w-4" />
                Educación y Salud
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="escolaridad">Escolaridad</Label>
                  <Select value={formData.escolaridad} onValueChange={(v) => setFormData({ ...formData, escolaridad: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar escolaridad" />
                    </SelectTrigger>
                    <SelectContent>
                      {ESCOLARIDAD_OPTIONS.map(e => (
                        <SelectItem key={e} value={e}>{e}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="enfermedades_alergias">Enfermedades o Alergias</Label>
                  <Input
                    id="enfermedades_alergias"
                    value={formData.enfermedades_alergias}
                    onChange={(e) => setFormData({ ...formData, enfermedades_alergias: e.target.value })}
                    placeholder="Condiciones médicas importantes"
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Observaciones */}
            <div className="space-y-2">
              <Label htmlFor="observaciones">Observaciones</Label>
              <Textarea
                id="observaciones"
                value={formData.observaciones}
                onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                placeholder="Notas adicionales sobre el empleado"
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Registrando..." : "Registrar Empleado"}
              </Button>
            </div>
          </form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
