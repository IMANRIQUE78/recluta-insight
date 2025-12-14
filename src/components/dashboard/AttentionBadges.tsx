import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { 
  AlertTriangle, 
  Clock, 
  FileCheck, 
  UserPlus, 
  ChevronRight,
  Bell
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
            title: `Cierre solicitado: ${v.titulo_puesto}`,
            subtitle: `${v.folio} • Por ${v.perfil_reclutador?.nombre_reclutador || "Reclutador"}`,
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
              title: `Invitación pendiente`,
              subtitle: `Código: ${inv.codigo_reclutador} • ${inv.tipo_vinculacion}`,
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
              title: `Estudio entregado: ${est.nombre_candidato}`,
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

  const getIcon = (type: AttentionItem["type"]) => {
    switch (type) {
      case "cierre":
        return <Clock className="h-4 w-4" />;
      case "invitacion":
        return <UserPlus className="h-4 w-4" />;
      case "estudio":
        return <FileCheck className="h-4 w-4" />;
    }
  };

  const getUrgencyStyles = (urgency: AttentionItem["urgency"]) => {
    switch (urgency) {
      case "alta":
        return "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-950/50";
      case "media":
        return "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 hover:bg-amber-100 dark:hover:bg-amber-950/50";
      case "baja":
        return "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-950/50";
    }
  };

  const getIconStyles = (urgency: AttentionItem["urgency"]) => {
    switch (urgency) {
      case "alta":
        return "text-red-600 dark:text-red-400";
      case "media":
        return "text-amber-600 dark:text-amber-400";
      case "baja":
        return "text-blue-600 dark:text-blue-400";
    }
  };

  if (loading) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Bell className="h-4 w-4 animate-pulse" />
            <span className="text-sm">Cargando alertas...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (items.length === 0) {
    return (
      <Card className="border-dashed border-green-300 dark:border-green-800 bg-green-50/50 dark:bg-green-950/20">
        <CardContent className="py-4">
          <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
            <Bell className="h-4 w-4" />
            <span className="text-sm font-medium">Sin pendientes - Todo está al día</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-amber-200 dark:border-amber-800 bg-gradient-to-r from-amber-50/50 to-orange-50/30 dark:from-amber-950/20 dark:to-orange-950/10">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            Lo que requiere mi atención ahora
            <Badge variant="secondary" className="ml-2 bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">
              {items.length}
            </Badge>
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex flex-wrap gap-2">
          {items.map((item) => (
            <button
              key={item.id}
              onClick={() => onItemClick?.(item)}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg border transition-all cursor-pointer text-left",
                getUrgencyStyles(item.urgency)
              )}
            >
              <div className={cn("shrink-0", getIconStyles(item.urgency))}>
                {getIcon(item.type)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{item.title}</p>
                <p className="text-xs text-muted-foreground truncate">{item.subtitle}</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};