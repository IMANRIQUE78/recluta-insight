import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SourcingResult {
  id: string;
  candidato_user_id: string;
  score_match: number;
  razon_match: string;
  habilidades_coincidentes: string[];
  experiencia_relevante: string[];
  estado: string;
  created_at: string;
  perfil_candidato?: {
    nombre_completo: string;
    email: string;
    telefono: string;
    ubicacion: string;
    puesto_actual: string;
    empresa_actual: string;
  };
}

interface SimulacionResult {
  success: boolean;
  dry_run: boolean;
  mensaje: string;
  vacante: {
    id: string;
    titulo: string;
    perfil: string;
  };
  candidatos_disponibles: number;
  candidatos_a_analizar: number;
  costo_creditos: number;
  creditos_disponibles: number;
  permisos: {
    esReclutador: boolean;
    esEmpresa: boolean;
  };
}

interface EjecucionResult {
  success: boolean;
  lote_sourcing: string;
  candidatos_encontrados: number;
  creditos_consumidos: number;
  mensaje: string;
}

export function useSourcingIA() {
  const [loading, setLoading] = useState(false);
  const [simulando, setSimulando] = useState(false);

  const simularSourcing = async (publicacionId: string): Promise<SimulacionResult | null> => {
    setSimulando(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Debes iniciar sesión para usar esta función');
        return null;
      }

      const response = await supabase.functions.invoke('sourcing-ia', {
        body: { 
          publicacion_id: publicacionId,
          dry_run: true 
        }
      });

      if (response.error) {
        const errorData = response.error;
        toast.error(errorData.message || 'Error al simular sourcing');
        return null;
      }

      return response.data as SimulacionResult;
    } catch (error) {
      console.error('Error simulando sourcing:', error);
      toast.error('Error al conectar con el servicio de sourcing');
      return null;
    } finally {
      setSimulando(false);
    }
  };

  const ejecutarSourcing = async (publicacionId: string): Promise<EjecucionResult | null> => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Debes iniciar sesión para usar esta función');
        return null;
      }

      const response = await supabase.functions.invoke('sourcing-ia', {
        body: { 
          publicacion_id: publicacionId,
          dry_run: false 
        }
      });

      if (response.error) {
        const errorData = response.error;
        
        if (errorData.message?.includes('402') || errorData.message?.includes('Créditos')) {
          toast.error('Créditos insuficientes para ejecutar el sourcing');
        } else if (errorData.message?.includes('429')) {
          toast.error('Demasiadas solicitudes, intenta en unos minutos');
        } else {
          toast.error(errorData.message || 'Error al ejecutar sourcing');
        }
        return null;
      }

      const result = response.data as EjecucionResult;
      toast.success(result.mensaje);
      return result;
    } catch (error) {
      console.error('Error ejecutando sourcing:', error);
      toast.error('Error al conectar con el servicio de sourcing');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const obtenerResultadosSourcing = async (vacanteId: string): Promise<SourcingResult[]> => {
    try {
      const { data, error } = await supabase
        .from('sourcing_ia')
        .select(`
          id,
          candidato_user_id,
          score_match,
          razon_match,
          habilidades_coincidentes,
          experiencia_relevante,
          estado,
          notas_contacto,
          fecha_contacto,
          created_at,
          lote_sourcing
        `)
        .eq('vacante_id', vacanteId)
        .order('score_match', { ascending: false });

      if (error) {
        console.error('Error obteniendo resultados:', error);
        return [];
      }

      // Obtener perfiles de candidatos
      const candidatoIds = data.map(s => s.candidato_user_id);
      const { data: perfiles } = await supabase
        .from('perfil_candidato')
        .select('user_id, nombre_completo, email, telefono, ubicacion, puesto_actual, empresa_actual')
        .in('user_id', candidatoIds);

      const perfilesMap = new Map(perfiles?.map(p => [p.user_id, p]) || []);

      return data.map(s => ({
        ...s,
        habilidades_coincidentes: s.habilidades_coincidentes as string[] || [],
        experiencia_relevante: s.experiencia_relevante as string[] || [],
        perfil_candidato: perfilesMap.get(s.candidato_user_id)
      }));
    } catch (error) {
      console.error('Error obteniendo resultados sourcing:', error);
      return [];
    }
  };

  const actualizarEstadoSourcing = async (
    sourcingId: string, 
    estado: 'pendiente' | 'contactado' | 'interesado' | 'no_interesado' | 'postulado' | 'descartado',
    notas?: string
  ): Promise<boolean> => {
    try {
      const updateData: Record<string, unknown> = { estado };
      
      if (estado === 'contactado' && !notas) {
        updateData.fecha_contacto = new Date().toISOString();
      }
      
      if (notas) {
        updateData.notas_contacto = notas;
      }

      const { error } = await supabase
        .from('sourcing_ia')
        .update(updateData)
        .eq('id', sourcingId);

      if (error) {
        console.error('Error actualizando estado:', error);
        toast.error('Error al actualizar estado');
        return false;
      }

      toast.success('Estado actualizado');
      return true;
    } catch (error) {
      console.error('Error actualizando estado sourcing:', error);
      return false;
    }
  };

  const COSTO_SOURCING = 50;
  const MAX_CANDIDATOS = 10;

  return {
    loading,
    simulando,
    simularSourcing,
    ejecutarSourcing,
    obtenerResultadosSourcing,
    actualizarEstadoSourcing,
    COSTO_SOURCING,
    MAX_CANDIDATOS
  };
}
