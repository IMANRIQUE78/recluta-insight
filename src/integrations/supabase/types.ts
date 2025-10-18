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
      candidatos: {
        Row: {
          contratado: boolean
          created_at: string
          etapa_maxima: Database["public"]["Enums"]["etapa_proceso"] | null
          fecha_ingreso: string | null
          fuente: Database["public"]["Enums"]["fuente_candidato"]
          id: string
          updated_at: string
          vacante_id: string
        }
        Insert: {
          contratado?: boolean
          created_at?: string
          etapa_maxima?: Database["public"]["Enums"]["etapa_proceso"] | null
          fecha_ingreso?: string | null
          fuente: Database["public"]["Enums"]["fuente_candidato"]
          id?: string
          updated_at?: string
          vacante_id: string
        }
        Update: {
          contratado?: boolean
          created_at?: string
          etapa_maxima?: Database["public"]["Enums"]["etapa_proceso"] | null
          fecha_ingreso?: string | null
          fuente?: Database["public"]["Enums"]["fuente_candidato"]
          id?: string
          updated_at?: string
          vacante_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "candidatos_vacante_id_fkey"
            columns: ["vacante_id"]
            isOneToOne: false
            referencedRelation: "vacantes"
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
      costos: {
        Row: {
          created_at: string
          fecha: string
          id: string
          monto: number
          tipo_costo: string
          updated_at: string
          vacante_id: string
        }
        Insert: {
          created_at?: string
          fecha: string
          id?: string
          monto: number
          tipo_costo: string
          updated_at?: string
          vacante_id: string
        }
        Update: {
          created_at?: string
          fecha?: string
          id?: string
          monto?: number
          tipo_costo?: string
          updated_at?: string
          vacante_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "costos_vacante_id_fkey"
            columns: ["vacante_id"]
            isOneToOne: false
            referencedRelation: "vacantes"
            referencedColumns: ["id"]
          },
        ]
      }
      entrevistas_candidato: {
        Row: {
          asistio: boolean | null
          candidato_user_id: string
          created_at: string
          duracion_minutos: number | null
          fecha_entrevista: string
          id: string
          notas: string | null
          postulacion_id: string
          tipo_entrevista: string | null
          updated_at: string
        }
        Insert: {
          asistio?: boolean | null
          candidato_user_id: string
          created_at?: string
          duracion_minutos?: number | null
          fecha_entrevista: string
          id?: string
          notas?: string | null
          postulacion_id: string
          tipo_entrevista?: string | null
          updated_at?: string
        }
        Update: {
          asistio?: boolean | null
          candidato_user_id?: string
          created_at?: string
          duracion_minutos?: number | null
          fecha_entrevista?: string
          id?: string
          notas?: string | null
          postulacion_id?: string
          tipo_entrevista?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      estadisticas_reclutador: {
        Row: {
          created_at: string
          id: string
          promedio_dias_cierre: number
          ranking_score: number | null
          ultima_actualizacion: string
          updated_at: string
          user_id: string
          vacantes_cerradas: number
        }
        Insert: {
          created_at?: string
          id?: string
          promedio_dias_cierre?: number
          ranking_score?: number | null
          ultima_actualizacion?: string
          updated_at?: string
          user_id: string
          vacantes_cerradas?: number
        }
        Update: {
          created_at?: string
          id?: string
          promedio_dias_cierre?: number
          ranking_score?: number | null
          ultima_actualizacion?: string
          updated_at?: string
          user_id?: string
          vacantes_cerradas?: number
        }
        Relationships: []
      }
      eventos_proceso: {
        Row: {
          created_at: string
          etapa: Database["public"]["Enums"]["etapa_proceso"]
          fecha_fin: string | null
          fecha_inicio: string
          id: string
          updated_at: string
          vacante_id: string
        }
        Insert: {
          created_at?: string
          etapa: Database["public"]["Enums"]["etapa_proceso"]
          fecha_fin?: string | null
          fecha_inicio: string
          id?: string
          updated_at?: string
          vacante_id: string
        }
        Update: {
          created_at?: string
          etapa?: Database["public"]["Enums"]["etapa_proceso"]
          fecha_fin?: string | null
          fecha_inicio?: string
          id?: string
          updated_at?: string
          vacante_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "eventos_proceso_vacante_id_fkey"
            columns: ["vacante_id"]
            isOneToOne: false
            referencedRelation: "vacantes"
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
      perfil_candidato: {
        Row: {
          anos_experiencia: number | null
          carrera: string | null
          created_at: string
          disponibilidad: string | null
          email: string
          empresa_actual: string | null
          github_url: string | null
          habilidades_blandas: string[] | null
          habilidades_tecnicas: string[] | null
          id: string
          idiomas: Json | null
          institucion: string | null
          linkedin_url: string | null
          modalidad_preferida: string | null
          nivel_educacion: string | null
          nivel_seniority: string | null
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
          anos_experiencia?: number | null
          carrera?: string | null
          created_at?: string
          disponibilidad?: string | null
          email: string
          empresa_actual?: string | null
          github_url?: string | null
          habilidades_blandas?: string[] | null
          habilidades_tecnicas?: string[] | null
          id?: string
          idiomas?: Json | null
          institucion?: string | null
          linkedin_url?: string | null
          modalidad_preferida?: string | null
          nivel_educacion?: string | null
          nivel_seniority?: string | null
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
          anos_experiencia?: number | null
          carrera?: string | null
          created_at?: string
          disponibilidad?: string | null
          email?: string
          empresa_actual?: string | null
          github_url?: string | null
          habilidades_blandas?: string[] | null
          habilidades_tecnicas?: string[] | null
          id?: string
          idiomas?: Json | null
          institucion?: string | null
          linkedin_url?: string | null
          modalidad_preferida?: string | null
          nivel_educacion?: string | null
          nivel_seniority?: string | null
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
      perfil_usuario: {
        Row: {
          created_at: string
          descripcion_empresa: string | null
          descripcion_reclutador: string | null
          frecuencia_actualizacion: string
          horizonte_planeacion: number
          id: string
          metricas_clave: string[] | null
          miden_indicadores: boolean
          mostrar_empresa_publica: boolean
          nombre_empresa: string | null
          nombre_reclutador: string | null
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
          descripcion_reclutador?: string | null
          frecuencia_actualizacion?: string
          horizonte_planeacion?: number
          id?: string
          metricas_clave?: string[] | null
          miden_indicadores?: boolean
          mostrar_empresa_publica?: boolean
          nombre_empresa?: string | null
          nombre_reclutador?: string | null
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
          descripcion_reclutador?: string | null
          frecuencia_actualizacion?: string
          horizonte_planeacion?: number
          id?: string
          metricas_clave?: string[] | null
          miden_indicadores?: boolean
          mostrar_empresa_publica?: boolean
          nombre_empresa?: string | null
          nombre_reclutador?: string | null
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
      reclutadores: {
        Row: {
          correo: string
          costo_hora: number
          created_at: string
          equipo: string | null
          id: string
          nombre: string
          senioridad: Database["public"]["Enums"]["senioridad"]
          updated_at: string
          user_id: string
        }
        Insert: {
          correo: string
          costo_hora?: number
          created_at?: string
          equipo?: string | null
          id?: string
          nombre: string
          senioridad: Database["public"]["Enums"]["senioridad"]
          updated_at?: string
          user_id: string
        }
        Update: {
          correo?: string
          costo_hora?: number
          created_at?: string
          equipo?: string | null
          id?: string
          nombre?: string
          senioridad?: Database["public"]["Enums"]["senioridad"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      rotacion: {
        Row: {
          created_at: string
          empleado_hash: string
          fecha_baja: string | null
          fecha_ingreso: string
          id: string
          motivo_baja: string | null
          updated_at: string
          vacante_id: string
        }
        Insert: {
          created_at?: string
          empleado_hash: string
          fecha_baja?: string | null
          fecha_ingreso: string
          id?: string
          motivo_baja?: string | null
          updated_at?: string
          vacante_id: string
        }
        Update: {
          created_at?: string
          empleado_hash?: string
          fecha_baja?: string | null
          fecha_ingreso?: string
          id?: string
          motivo_baja?: string | null
          updated_at?: string
          vacante_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rotacion_vacante_id_fkey"
            columns: ["vacante_id"]
            isOneToOne: false
            referencedRelation: "vacantes"
            referencedColumns: ["id"]
          },
        ]
      }
      satisfaccion: {
        Row: {
          comentarios: string | null
          created_at: string
          fecha: string
          id: string
          nps: number | null
          satisfaccion: number | null
          updated_at: string
          vacante_id: string
        }
        Insert: {
          comentarios?: string | null
          created_at?: string
          fecha?: string
          id?: string
          nps?: number | null
          satisfaccion?: number | null
          updated_at?: string
          vacante_id: string
        }
        Update: {
          comentarios?: string | null
          created_at?: string
          fecha?: string
          id?: string
          nps?: number | null
          satisfaccion?: number | null
          updated_at?: string
          vacante_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "satisfaccion_vacante_id_fkey"
            columns: ["vacante_id"]
            isOneToOne: false
            referencedRelation: "vacantes"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      vacantes: {
        Row: {
          a_quien_sustituye: string | null
          cliente_area_id: string
          created_at: string
          estatus: Database["public"]["Enums"]["estatus_vacante"]
          fecha_cierre: string | null
          fecha_solicitud: string
          folio: string
          id: string
          lugar_trabajo: Database["public"]["Enums"]["modalidad_trabajo"]
          motivo: Database["public"]["Enums"]["motivo_vacante"]
          observaciones: string | null
          perfil_requerido: string | null
          reclutador_id: string | null
          sueldo_bruto_aprobado: number | null
          titulo_puesto: string
          updated_at: string
          user_id: string
        }
        Insert: {
          a_quien_sustituye?: string | null
          cliente_area_id: string
          created_at?: string
          estatus?: Database["public"]["Enums"]["estatus_vacante"]
          fecha_cierre?: string | null
          fecha_solicitud: string
          folio: string
          id?: string
          lugar_trabajo: Database["public"]["Enums"]["modalidad_trabajo"]
          motivo: Database["public"]["Enums"]["motivo_vacante"]
          observaciones?: string | null
          perfil_requerido?: string | null
          reclutador_id?: string | null
          sueldo_bruto_aprobado?: number | null
          titulo_puesto: string
          updated_at?: string
          user_id: string
        }
        Update: {
          a_quien_sustituye?: string | null
          cliente_area_id?: string
          created_at?: string
          estatus?: Database["public"]["Enums"]["estatus_vacante"]
          fecha_cierre?: string | null
          fecha_solicitud?: string
          folio?: string
          id?: string
          lugar_trabajo?: Database["public"]["Enums"]["modalidad_trabajo"]
          motivo?: Database["public"]["Enums"]["motivo_vacante"]
          observaciones?: string | null
          perfil_requerido?: string | null
          reclutador_id?: string | null
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
            foreignKeyName: "vacantes_reclutador_id_fkey"
            columns: ["reclutador_id"]
            isOneToOne: false
            referencedRelation: "reclutadores"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      recalcular_estadisticas_reclutador: {
        Args: { p_user_id: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "rrhh" | "solo_lectura"
      estatus_vacante: "abierta" | "cerrada" | "cancelada"
      etapa_proceso:
        | "sourcing"
        | "screening"
        | "entrevista_rrhh"
        | "entrevista_tecnica"
        | "validacion_cliente"
        | "oferta"
        | "onboarding"
      fuente_candidato: "linkedin" | "referido" | "portal" | "base"
      modalidad_trabajo: "hibrido" | "remoto" | "presencial"
      motivo_vacante:
        | "reposicion"
        | "crecimiento"
        | "temporal"
        | "baja_personal"
        | "incapacidad"
        | "crecimiento_negocio"
        | "nuevo_puesto"
      senioridad: "junior" | "senior"
      tamano_empresa: "micro" | "pyme" | "mediana" | "grande"
      tipo_usuario: "dueno_direccion" | "profesional_rrhh"
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
      app_role: ["admin", "rrhh", "solo_lectura"],
      estatus_vacante: ["abierta", "cerrada", "cancelada"],
      etapa_proceso: [
        "sourcing",
        "screening",
        "entrevista_rrhh",
        "entrevista_tecnica",
        "validacion_cliente",
        "oferta",
        "onboarding",
      ],
      fuente_candidato: ["linkedin", "referido", "portal", "base"],
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
      senioridad: ["junior", "senior"],
      tamano_empresa: ["micro", "pyme", "mediana", "grande"],
      tipo_usuario: ["dueno_direccion", "profesional_rrhh"],
    },
  },
} as const
