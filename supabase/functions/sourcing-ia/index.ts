import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ============================================================================
// CONFIGURACIÓN Y CONSTANTES
// ============================================================================

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const COSTO_SOURCING = 50;
const MAX_CANDIDATOS = 10;
const POOL_SIZE_INDEXADOS = 150;
const POOL_SIZE_SIN_INDEXAR = 50;
const MAX_CANDIDATOS_ANALISIS = 50;
const MAX_PROMPT_LENGTH = 120000;

// Rate limiting
const DRY_RUN_DAILY_LIMIT = 20;
const DRY_RUN_PER_VACANCY_LIMIT = 3;

// ============================================================================
// TIPOS
// ============================================================================

interface VacanteData {
  id: string;
  titulo_puesto: string;
  perfil_requerido: string | null;
  motivo: string;
  lugar_trabajo: string;
  sueldo_bruto_aprobado: number | null;
  observaciones: string | null;
  reclutador_asignado_id: string | null;
  empresa_id: string | null;
  user_id: string;
  cliente_area_id: string | null;
}

interface MatchIA {
  index: number;
  score: number;
  razon: string;
  habilidades_match: string[];
  experiencia_relevante: string[];
}

interface LogMetadata {
  user_id?: string;
  vacante_id?: string;
  publicacion_id?: string;
  [key: string]: any;
}

// ============================================================================
// FUNCIONES UTILITARIAS
// ============================================================================

/** Sistema de logging estructurado con persistencia en BD */
async function logEvent(supabase: any, level: "info" | "warn" | "error", action: string, metadata: LogMetadata) {
  const timestamp = new Date().toISOString();

  // Log a consola (debugging inmediato)
  console.log(`[${timestamp}] [${level.toUpperCase()}] ${action}:`, JSON.stringify(metadata));

  // Persistir en BD (no bloqueante)
  try {
    await supabase.from("logs_sistema").insert({
      nivel: level,
      accion: action,
      metadata: metadata,
      created_at: timestamp,
    });
  } catch (error) {
    // No fallar si el logging falla
    console.error("[LOG ERROR]", error);
  }
}

/** Sanitiza texto para prevenir prompt injection */
function sanitizeForPrompt(text: string | null | undefined): string {
  if (!text) return "No especificado";
  return text
    .replace(
      /IGNORA|IGNORE|OLVIDA|FORGET|NUEVA INSTRUCCIÓN|NEW INSTRUCTION|BYPASS|SYSTEM:|ASSISTANT:|USER:/gi,
      "[filtrado]",
    )
    .replace(/[`]/g, "'")
    .substring(0, 2000)
    .trim();
}

/** Valida estructura de respuesta de IA */
function validateAIResponse(data: any): data is MatchIA[] {
  if (!Array.isArray(data) || data.length === 0) return false;
  return data.every(
    (item) =>
      typeof item.index === "number" &&
      typeof item.score === "number" &&
      typeof item.razon === "string" &&
      Array.isArray(item.habilidades_match) &&
      Array.isArray(item.experiencia_relevante),
  );
}

/** Parsea respuesta de IA con reintentos y limpieza robusta */
async function parseAIResponse(content: string): Promise<MatchIA[]> {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      let clean = content
        .replace(/```json\n?|\n?```/g, "")
        .replace(/```\n?|\n?```/g, "")
        .replace(/,\s*]/g, "]")
        .replace(/,\s*}/g, "}")
        .trim();

      const jsonMatch = clean.match(/\[[\s\S]*\]/);
      if (jsonMatch) clean = jsonMatch[0];

      const parsed = JSON.parse(clean);
      if (!validateAIResponse(parsed)) throw new Error("Estructura inválida");
      return parsed;
    } catch (error) {
      console.error(`[Parse] Intento ${attempt}/3:`, error);
      if (attempt === 3) throw new Error("No se pudo parsear respuesta IA");
      await new Promise((r) => setTimeout(r, 500 * attempt));
    }
  }
  return [];
}

/** Llama a la API de IA con retry automático */
async function callAIWithRetry(apiKey: string, prompt: string): Promise<any> {
  for (let attempt = 0; attempt <= 2; attempt++) {
    try {
      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            {
              role: "system",
              content:
                "Eres un experto en reclutamiento mexicano. Responde SOLO con JSON válido, sin markdown, sin texto adicional.",
            },
            { role: "user", content: prompt },
          ],
          temperature: 0.3,
          max_tokens: 4000,
        }),
      });

      if (response.ok) return await response.json();

      if (response.status === 429 && attempt < 2) {
        const retryAfter = response.headers.get("Retry-After") || "5";
        console.log(`[AI Retry] Rate limited, esperando ${retryAfter}s...`);
        await new Promise((r) => setTimeout(r, parseInt(retryAfter) * 1000));
        continue;
      }

      const errorText = await response.text();
      throw new Error(`AI API error ${response.status}: ${errorText}`);
    } catch (error) {
      if (attempt === 2) throw error;
      console.log(`[AI Retry] Intento ${attempt + 1} falló, reintentando...`);
      await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
    }
  }
  throw new Error("AI API no disponible");
}

/** Deduce créditos de forma atómica (previene race conditions) */
async function deducirCreditosAtomico(
  supabase: any,
  esReclutador: boolean,
  walletReclutadorId: string | null,
  walletEmpresaId: string | null,
  costo: number,
): Promise<{ success: boolean; origen: "reclutador" | "empresa" | "heredado_empresa"; error?: string }> {
  if (esReclutador && walletReclutadorId) {
    const { data, error } = await supabase.rpc("deducir_creditos_reclutador_atomico", {
      p_wallet_id: walletReclutadorId,
      p_costo: costo,
    });
    if (error || !data?.success) {
      return { success: false, origen: "reclutador", error: data?.error || "Créditos insuficientes" };
    }
    return { success: true, origen: data.origen_usado as any };
  } else if (walletEmpresaId) {
    const { data, error } = await supabase.rpc("deducir_creditos_empresa_atomico", {
      p_wallet_id: walletEmpresaId,
      p_costo: costo,
    });
    if (error || !data?.success) {
      return { success: false, origen: "empresa", error: data?.error || "Créditos insuficientes" };
    }
    return { success: true, origen: "empresa" };
  }
  return { success: false, origen: "reclutador", error: "No se encontró wallet válido" };
}

/** Construye el prompt para la IA (función helper para reutilización) */
function buildPrompt(vacanteInfo: any, candidatosParaAnalisis: any[], maxCandidatos: number): string {
  return `Eres un experto en reclutamiento y selección de talento para el mercado mexicano. Analiza los candidatos y selecciona los ${maxCandidatos} mejores matches para la vacante.

===== CONTEXTO DE LA VACANTE =====
EMPRESA SOLICITANTE:
- Empresa: ${vacanteInfo.empresa}
- Sector/Industria: ${vacanteInfo.sector}
- Cliente interno: ${vacanteInfo.cliente}
- Área: ${vacanteInfo.area}

DETALLES DE LA POSICIÓN:
- Título del puesto: ${vacanteInfo.titulo}
- Motivo de la vacante: ${vacanteInfo.motivo_vacante}
- Modalidad de trabajo: ${vacanteInfo.modalidad}
- Ubicación: ${vacanteInfo.ubicacion}
- Rango salarial: ${vacanteInfo.salario ? "$" + vacanteInfo.salario + " MXN brutos" : "No especificado"}

PERFIL REQUERIDO:
${vacanteInfo.perfil_requerido}

${vacanteInfo.observaciones !== "No especificado" ? `OBSERVACIONES ADICIONALES:\n${vacanteInfo.observaciones}` : ""}

===== POOL DE CANDIDATOS =====
${candidatosParaAnalisis
  .map((c, i) => {
    const tieneIndexado = !!c.resumen_indexado_ia;
    const keywords = ((c.keywords_sourcing as string[]) || []).join(", ");
    const industrias = ((c.industrias_detectadas as string[]) || []).join(", ");

    return `
[${i}] ${tieneIndexado ? "✓ PERFIL INDEXADO" : "○ SIN INDEXAR"}
- Nivel experiencia: ${c.nivel_experiencia_ia || "No clasificado"}
- Puesto actual: ${sanitizeForPrompt(c.puesto_actual)}
- Empresa actual: ${sanitizeForPrompt(c.empresa_actual)}
- Educación: ${sanitizeForPrompt(c.nivel_educacion)}${c.carrera ? " en " + sanitizeForPrompt(c.carrera) : ""}
- Keywords técnicas: ${keywords || (c.habilidades_tecnicas || []).join(", ") || "No especificadas"}
- Industrias: ${industrias || "No especificadas"}
- Habilidades blandas: ${(c.habilidades_blandas || []).join(", ") || "No especificadas"}
- Ubicación: ${sanitizeForPrompt(c.ubicacion)}
- Modalidad preferida: ${sanitizeForPrompt(c.modalidad_preferida)}
- Disponibilidad: ${sanitizeForPrompt(c.disponibilidad)}
- Expectativa salarial: ${c.salario_esperado_min ? "$" + c.salario_esperado_min + " - $" + c.salario_esperado_max + " MXN" : "No especificada"}
- Resumen profesional: ${sanitizeForPrompt(c.resumen_indexado_ia || c.resumen_profesional)}
`;
  })
  .join("\n")}

===== CRITERIOS DE MATCHING =====
1. PRIORIZA candidatos marcados como "✓ PERFIL INDEXADO".
2. Considera la COMPATIBILIDAD DE SECTOR/INDUSTRIA.
3. Evalúa la COHERENCIA DEL NIVEL DE EXPERIENCIA.
4. Verifica COMPATIBILIDAD GEOGRÁFICA y de modalidad.
5. Compara EXPECTATIVAS SALARIALES vs el rango ofrecido.
6. Analiza las KEYWORDS TÉCNICAS vs los requisitos del perfil.

===== FORMATO DE RESPUESTA =====
Responde SOLO con un JSON array de los ${maxCandidatos} mejores candidatos, ordenados por score (100=match perfecto).
NO incluyas markdown, NO incluyas texto adicional, SOLO el array JSON:
[
  {
    "index": 0,
    "score": 85,
    "razon": "Explicación concisa del match (máx 100 caracteres)",
    "habilidades_match": ["habilidad1", "habilidad2"],
    "experiencia_relevante": ["experiencia1", "experiencia2"]
  }
]`;
}

// ============================================================================
// EDGE FUNCTION PRINCIPAL
// ============================================================================

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const requestStartTime = Date.now();

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(JSON.stringify({ error: "Configuración del servidor incompleta" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No autorizado - Token requerido" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    const supabaseUser = createClient(supabaseUrl, supabaseServiceKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
      error: userError,
    } = await supabaseUser.auth.getUser();
    if (userError || !user) {
      await logEvent(supabaseAdmin, "warn", "auth_failed", { error: userError?.message });
      return new Response(JSON.stringify({ error: "Usuario no válido" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ========================================================================
    // VALIDACIÓN DE PARÁMETROS
    // ========================================================================

    let body: any;
    try {
      body = await req.json();
    } catch {
      return new Response(JSON.stringify({ error: "Body JSON inválido" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { publicacion_id, dry_run = true } = body;

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!publicacion_id || !uuidRegex.test(publicacion_id)) {
      return new Response(JSON.stringify({ error: "publicacion_id inválido (UUID requerido)" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (typeof dry_run !== "boolean") {
      return new Response(JSON.stringify({ error: "dry_run debe ser boolean" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    await logEvent(supabaseAdmin, "info", "sourcing_iniciado", {
      user_id: user.id,
      publicacion_id,
      dry_run,
    });

    // ========================================================================
    // OBTENER DATOS DE LA PUBLICACIÓN
    // ========================================================================

    const { data: publicacion, error: pubError } = await supabaseAdmin
      .from("publicaciones_marketplace")
      .select(
        `
        id, titulo_puesto, perfil_requerido, ubicacion, lugar_trabajo,
        sueldo_bruto_aprobado, cliente_area, observaciones, vacante_id, user_id,
        vacantes!inner(
          id, titulo_puesto, perfil_requerido, motivo, lugar_trabajo,
          sueldo_bruto_aprobado, observaciones, reclutador_asignado_id,
          empresa_id, user_id, cliente_area_id
        )
      `,
      )
      .eq("id", publicacion_id)
      .eq("publicada", true)
      .single();

    if (pubError || !publicacion) {
      await logEvent(supabaseAdmin, "warn", "publicacion_no_encontrada", {
        user_id: user.id,
        publicacion_id,
        error: pubError?.message,
      });
      return new Response(JSON.stringify({ error: "Publicación no encontrada o no publicada" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const vacante = publicacion.vacantes as unknown as VacanteData;

    let clienteArea: { cliente_nombre: string; area: string; ubicacion: string | null } | null = null;
    let empresaInfo: { nombre_empresa: string; sector: string | null } | null = null;

    if (vacante.cliente_area_id) {
      const { data: ca } = await supabaseAdmin
        .from("clientes_areas")
        .select("cliente_nombre, area, ubicacion")
        .eq("id", vacante.cliente_area_id)
        .maybeSingle();
      clienteArea = ca;
    }

    if (vacante.empresa_id) {
      const { data: emp } = await supabaseAdmin
        .from("empresas")
        .select("nombre_empresa, sector")
        .eq("id", vacante.empresa_id)
        .maybeSingle();
      empresaInfo = emp;
    }

    // ========================================================================
    // VERIFICAR PERMISOS
    // ========================================================================

    let esReclutador = false;
    let esEmpresa = false;
    let reclutadorId: string | null = null;
    let empresaId: string | null = vacante.empresa_id;

    if (vacante.reclutador_asignado_id) {
      const { data: perfilReclutador } = await supabaseAdmin
        .from("perfil_reclutador")
        .select("id")
        .eq("id", vacante.reclutador_asignado_id)
        .eq("user_id", user.id)
        .single();

      if (perfilReclutador) {
        esReclutador = true;
        reclutadorId = perfilReclutador.id;
      }
    }

    if (vacante.user_id === user.id) {
      esEmpresa = true;
    }

    if (!esReclutador && !esEmpresa) {
      await logEvent(supabaseAdmin, "warn", "permisos_insuficientes", {
        user_id: user.id,
        vacante_id: vacante.id,
      });
      return new Response(JSON.stringify({ error: "No tienes permisos para ejecutar sourcing en esta vacante" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ========================================================================
    // VERIFICAR CRÉDITOS
    // ========================================================================

    let creditosDisponibles = 0;
    let walletReclutadorId: string | null = null;
    let walletEmpresaId: string | null = null;

    if (esReclutador && reclutadorId) {
      const { data: walletRec } = await supabaseAdmin
        .from("wallet_reclutador")
        .select("id, creditos_propios, creditos_heredados")
        .eq("reclutador_id", reclutadorId)
        .single();

      if (walletRec) {
        walletReclutadorId = walletRec.id;
        creditosDisponibles = (walletRec.creditos_propios || 0) + (walletRec.creditos_heredados || 0);
      }
    } else if (esEmpresa && empresaId) {
      const { data: walletEmp } = await supabaseAdmin
        .from("wallet_empresa")
        .select("id, creditos_disponibles")
        .eq("empresa_id", empresaId)
        .single();

      if (walletEmp) {
        walletEmpresaId = walletEmp.id;
        creditosDisponibles = walletEmp.creditos_disponibles || 0;
      }
    }

    if (creditosDisponibles < COSTO_SOURCING) {
      await logEvent(supabaseAdmin, "warn", "creditos_insuficientes", {
        user_id: user.id,
        vacante_id: vacante.id,
        creditos_requeridos: COSTO_SOURCING,
      });
      return new Response(
        JSON.stringify({
          error: "Créditos insuficientes para ejecutar sourcing",
          creditos_requeridos: COSTO_SOURCING,
        }),
        { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // ========================================================================
    // OBTENER POOL DE CANDIDATOS (DIVERSIFICADO)
    // ========================================================================

    const candidateSelect = `
      user_id, nombre_completo, email, telefono, ubicacion,
      puesto_actual, empresa_actual, nivel_educacion, carrera, institucion,
      habilidades_tecnicas, habilidades_blandas, experiencia_laboral,
      salario_esperado_min, salario_esperado_max, disponibilidad,
      modalidad_preferida, resumen_profesional, resumen_indexado_ia,
      keywords_sourcing, industrias_detectadas, nivel_experiencia_ia, fecha_indexado_ia
    `;

    const { data: candidatosIndexados } = await supabaseAdmin
      .from("perfil_candidato")
      .select(candidateSelect)
      .not("fecha_indexado_ia", "is", null)
      .order("fecha_indexado_ia", { ascending: false })
      .limit(POOL_SIZE_INDEXADOS);

    const { data: candidatosSinIndexar } = await supabaseAdmin
      .from("perfil_candidato")
      .select(candidateSelect)
      .is("fecha_indexado_ia", null)
      .limit(POOL_SIZE_SIN_INDEXAR);

    const todosCandidatos = [...(candidatosIndexados || []), ...(candidatosSinIndexar || [])];

    // Filtrar ya postulados y ya sourced
    const { data: postulacionesExistentes } = await supabaseAdmin
      .from("postulaciones")
      .select("candidato_user_id")
      .eq("publicacion_id", publicacion_id);

    const idsPostulados = new Set((postulacionesExistentes || []).map((p) => p.candidato_user_id));

    const { data: sourcingExistente } = await supabaseAdmin
      .from("sourcing_ia")
      .select("candidato_user_id")
      .eq("vacante_id", vacante.id);

    const idsSourceados = new Set((sourcingExistente || []).map((s) => s.candidato_user_id));

    const candidatosDisponibles = todosCandidatos.filter(
      (c) => !idsPostulados.has(c.user_id) && !idsSourceados.has(c.user_id),
    );

    await logEvent(supabaseAdmin, "info", "pool_candidatos", {
      user_id: user.id,
      vacante_id: vacante.id,
      total_indexados: candidatosIndexados?.length || 0,
      total_sin_indexar: candidatosSinIndexar?.length || 0,
      total_disponibles: candidatosDisponibles.length,
    });

    if (candidatosDisponibles.length === 0) {
      return new Response(
        JSON.stringify({
          error: "No hay candidatos disponibles para sourcing",
          mensaje: "Todos los candidatos ya fueron postulados o sourced para esta vacante",
        }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // ========================================================================
    // DRY RUN - SIMULACIÓN CON RATE LIMITING
    // ========================================================================

    if (dry_run) {
      const oneDayAgo = new Date(Date.now() - 86400000).toISOString();

      const { count: dailyCount } = await supabaseAdmin
        .from("sourcing_audit")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("action", "dry_run")
        .gte("created_at", oneDayAgo);

      if ((dailyCount || 0) >= DRY_RUN_DAILY_LIMIT) {
        return new Response(JSON.stringify({ error: "Límite diario de simulaciones alcanzado. Intenta mañana." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { count: vacancyCount } = await supabaseAdmin
        .from("sourcing_audit")
        .select("*", { count: "exact", head: true })
        .eq("vacante_id", vacante.id)
        .eq("user_id", user.id)
        .eq("action", "dry_run")
        .gte("created_at", oneDayAgo);

      if ((vacancyCount || 0) >= DRY_RUN_PER_VACANCY_LIMIT) {
        return new Response(JSON.stringify({ error: "Límite de simulaciones para esta vacante alcanzado." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      await supabaseAdmin.from("sourcing_audit").insert({
        user_id: user.id,
        vacante_id: vacante.id,
        publicacion_id: publicacion_id,
        action: "dry_run",
      });

      await logEvent(supabaseAdmin, "info", "dry_run_completado", {
        user_id: user.id,
        vacante_id: vacante.id,
        count_diario: (dailyCount || 0) + 1,
      });

      return new Response(
        JSON.stringify({
          success: true,
          dry_run: true,
          mensaje: "Simulación exitosa - No se consumieron créditos",
          vacante: { id: vacante.id, titulo: publicacion.titulo_puesto },
          candidatos_a_analizar: Math.min(candidatosDisponibles.length, MAX_CANDIDATOS_ANALISIS),
          costo_creditos: COSTO_SOURCING,
          creditos_suficientes: true,
          simulaciones_restantes_hoy: DRY_RUN_DAILY_LIMIT - ((dailyCount || 0) + 1),
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // ========================================================================
    // EJECUCIÓN REAL
    // ========================================================================

    if (!lovableApiKey) {
      return new Response(JSON.stringify({ error: "Servicio de IA no configurado" }), {
        status: 503,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    await supabaseAdmin.from("sourcing_audit").insert({
      user_id: user.id,
      vacante_id: vacante.id,
      publicacion_id: publicacion_id,
      action: "execution",
    });

    // Contexto sanitizado para IA
    const vacanteInfo = {
      titulo: sanitizeForPrompt(publicacion.titulo_puesto),
      perfil_requerido: sanitizeForPrompt(publicacion.perfil_requerido || vacante.perfil_requerido),
      ubicacion: sanitizeForPrompt(publicacion.ubicacion || clienteArea?.ubicacion),
      modalidad: sanitizeForPrompt(publicacion.lugar_trabajo || vacante.lugar_trabajo),
      salario: publicacion.sueldo_bruto_aprobado || vacante.sueldo_bruto_aprobado,
      observaciones: sanitizeForPrompt(publicacion.observaciones || vacante.observaciones),
      motivo_vacante: sanitizeForPrompt(vacante.motivo),
      cliente: sanitizeForPrompt(clienteArea?.cliente_nombre || publicacion.cliente_area),
      area: sanitizeForPrompt(clienteArea?.area),
      empresa: sanitizeForPrompt(empresaInfo?.nombre_empresa),
      sector: sanitizeForPrompt(empresaInfo?.sector),
    };

    let candidatosParaAnalisis = candidatosDisponibles.slice(0, MAX_CANDIDATOS_ANALISIS);

    // Construir prompt inicial
    let prompt = buildPrompt(vacanteInfo, candidatosParaAnalisis, MAX_CANDIDATOS);

    // ✅ FIX CRÍTICO: Verificar y RECONSTRUIR prompt si es muy largo
    if (prompt.length > MAX_PROMPT_LENGTH) {
      // Reducir candidatos hasta que el prompt quepa
      const reduccionFactor = Math.ceil(candidatosParaAnalisis.length / 2);
      candidatosParaAnalisis = candidatosParaAnalisis.slice(0, Math.max(10, reduccionFactor));

      await logEvent(supabaseAdmin, "warn", "prompt_reducido", {
        user_id: user.id,
        vacante_id: vacante.id,
        candidatos_originales: MAX_CANDIDATOS_ANALISIS,
        candidatos_reducidos: candidatosParaAnalisis.length,
        prompt_original_length: prompt.length,
      });

      // RECONSTRUIR prompt con menos candidatos
      prompt = buildPrompt(vacanteInfo, candidatosParaAnalisis, MAX_CANDIDATOS);
    }

    await logEvent(supabaseAdmin, "info", "llamada_ia_iniciada", {
      user_id: user.id,
      vacante_id: vacante.id,
      candidatos_analizar: candidatosParaAnalisis.length,
      prompt_length: prompt.length,
    });

    // ========================================================================
    // LLAMAR A IA CON RETRY
    // ========================================================================

    let aiData: any;
    try {
      aiData = await callAIWithRetry(lovableApiKey, prompt);
    } catch (error: any) {
      await logEvent(supabaseAdmin, "error", "ia_error", {
        user_id: user.id,
        vacante_id: vacante.id,
        error: error.message,
      });

      if (error.message.includes("429")) {
        return new Response(JSON.stringify({ error: "Límite de solicitudes de IA excedido, intenta más tarde" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (error.message.includes("402")) {
        return new Response(JSON.stringify({ error: "Créditos de IA agotados" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "Error al procesar con IA" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiContent = aiData.choices?.[0]?.message?.content || "[]";

    // ========================================================================
    // PARSEAR RESPUESTA CON REINTENTOS
    // ========================================================================

    let matchesIA: MatchIA[];
    try {
      matchesIA = await parseAIResponse(aiContent);
    } catch (parseError: any) {
      await logEvent(supabaseAdmin, "error", "parse_ia_error", {
        user_id: user.id,
        vacante_id: vacante.id,
        error: parseError.message,
        ai_content_preview: aiContent.substring(0, 200),
      });

      return new Response(JSON.stringify({ error: "Error al procesar respuesta de IA" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (matchesIA.length === 0) {
      await logEvent(supabaseAdmin, "warn", "ia_sin_matches", {
        user_id: user.id,
        vacante_id: vacante.id,
      });
      return new Response(JSON.stringify({ error: "La IA no encontró candidatos compatibles" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const loteSourcing = crypto.randomUUID();

    await logEvent(supabaseAdmin, "info", "matches_encontrados", {
      user_id: user.id,
      vacante_id: vacante.id,
      total_matches: matchesIA.length,
      lote: loteSourcing,
    });

    // ========================================================================
    // DEDUCIR CRÉDITOS DE FORMA ATÓMICA
    // ========================================================================

    const deduccionResult = await deducirCreditosAtomico(
      supabaseAdmin,
      esReclutador,
      walletReclutadorId,
      walletEmpresaId,
      COSTO_SOURCING,
    );

    if (!deduccionResult.success) {
      await logEvent(supabaseAdmin, "error", "deduccion_creditos_fallida", {
        user_id: user.id,
        vacante_id: vacante.id,
        error: deduccionResult.error,
      });

      return new Response(JSON.stringify({ error: deduccionResult.error }), {
        status: 402,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const origenPago = deduccionResult.origen;

    // ========================================================================
    // REGISTRAR MOVIMIENTO DE CRÉDITOS
    // ========================================================================

    await supabaseAdmin.rpc("registrar_movimiento_creditos", {
      p_origen_pago: origenPago,
      p_wallet_empresa_id: walletEmpresaId,
      p_wallet_reclutador_id: walletReclutadorId,
      p_empresa_id: empresaId,
      p_reclutador_user_id: user.id,
      p_tipo_accion: "sourcing_ia",
      p_creditos_cantidad: -COSTO_SOURCING,
      p_descripcion: `Sourcing IA para vacante: ${publicacion.titulo_puesto}`,
      p_vacante_id: vacante.id,
      p_metodo: "automatico_ia",
      p_metadata: { lote_sourcing: loteSourcing, candidatos_analizados: matchesIA.length, origen_pago: origenPago },
    });

    // ========================================================================
    // INSERTAR RESULTADOS CON COMPENSACIÓN EN CASO DE ERROR
    // ========================================================================

    const sourcingRecords = matchesIA.map((match) => {
      const candidato = candidatosParaAnalisis[match.index];
      return {
        vacante_id: vacante.id,
        publicacion_id: publicacion_id,
        candidato_user_id: candidato.user_id,
        reclutador_ejecutor_id: esReclutador ? reclutadorId : null,
        empresa_ejecutora_id: esEmpresa ? empresaId : null,
        ejecutor_user_id: user.id,
        score_match: Math.min(100, Math.max(0, match.score)),
        razon_match: match.razon.substring(0, 255),
        habilidades_coincidentes: match.habilidades_match || [],
        experiencia_relevante: match.experiencia_relevante || [],
        estado: "pendiente",
        creditos_consumidos: COSTO_SOURCING / MAX_CANDIDATOS,
        lote_sourcing: loteSourcing,
      };
    });

    const { error: insertError } = await supabaseAdmin.from("sourcing_ia").insert(sourcingRecords);

    if (insertError) {
      await logEvent(supabaseAdmin, "error", "insert_sourcing_error", {
        user_id: user.id,
        vacante_id: vacante.id,
        lote: loteSourcing,
        error: insertError.message,
      });

      // Registrar compensación pendiente
      await supabaseAdmin.from("creditos_compensacion").insert({
        user_id: user.id,
        wallet_reclutador_id: walletReclutadorId,
        wallet_empresa_id: walletEmpresaId,
        creditos_compensar: COSTO_SOURCING,
        razon: `Error al insertar sourcing: ${insertError.message}`,
        lote_sourcing: loteSourcing,
      });

      return new Response(JSON.stringify({ error: "Error al guardar resultados. Se compensarán los créditos." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ========================================================================
    // REGISTRAR ACCESO A IDENTIDADES
    // ========================================================================

    if (reclutadorId) {
      const accesosIdentidad = matchesIA.map((match) => ({
        reclutador_id: reclutadorId,
        candidato_user_id: candidatosParaAnalisis[match.index].user_id,
        empresa_id: empresaId,
        origen_pago: origenPago,
        creditos_consumidos: 0,
      }));

      await supabaseAdmin.from("acceso_identidad_candidato").upsert(accesosIdentidad, {
        onConflict: "reclutador_id,candidato_user_id",
        ignoreDuplicates: true,
      });
    }

    // ========================================================================
    // RESPUESTA EXITOSA
    // ========================================================================

    const executionTime = Date.now() - requestStartTime;

    await logEvent(supabaseAdmin, "info", "sourcing_completado", {
      user_id: user.id,
      vacante_id: vacante.id,
      lote: loteSourcing,
      candidatos_encontrados: matchesIA.length,
      creditos_consumidos: COSTO_SOURCING,
      origen_pago: origenPago,
      execution_time_ms: executionTime,
    });

    return new Response(
      JSON.stringify({
        success: true,
        lote_sourcing: loteSourcing,
        candidatos_encontrados: matchesIA.length,
        creditos_consumidos: COSTO_SOURCING,
        origen_pago: origenPago,
        mensaje: `Se encontraron ${matchesIA.length} candidatos potenciales para la vacante "${publicacion.titulo_puesto}"`,
        execution_time_ms: executionTime,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error: any) {
    // Log de error general
    try {
      const supabaseAdmin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

      await logEvent(supabaseAdmin, "error", "error_no_controlado", {
        error: error.message,
        stack: error.stack,
      });
    } catch {
      console.error("[Sourcing IA] Error general:", error);
    }

    return new Response(JSON.stringify({ error: "Error interno del servidor" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
