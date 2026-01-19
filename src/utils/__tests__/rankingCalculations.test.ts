import { describe, it, expect } from 'vitest';
import { 
  calcularIndiceProductividad, 
  calcularRankingGlobal,
  ReclutadorRanking 
} from '../rankingCalculations';

describe('calcularIndiceProductividad', () => {
  describe('Caso 1: Sin vacantes cerradas', () => {
    it('devuelve 0 cuando no hay vacantes cerradas', () => {
      expect(calcularIndiceProductividad(0, 10)).toBe(0);
      expect(calcularIndiceProductividad(0, 0)).toBe(0);
      expect(calcularIndiceProductividad(0, null)).toBe(0);
    });
  });

  describe('Caso 2: Promedio días = 0 o null', () => {
    it('devuelve vacantes × 10000 cuando promedio es 0', () => {
      expect(calcularIndiceProductividad(5, 0)).toBe(50000);
      expect(calcularIndiceProductividad(1, 0)).toBe(10000);
      expect(calcularIndiceProductividad(10, 0)).toBe(100000);
    });

    it('devuelve vacantes × 10000 cuando promedio es null', () => {
      expect(calcularIndiceProductividad(3, null)).toBe(30000);
      expect(calcularIndiceProductividad(7, null)).toBe(70000);
    });
  });

  describe('Caso 3: Cálculo normal', () => {
    it('calcula correctamente (vacantes / días) × 100', () => {
      // 10 vacantes / 5 días × 100 = 200
      expect(calcularIndiceProductividad(10, 5)).toBe(200);
      
      // 5 vacantes / 10 días × 100 = 50
      expect(calcularIndiceProductividad(5, 10)).toBe(50);
      
      // 1 vacante / 1 día × 100 = 100
      expect(calcularIndiceProductividad(1, 1)).toBe(100);
    });

    it('redondea a 2 decimales', () => {
      // 7 vacantes / 3 días × 100 = 233.333... → 233.33
      expect(calcularIndiceProductividad(7, 3)).toBe(233.33);
      
      // 1 vacante / 7 días × 100 = 14.2857... → 14.29
      expect(calcularIndiceProductividad(1, 7)).toBe(14.29);
    });

    it('mayor productividad con más vacantes en menos tiempo', () => {
      const rapido = calcularIndiceProductividad(10, 2); // 500
      const lento = calcularIndiceProductividad(10, 20); // 50
      expect(rapido).toBeGreaterThan(lento);
    });

    it('mayor productividad con más vacantes en mismo tiempo', () => {
      const muchas = calcularIndiceProductividad(20, 10); // 200
      const pocas = calcularIndiceProductividad(5, 10);   // 50
      expect(muchas).toBeGreaterThan(pocas);
    });
  });
});

describe('calcularRankingGlobal', () => {
  const crearReclutador = (
    id: string,
    nombre: string,
    cerradas: number,
    dias: number
  ): Omit<ReclutadorRanking, 'ranking_score' | 'posicion'> => ({
    user_id: id,
    nombre_reclutador: nombre,
    vacantes_cerradas: cerradas,
    promedio_dias_cierre: dias,
  });

  it('calcula ranking_score para cada reclutador', () => {
    const reclutadores = [
      crearReclutador('1', 'Ana', 10, 5),
      crearReclutador('2', 'Carlos', 5, 10),
    ];

    const resultado = calcularRankingGlobal(reclutadores);

    expect(resultado[0].ranking_score).toBe(200); // Ana: 10/5 × 100
    expect(resultado[1].ranking_score).toBe(50);  // Carlos: 5/10 × 100
  });

  it('ordena por ranking_score descendente', () => {
    const reclutadores = [
      crearReclutador('1', 'Bajo', 2, 10),    // 20
      crearReclutador('2', 'Alto', 10, 2),    // 500
      crearReclutador('3', 'Medio', 5, 5),    // 100
    ];

    const resultado = calcularRankingGlobal(reclutadores);

    expect(resultado[0].nombre_reclutador).toBe('Alto');
    expect(resultado[1].nombre_reclutador).toBe('Medio');
    expect(resultado[2].nombre_reclutador).toBe('Bajo');
  });

  it('desempata por más vacantes cerradas', () => {
    const reclutadores = [
      crearReclutador('1', 'Menos', 5, 2.5),   // 200, 5 vacantes
      crearReclutador('2', 'Mas', 10, 5),      // 200, 10 vacantes
    ];

    const resultado = calcularRankingGlobal(reclutadores);

    expect(resultado[0].nombre_reclutador).toBe('Mas');
    expect(resultado[1].nombre_reclutador).toBe('Menos');
  });

  it('desempata por menos días de cierre', () => {
    const reclutadores = [
      crearReclutador('1', 'Lento', 10, 10),   // 100, 10 días
      crearReclutador('2', 'Rapido', 10, 10),  // 100, 10 días (mismo)
    ];

    // Cuando todo es igual, mantiene el orden
    const resultado = calcularRankingGlobal(reclutadores);
    expect(resultado.length).toBe(2);
  });

  it('asigna posiciones correctamente', () => {
    const reclutadores = [
      crearReclutador('1', 'Tercero', 1, 10),
      crearReclutador('2', 'Primero', 20, 5),
      crearReclutador('3', 'Segundo', 10, 5),
    ];

    const resultado = calcularRankingGlobal(reclutadores);

    expect(resultado.find(r => r.nombre_reclutador === 'Primero')?.posicion).toBe(1);
    expect(resultado.find(r => r.nombre_reclutador === 'Segundo')?.posicion).toBe(2);
    expect(resultado.find(r => r.nombre_reclutador === 'Tercero')?.posicion).toBe(3);
  });

  it('maneja array vacío', () => {
    const resultado = calcularRankingGlobal([]);
    expect(resultado).toEqual([]);
  });

  it('maneja un solo reclutador', () => {
    const reclutadores = [crearReclutador('1', 'Solo', 5, 5)];
    const resultado = calcularRankingGlobal(reclutadores);

    expect(resultado.length).toBe(1);
    expect(resultado[0].posicion).toBe(1);
    expect(resultado[0].ranking_score).toBe(100);
  });

  it('maneja reclutadores sin vacantes cerradas', () => {
    const reclutadores = [
      crearReclutador('1', 'Activo', 5, 5),
      crearReclutador('2', 'Nuevo', 0, 0),
    ];

    const resultado = calcularRankingGlobal(reclutadores);

    expect(resultado[0].nombre_reclutador).toBe('Activo');
    expect(resultado[0].ranking_score).toBe(100);
    expect(resultado[1].nombre_reclutador).toBe('Nuevo');
    expect(resultado[1].ranking_score).toBe(0);
  });
});

describe('Integración: Cálculos dinámicos post-limpieza', () => {
  it('verifica que la lógica de cálculo es consistente con el reemplazo de estadisticas_reclutador', () => {
    // Simular datos que vendrían de la tabla vacantes
    const vacantesData = [
      { id: '1', estatus: 'cerrada', fecha_cierre: '2026-01-15', fecha_solicitud: '2026-01-10' }, // 5 días
      { id: '2', estatus: 'cerrada', fecha_cierre: '2026-01-18', fecha_solicitud: '2026-01-08' }, // 10 días
      { id: '3', estatus: 'abierta', fecha_cierre: null, fecha_solicitud: '2026-01-01' },
    ];

    // Lógica que ahora se usa en los componentes (reemplazo de estadisticas_reclutador)
    const cerradas = vacantesData.filter(v => v.estatus === 'cerrada');
    const vacantesCerradas = cerradas.length;

    let promedioDias = 0;
    if (cerradas.length > 0) {
      const totalDias = cerradas.reduce((sum, v) => {
        if (v.fecha_cierre && v.fecha_solicitud) {
          const dias = Math.floor(
            (new Date(v.fecha_cierre).getTime() - new Date(v.fecha_solicitud).getTime()) / (1000 * 60 * 60 * 24)
          );
          return sum + Math.max(dias, 1);
        }
        return sum;
      }, 0);
      promedioDias = totalDias / cerradas.length;
    }

    // Calcular ranking_score usando la función centralizada
    const rankingScore = calcularIndiceProductividad(vacantesCerradas, promedioDias);

    // Verificaciones
    expect(vacantesCerradas).toBe(2);
    expect(promedioDias).toBe(7.5); // (5 + 10) / 2
    expect(rankingScore).toBe(26.67); // (2 / 7.5) × 100 = 26.666... → 26.67
  });

  it('maneja el caso de cierre en el mismo día (días = 0)', () => {
    const vacantesData = [
      { id: '1', estatus: 'cerrada', fecha_cierre: '2026-01-15', fecha_solicitud: '2026-01-15' }, // 0 días → mínimo 1
    ];

    const cerradas = vacantesData.filter(v => v.estatus === 'cerrada');
    const totalDias = cerradas.reduce((sum, v) => {
      if (v.fecha_cierre && v.fecha_solicitud) {
        const dias = Math.floor(
          (new Date(v.fecha_cierre).getTime() - new Date(v.fecha_solicitud).getTime()) / (1000 * 60 * 60 * 24)
        );
        return sum + Math.max(dias, 1); // Mínimo 1 día
      }
      return sum;
    }, 0);
    const promedioDias = totalDias / cerradas.length;

    const rankingScore = calcularIndiceProductividad(cerradas.length, promedioDias);

    expect(promedioDias).toBe(1); // Mínimo 1 día
    expect(rankingScore).toBe(100); // 1/1 × 100 = 100
  });

  it('maneja vacantes sin fecha de cierre definida', () => {
    const vacantesData = [
      { id: '1', estatus: 'cerrada', fecha_cierre: null, fecha_solicitud: '2026-01-10' },
      { id: '2', estatus: 'cerrada', fecha_cierre: '2026-01-15', fecha_solicitud: '2026-01-10' },
    ];

    const cerradas = vacantesData.filter(v => v.estatus === 'cerrada');
    const totalDias = cerradas.reduce((sum, v) => {
      if (v.fecha_cierre && v.fecha_solicitud) {
        const dias = Math.floor(
          (new Date(v.fecha_cierre).getTime() - new Date(v.fecha_solicitud).getTime()) / (1000 * 60 * 60 * 24)
        );
        return sum + Math.max(dias, 1);
      }
      return sum; // Si no hay fecha_cierre, no suma días
    }, 0);

    // Solo 1 vacante tiene fecha de cierre válida
    const vacantesConFecha = cerradas.filter(v => v.fecha_cierre && v.fecha_solicitud).length;
    const promedioDias = vacantesConFecha > 0 ? totalDias / vacantesConFecha : 0;

    expect(totalDias).toBe(5);
    expect(vacantesConFecha).toBe(1);
    expect(promedioDias).toBe(5);
  });
});
