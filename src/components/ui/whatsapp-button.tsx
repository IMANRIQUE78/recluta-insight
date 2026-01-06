import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { MessageCircle } from "lucide-react";

interface WhatsAppButtonProps {
  telefono: string | null | undefined;
  mensaje?: string;
  className?: string;
  variant?: "default" | "outline" | "ghost" | "secondary";
  size?: "default" | "sm" | "lg" | "icon";
  showText?: boolean;
  disabled?: boolean;
}

/**
 * Componente de botón Click-to-Chat para WhatsApp
 * Abre una conversación de WhatsApp en una nueva pestaña con un mensaje pre-llenado
 */
export const WhatsAppButton = ({
  telefono,
  mensaje = "",
  className,
  variant = "outline",
  size = "sm",
  showText = true,
  disabled = false,
}: WhatsAppButtonProps) => {
  // Función para limpiar y formatear el número de teléfono
  const formatPhoneNumber = (phone: string): string => {
    // Eliminar espacios, guiones, paréntesis y otros caracteres
    let cleaned = phone.replace(/[\s\-\(\)\+]/g, "");
    
    // Si el número empieza con 0, asumir que es local y añadir código de país México (+52)
    if (cleaned.startsWith("0")) {
      cleaned = "52" + cleaned.substring(1);
    }
    
    // Si el número tiene 10 dígitos (formato mexicano local), añadir código de país
    if (cleaned.length === 10) {
      cleaned = "52" + cleaned;
    }
    
    return cleaned;
  };

  const handleClick = () => {
    if (!telefono) return;
    
    const formattedPhone = formatPhoneNumber(telefono);
    const encodedMessage = encodeURIComponent(mensaje);
    const whatsappUrl = `https://wa.me/${formattedPhone}${mensaje ? `?text=${encodedMessage}` : ""}`;
    
    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
  };

  const isDisabled = disabled || !telefono;

  return (
    <Button
      variant={variant}
      size={size}
      className={cn(
        "gap-2",
        !isDisabled && "hover:bg-green-50 hover:border-green-500 hover:text-green-600 dark:hover:bg-green-950 dark:hover:border-green-400 dark:hover:text-green-400",
        className
      )}
      onClick={handleClick}
      disabled={isDisabled}
      title={isDisabled ? "El candidato no tiene número de WhatsApp registrado" : "Contactar por WhatsApp"}
    >
      <MessageCircle className="h-4 w-4" />
      {showText && (
        <span className="hidden sm:inline">WhatsApp</span>
      )}
    </Button>
  );
};

/**
 * Hook para generar mensajes pre-llenados según el contexto
 */
export const useWhatsAppMessage = () => {
  const generarMensajePostulacion = (
    nombreCandidato: string,
    tituloPuesto: string,
    nombreReclutador?: string
  ): string => {
    const saludo = nombreReclutador 
      ? `Hola ${nombreCandidato}, soy ${nombreReclutador} de VVGI.`
      : `Hola ${nombreCandidato}, te contacto a través de VVGI.`;
    
    return `${saludo}\n\nMe comunico contigo respecto a tu postulación para la vacante de *${tituloPuesto}*.\n\n¿Tienes unos minutos para conversar sobre el proceso?`;
  };

  const generarMensajeInvitacion = (
    nombreCandidato: string,
    tituloPuesto: string,
    nombreReclutador?: string
  ): string => {
    const saludo = nombreReclutador 
      ? `Hola ${nombreCandidato}, soy ${nombreReclutador} de VVGI.`
      : `Hola ${nombreCandidato}, te contacto a través de VVGI.`;
    
    return `${saludo}\n\nHe revisado tu perfil y creo que podrías ser un excelente candidato para una vacante de *${tituloPuesto}* que estamos gestionando.\n\n¿Te gustaría conocer más detalles sobre esta oportunidad?`;
  };

  const generarMensajeSourcingIA = (
    nombreCandidato: string,
    tituloPuesto: string,
    scoreMatch: number,
    nombreReclutador?: string
  ): string => {
    const saludo = nombreReclutador 
      ? `Hola ${nombreCandidato}, soy ${nombreReclutador} de VVGI.`
      : `Hola ${nombreCandidato}, te contacto a través de VVGI.`;
    
    return `${saludo}\n\nNuestro sistema de inteligencia artificial ha identificado tu perfil como altamente compatible (${scoreMatch}%) con una vacante de *${tituloPuesto}*.\n\n¿Tienes disponibilidad para platicar sobre esta oportunidad?`;
  };

  const generarMensajeGenerico = (
    nombreCandidato: string,
    nombreReclutador?: string
  ): string => {
    const saludo = nombreReclutador 
      ? `Hola ${nombreCandidato}, soy ${nombreReclutador} de VVGI.`
      : `Hola ${nombreCandidato}, te contacto a través de VVGI.`;
    
    return `${saludo}\n\nMe gustaría conversar contigo sobre una oportunidad laboral que podría interesarte.\n\n¿Tienes disponibilidad para una breve llamada?`;
  };

  return {
    generarMensajePostulacion,
    generarMensajeInvitacion,
    generarMensajeSourcingIA,
    generarMensajeGenerico,
  };
};
