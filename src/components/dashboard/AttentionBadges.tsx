import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { 
  AlertTriangle, 
  Clock, 
  FileCheck, 
  UserPlus, 
  ChevronRight,
  CheckCircle2
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AttentionItem {
  id: string;
  type: "cierre" | "invitacion" | "estudio";
  title: string;
  subtitle: string;
  urgency: "alta" | "media" | "baja";
  data?: any;
}

interface AttentionBadgesProps {
  onItemClick?: (item: AttentionItem) => void;
}

export const AttentionBadges = ({ onItemClick }: AttentionBadgesProps) => {
  const [items, setItems] = useState<AttentionItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAttentionItems();
  }, []);

  const loadAttentionItems = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const attentionItems: AttentionItem[] = [];

      // 1. Solicitudes de cierre pendientes
      const { data: solicitudesCierre } = await supabase
        .from("vacantes")
        .select(`
          id,
          folio,
          titulo_puesto,
          fecha_solicitud_cierre,
          motivo_solicitud_cierre,
          perfil_reclutador:reclutador_asignado_id (nombre_reclutador)
        `)
        .eq("user_id", user.id)
        .eq("estatus", "abierta")
        .eq("solicitud_cierre", true);

      if (solicitudesCierre) {
        solicitudesCierre.forEach((v: any) => {
          attentionItems.push({
            id: v.id,
            type: "cierre",
            title: `${v.titulo_puesto}`,
            subtitle: `${v.folio} • ${v.perfil_reclutador?.nombre_reclutador || "Reclutador"}`,
            urgency: "alta",
            data: v
          });
        });
      }

      // 2. Invitaciones pendientes de respuesta
      const { data: userRole } = await supabase
        .from("user_roles")
        .select("empresa_id")
        .eq("user_id", user.id)
        .eq("role", "admin_empresa")
        .maybeSingle();

      if (userRole?.empresa_id) {
        const { data: invitaciones } = await supabase
          .from("invitaciones_reclutador")
          .select(`
            id,
            codigo_reclutador,
            created_at,
            tipo_vinculacion
          `)
          .eq("empresa_id", userRole.empresa_id)
          .eq("estado", "pendiente");

        if (invitaciones) {
          invitaciones.forEach((inv: any) => {
            attentionItems.push({
              id: inv.id,
              type: "invitacion",
              title: `Código: ${inv.codigo_reclutador}`,
              subtitle: `Tipo: ${inv.tipo_vinculacion}`,
              urgency: "media",
              data: inv
            });
          });
        }

        // 3. Estudios socioeconómicos entregados pendientes de revisión
        const { data: estudios } = await supabase
          .from("estudios_socioeconomicos")
          .select(`
            id,
            folio,
            nombre_candidato,
            vacante_puesto,
            fecha_entrega
          `)
          .eq("empresa_id", userRole.empresa_id)
          .eq("estatus", "entregado");

        if (estudios) {
          estudios.forEach((est: any) => {
            attentionItems.push({
              id: est.id,
              type: "estudio",
              title: `${est.nombre_candidato}`,
              subtitle: `${est.folio} • ${est.vacante_puesto}`,
              urgency: "media",
              data: est
            });
          });
        }
      }

      setItems(attentionItems);
    } catch (error) {
      console.error("Error loading attention items:", error);
    } finally {
      setLoading(false);
    }
  };

  const cierreItems = items.filter(i => i.type === "cierre");
  const invitacionItems = items.filter(i => i.type === "invitacion");
  const estudioItems = items.filter(i => i.type === "estudio");

  const renderCard = (
    title: string,
    icon: React.ReactNode,
    sectionItems: AttentionItem[],
    emptyColor: string,
    alertColor: string
  ) => {
    const isEmpty = sectionItems.length === 0;
    
    return (
      <Card className={cn(
        "transition-all",
        isEmpty 
          ? `border-dashed ${emptyColor}` 
          : alertColor
      )}>
        <CardHeader className="pb-2 pt-4">
          <CardTitle className="flex items-center justify-between text-sm font-medium">
            <div className="flex items-center gap-2">
              {icon}
              {title}
            </div>
            {!isEmpty && (
              <Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">
                {sectionItems.length}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-4">
          {loading ? (
            <div className="text-sm text-muted-foreground animate-pulse">Cargando...</div>
          ) : isEmpty ? (
            <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
              <CheckCircle2 className="h-4 w-4" />
              <span className="text-sm font-medium">Todo ok</span>
            </div>
          ) : (
            <div className="space-y-2">
              {sectionItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => onItemClick?.(item)}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-md bg-background/60 hover:bg-background border border-border/50 transition-all cursor-pointer text-left"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{item.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{item.subtitle}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-5 w-5 text-amber-600" />
        <h2 className="text-lg font-semibold">Lo que requiere mi atención ahora</h2>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {renderCard(
          "Solicitudes de Cierre",
          <Clock className="h-4 w-4 text-red-600" />,
          cierreItems,
          "border-green-300 dark:border-green-800 bg-green-50/50 dark:bg-green-950/20",
          "border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-950/20"
        )}
        {renderCard(
          "Invitaciones Pendientes",
          <UserPlus className="h-4 w-4 text-amber-600" />,
          invitacionItems,
          "border-green-300 dark:border-green-800 bg-green-50/50 dark:bg-green-950/20",
          "border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20"
        )}
        {renderCard(
          "Estudios Entregados",
          <FileCheck className="h-4 w-4 text-blue-600" />,
          estudioItems,
          "border-green-300 dark:border-green-800 bg-green-50/50 dark:bg-green-950/20",
          "border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20"
        )}
      </div>
    </div>
  );
};