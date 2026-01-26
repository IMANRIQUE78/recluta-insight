import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ImproveSummaryRequest {
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

interface ImproveSummaryResponse {
  success: boolean;
  resumen_mejorado: string;
  resumen_indexado: string;
  keywords: string[];
  industrias: string[];
  nivel_experiencia: 'junior' | 'mid' | 'senior' | 'lead' | 'executive';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

    if (!lovableApiKey) {
      return new Response(
        JSON.stringify({ error: 'Servicio de IA no configurado' }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

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

    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Usuario no válido' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body: ImproveSummaryRequest = await req.json();
    const { resumen_actual, puesto_buscado, habilidades_tecnicas, habilidades_blandas, experiencia_laboral } = body;

    if (!resumen_actual || resumen_actual.trim().length < 20) {
      return new Response(
        JSON.stringify({ error: 'El resumen debe tener al menos 20 caracteres' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[Improve Summary] Usuario: ${user.id}, Longitud resumen: ${resumen_actual.length}`);

    // Construir contexto adicional
    let contextoAdicional = '';
    if (puesto_buscado) {
      contextoAdicional += `\nPuesto buscado: ${puesto_buscado}`;
    }
    if (habilidades_tecnicas && habilidades_tecnicas.length > 0) {
      contextoAdicional += `\nHabilidades técnicas: ${habilidades_tecnicas.join(', ')}`;
    }
    if (habilidades_blandas && habilidades_blandas.length > 0) {
      contextoAdicional += `\nHabilidades blandas: ${habilidades_blandas.join(', ')}`;
    }
    if (experiencia_laboral && experiencia_laboral.length > 0) {
      contextoAdicional += `\nExperiencia laboral reciente:`;
      experiencia_laboral.slice(0, 3).forEach((exp, i) => {
        contextoAdicional += `\n${i + 1}. ${exp.puesto} en ${exp.empresa}${exp.descripcion ? ': ' + exp.descripcion.slice(0, 150) : ''}`;
      });
    }

    const prompt = `Eres un experto en recursos humanos y redacción de perfiles profesionales para plataformas de empleo en México y Latinoamérica.

TAREA: Analiza y mejora el siguiente resumen profesional de un candidato. Debes:
1. Mejorar la redacción para hacerla más profesional, clara y atractiva
2. Mantener la esencia y logros del candidato
3. Optimizar para que sea encontrado por reclutadores (keywords relevantes)
4. Extraer metadatos para indexación

RESUMEN ORIGINAL:
${resumen_actual}
${contextoAdicional}

RESPONDE ÚNICAMENTE con un JSON válido con esta estructura exacta:
{
  "resumen_mejorado": "El resumen profesional mejorado y optimizado (máximo 500 caracteres)",
  "resumen_indexado": "Versión ultra-compacta para matching rápido (máximo 150 caracteres): logros clave, especialidades, industria",
  "keywords": ["keyword1", "keyword2", "keyword3", "...hasta 10 keywords relevantes para sourcing"],
  "industrias": ["industria1", "industria2", "...industrias o sectores detectados"],
  "nivel_experiencia": "junior|mid|senior|lead|executive"
}

CRITERIOS PARA nivel_experiencia:
- junior: 0-2 años de experiencia o recién egresado
- mid: 2-5 años con experiencia sólida
- senior: 5-10 años, especialista o experto
- lead: 8+ años con liderazgo de equipos o proyectos
- executive: Director, C-level, o +15 años en posiciones estratégicas`;

    console.log(`[Improve Summary] Llamando a Lovable AI...`);

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: 'Eres un experto en RH. Responde SOLO con JSON válido, sin markdown ni explicaciones.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.4
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('[Improve Summary] Error de IA:', aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Demasiadas solicitudes, intenta en unos minutos' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Servicio temporalmente no disponible' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: 'Error al procesar con IA' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiData = await aiResponse.json();
    const aiContent = aiData.choices?.[0]?.message?.content || '{}';
    
    console.log(`[Improve Summary] Respuesta IA recibida`);

    let result: ImproveSummaryResponse;
    try {
      const cleanContent = aiContent.replace(/```json\n?|\n?```/g, '').trim();
      const parsed = JSON.parse(cleanContent);
      
      result = {
        success: true,
        resumen_mejorado: parsed.resumen_mejorado || resumen_actual,
        resumen_indexado: parsed.resumen_indexado || '',
        keywords: Array.isArray(parsed.keywords) ? parsed.keywords.slice(0, 15) : [],
        industrias: Array.isArray(parsed.industrias) ? parsed.industrias.slice(0, 5) : [],
        nivel_experiencia: ['junior', 'mid', 'senior', 'lead', 'executive'].includes(parsed.nivel_experiencia) 
          ? parsed.nivel_experiencia 
          : 'mid'
      };
    } catch (parseError) {
      console.error('[Improve Summary] Error parsing AI response:', parseError);
      return new Response(
        JSON.stringify({ error: 'Error al procesar respuesta de IA' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[Improve Summary] Procesamiento completado - ${result.keywords.length} keywords, ${result.industrias.length} industrias`);

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[Improve Summary] Error:', error);
    return new Response(
      JSON.stringify({ error: 'Error interno del servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
