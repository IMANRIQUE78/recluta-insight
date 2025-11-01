import { Check, Clock, Users, FileText, UserCheck, XCircle } from "lucide-react";

interface TimelineItem {
  etapa: string;
  fecha?: string;
  completado: boolean;
  actual: boolean;
}

interface PostulacionTimelineProps {
  etapaActual: string;
  estado: string;
}

const etapasOrden = ["recibida", "revision", "entrevista", "oferta", "contratada"];

const etapaIcons: Record<string, any> = {
  recibida: FileText,
  revision: Clock,
  entrevista: Users,
  oferta: UserCheck,
  contratada: Check,
  rechazada: XCircle,
};

const etapaLabels: Record<string, string> = {
  recibida: "Recibida",
  revision: "En Revisión",
  entrevista: "Entrevista",
  oferta: "Oferta",
  contratada: "Contratado",
  rechazada: "Rechazada",
};

export const PostulacionTimeline = ({ etapaActual, estado }: PostulacionTimelineProps) => {
  const isRechazada = estado === "rechazada";
  const currentIndex = etapasOrden.indexOf(etapaActual);

  const getTimelineItems = (): TimelineItem[] => {
    if (isRechazada) {
      return [{
        etapa: "rechazada",
        completado: true,
        actual: true,
      }];
    }

    return etapasOrden.map((etapa, index) => ({
      etapa,
      completado: index <= currentIndex,
      actual: index === currentIndex,
    }));
  };

  const items = getTimelineItems();

  return (
    <div className="py-4">
      <div className="relative">
        {/* Line */}
        {!isRechazada && (
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />
        )}

        {/* Timeline items */}
        <div className="space-y-6">
          {items.map((item, index) => {
            const Icon = etapaIcons[item.etapa];
            const isLast = index === items.length - 1;

            return (
              <div key={item.etapa} className="relative flex items-start gap-4">
                {/* Icon circle */}
                <div
                  className={`
                    relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2
                    ${
                      item.completado
                        ? item.etapa === "rechazada"
                          ? "border-destructive bg-destructive text-destructive-foreground"
                          : "border-primary bg-primary text-primary-foreground"
                        : "border-muted bg-background text-muted-foreground"
                    }
                    ${item.actual && !isRechazada ? "ring-4 ring-primary/20" : ""}
                  `}
                >
                  <Icon className="h-4 w-4" />
                </div>

                {/* Content */}
                <div className="flex-1 pt-0.5">
                  <div className="flex items-center gap-2">
                    <p
                      className={`font-medium ${
                        item.completado ? "text-foreground" : "text-muted-foreground"
                      }`}
                    >
                      {etapaLabels[item.etapa]}
                    </p>
                    {item.actual && !isRechazada && (
                      <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                        Actual
                      </span>
                    )}
                  </div>
                  {item.fecha && (
                    <p className="text-sm text-muted-foreground mt-1">{item.fecha}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};