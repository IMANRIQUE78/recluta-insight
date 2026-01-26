import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ImproveResumenInput {
  resumen_actual: string;
  puesto_buscado?: string;
  habilidades_tecnicas?: string[];
  habilidades_blandas?: string[];
  experiencia_laboral?: Array<{
    empresa: string;
    puesto: string;
    descripcion: string;
    tags?: string;
  }>;
}

interface ImproveResumenResult {
  success: boolean;
  resumen_mejorado: string;
  resumen_indexado: string;
  keywords: string[];
  industrias: string[];
  nivel_experiencia: 'junior' | 'mid' | 'senior' | 'lead' | 'executive';
}

export function useImproveResumen() {
  const [loading, setLoading] = useState(false);

  const mejorarResumen = async (input: ImproveResumenInput): Promise<ImproveResumenResult | null> => {
    if (!input.resumen_actual || input.resumen_actual.trim().length < 20) {
      toast.error('El resumen debe tener al menos 20 caracteres');
      return null;
    }

    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Debes iniciar sesión');
        return null;
      }

      const response = await supabase.functions.invoke('improve-candidate-summary', {
        body: input
      });

      if (response.error) {
        const errorMessage = response.error.message || 'Error al mejorar el resumen';
        
        if (errorMessage.includes('429')) {
          toast.error('Demasiadas solicitudes, intenta en unos minutos');
        } else if (errorMessage.includes('402')) {
          toast.error('Servicio temporalmente no disponible');
        } else {
          toast.error(errorMessage);
        }
        return null;
      }

      const result = response.data as ImproveResumenResult;
      
      if (!result.success) {
        toast.error('No se pudo procesar el resumen');
        return null;
      }

      return result;
    } catch (error) {
      console.error('Error mejorando resumen:', error);
      toast.error('Error al conectar con el servicio de IA');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const guardarResumenIndexado = async (
    resumen_mejorado: string,
    resumen_indexado: string,
    keywords: string[],
    industrias: string[],
    nivel_experiencia: string
  ): Promise<boolean> => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return false;

      const { error } = await supabase
        .from('perfil_candidato')
        .update({
          resumen_profesional: resumen_mejorado,
          resumen_indexado_ia: resumen_indexado,
          keywords_sourcing: keywords,
          industrias_detectadas: industrias,
          nivel_experiencia_ia: nivel_experiencia,
          fecha_indexado_ia: new Date().toISOString()
        } as any)
        .eq('user_id', session.user.id);

      if (error) {
        console.error('Error guardando resumen indexado:', error);
        toast.error('Error al guardar el resumen');
        return false;
      }

      toast.success('Resumen mejorado y guardado correctamente');
      return true;
    } catch (error) {
      console.error('Error guardando resumen:', error);
      return false;
    }
  };

  return {
    loading,
    mejorarResumen,
    guardarResumenIndexado
  };
}
