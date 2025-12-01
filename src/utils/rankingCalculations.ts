/**
 * ÍNDICE DE PRODUCTIVIDAD - Cálculo Centralizado
 * 
 * Fórmula: (Vacantes Cerradas / Promedio de Días) × 100
 * 
 * INTERPRETACIÓN:
 * - Mide vacantes cerradas por unidad de tiempo (productividad)
 * - MÁS vacantes cerradas = MEJOR índice
 * - MENOS días promedio = MEJOR índice
 * - Índice escalado ×100 para facilitar lectura
 * 
 * CASOS ESPECIALES:
 * - Sin vacantes cerradas → Índice = 0
 * - Vacantes > 0 pero días = 0/null → Índice = vacantes × 10000
 *   (caso teórico: cierre instantáneo o datos incompletos)
 * 
 * ANÁLISIS DINÁMICO:
 * - Se calculan los últimos 28 días de forma dinámica (rolling window)
 * - NO se cierra por mes específico, siempre son los últimos 28 días
 * - Esto permite tener métricas actualizadas en tiempo real
 */

/**
 * Calcula el Índice de Productividad para un reclutador
 * @param vacantesCerradas - Número de vacantes cerradas
 * @param promedioDias - Promedio de días para cerrar vacantes
 * @returns Índice de productividad redondeado a 2 decimales
 */
export const calcularIndiceProductividad = (
  vacantesCerradas: number, 
  promedioDias: number | null
): number => {
  // Caso 1: Sin vacantes cerradas → Índice = 0
  if (vacantesCerradas === 0) {
    return 0;
  }
  
  // Caso 2: Promedio = 0 o NULL (caso teórico)
  // Asignar índice alto proporcional a las vacantes
  if (promedioDias === null || promedioDias === 0) {
    return vacantesCerradas * 10000;
  }
  
  // Caso 3: Caso normal
  // Productividad = (vacantes / días) × 100
  const indice = (vacantesCerradas / promedioDias) * 100;
  return Math.round(indice * 100) / 100; // Redondear a 2 decimales
};

/**
 * Interface para datos de reclutador con ranking
 */
export interface ReclutadorRanking {
  user_id: string;
  nombre_reclutador: string;
  vacantes_cerradas: number;
  promedio_dias_cierre: number;
  ranking_score: number;
  posicion?: number;
}

/**
 * Recalcula los scores de productividad para un array de reclutadores
 * y los ordena por ranking
 * @param reclutadores - Array de reclutadores con datos de vacantes y días
 * @returns Array ordenado con índices de productividad calculados y posiciones asignadas
 */
export const calcularRankingGlobal = (
  reclutadores: Omit<ReclutadorRanking, 'ranking_score' | 'posicion'>[]
): ReclutadorRanking[] => {
  // Calcular nuevo índice para cada reclutador
  const conIndices = reclutadores.map(r => ({
    ...r,
    ranking_score: calcularIndiceProductividad(
      r.vacantes_cerradas,
      r.promedio_dias_cierre
    )
  }));
  
  // Ordenar por índice (mayor = mejor), desempate por vacantes, luego por días
  const ordenados = [...conIndices].sort((a, b) => {
    // Primero por índice descendente
    if (b.ranking_score !== a.ranking_score) {
      return b.ranking_score - a.ranking_score;
    }
    // Desempate por más vacantes
    if (b.vacantes_cerradas !== a.vacantes_cerradas) {
      return b.vacantes_cerradas - a.vacantes_cerradas;
    }
    // Desempate por menos días
    return a.promedio_dias_cierre - b.promedio_dias_cierre;
  });
  
  // Asignar posiciones
  return ordenados.map((r, index) => ({
    ...r,
    posicion: index + 1
  }));
};
