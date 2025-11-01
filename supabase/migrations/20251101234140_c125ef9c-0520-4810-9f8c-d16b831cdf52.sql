-- Tabla para mensajes entre reclutador y candidato por postulación
CREATE TABLE IF NOT EXISTS public.mensajes_postulacion (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  postulacion_id UUID NOT NULL REFERENCES public.postulaciones(id) ON DELETE CASCADE,
  remitente_user_id UUID NOT NULL,
  destinatario_user_id UUID NOT NULL,
  mensaje TEXT NOT NULL,
  leido BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices para mejor performance
CREATE INDEX idx_mensajes_postulacion_postulacion ON public.mensajes_postulacion(postulacion_id);
CREATE INDEX idx_mensajes_postulacion_destinatario ON public.mensajes_postulacion(destinatario_user_id);

-- RLS para mensajes
ALTER TABLE public.mensajes_postulacion ENABLE ROW LEVEL SECURITY;

-- Los usuarios pueden ver mensajes donde son remitente o destinatario
CREATE POLICY "Usuarios pueden ver sus mensajes"
  ON public.mensajes_postulacion
  FOR SELECT
  USING (
    auth.uid() = remitente_user_id OR 
    auth.uid() = destinatario_user_id
  );

-- Los usuarios pueden enviar mensajes
CREATE POLICY "Usuarios pueden enviar mensajes"
  ON public.mensajes_postulacion
  FOR INSERT
  WITH CHECK (auth.uid() = remitente_user_id);

-- Los usuarios pueden marcar como leído sus mensajes recibidos
CREATE POLICY "Usuarios pueden marcar mensajes como leídos"
  ON public.mensajes_postulacion
  FOR UPDATE
  USING (auth.uid() = destinatario_user_id)
  WITH CHECK (auth.uid() = destinatario_user_id);

-- Trigger para updated_at
CREATE TRIGGER update_mensajes_postulacion_updated_at
  BEFORE UPDATE ON public.mensajes_postulacion
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Habilitar realtime para mensajes
ALTER PUBLICATION supabase_realtime ADD TABLE public.mensajes_postulacion;