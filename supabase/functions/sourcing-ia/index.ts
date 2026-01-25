import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const COSTO_SOURCING = 50; // 50 créditos por 10 candidatos
const MAX_CANDIDATOS = 10;

// Rate limiting constants
const DRY_RUN_DAILY_LIMIT = 20; // por usuario por día
const DRY_RUN_PER_VACANCY_LIMIT = 3; // por vacante por usuario por día

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    
    // Get auth token from request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No autorizado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    const supabaseUser = createClient(supabaseUrl, supabaseServiceKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Get user from token
    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !user) {
      console.error('Error getting user:', userError);
      return new Response(
        JSON.stringify({ error: 'Usuario no válido' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { publicacion_id, dry_run = true } = await req.json();

    if (!publicacion_id) {
      return new Response(
        JSON.stringify({ error: 'Se requiere publicacion_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[Sourcing IA] Usuario: ${user.id}, Publicación: ${publicacion_id}, DryRun: ${dry_run}`);

    // 1. Obtener datos de la publicación y vacante
    const { data: publicacion, error: pubError } = await supabaseAdmin
      .from('publicaciones_marketplace')
      .select(`
        id,
        titulo_puesto,
        perfil_requerido,
        ubicacion,
        lugar_trabajo,
        sueldo_bruto_aprobado,
        vacante_id,
        user_id,
        vacantes!inner(
          id,
          reclutador_asignado_id,
          empresa_id,
          user_id
        )
      `)
      .eq('id', publicacion_id)
      .eq('publicada', true)
      .single();

    if (pubError || !publicacion) {
      console.error('Error fetching publication:', pubError);
      return new Response(
        JSON.stringify({ error: 'Publicación no encontrada o no publicada' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // vacantes viene como objeto único por el !inner join
    const vacante = publicacion.vacantes as unknown as {
      id: string;
      reclutador_asignado_id: string | null;
      empresa_id: string | null;
      user_id: string;
    };

    // 2. Verificar permisos (reclutador asignado o empresa dueña)
    let esReclutador = false;
    let esEmpresa = false;
    let reclutadorId: string | null = null;
    let empresaId: string | null = vacante.empresa_id;

    // Verificar si es reclutador asignado
    if (vacante.reclutador_asignado_id) {
      const { data: perfilReclutador } = await supabaseAdmin
        .from('perfil_reclutador')
        .select('id')
        .eq('id', vacante.reclutador_asignado_id)
        .eq('user_id', user.id)
        .single();
      
      if (perfilReclutador) {
        esReclutador = true;
        reclutadorId = perfilReclutador.id;
      }
    }

    // Verificar si es la empresa dueña de la vacante
    if (vacante.user_id === user.id) {
      esEmpresa = true;
    }

    if (!esReclutador && !esEmpresa) {
      return new Response(
        JSON.stringify({ error: 'No tienes permisos para ejecutar sourcing en esta vacante' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[Sourcing IA] Permisos OK - Reclutador: ${esReclutador}, Empresa: ${esEmpresa}`);

    // 3. Verificar créditos disponibles
    let creditosDisponibles = 0;
    let walletReclutadorId: string | null = null;
    let walletEmpresaId: string | null = null;
    let origenPago: 'reclutador' | 'empresa' | 'heredado_empresa' = 'reclutador';

    if (esReclutador && reclutadorId) {
      // Obtener wallet del reclutador
      const { data: walletRec } = await supabaseAdmin
        .from('wallet_reclutador')
        .select('id, creditos_propios, creditos_heredados')
        .eq('reclutador_id', reclutadorId)
        .single();
      
      if (walletRec) {
        walletReclutadorId = walletRec.id;
        creditosDisponibles = (walletRec.creditos_propios || 0) + (walletRec.creditos_heredados || 0);
        origenPago = walletRec.creditos_heredados > 0 ? 'heredado_empresa' : 'reclutador';
      }
    } else if (esEmpresa && empresaId) {
      // Obtener wallet de la empresa
      const { data: walletEmp } = await supabaseAdmin
        .from('wallet_empresa')
        .select('id, creditos_disponibles')
        .eq('empresa_id', empresaId)
        .single();
      
      if (walletEmp) {
        walletEmpresaId = walletEmp.id;
        creditosDisponibles = walletEmp.creditos_disponibles || 0;
        origenPago = 'empresa';
      }
    }

    // Respuesta sanitizada para créditos insuficientes (no revelar balance exacto)
    if (creditosDisponibles < COSTO_SOURCING) {
      return new Response(
        JSON.stringify({ 
          error: 'Créditos insuficientes para ejecutar sourcing',
          creditos_requeridos: COSTO_SOURCING
        }),
        { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[Sourcing IA] Créditos verificados`);

    // 4. Obtener candidatos del pool (excluyendo ya postulados y ya sourced)
    const { data: candidatos, error: candError } = await supabaseAdmin
      .from('perfil_candidato')
      .select(`
        user_id,
        nombre_completo,
        email,
        telefono,
        ubicacion,
        puesto_actual,
        empresa_actual,
        nivel_educacion,
        carrera,
        institucion,
        habilidades_tecnicas,
        habilidades_blandas,
        experiencia_laboral,
        salario_esperado_min,
        salario_esperado_max,
        disponibilidad,
        modalidad_preferida,
        resumen_profesional
      `)
      .limit(100); // Pool inicial

    if (candError) {
      console.error('Error fetching candidates:', candError);
      return new Response(
        JSON.stringify({ error: 'Error al obtener candidatos' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Filtrar candidatos ya postulados a esta vacante
    const { data: postulacionesExistentes } = await supabaseAdmin
      .from('postulaciones')
      .select('candidato_user_id')
      .eq('publicacion_id', publicacion_id);

    const idsPostulados = new Set((postulacionesExistentes || []).map(p => p.candidato_user_id));

    // Filtrar candidatos ya en sourcing para esta vacante
    const { data: sourcingExistente } = await supabaseAdmin
      .from('sourcing_ia')
      .select('candidato_user_id')
      .eq('vacante_id', vacante.id);

    const idsSourceados = new Set((sourcingExistente || []).map(s => s.candidato_user_id));

    const candidatosDisponibles = (candidatos || []).filter(c => 
      !idsPostulados.has(c.user_id) && !idsSourceados.has(c.user_id)
    );

    console.log(`[Sourcing IA] Candidatos disponibles: ${candidatosDisponibles.length}`);

    if (candidatosDisponibles.length === 0) {
      return new Response(
        JSON.stringify({ 
          error: 'No hay candidatos disponibles para sourcing',
          mensaje: 'Todos los candidatos ya fueron postulados o sourced para esta vacante'
        }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 5. DRY RUN - Simular sin gastar créditos (CON RATE LIMITING)
    if (dry_run) {
      const oneDayAgo = new Date(Date.now() - 86400000).toISOString();
      
      // Verificar límite diario por usuario
      const { count: dailyCount } = await supabaseAdmin
        .from('sourcing_audit')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('action', 'dry_run')
        .gte('created_at', oneDayAgo);

      if ((dailyCount || 0) >= DRY_RUN_DAILY_LIMIT) {
        console.log(`[Sourcing IA] Rate limit diario alcanzado para usuario ${user.id}`);
        return new Response(
          JSON.stringify({ error: 'Límite diario de simulaciones alcanzado. Intenta mañana.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Verificar límite por vacante por usuario
      const { count: vacancyCount } = await supabaseAdmin
        .from('sourcing_audit')
        .select('*', { count: 'exact', head: true })
        .eq('vacante_id', vacante.id)
        .eq('user_id', user.id)
        .eq('action', 'dry_run')
        .gte('created_at', oneDayAgo);

      if ((vacancyCount || 0) >= DRY_RUN_PER_VACANCY_LIMIT) {
        console.log(`[Sourcing IA] Rate limit por vacante alcanzado para ${vacante.id}`);
        return new Response(
          JSON.stringify({ error: 'Límite de simulaciones para esta vacante alcanzado. Intenta mañana o ejecuta el sourcing.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Registrar la llamada dry_run en auditoría
      await supabaseAdmin
        .from('sourcing_audit')
        .insert({
          user_id: user.id,
          vacante_id: vacante.id,
          publicacion_id: publicacion_id,
          action: 'dry_run'
        });

      console.log(`[Sourcing IA] DRY RUN - Simulación completada (${(dailyCount || 0) + 1}/${DRY_RUN_DAILY_LIMIT} hoy)`);
      
      // Respuesta sanitizada - no revelar balances exactos ni conteos internos
      return new Response(
        JSON.stringify({
          success: true,
          dry_run: true,
          mensaje: 'Simulación exitosa - No se consumieron créditos',
          vacante: {
            id: vacante.id,
            titulo: publicacion.titulo_puesto
          },
          candidatos_a_analizar: Math.min(candidatosDisponibles.length, MAX_CANDIDATOS),
          costo_creditos: COSTO_SOURCING,
          creditos_suficientes: true
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // =====================================================
    // EJECUCIÓN REAL - Solo si dry_run = false
    // =====================================================

    if (!lovableApiKey) {
      return new Response(
        JSON.stringify({ error: 'Servicio de IA no configurado' }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Registrar ejecución en auditoría
    await supabaseAdmin
      .from('sourcing_audit')
      .insert({
        user_id: user.id,
        vacante_id: vacante.id,
        publicacion_id: publicacion_id,
        action: 'execution'
      });

    // Preparar prompt para IA
    const vacanteInfo = {
      titulo: publicacion.titulo_puesto,
      perfil_requerido: publicacion.perfil_requerido || 'No especificado',
      ubicacion: publicacion.ubicacion || 'No especificada',
      modalidad: publicacion.lugar_trabajo,
      salario: publicacion.sueldo_bruto_aprobado
    };

    const candidatosParaAnalisis = candidatosDisponibles.slice(0, 50); // Analizar hasta 50

    const prompt = `Eres un experto en reclutamiento y selección de talento. Analiza los siguientes candidatos y selecciona los ${MAX_CANDIDATOS} mejores matches para la vacante.

VACANTE:
- Título: ${vacanteInfo.titulo}
- Perfil requerido: ${vacanteInfo.perfil_requerido}
- Ubicación: ${vacanteInfo.ubicacion}
- Modalidad: ${vacanteInfo.modalidad}
- Salario: ${vacanteInfo.salario ? '$' + vacanteInfo.salario : 'No especificado'}

CANDIDATOS:
${candidatosParaAnalisis.map((c, i) => `
[${i}] 
- Puesto actual: ${c.puesto_actual || 'No especificado'}
- Empresa: ${c.empresa_actual || 'No especificada'}
- Educación: ${c.nivel_educacion || 'No especificado'} - ${c.carrera || ''}
- Habilidades técnicas: ${(c.habilidades_tecnicas || []).join(', ') || 'No especificadas'}
- Habilidades blandas: ${(c.habilidades_blandas || []).join(', ') || 'No especificadas'}
- Ubicación: ${c.ubicacion || 'No especificada'}
- Modalidad preferida: ${c.modalidad_preferida || 'No especificada'}
- Expectativa salarial: ${c.salario_esperado_min ? '$' + c.salario_esperado_min + ' - $' + c.salario_esperado_max : 'No especificada'}
- Resumen: ${c.resumen_profesional || 'No disponible'}
`).join('\n')}

Responde SOLO con un JSON array de los ${MAX_CANDIDATOS} mejores candidatos, ordenados por score de match (mayor a menor):
[
  {
    "index": 0,
    "score": 85,
    "razon": "Breve explicación del match",
    "habilidades_match": ["habilidad1", "habilidad2"],
    "experiencia_relevante": ["experiencia1"]
  }
]`;

    console.log(`[Sourcing IA] Llamando a Lovable AI...`);

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'Eres un experto en reclutamiento. Responde SOLO con JSON válido, sin markdown.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('[Sourcing IA] Error de IA:', aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Límite de solicitudes excedido, intenta más tarde' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Créditos de IA agotados' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: 'Error al procesar con IA' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiData = await aiResponse.json();
    const aiContent = aiData.choices?.[0]?.message?.content || '[]';
    
    console.log(`[Sourcing IA] Respuesta IA recibida`);

    // Parsear respuesta de IA
    let matchesIA: Array<{
      index: number;
      score: number;
      razon: string;
      habilidades_match: string[];
      experiencia_relevante: string[];
    }> = [];

    try {
      // Limpiar posibles marcadores de código
      const cleanContent = aiContent.replace(/```json\n?|\n?```/g, '').trim();
      matchesIA = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error('[Sourcing IA] Error parsing AI response:', parseError);
      return new Response(
        JSON.stringify({ error: 'Error al procesar respuesta de IA' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generar ID de lote
    const loteSourcing = crypto.randomUUID();

    // 6. Deducir créditos
    if (esReclutador && walletReclutadorId) {
      const { data: wallet } = await supabaseAdmin
        .from('wallet_reclutador')
        .select('creditos_propios, creditos_heredados')
        .eq('id', walletReclutadorId)
        .single();

      if (wallet) {
        const heredados = wallet.creditos_heredados || 0;
        const propios = wallet.creditos_propios || 0;
        
        if (heredados >= COSTO_SOURCING) {
          await supabaseAdmin
            .from('wallet_reclutador')
            .update({ creditos_heredados: heredados - COSTO_SOURCING })
            .eq('id', walletReclutadorId);
          origenPago = 'heredado_empresa';
        } else if (heredados > 0) {
          const restante = COSTO_SOURCING - heredados;
          await supabaseAdmin
            .from('wallet_reclutador')
            .update({ 
              creditos_heredados: 0,
              creditos_propios: propios - restante
            })
            .eq('id', walletReclutadorId);
          origenPago = 'heredado_empresa';
        } else {
          await supabaseAdmin
            .from('wallet_reclutador')
            .update({ creditos_propios: propios - COSTO_SOURCING })
            .eq('id', walletReclutadorId);
          origenPago = 'reclutador';
        }
      }
    } else if (esEmpresa && walletEmpresaId) {
      const { data: wallet } = await supabaseAdmin
        .from('wallet_empresa')
        .select('creditos_disponibles')
        .eq('id', walletEmpresaId)
        .single();

      if (wallet) {
        await supabaseAdmin
          .from('wallet_empresa')
          .update({ creditos_disponibles: (wallet.creditos_disponibles || 0) - COSTO_SOURCING })
          .eq('id', walletEmpresaId);
      }
      origenPago = 'empresa';
    }

    // 7. Registrar movimiento de créditos
    await supabaseAdmin.rpc('registrar_movimiento_creditos', {
      p_origen_pago: origenPago,
      p_wallet_empresa_id: walletEmpresaId,
      p_wallet_reclutador_id: walletReclutadorId,
      p_empresa_id: empresaId,
      p_reclutador_user_id: user.id,
      p_tipo_accion: 'sourcing_ia',
      p_creditos_cantidad: -COSTO_SOURCING,
      p_descripcion: `Sourcing IA para vacante: ${publicacion.titulo_puesto}`,
      p_vacante_id: vacante.id,
      p_metodo: 'automatico_ia',
      p_metadata: { lote_sourcing: loteSourcing, candidatos_analizados: matchesIA.length }
    });

    // 8. Insertar resultados de sourcing
    const sourcingRecords = matchesIA.map(match => {
      const candidato = candidatosParaAnalisis[match.index];
      return {
        vacante_id: vacante.id,
        publicacion_id: publicacion_id,
        candidato_user_id: candidato.user_id,
        reclutador_ejecutor_id: esReclutador ? reclutadorId : null,
        empresa_ejecutora_id: esEmpresa ? empresaId : null,
        ejecutor_user_id: user.id,
        score_match: match.score,
        razon_match: match.razon,
        habilidades_coincidentes: match.habilidades_match || [],
        experiencia_relevante: match.experiencia_relevante || [],
        estado: 'pendiente',
        creditos_consumidos: COSTO_SOURCING / MAX_CANDIDATOS,
        lote_sourcing: loteSourcing
      };
    });

    const { error: insertError } = await supabaseAdmin
      .from('sourcing_ia')
      .insert(sourcingRecords);

    if (insertError) {
      console.error('[Sourcing IA] Error inserting results:', insertError);
      return new Response(
        JSON.stringify({ error: 'Error al guardar resultados' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 9. Registrar acceso a identidades de candidatos
    const accesosIdentidad = matchesIA.map(match => {
      const candidato = candidatosParaAnalisis[match.index];
      return {
        reclutador_id: reclutadorId || empresaId,
        candidato_user_id: candidato.user_id,
        empresa_id: empresaId,
        origen_pago: origenPago,
        creditos_consumidos: 0 // Ya se cobró en el sourcing
      };
    });

    // Solo insertar accesos si es reclutador (tiene reclutadorId)
    if (reclutadorId) {
      await supabaseAdmin
        .from('acceso_identidad_candidato')
        .upsert(accesosIdentidad.map(a => ({
          ...a,
          reclutador_id: reclutadorId
        })), { 
          onConflict: 'reclutador_id,candidato_user_id',
          ignoreDuplicates: true 
        });
    }

    console.log(`[Sourcing IA] Completado - ${matchesIA.length} candidatos encontrados`);

    return new Response(
      JSON.stringify({
        success: true,
        lote_sourcing: loteSourcing,
        candidatos_encontrados: matchesIA.length,
        creditos_consumidos: COSTO_SOURCING,
        mensaje: `Se encontraron ${matchesIA.length} candidatos potenciales para la vacante "${publicacion.titulo_puesto}"`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[Sourcing IA] Error general:', error);
    return new Response(
      JSON.stringify({ error: 'Error interno del servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
