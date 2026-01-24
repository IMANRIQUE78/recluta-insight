export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      acceso_identidad_candidato: {
        Row: {
          candidato_user_id: string
          created_at: string
          creditos_consumidos: number
          empresa_id: string | null
          fecha_desbloqueo: string
          id: string
          origen_pago: string
          reclutador_id: string
        }
        Insert: {
          candidato_user_id: string
          created_at?: string
          creditos_consumidos?: number
          empresa_id?: string | null
          fecha_desbloqueo?: string
          id?: string
          origen_pago?: string
          reclutador_id: string
        }
        Update: {
          candidato_user_id?: string
          created_at?: string
          creditos_consumidos?: number
          empresa_id?: string | null
          fecha_desbloqueo?: string
          id?: string
          origen_pago?: string
          reclutador_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "acceso_identidad_candidato_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "acceso_identidad_candidato_reclutador_id_fkey"
            columns: ["reclutador_id"]
            isOneToOne: false
            referencedRelation: "perfil_reclutador"
            referencedColumns: ["id"]
          },
        ]
      }
      auditoria_vacantes: {
        Row: {
          created_at: string
          estatus_anterior: string | null
          estatus_nuevo: string
          fecha_cambio: string
          id: string
          observaciones: string | null
          user_id: string
          vacante_id: string
        }
        Insert: {
          created_at?: string
          estatus_anterior?: string | null
          estatus_nuevo: string
          fecha_cambio?: string
          id?: string
          observaciones?: string | null
          user_id: string
          vacante_id: string
        }
        Update: {
          created_at?: string
          estatus_anterior?: string | null
          estatus_nuevo?: string
          fecha_cambio?: string
          id?: string
          observaciones?: string | null
          user_id?: string
          vacante_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "auditoria_vacantes_vacante_id_fkey"
            columns: ["vacante_id"]
            isOneToOne: false
            referencedRelation: "vacantes"
            referencedColumns: ["id"]
          },
        ]
      }
      calificaciones_estudio: {
        Row: {
          calificacion: number
          calificador_user_id: string
          comentario: string | null
          created_at: string
          estudio_id: string
          id: string
        }
        Insert: {
          calificacion: number
          calificador_user_id: string
          comentario?: string | null
          created_at?: string
          estudio_id: string
          id?: string
        }
        Update: {
          calificacion?: number
          calificador_user_id?: string
          comentario?: string | null
          created_at?: string
          estudio_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "calificaciones_estudio_estudio_id_fkey"
            columns: ["estudio_id"]
            isOneToOne: false
            referencedRelation: "estudios_socioeconomicos"
            referencedColumns: ["id"]
          },
        ]
      }
      clientes_areas: {
        Row: {
          area: string
          cliente_nombre: string
          created_at: string
          id: string
          tipo_cliente: string
          ubicacion: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          area: string
          cliente_nombre: string
          created_at?: string
          id?: string
          tipo_cliente?: string
          ubicacion?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          area?: string
          cliente_nombre?: string
          created_at?: string
          id?: string
          tipo_cliente?: string
          ubicacion?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      conceptos_costeo_reclutamiento: {
        Row: {
          activo: boolean
          concepto: string
          costo: number
          created_at: string
          descripcion: string | null
          empresa_id: string
          id: string
          periodicidad: string
          unidad_medida: string
          updated_at: string
        }
        Insert: {
          activo?: boolean
          concepto: string
          costo?: number
          created_at?: string
          descripcion?: string | null
          empresa_id: string
          id?: string
          periodicidad?: string
          unidad_medida?: string
          updated_at?: string
        }
        Update: {
          activo?: boolean
          concepto?: string
          costo?: number
          created_at?: string
          descripcion?: string | null
          empresa_id?: string
          id?: string
          periodicidad?: string
          unidad_medida?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "conceptos_costeo_reclutamiento_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      creditos_heredados_reclutador: {
        Row: {
          created_at: string
          creditos_disponibles: number
          creditos_totales_recibidos: number
          empresa_id: string
          id: string
          reclutador_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          creditos_disponibles?: number
          creditos_totales_recibidos?: number
          empresa_id: string
          id?: string
          reclutador_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          creditos_disponibles?: number
          creditos_totales_recibidos?: number
          empresa_id?: string
          id?: string
          reclutador_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      empresas: {
        Row: {
          ciudad: string | null
          codigo_empresa: string
          codigo_postal: string | null
          created_at: string
          created_by: string | null
          descripcion_empresa: string | null
          direccion_fiscal: string | null
          direccion_fiscal_encrypted: string | null
          email_contacto: string
          estado: string | null
          id: string
          nombre_empresa: string
          pais: string | null
          razon_social: string | null
          razon_social_encrypted: string | null
          rfc: string | null
          rfc_encrypted: string | null
          sector: string | null
          sitio_web: string | null
          tamano_empresa: string | null
          telefono_contacto: string | null
          updated_at: string
        }
        Insert: {
          ciudad?: string | null
          codigo_empresa?: string
          codigo_postal?: string | null
          created_at?: string
          created_by?: string | null
          descripcion_empresa?: string | null
          direccion_fiscal?: string | null
          direccion_fiscal_encrypted?: string | null
          email_contacto: string
          estado?: string | null
          id?: string
          nombre_empresa: string
          pais?: string | null
          razon_social?: string | null
          razon_social_encrypted?: string | null
          rfc?: string | null
          rfc_encrypted?: string | null
          sector?: string | null
          sitio_web?: string | null
          tamano_empresa?: string | null
          telefono_contacto?: string | null
          updated_at?: string
        }
        Update: {
          ciudad?: string | null
          codigo_empresa?: string
          codigo_postal?: string | null
          created_at?: string
          created_by?: string | null
          descripcion_empresa?: string | null
          direccion_fiscal?: string | null
          direccion_fiscal_encrypted?: string | null
          email_contacto?: string
          estado?: string | null
          id?: string
          nombre_empresa?: string
          pais?: string | null
          razon_social?: string | null
          razon_social_encrypted?: string | null
          rfc?: string | null
          rfc_encrypted?: string | null
          sector?: string | null
          sitio_web?: string | null
          tamano_empresa?: string | null
          telefono_contacto?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      entrevistas_candidato: {
        Row: {
          asistio: boolean | null
          candidato_user_id: string
          created_at: string
          detalles_reunion: string | null
          duracion_minutos: number | null
          estado: string
          fecha_entrevista: string
          id: string
          motivo_rechazo: string | null
          notas: string | null
          postulacion_id: string
          reclutador_user_id: string | null
          tipo_entrevista: string | null
          updated_at: string
        }
        Insert: {
          asistio?: boolean | null
          candidato_user_id: string
          created_at?: string
          detalles_reunion?: string | null
          duracion_minutos?: number | null
          estado?: string
          fecha_entrevista: string
          id?: string
          motivo_rechazo?: string | null
          notas?: string | null
          postulacion_id: string
          reclutador_user_id?: string | null
          tipo_entrevista?: string | null
          updated_at?: string
        }
        Update: {
          asistio?: boolean | null
          candidato_user_id?: string
          created_at?: string
          detalles_reunion?: string | null
          duracion_minutos?: number | null
          estado?: string
          fecha_entrevista?: string
          id?: string
          motivo_rechazo?: string | null
          notas?: string | null
          postulacion_id?: string
          reclutador_user_id?: string | null
          tipo_entrevista?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "entrevistas_candidato_postulacion_id_fkey"
            columns: ["postulacion_id"]
            isOneToOne: false
            referencedRelation: "postulaciones"
            referencedColumns: ["id"]
          },
        ]
      }
      estadisticas_verificador: {
        Row: {
          calificacion_promedio: number | null
          created_at: string
          estudios_completados: number | null
          id: string
          porcentaje_a_tiempo: number | null
          tiempo_respuesta_promedio_horas: number | null
          ultima_actualizacion: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          calificacion_promedio?: number | null
          created_at?: string
          estudios_completados?: number | null
          id?: string
          porcentaje_a_tiempo?: number | null
          tiempo_respuesta_promedio_horas?: number | null
          ultima_actualizacion?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          calificacion_promedio?: number | null
          created_at?: string
          estudios_completados?: number | null
          id?: string
          porcentaje_a_tiempo?: number | null
          tiempo_respuesta_promedio_horas?: number | null
          ultima_actualizacion?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      estudios_socioeconomicos: {
        Row: {
          borrador: boolean | null
          calificacion_riesgo: string | null
          candidato_presente: boolean | null
          candidato_user_id: string
          created_at: string
          datos_economicos: Json | null
          datos_laborales: Json | null
          datos_referencias: Json | null
          datos_sociodemograficos: Json | null
          datos_vivienda: Json | null
          direccion_visita: string
          empresa_id: string | null
          estatus: string
          evidencias: Json | null
          fecha_asignacion: string | null
          fecha_entrega: string | null
          fecha_limite: string
          fecha_solicitud: string
          fecha_visita: string | null
          folio: string
          hora_visita: string | null
          id: string
          motivo_ausencia: string | null
          nombre_candidato: string
          observaciones_finales: string | null
          observaciones_visita: string | null
          postulacion_id: string | null
          resultado_general: string | null
          solicitante_user_id: string
          updated_at: string
          vacante_puesto: string
          verificador_id: string | null
        }
        Insert: {
          borrador?: boolean | null
          calificacion_riesgo?: string | null
          candidato_presente?: boolean | null
          candidato_user_id: string
          created_at?: string
          datos_economicos?: Json | null
          datos_laborales?: Json | null
          datos_referencias?: Json | null
          datos_sociodemograficos?: Json | null
          datos_vivienda?: Json | null
          direccion_visita: string
          empresa_id?: string | null
          estatus?: string
          evidencias?: Json | null
          fecha_asignacion?: string | null
          fecha_entrega?: string | null
          fecha_limite: string
          fecha_solicitud?: string
          fecha_visita?: string | null
          folio: string
          hora_visita?: string | null
          id?: string
          motivo_ausencia?: string | null
          nombre_candidato: string
          observaciones_finales?: string | null
          observaciones_visita?: string | null
          postulacion_id?: string | null
          resultado_general?: string | null
          solicitante_user_id: string
          updated_at?: string
          vacante_puesto: string
          verificador_id?: string | null
        }
        Update: {
          borrador?: boolean | null
          calificacion_riesgo?: string | null
          candidato_presente?: boolean | null
          candidato_user_id?: string
          created_at?: string
          datos_economicos?: Json | null
          datos_laborales?: Json | null
          datos_referencias?: Json | null
          datos_sociodemograficos?: Json | null
          datos_vivienda?: Json | null
          direccion_visita?: string
          empresa_id?: string | null
          estatus?: string
          evidencias?: Json | null
          fecha_asignacion?: string | null
          fecha_entrega?: string | null
          fecha_limite?: string
          fecha_solicitud?: string
          fecha_visita?: string | null
          folio?: string
          hora_visita?: string | null
          id?: string
          motivo_ausencia?: string | null
          nombre_candidato?: string
          observaciones_finales?: string | null
          observaciones_visita?: string | null
          postulacion_id?: string | null
          resultado_general?: string | null
          solicitante_user_id?: string
          updated_at?: string
          vacante_puesto?: string
          verificador_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "estudios_socioeconomicos_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estudios_socioeconomicos_postulacion_id_fkey"
            columns: ["postulacion_id"]
            isOneToOne: false
            referencedRelation: "postulaciones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estudios_socioeconomicos_verificador_id_fkey"
            columns: ["verificador_id"]
            isOneToOne: false
            referencedRelation: "perfil_verificador"
            referencedColumns: ["id"]
          },
        ]
      }
      evaluaciones_nom035: {
        Row: {
          created_at: string
          empresa_id: string
          estado: string
          fecha_fin: string | null
          fecha_inicio: string | null
          id: string
          nivel_riesgo: string | null
          periodo_evaluacion: string | null
          puntaje_total: number | null
          requiere_accion: boolean | null
          tipo_guia: string
          trabajador_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          empresa_id: string
          estado?: string
          fecha_fin?: string | null
          fecha_inicio?: string | null
          id?: string
          nivel_riesgo?: string | null
          periodo_evaluacion?: string | null
          puntaje_total?: number | null
          requiere_accion?: boolean | null
          tipo_guia: string
          trabajador_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          empresa_id?: string
          estado?: string
          fecha_fin?: string | null
          fecha_inicio?: string | null
          id?: string
          nivel_riesgo?: string | null
          periodo_evaluacion?: string | null
          puntaje_total?: number | null
          requiere_accion?: boolean | null
          tipo_guia?: string
          trabajador_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "evaluaciones_nom035_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evaluaciones_nom035_trabajador_id_fkey"
            columns: ["trabajador_id"]
            isOneToOne: false
            referencedRelation: "trabajadores_nom035"
            referencedColumns: ["id"]
          },
        ]
      }
      feedback_candidato: {
        Row: {
          aspectos_mejora: string[] | null
          aspectos_positivos: string[] | null
          candidato_user_id: string
          comentario: string
          created_at: string
          id: string
          postulacion_id: string
          puntuacion: number | null
          reclutador_user_id: string
        }
        Insert: {
          aspectos_mejora?: string[] | null
          aspectos_positivos?: string[] | null
          candidato_user_id: string
          comentario: string
          created_at?: string
          id?: string
          postulacion_id: string
          puntuacion?: number | null
          reclutador_user_id: string
        }
        Update: {
          aspectos_mejora?: string[] | null
          aspectos_positivos?: string[] | null
          candidato_user_id?: string
          comentario?: string
          created_at?: string
          id?: string
          postulacion_id?: string
          puntuacion?: number | null
          reclutador_user_id?: string
        }
        Relationships: []
      }
      invitaciones_reclutador: {
        Row: {
          codigo_reclutador: string
          created_at: string
          empresa_id: string
          estado: Database["public"]["Enums"]["estado_invitacion"]
          fecha_expiracion: string | null
          id: string
          mensaje: string | null
          reclutador_id: string | null
          tipo_vinculacion: Database["public"]["Enums"]["tipo_vinculacion"]
          updated_at: string
        }
        Insert: {
          codigo_reclutador: string
          created_at?: string
          empresa_id: string
          estado?: Database["public"]["Enums"]["estado_invitacion"]
          fecha_expiracion?: string | null
          id?: string
          mensaje?: string | null
          reclutador_id?: string | null
          tipo_vinculacion: Database["public"]["Enums"]["tipo_vinculacion"]
          updated_at?: string
        }
        Update: {
          codigo_reclutador?: string
          created_at?: string
          empresa_id?: string
          estado?: Database["public"]["Enums"]["estado_invitacion"]
          fecha_expiracion?: string | null
          id?: string
          mensaje?: string | null
          reclutador_id?: string | null
          tipo_vinculacion?: Database["public"]["Enums"]["tipo_vinculacion"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invitaciones_reclutador_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invitaciones_reclutador_reclutador_id_fkey"
            columns: ["reclutador_id"]
            isOneToOne: false
            referencedRelation: "perfil_reclutador"
            referencedColumns: ["id"]
          },
        ]
      }
      lista_espera_lanzamiento: {
        Row: {
          confirmado: boolean | null
          created_at: string
          email: string
          fuente: string | null
          id: string
          ip_registro: string | null
          nombre: string
          perfil_interes: string
          whatsapp: string | null
        }
        Insert: {
          confirmado?: boolean | null
          created_at?: string
          email: string
          fuente?: string | null
          id?: string
          ip_registro?: string | null
          nombre: string
          perfil_interes: string
          whatsapp?: string | null
        }
        Update: {
          confirmado?: boolean | null
          created_at?: string
          email?: string
          fuente?: string | null
          id?: string
          ip_registro?: string | null
          nombre?: string
          perfil_interes?: string
          whatsapp?: string | null
        }
        Relationships: []
      }
      mensajes_postulacion: {
        Row: {
          created_at: string
          destinatario_user_id: string
          id: string
          leido: boolean
          mensaje: string
          postulacion_id: string
          remitente_user_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          destinatario_user_id: string
          id?: string
          leido?: boolean
          mensaje: string
          postulacion_id: string
          remitente_user_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          destinatario_user_id?: string
          id?: string
          leido?: boolean
          mensaje?: string
          postulacion_id?: string
          remitente_user_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mensajes_postulacion_postulacion_id_fkey"
            columns: ["postulacion_id"]
            isOneToOne: false
            referencedRelation: "postulaciones"
            referencedColumns: ["id"]
          },
        ]
      }
      movimientos_creditos: {
        Row: {
          candidato_user_id: string | null
          created_at: string
          creditos_antes: number
          creditos_cantidad: number
          creditos_despues: number
          descripcion: string
          empresa_id: string | null
          id: string
          ip_address: unknown
          metadata: Json | null
          metodo: Database["public"]["Enums"]["metodo_ejecucion"]
          origen_pago: Database["public"]["Enums"]["origen_pago"]
          postulacion_id: string | null
          reclutador_user_id: string
          tipo_accion: Database["public"]["Enums"]["tipo_accion_credito"]
          user_agent: string | null
          vacante_id: string | null
          wallet_empresa_id: string | null
          wallet_reclutador_id: string | null
        }
        Insert: {
          candidato_user_id?: string | null
          created_at?: string
          creditos_antes: number
          creditos_cantidad: number
          creditos_despues: number
          descripcion: string
          empresa_id?: string | null
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          metodo?: Database["public"]["Enums"]["metodo_ejecucion"]
          origen_pago: Database["public"]["Enums"]["origen_pago"]
          postulacion_id?: string | null
          reclutador_user_id: string
          tipo_accion: Database["public"]["Enums"]["tipo_accion_credito"]
          user_agent?: string | null
          vacante_id?: string | null
          wallet_empresa_id?: string | null
          wallet_reclutador_id?: string | null
        }
        Update: {
          candidato_user_id?: string | null
          created_at?: string
          creditos_antes?: number
          creditos_cantidad?: number
          creditos_despues?: number
          descripcion?: string
          empresa_id?: string | null
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          metodo?: Database["public"]["Enums"]["metodo_ejecucion"]
          origen_pago?: Database["public"]["Enums"]["origen_pago"]
          postulacion_id?: string | null
          reclutador_user_id?: string
          tipo_accion?: Database["public"]["Enums"]["tipo_accion_credito"]
          user_agent?: string | null
          vacante_id?: string | null
          wallet_empresa_id?: string | null
          wallet_reclutador_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "movimientos_creditos_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimientos_creditos_postulacion_id_fkey"
            columns: ["postulacion_id"]
            isOneToOne: false
            referencedRelation: "postulaciones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimientos_creditos_vacante_id_fkey"
            columns: ["vacante_id"]
            isOneToOne: false
            referencedRelation: "vacantes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimientos_creditos_wallet_empresa_id_fkey"
            columns: ["wallet_empresa_id"]
            isOneToOne: false
            referencedRelation: "wallet_empresa"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimientos_creditos_wallet_reclutador_id_fkey"
            columns: ["wallet_reclutador_id"]
            isOneToOne: false
            referencedRelation: "wallet_reclutador"
            referencedColumns: ["id"]
          },
        ]
      }
      perfil_candidato: {
        Row: {
          carrera: string | null
          certificaciones: Json | null
          codigo_candidato: string | null
          created_at: string
          cv_filename: string | null
          cv_url: string | null
          disponibilidad: string | null
          educacion: Json | null
          email: string
          empresa_actual: string | null
          experiencia_laboral: Json | null
          github_url: string | null
          habilidades_blandas: string[] | null
          habilidades_tecnicas: string[] | null
          id: string
          idiomas: Json | null
          institucion: string | null
          linkedin_url: string | null
          modalidad_preferida: string | null
          nivel_educacion: string | null
          nombre_completo: string
          portfolio_url: string | null
          puesto_actual: string | null
          resumen_profesional: string | null
          salario_esperado_max: number | null
          salario_esperado_min: number | null
          telefono: string | null
          ubicacion: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          carrera?: string | null
          certificaciones?: Json | null
          codigo_candidato?: string | null
          created_at?: string
          cv_filename?: string | null
          cv_url?: string | null
          disponibilidad?: string | null
          educacion?: Json | null
          email: string
          empresa_actual?: string | null
          experiencia_laboral?: Json | null
          github_url?: string | null
          habilidades_blandas?: string[] | null
          habilidades_tecnicas?: string[] | null
          id?: string
          idiomas?: Json | null
          institucion?: string | null
          linkedin_url?: string | null
          modalidad_preferida?: string | null
          nivel_educacion?: string | null
          nombre_completo: string
          portfolio_url?: string | null
          puesto_actual?: string | null
          resumen_profesional?: string | null
          salario_esperado_max?: number | null
          salario_esperado_min?: number | null
          telefono?: string | null
          ubicacion?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          carrera?: string | null
          certificaciones?: Json | null
          codigo_candidato?: string | null
          created_at?: string
          cv_filename?: string | null
          cv_url?: string | null
          disponibilidad?: string | null
          educacion?: Json | null
          email?: string
          empresa_actual?: string | null
          experiencia_laboral?: Json | null
          github_url?: string | null
          habilidades_blandas?: string[] | null
          habilidades_tecnicas?: string[] | null
          id?: string
          idiomas?: Json | null
          institucion?: string | null
          linkedin_url?: string | null
          modalidad_preferida?: string | null
          nivel_educacion?: string | null
          nombre_completo?: string
          portfolio_url?: string | null
          puesto_actual?: string | null
          resumen_profesional?: string | null
          salario_esperado_max?: number | null
          salario_esperado_min?: number | null
          telefono?: string | null
          ubicacion?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      perfil_reclutador: {
        Row: {
          anos_experiencia: number | null
          codigo_reclutador: string
          created_at: string
          descripcion_reclutador: string | null
          email: string
          especialidades: string[] | null
          id: string
          linkedin_url: string | null
          mostrar_telefono: boolean | null
          nombre_reclutador: string
          semblanza_profesional: string | null
          telefono: string | null
          tipo_reclutador: Database["public"]["Enums"]["tipo_reclutador"]
          twitter_url: string | null
          updated_at: string
          user_id: string
          website_url: string | null
        }
        Insert: {
          anos_experiencia?: number | null
          codigo_reclutador?: string
          created_at?: string
          descripcion_reclutador?: string | null
          email: string
          especialidades?: string[] | null
          id?: string
          linkedin_url?: string | null
          mostrar_telefono?: boolean | null
          nombre_reclutador: string
          semblanza_profesional?: string | null
          telefono?: string | null
          tipo_reclutador?: Database["public"]["Enums"]["tipo_reclutador"]
          twitter_url?: string | null
          updated_at?: string
          user_id: string
          website_url?: string | null
        }
        Update: {
          anos_experiencia?: number | null
          codigo_reclutador?: string
          created_at?: string
          descripcion_reclutador?: string | null
          email?: string
          especialidades?: string[] | null
          id?: string
          linkedin_url?: string | null
          mostrar_telefono?: boolean | null
          nombre_reclutador?: string
          semblanza_profesional?: string | null
          telefono?: string | null
          tipo_reclutador?: Database["public"]["Enums"]["tipo_reclutador"]
          twitter_url?: string | null
          updated_at?: string
          user_id?: string
          website_url?: string | null
        }
        Relationships: []
      }
      perfil_usuario: {
        Row: {
          created_at: string
          descripcion_empresa: string | null
          frecuencia_actualizacion: string
          horizonte_planeacion: number
          id: string
          metricas_clave: string[] | null
          miden_indicadores: boolean
          mostrar_empresa_publica: boolean
          nombre_empresa: string | null
          nombre_usuario: string | null
          pais: string
          sector: string | null
          sitio_web: string | null
          tamano_empresa: Database["public"]["Enums"]["tamano_empresa"]
          tipo_usuario: Database["public"]["Enums"]["tipo_usuario"]
          updated_at: string
          user_id: string
          vacantes_promedio_mes: number
        }
        Insert: {
          created_at?: string
          descripcion_empresa?: string | null
          frecuencia_actualizacion?: string
          horizonte_planeacion?: number
          id?: string
          metricas_clave?: string[] | null
          miden_indicadores?: boolean
          mostrar_empresa_publica?: boolean
          nombre_empresa?: string | null
          nombre_usuario?: string | null
          pais?: string
          sector?: string | null
          sitio_web?: string | null
          tamano_empresa: Database["public"]["Enums"]["tamano_empresa"]
          tipo_usuario: Database["public"]["Enums"]["tipo_usuario"]
          updated_at?: string
          user_id: string
          vacantes_promedio_mes?: number
        }
        Update: {
          created_at?: string
          descripcion_empresa?: string | null
          frecuencia_actualizacion?: string
          horizonte_planeacion?: number
          id?: string
          metricas_clave?: string[] | null
          miden_indicadores?: boolean
          mostrar_empresa_publica?: boolean
          nombre_empresa?: string | null
          nombre_usuario?: string | null
          pais?: string
          sector?: string | null
          sitio_web?: string | null
          tamano_empresa?: Database["public"]["Enums"]["tamano_empresa"]
          tipo_usuario?: Database["public"]["Enums"]["tipo_usuario"]
          updated_at?: string
          user_id?: string
          vacantes_promedio_mes?: number
        }
        Relationships: []
      }
      perfil_verificador: {
        Row: {
          codigo_verificador: string
          created_at: string
          disponible: boolean | null
          email: string
          id: string
          nombre_verificador: string
          telefono: string | null
          updated_at: string
          user_id: string
          zona_cobertura: string[] | null
        }
        Insert: {
          codigo_verificador?: string
          created_at?: string
          disponible?: boolean | null
          email: string
          id?: string
          nombre_verificador: string
          telefono?: string | null
          updated_at?: string
          user_id: string
          zona_cobertura?: string[] | null
        }
        Update: {
          codigo_verificador?: string
          created_at?: string
          disponible?: boolean | null
          email?: string
          id?: string
          nombre_verificador?: string
          telefono?: string | null
          updated_at?: string
          user_id?: string
          zona_cobertura?: string[] | null
        }
        Relationships: []
      }
      personal_empresa: {
        Row: {
          alcaldia_municipio: string | null
          area: string | null
          centro_trabajo: string | null
          codigo_empleado: string
          codigo_postal: string | null
          colonia: string | null
          colonia_encrypted: string | null
          created_at: string
          cuenta_bancaria: string | null
          cuenta_bancaria_encrypted: string | null
          curp: string | null
          curp_encrypted: string | null
          domicilio: string | null
          domicilio_encrypted: string | null
          email_corporativo: string | null
          email_personal: string | null
          email_personal_encrypted: string | null
          empresa_id: string
          enfermedades_alergias: string | null
          es_supervisor: boolean
          escolaridad: string | null
          estado_civil: string | null
          estatus: string
          fecha_ingreso: string | null
          fecha_nacimiento: string | null
          fecha_salida: string | null
          finiquito: number | null
          genero: string | null
          id: string
          jefe_directo: string | null
          modalidad_contratacion: string | null
          nombre_completo: string
          nss: string | null
          nss_encrypted: string | null
          observaciones: string | null
          puesto: string | null
          reclutador_asignado: string | null
          rfc: string | null
          rfc_encrypted: string | null
          sueldo_asignado: number | null
          telefono_emergencia: string | null
          telefono_emergencia_encrypted: string | null
          telefono_movil: string | null
          telefono_movil_encrypted: string | null
          tipo_jornada: string | null
          updated_at: string
        }
        Insert: {
          alcaldia_municipio?: string | null
          area?: string | null
          centro_trabajo?: string | null
          codigo_empleado: string
          codigo_postal?: string | null
          colonia?: string | null
          colonia_encrypted?: string | null
          created_at?: string
          cuenta_bancaria?: string | null
          cuenta_bancaria_encrypted?: string | null
          curp?: string | null
          curp_encrypted?: string | null
          domicilio?: string | null
          domicilio_encrypted?: string | null
          email_corporativo?: string | null
          email_personal?: string | null
          email_personal_encrypted?: string | null
          empresa_id: string
          enfermedades_alergias?: string | null
          es_supervisor?: boolean
          escolaridad?: string | null
          estado_civil?: string | null
          estatus?: string
          fecha_ingreso?: string | null
          fecha_nacimiento?: string | null
          fecha_salida?: string | null
          finiquito?: number | null
          genero?: string | null
          id?: string
          jefe_directo?: string | null
          modalidad_contratacion?: string | null
          nombre_completo: string
          nss?: string | null
          nss_encrypted?: string | null
          observaciones?: string | null
          puesto?: string | null
          reclutador_asignado?: string | null
          rfc?: string | null
          rfc_encrypted?: string | null
          sueldo_asignado?: number | null
          telefono_emergencia?: string | null
          telefono_emergencia_encrypted?: string | null
          telefono_movil?: string | null
          telefono_movil_encrypted?: string | null
          tipo_jornada?: string | null
          updated_at?: string
        }
        Update: {
          alcaldia_municipio?: string | null
          area?: string | null
          centro_trabajo?: string | null
          codigo_empleado?: string
          codigo_postal?: string | null
          colonia?: string | null
          colonia_encrypted?: string | null
          created_at?: string
          cuenta_bancaria?: string | null
          cuenta_bancaria_encrypted?: string | null
          curp?: string | null
          curp_encrypted?: string | null
          domicilio?: string | null
          domicilio_encrypted?: string | null
          email_corporativo?: string | null
          email_personal?: string | null
          email_personal_encrypted?: string | null
          empresa_id?: string
          enfermedades_alergias?: string | null
          es_supervisor?: boolean
          escolaridad?: string | null
          estado_civil?: string | null
          estatus?: string
          fecha_ingreso?: string | null
          fecha_nacimiento?: string | null
          fecha_salida?: string | null
          finiquito?: number | null
          genero?: string | null
          id?: string
          jefe_directo?: string | null
          modalidad_contratacion?: string | null
          nombre_completo?: string
          nss?: string | null
          nss_encrypted?: string | null
          observaciones?: string | null
          puesto?: string | null
          reclutador_asignado?: string | null
          rfc?: string | null
          rfc_encrypted?: string | null
          sueldo_asignado?: number | null
          telefono_emergencia?: string | null
          telefono_emergencia_encrypted?: string | null
          telefono_movil?: string | null
          telefono_movil_encrypted?: string | null
          tipo_jornada?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "personal_empresa_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      politica_prevencion_nom035: {
        Row: {
          contenido_politica: string
          created_at: string
          empresa_id: string
          fecha_publicacion: string | null
          id: string
          responsables: Json | null
          updated_at: string
          vigente: boolean
        }
        Insert: {
          contenido_politica: string
          created_at?: string
          empresa_id: string
          fecha_publicacion?: string | null
          id?: string
          responsables?: Json | null
          updated_at?: string
          vigente?: boolean
        }
        Update: {
          contenido_politica?: string
          created_at?: string
          empresa_id?: string
          fecha_publicacion?: string | null
          id?: string
          responsables?: Json | null
          updated_at?: string
          vigente?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "politica_prevencion_nom035_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: true
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      postulaciones: {
        Row: {
          candidato_user_id: string
          created_at: string
          estado: string
          etapa: string | null
          fecha_actualizacion: string | null
          fecha_postulacion: string
          id: string
          notas_reclutador: string | null
          publicacion_id: string
        }
        Insert: {
          candidato_user_id: string
          created_at?: string
          estado?: string
          etapa?: string | null
          fecha_actualizacion?: string | null
          fecha_postulacion?: string
          id?: string
          notas_reclutador?: string | null
          publicacion_id: string
        }
        Update: {
          candidato_user_id?: string
          created_at?: string
          estado?: string
          etapa?: string | null
          fecha_actualizacion?: string | null
          fecha_postulacion?: string
          id?: string
          notas_reclutador?: string | null
          publicacion_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "postulaciones_candidato_user_id_fkey"
            columns: ["candidato_user_id"]
            isOneToOne: false
            referencedRelation: "perfil_candidato"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "postulaciones_publicacion_id_fkey"
            columns: ["publicacion_id"]
            isOneToOne: false
            referencedRelation: "publicaciones_marketplace"
            referencedColumns: ["id"]
          },
        ]
      }
      publicaciones_marketplace: {
        Row: {
          cliente_area: string | null
          created_at: string
          fecha_publicacion: string
          id: string
          lugar_trabajo: Database["public"]["Enums"]["modalidad_trabajo"]
          observaciones: string | null
          perfil_requerido: string | null
          publicada: boolean
          sueldo_bruto_aprobado: number | null
          titulo_puesto: string
          ubicacion: string | null
          updated_at: string
          user_id: string
          vacante_id: string
        }
        Insert: {
          cliente_area?: string | null
          created_at?: string
          fecha_publicacion?: string
          id?: string
          lugar_trabajo: Database["public"]["Enums"]["modalidad_trabajo"]
          observaciones?: string | null
          perfil_requerido?: string | null
          publicada?: boolean
          sueldo_bruto_aprobado?: number | null
          titulo_puesto: string
          ubicacion?: string | null
          updated_at?: string
          user_id: string
          vacante_id: string
        }
        Update: {
          cliente_area?: string | null
          created_at?: string
          fecha_publicacion?: string
          id?: string
          lugar_trabajo?: Database["public"]["Enums"]["modalidad_trabajo"]
          observaciones?: string | null
          perfil_requerido?: string | null
          publicada?: boolean
          sueldo_bruto_aprobado?: number | null
          titulo_puesto?: string
          ubicacion?: string | null
          updated_at?: string
          user_id?: string
          vacante_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "publicaciones_marketplace_vacante_id_fkey"
            columns: ["vacante_id"]
            isOneToOne: true
            referencedRelation: "vacantes"
            referencedColumns: ["id"]
          },
        ]
      }
      reclutador_empresa: {
        Row: {
          created_at: string
          empresa_id: string
          es_asociacion_activa: boolean | null
          estado: Database["public"]["Enums"]["estado_asociacion"]
          fecha_fin: string | null
          fecha_inicio: string
          id: string
          reclutador_id: string
          tipo_vinculacion: Database["public"]["Enums"]["tipo_vinculacion"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          empresa_id: string
          es_asociacion_activa?: boolean | null
          estado?: Database["public"]["Enums"]["estado_asociacion"]
          fecha_fin?: string | null
          fecha_inicio?: string
          id?: string
          reclutador_id: string
          tipo_vinculacion: Database["public"]["Enums"]["tipo_vinculacion"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          empresa_id?: string
          es_asociacion_activa?: boolean | null
          estado?: Database["public"]["Enums"]["estado_asociacion"]
          fecha_fin?: string | null
          fecha_inicio?: string
          id?: string
          reclutador_id?: string
          tipo_vinculacion?: Database["public"]["Enums"]["tipo_vinculacion"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reclutador_empresa_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reclutador_empresa_reclutador_id_fkey"
            columns: ["reclutador_id"]
            isOneToOne: false
            referencedRelation: "perfil_reclutador"
            referencedColumns: ["id"]
          },
        ]
      }
      respuestas_nom035: {
        Row: {
          created_at: string
          dimension: string | null
          evaluacion_id: string
          id: string
          numero_pregunta: number
          respuesta_texto: string | null
          respuesta_valor: number
          seccion: string
        }
        Insert: {
          created_at?: string
          dimension?: string | null
          evaluacion_id: string
          id?: string
          numero_pregunta: number
          respuesta_texto?: string | null
          respuesta_valor: number
          seccion: string
        }
        Update: {
          created_at?: string
          dimension?: string | null
          evaluacion_id?: string
          id?: string
          numero_pregunta?: number
          respuesta_texto?: string | null
          respuesta_valor?: number
          seccion?: string
        }
        Relationships: [
          {
            foreignKeyName: "respuestas_nom035_evaluacion_id_fkey"
            columns: ["evaluacion_id"]
            isOneToOne: false
            referencedRelation: "evaluaciones_nom035"
            referencedColumns: ["id"]
          },
        ]
      }
      resultados_dimension_nom035: {
        Row: {
          categoria: string
          created_at: string
          dimension: string
          evaluacion_id: string
          id: string
          nivel_riesgo: string
          puntaje: number
        }
        Insert: {
          categoria: string
          created_at?: string
          dimension: string
          evaluacion_id: string
          id?: string
          nivel_riesgo: string
          puntaje: number
        }
        Update: {
          categoria?: string
          created_at?: string
          dimension?: string
          evaluacion_id?: string
          id?: string
          nivel_riesgo?: string
          puntaje?: number
        }
        Relationships: [
          {
            foreignKeyName: "resultados_dimension_nom035_evaluacion_id_fkey"
            columns: ["evaluacion_id"]
            isOneToOne: false
            referencedRelation: "evaluaciones_nom035"
            referencedColumns: ["id"]
          },
        ]
      }
      sourcing_ia: {
        Row: {
          candidato_user_id: string
          created_at: string
          creditos_consumidos: number
          ejecutor_user_id: string
          empresa_ejecutora_id: string | null
          estado: string
          experiencia_relevante: Json | null
          fecha_contacto: string | null
          habilidades_coincidentes: Json | null
          id: string
          lote_sourcing: string
          notas_contacto: string | null
          publicacion_id: string
          razon_match: string | null
          reclutador_ejecutor_id: string | null
          score_match: number
          updated_at: string
          vacante_id: string
        }
        Insert: {
          candidato_user_id: string
          created_at?: string
          creditos_consumidos?: number
          ejecutor_user_id: string
          empresa_ejecutora_id?: string | null
          estado?: string
          experiencia_relevante?: Json | null
          fecha_contacto?: string | null
          habilidades_coincidentes?: Json | null
          id?: string
          lote_sourcing: string
          notas_contacto?: string | null
          publicacion_id: string
          razon_match?: string | null
          reclutador_ejecutor_id?: string | null
          score_match?: number
          updated_at?: string
          vacante_id: string
        }
        Update: {
          candidato_user_id?: string
          created_at?: string
          creditos_consumidos?: number
          ejecutor_user_id?: string
          empresa_ejecutora_id?: string | null
          estado?: string
          experiencia_relevante?: Json | null
          fecha_contacto?: string | null
          habilidades_coincidentes?: Json | null
          id?: string
          lote_sourcing?: string
          notas_contacto?: string | null
          publicacion_id?: string
          razon_match?: string | null
          reclutador_ejecutor_id?: string | null
          score_match?: number
          updated_at?: string
          vacante_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sourcing_ia_empresa_ejecutora_id_fkey"
            columns: ["empresa_ejecutora_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sourcing_ia_publicacion_id_fkey"
            columns: ["publicacion_id"]
            isOneToOne: false
            referencedRelation: "publicaciones_marketplace"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sourcing_ia_reclutador_ejecutor_id_fkey"
            columns: ["reclutador_ejecutor_id"]
            isOneToOne: false
            referencedRelation: "perfil_reclutador"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sourcing_ia_vacante_id_fkey"
            columns: ["vacante_id"]
            isOneToOne: false
            referencedRelation: "vacantes"
            referencedColumns: ["id"]
          },
        ]
      }
      suscripcion_empresa: {
        Row: {
          acceso_analytics_avanzado: boolean | null
          acceso_marketplace: boolean | null
          activa: boolean
          created_at: string
          empresa_id: string
          fecha_fin: string | null
          fecha_inicio: string
          id: string
          plan: Database["public"]["Enums"]["plan_empresa"]
          publicaciones_mes: number | null
          publicaciones_usadas: number | null
          soporte_prioritario: boolean | null
          updated_at: string
        }
        Insert: {
          acceso_analytics_avanzado?: boolean | null
          acceso_marketplace?: boolean | null
          activa?: boolean
          created_at?: string
          empresa_id: string
          fecha_fin?: string | null
          fecha_inicio?: string
          id?: string
          plan?: Database["public"]["Enums"]["plan_empresa"]
          publicaciones_mes?: number | null
          publicaciones_usadas?: number | null
          soporte_prioritario?: boolean | null
          updated_at?: string
        }
        Update: {
          acceso_analytics_avanzado?: boolean | null
          acceso_marketplace?: boolean | null
          activa?: boolean
          created_at?: string
          empresa_id?: string
          fecha_fin?: string | null
          fecha_inicio?: string
          id?: string
          plan?: Database["public"]["Enums"]["plan_empresa"]
          publicaciones_mes?: number | null
          publicaciones_usadas?: number | null
          soporte_prioritario?: boolean | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "suscripcion_empresa_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: true
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      suscripcion_reclutador: {
        Row: {
          acceso_baterias_psicometricas: boolean | null
          acceso_ia_sourcing: boolean | null
          acceso_pool_premium: boolean | null
          activa: boolean
          created_at: string
          fecha_fin: string | null
          fecha_inicio: string
          id: string
          max_asociaciones_simultaneas: number | null
          plan: Database["public"]["Enums"]["plan_reclutador"]
          publicacion_destacada: boolean | null
          reclutador_id: string
          updated_at: string
        }
        Insert: {
          acceso_baterias_psicometricas?: boolean | null
          acceso_ia_sourcing?: boolean | null
          acceso_pool_premium?: boolean | null
          activa?: boolean
          created_at?: string
          fecha_fin?: string | null
          fecha_inicio?: string
          id?: string
          max_asociaciones_simultaneas?: number | null
          plan?: Database["public"]["Enums"]["plan_reclutador"]
          publicacion_destacada?: boolean | null
          reclutador_id: string
          updated_at?: string
        }
        Update: {
          acceso_baterias_psicometricas?: boolean | null
          acceso_ia_sourcing?: boolean | null
          acceso_pool_premium?: boolean | null
          activa?: boolean
          created_at?: string
          fecha_fin?: string | null
          fecha_inicio?: string
          id?: string
          max_asociaciones_simultaneas?: number | null
          plan?: Database["public"]["Enums"]["plan_reclutador"]
          publicacion_destacada?: boolean | null
          reclutador_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "suscripcion_reclutador_reclutador_id_fkey"
            columns: ["reclutador_id"]
            isOneToOne: true
            referencedRelation: "perfil_reclutador"
            referencedColumns: ["id"]
          },
        ]
      }
      tokens_cuestionario_nom035: {
        Row: {
          created_at: string
          empresa_id: string
          fecha_expiracion: string
          id: string
          tipo_guia: string
          token: string
          trabajador_id: string
          usado: boolean
        }
        Insert: {
          created_at?: string
          empresa_id: string
          fecha_expiracion?: string
          id?: string
          tipo_guia: string
          token?: string
          trabajador_id: string
          usado?: boolean
        }
        Update: {
          created_at?: string
          empresa_id?: string
          fecha_expiracion?: string
          id?: string
          tipo_guia?: string
          token?: string
          trabajador_id?: string
          usado?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "tokens_cuestionario_nom035_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tokens_cuestionario_nom035_trabajador_id_fkey"
            columns: ["trabajador_id"]
            isOneToOne: false
            referencedRelation: "trabajadores_nom035"
            referencedColumns: ["id"]
          },
        ]
      }
      trabajadores_nom035: {
        Row: {
          acepto_aviso_privacidad: boolean
          activo: boolean
          antiguedad_meses: number
          area: string
          centro_trabajo: string
          codigo_trabajador: string
          created_at: string
          email: string | null
          email_encrypted: string | null
          empresa_id: string
          fecha_acepto_aviso: string | null
          fecha_ingreso: string | null
          id: string
          modalidad_contratacion: string
          nombre_completo: string
          personal_id: string | null
          puesto: string
          telefono: string | null
          telefono_encrypted: string | null
          tipo_jornada: string
          updated_at: string
        }
        Insert: {
          acepto_aviso_privacidad?: boolean
          activo?: boolean
          antiguedad_meses?: number
          area: string
          centro_trabajo: string
          codigo_trabajador: string
          created_at?: string
          email?: string | null
          email_encrypted?: string | null
          empresa_id: string
          fecha_acepto_aviso?: string | null
          fecha_ingreso?: string | null
          id?: string
          modalidad_contratacion?: string
          nombre_completo: string
          personal_id?: string | null
          puesto: string
          telefono?: string | null
          telefono_encrypted?: string | null
          tipo_jornada?: string
          updated_at?: string
        }
        Update: {
          acepto_aviso_privacidad?: boolean
          activo?: boolean
          antiguedad_meses?: number
          area?: string
          centro_trabajo?: string
          codigo_trabajador?: string
          created_at?: string
          email?: string | null
          email_encrypted?: string | null
          empresa_id?: string
          fecha_acepto_aviso?: string | null
          fecha_ingreso?: string | null
          id?: string
          modalidad_contratacion?: string
          nombre_completo?: string
          personal_id?: string | null
          puesto?: string
          telefono?: string | null
          telefono_encrypted?: string | null
          tipo_jornada?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "trabajadores_nom035_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trabajadores_nom035_personal_id_fkey"
            columns: ["personal_id"]
            isOneToOne: false
            referencedRelation: "personal_empresa"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          empresa_id: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          empresa_id?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          empresa_id?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      vacantes: {
        Row: {
          a_quien_sustituye: string | null
          cliente_area_id: string
          created_at: string
          empresa_id: string | null
          estatus: Database["public"]["Enums"]["estatus_vacante"]
          fecha_cierre: string | null
          fecha_solicitud: string
          fecha_solicitud_cierre: string | null
          folio: string
          id: string
          lugar_trabajo: Database["public"]["Enums"]["modalidad_trabajo"]
          motivo: Database["public"]["Enums"]["motivo_vacante"]
          motivo_solicitud_cierre: string | null
          observaciones: string | null
          perfil_requerido: string | null
          reclutador_asignado_id: string | null
          reclutador_id: string | null
          solicitud_cierre: boolean | null
          sueldo_bruto_aprobado: number | null
          titulo_puesto: string
          updated_at: string
          user_id: string
        }
        Insert: {
          a_quien_sustituye?: string | null
          cliente_area_id: string
          created_at?: string
          empresa_id?: string | null
          estatus?: Database["public"]["Enums"]["estatus_vacante"]
          fecha_cierre?: string | null
          fecha_solicitud: string
          fecha_solicitud_cierre?: string | null
          folio: string
          id?: string
          lugar_trabajo: Database["public"]["Enums"]["modalidad_trabajo"]
          motivo: Database["public"]["Enums"]["motivo_vacante"]
          motivo_solicitud_cierre?: string | null
          observaciones?: string | null
          perfil_requerido?: string | null
          reclutador_asignado_id?: string | null
          reclutador_id?: string | null
          solicitud_cierre?: boolean | null
          sueldo_bruto_aprobado?: number | null
          titulo_puesto: string
          updated_at?: string
          user_id: string
        }
        Update: {
          a_quien_sustituye?: string | null
          cliente_area_id?: string
          created_at?: string
          empresa_id?: string | null
          estatus?: Database["public"]["Enums"]["estatus_vacante"]
          fecha_cierre?: string | null
          fecha_solicitud?: string
          fecha_solicitud_cierre?: string | null
          folio?: string
          id?: string
          lugar_trabajo?: Database["public"]["Enums"]["modalidad_trabajo"]
          motivo?: Database["public"]["Enums"]["motivo_vacante"]
          motivo_solicitud_cierre?: string | null
          observaciones?: string | null
          perfil_requerido?: string | null
          reclutador_asignado_id?: string | null
          reclutador_id?: string | null
          solicitud_cierre?: boolean | null
          sueldo_bruto_aprobado?: number | null
          titulo_puesto?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vacantes_cliente_area_id_fkey"
            columns: ["cliente_area_id"]
            isOneToOne: false
            referencedRelation: "clientes_areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vacantes_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vacantes_reclutador_asignado_id_fkey"
            columns: ["reclutador_asignado_id"]
            isOneToOne: false
            referencedRelation: "perfil_reclutador"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vacantes_reclutador_id_fkey"
            columns: ["reclutador_id"]
            isOneToOne: false
            referencedRelation: "perfil_reclutador"
            referencedColumns: ["id"]
          },
        ]
      }
      wallet_empresa: {
        Row: {
          created_at: string
          creditos_disponibles: number
          creditos_heredados_totales: number
          creditos_totales_comprados: number
          empresa_id: string
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          creditos_disponibles?: number
          creditos_heredados_totales?: number
          creditos_totales_comprados?: number
          empresa_id: string
          id?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          creditos_disponibles?: number
          creditos_heredados_totales?: number
          creditos_totales_comprados?: number
          empresa_id?: string
          id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "wallet_empresa_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: true
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      wallet_reclutador: {
        Row: {
          created_at: string
          creditos_heredados: number
          creditos_propios: number
          creditos_totales_comprados: number
          id: string
          reclutador_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          creditos_heredados?: number
          creditos_propios?: number
          creditos_totales_comprados?: number
          id?: string
          reclutador_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          creditos_heredados?: number
          creditos_propios?: number
          creditos_totales_comprados?: number
          id?: string
          reclutador_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "wallet_reclutador_reclutador_id_fkey"
            columns: ["reclutador_id"]
            isOneToOne: true
            referencedRelation: "perfil_reclutador"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      decrypt_sensitive_data: {
        Args: { encrypted_data: string }
        Returns: string
      }
      encrypt_sensitive_data: { Args: { data: string }; Returns: string }
      generate_unique_code: { Args: { prefix: string }; Returns: string }
      get_creditos_disponibles_reclutador: {
        Args: { p_reclutador_id: string }
        Returns: number
      }
      get_empresa_decrypted: {
        Args: { empresa_id: string }
        Returns: {
          direccion_fiscal_decrypted: string
          email_contacto: string
          id: string
          nombre_empresa: string
          razon_social_decrypted: string
          rfc_decrypted: string
          telefono_contacto: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_reclutador_asignado_de_postulacion: {
        Args: { p_postulacion_id: string }
        Returns: boolean
      }
      mark_questionnaire_token_used: {
        Args: { p_token_id: string }
        Returns: boolean
      }
      puede_gestionar_postulacion: {
        Args: { p_postulacion_id: string }
        Returns: boolean
      }
      puede_gestionar_postulacion_por_publicacion: {
        Args: { p_publicacion_id: string }
        Returns: boolean
      }
      registrar_movimiento_creditos: {
        Args: {
          p_candidato_user_id?: string
          p_creditos_cantidad: number
          p_descripcion: string
          p_empresa_id: string
          p_metadata?: Json
          p_metodo?: Database["public"]["Enums"]["metodo_ejecucion"]
          p_origen_pago: Database["public"]["Enums"]["origen_pago"]
          p_postulacion_id?: string
          p_reclutador_user_id: string
          p_tipo_accion: Database["public"]["Enums"]["tipo_accion_credito"]
          p_vacante_id?: string
          p_wallet_empresa_id: string
          p_wallet_reclutador_id: string
        }
        Returns: string
      }
      safe_decrypt: {
        Args: { encrypted_data: string; fallback_data?: string }
        Returns: string
      }
      safe_encrypt: { Args: { data: string }; Returns: string }
      validate_questionnaire_token: {
        Args: { p_token: string }
        Returns: {
          empresa_id: string
          fecha_expiracion: string
          tipo_guia: string
          token_id: string
          trabajador_email: string
          trabajador_id: string
          trabajador_nombre: string
          trabajador_telefono: string
          usado: boolean
        }[]
      }
    }
    Enums: {
      app_role:
        | "admin"
        | "rrhh"
        | "solo_lectura"
        | "admin_empresa"
        | "reclutador"
        | "candidato"
        | "verificador"
      estado_asociacion: "activa" | "inactiva" | "finalizada"
      estado_invitacion: "pendiente" | "aceptada" | "rechazada" | "expirada"
      estatus_vacante: "abierta" | "cerrada" | "cancelada"
      metodo_ejecucion: "manual" | "automatico_ia" | "sistema"
      modalidad_trabajo: "hibrido" | "remoto" | "presencial"
      motivo_vacante:
        | "reposicion"
        | "crecimiento"
        | "temporal"
        | "baja_personal"
        | "incapacidad"
        | "crecimiento_negocio"
        | "nuevo_puesto"
      origen_pago: "empresa" | "reclutador" | "heredado_empresa"
      plan_empresa: "basico" | "profesional" | "enterprise"
      plan_reclutador: "basico" | "profesional" | "premium"
      senioridad: "junior" | "senior"
      tamano_empresa: "micro" | "pyme" | "mediana" | "grande"
      tipo_accion_credito:
        | "compra_creditos"
        | "publicacion_vacante"
        | "acceso_pool_candidatos"
        | "descarga_cv"
        | "contacto_candidato"
        | "estudio_socioeconomico"
        | "evaluacion_psicometrica"
        | "sourcing_ia"
        | "herencia_creditos"
        | "devolucion_creditos"
        | "ajuste_manual"
        | "expiracion_creditos"
      tipo_reclutador: "interno" | "freelance"
      tipo_usuario: "dueno_direccion" | "profesional_rrhh"
      tipo_vinculacion: "interno" | "freelance"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: [
        "admin",
        "rrhh",
        "solo_lectura",
        "admin_empresa",
        "reclutador",
        "candidato",
        "verificador",
      ],
      estado_asociacion: ["activa", "inactiva", "finalizada"],
      estado_invitacion: ["pendiente", "aceptada", "rechazada", "expirada"],
      estatus_vacante: ["abierta", "cerrada", "cancelada"],
      metodo_ejecucion: ["manual", "automatico_ia", "sistema"],
      modalidad_trabajo: ["hibrido", "remoto", "presencial"],
      motivo_vacante: [
        "reposicion",
        "crecimiento",
        "temporal",
        "baja_personal",
        "incapacidad",
        "crecimiento_negocio",
        "nuevo_puesto",
      ],
      origen_pago: ["empresa", "reclutador", "heredado_empresa"],
      plan_empresa: ["basico", "profesional", "enterprise"],
      plan_reclutador: ["basico", "profesional", "premium"],
      senioridad: ["junior", "senior"],
      tamano_empresa: ["micro", "pyme", "mediana", "grande"],
      tipo_accion_credito: [
        "compra_creditos",
        "publicacion_vacante",
        "acceso_pool_candidatos",
        "descarga_cv",
        "contacto_candidato",
        "estudio_socioeconomico",
        "evaluacion_psicometrica",
        "sourcing_ia",
        "herencia_creditos",
        "devolucion_creditos",
        "ajuste_manual",
        "expiracion_creditos",
      ],
      tipo_reclutador: ["interno", "freelance"],
      tipo_usuario: ["dueno_direccion", "profesional_rrhh"],
      tipo_vinculacion: ["interno", "freelance"],
    },
  },
} as const
