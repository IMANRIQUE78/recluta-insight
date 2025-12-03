// Guía de Referencia III - Factores de Riesgo Psicosocial y Entorno Organizacional
// NOM-035-STPS-2018

export interface PreguntaGuiaIII {
  id: number;
  categoria: string;
  dominio: string;
  dimension: string;
  texto: string;
  invertida: boolean; // Algunas preguntas se califican de forma inversa
}

export const CATEGORIAS_GUIA_III = {
  ambiente_trabajo: "Ambiente de trabajo",
  factores_actividad: "Factores propios de la actividad",
  organizacion_tiempo: "Organización del tiempo de trabajo",
  liderazgo: "Liderazgo y relaciones en el trabajo",
  entorno_organizacional: "Entorno organizacional"
};

export const DOMINIOS_GUIA_III = {
  condiciones_ambiente: "Condiciones en el ambiente de trabajo",
  carga_trabajo: "Carga de trabajo",
  falta_control: "Falta de control sobre el trabajo",
  jornada_trabajo: "Jornada de trabajo",
  interferencia: "Interferencia en la relación trabajo-familia",
  liderazgo: "Liderazgo",
  relaciones_trabajo: "Relaciones en el trabajo",
  violencia: "Violencia",
  reconocimiento: "Reconocimiento del desempeño",
  insuficiente_sentido: "Insuficiente sentido de pertenencia e inestabilidad"
};

export const ESCALA_LIKERT = [
  { valor: 0, texto: "Siempre" },
  { valor: 1, texto: "Casi siempre" },
  { valor: 2, texto: "Algunas veces" },
  { valor: 3, texto: "Casi nunca" },
  { valor: 4, texto: "Nunca" }
];

export const ESCALA_LIKERT_INVERTIDA = [
  { valor: 4, texto: "Siempre" },
  { valor: 3, texto: "Casi siempre" },
  { valor: 2, texto: "Algunas veces" },
  { valor: 1, texto: "Casi nunca" },
  { valor: 0, texto: "Nunca" }
];

export const PREGUNTAS_GUIA_III: PreguntaGuiaIII[] = [
  // Ambiente de trabajo (1-5)
  { id: 1, categoria: "ambiente_trabajo", dominio: "condiciones_ambiente", dimension: "Condiciones peligrosas e inseguras", texto: "El espacio donde trabajo me permite realizar mis actividades de manera segura e higiénica", invertida: true },
  { id: 2, categoria: "ambiente_trabajo", dominio: "condiciones_ambiente", dimension: "Condiciones deficientes e insalubres", texto: "Mi trabajo me exige hacer mucho esfuerzo físico", invertida: false },
  { id: 3, categoria: "ambiente_trabajo", dominio: "condiciones_ambiente", dimension: "Trabajos peligrosos", texto: "Me preocupa sufrir un accidente en mi trabajo", invertida: false },
  { id: 4, categoria: "ambiente_trabajo", dominio: "condiciones_ambiente", dimension: "Condiciones peligrosas e inseguras", texto: "Considero que en mi trabajo se aplican las normas de seguridad y salud en el trabajo", invertida: true },
  { id: 5, categoria: "ambiente_trabajo", dominio: "condiciones_ambiente", dimension: "Trabajos peligrosos", texto: "Considero que las actividades que realizo son peligrosas", invertida: false },
  
  // Carga de trabajo (6-16)
  { id: 6, categoria: "factores_actividad", dominio: "carga_trabajo", dimension: "Cargas cuantitativas", texto: "Por la cantidad de trabajo que tengo debo quedarme tiempo adicional a mi turno", invertida: false },
  { id: 7, categoria: "factores_actividad", dominio: "carga_trabajo", dimension: "Ritmos de trabajo acelerado", texto: "Por la cantidad de trabajo que tengo debo trabajar sin parar", invertida: false },
  { id: 8, categoria: "factores_actividad", dominio: "carga_trabajo", dimension: "Ritmos de trabajo acelerado", texto: "Considero que es necesario mantener un ritmo de trabajo acelerado", invertida: false },
  { id: 9, categoria: "factores_actividad", dominio: "carga_trabajo", dimension: "Carga mental", texto: "Mi trabajo exige que esté muy concentrado", invertida: false },
  { id: 10, categoria: "factores_actividad", dominio: "carga_trabajo", dimension: "Carga mental", texto: "Mi trabajo requiere que memorice mucha información", invertida: false },
  { id: 11, categoria: "factores_actividad", dominio: "carga_trabajo", dimension: "Carga mental", texto: "En mi trabajo tengo que tomar decisiones difíciles muy rápido", invertida: false },
  { id: 12, categoria: "factores_actividad", dominio: "carga_trabajo", dimension: "Carga mental", texto: "Mi trabajo exige que atienda varios asuntos al mismo tiempo", invertida: false },
  { id: 13, categoria: "factores_actividad", dominio: "carga_trabajo", dimension: "Cargas psicológicas emocionales", texto: "En mi trabajo soy responsable de cosas de mucho valor", invertida: false },
  { id: 14, categoria: "factores_actividad", dominio: "carga_trabajo", dimension: "Cargas de alta responsabilidad", texto: "Respondo ante mi jefe por los resultados de toda mi área de trabajo", invertida: false },
  { id: 15, categoria: "factores_actividad", dominio: "carga_trabajo", dimension: "Cargas contradictorias o inconsistentes", texto: "En el trabajo me dan órdenes contradictorias", invertida: false },
  { id: 16, categoria: "factores_actividad", dominio: "carga_trabajo", dimension: "Cargas contradictorias o inconsistentes", texto: "Considero que en mi trabajo me piden hacer cosas innecesarias", invertida: false },
  
  // Jornada de trabajo (17-22)
  { id: 17, categoria: "organizacion_tiempo", dominio: "jornada_trabajo", dimension: "Jornadas de trabajo extensas", texto: "Trabajo horas extras más de tres veces a la semana", invertida: false },
  { id: 18, categoria: "organizacion_tiempo", dominio: "jornada_trabajo", dimension: "Jornadas de trabajo extensas", texto: "Mi trabajo me exige laborar en días de descanso, festivos o fines de semana", invertida: false },
  { id: 19, categoria: "organizacion_tiempo", dominio: "interferencia", dimension: "Influencia del trabajo fuera del centro laboral", texto: "Considero que el tiempo en el trabajo es mucho y perjudica mis actividades familiares o personales", invertida: false },
  { id: 20, categoria: "organizacion_tiempo", dominio: "interferencia", dimension: "Influencia del trabajo fuera del centro laboral", texto: "Debo atender asuntos de trabajo cuando estoy en casa", invertida: false },
  { id: 21, categoria: "organizacion_tiempo", dominio: "interferencia", dimension: "Influencia de las responsabilidades familiares", texto: "Pienso en las actividades familiares o personales cuando estoy en mi trabajo", invertida: false },
  { id: 22, categoria: "organizacion_tiempo", dominio: "interferencia", dimension: "Influencia de las responsabilidades familiares", texto: "Pienso que mis responsabilidades familiares afectan mi trabajo", invertida: false },
  
  // Falta de control sobre el trabajo (23-28)
  { id: 23, categoria: "factores_actividad", dominio: "falta_control", dimension: "Falta de control y autonomía sobre el trabajo", texto: "Mi trabajo permite que desarrolle nuevas habilidades", invertida: true },
  { id: 24, categoria: "factores_actividad", dominio: "falta_control", dimension: "Limitada o nula posibilidad de desarrollo", texto: "En mi trabajo puedo aspirar a un mejor puesto", invertida: true },
  { id: 25, categoria: "factores_actividad", dominio: "falta_control", dimension: "Falta de control y autonomía sobre el trabajo", texto: "Durante mi jornada de trabajo puedo tomar pausas cuando las necesito", invertida: true },
  { id: 26, categoria: "factores_actividad", dominio: "falta_control", dimension: "Falta de control y autonomía sobre el trabajo", texto: "Puedo decidir cuánto trabajo realizo durante la jornada laboral", invertida: true },
  { id: 27, categoria: "factores_actividad", dominio: "falta_control", dimension: "Falta de control y autonomía sobre el trabajo", texto: "Puedo decidir la velocidad a la que realizo mis actividades en mi trabajo", invertida: true },
  { id: 28, categoria: "factores_actividad", dominio: "falta_control", dimension: "Limitada o inexistente capacidad para participar", texto: "Puedo cambiar el orden de las actividades que realizo en mi trabajo", invertida: true },
  
  // Cambios en el trabajo (29-30)
  { id: 29, categoria: "factores_actividad", dominio: "falta_control", dimension: "Limitada o inexistente capacidad para participar", texto: "Los cambios que se presentan en mi trabajo dificultan mi labor", invertida: false },
  { id: 30, categoria: "factores_actividad", dominio: "falta_control", dimension: "Limitada o inexistente capacidad para participar", texto: "Cuando se presentan cambios en mi trabajo se tienen en cuenta mis ideas o aportaciones", invertida: true },
  
  // Capacitación e información (31-36)
  { id: 31, categoria: "liderazgo", dominio: "liderazgo", dimension: "Escasa claridad de funciones", texto: "Me informan con claridad cuáles son mis funciones", invertida: true },
  { id: 32, categoria: "liderazgo", dominio: "liderazgo", dimension: "Escasa claridad de funciones", texto: "Me explican claramente los resultados que debo obtener en mi trabajo", invertida: true },
  { id: 33, categoria: "liderazgo", dominio: "liderazgo", dimension: "Escasa claridad de funciones", texto: "Me explican claramente los objetivos de mi trabajo", invertida: true },
  { id: 34, categoria: "liderazgo", dominio: "liderazgo", dimension: "Escasa claridad de funciones", texto: "Me informan con quién puedo resolver problemas o asuntos de trabajo", invertida: true },
  { id: 35, categoria: "liderazgo", dominio: "liderazgo", dimension: "Limitada o inexistente capacitación", texto: "Me permiten asistir a capacitaciones relacionadas con mi trabajo", invertida: true },
  { id: 36, categoria: "liderazgo", dominio: "liderazgo", dimension: "Limitada o inexistente capacitación", texto: "Recibo capacitación útil para hacer mi trabajo", invertida: true },
  
  // Relación con jefes (37-41)
  { id: 37, categoria: "liderazgo", dominio: "liderazgo", dimension: "Características del liderazgo", texto: "Mi jefe ayuda a organizar mejor el trabajo", invertida: true },
  { id: 38, categoria: "liderazgo", dominio: "liderazgo", dimension: "Características del liderazgo", texto: "Mi jefe tiene en cuenta mis puntos de vista y opiniones", invertida: true },
  { id: 39, categoria: "liderazgo", dominio: "liderazgo", dimension: "Características del liderazgo", texto: "Mi jefe me comunica a tiempo la información relacionada con el trabajo", invertida: true },
  { id: 40, categoria: "liderazgo", dominio: "liderazgo", dimension: "Características del liderazgo", texto: "La orientación que me da mi jefe me ayuda a realizar mejor mi trabajo", invertida: true },
  { id: 41, categoria: "liderazgo", dominio: "liderazgo", dimension: "Características del liderazgo", texto: "Mi jefe ayuda a solucionar los problemas que se presentan en el trabajo", invertida: true },
  
  // Relaciones con compañeros (42-46)
  { id: 42, categoria: "liderazgo", dominio: "relaciones_trabajo", dimension: "Relaciones sociales en el trabajo", texto: "Puedo confiar en mis compañeros de trabajo", invertida: true },
  { id: 43, categoria: "liderazgo", dominio: "relaciones_trabajo", dimension: "Relaciones sociales en el trabajo", texto: "Entre compañeros solucionamos los problemas de trabajo de forma respetuosa", invertida: true },
  { id: 44, categoria: "liderazgo", dominio: "relaciones_trabajo", dimension: "Deficiente relación con los colaboradores que supervisa", texto: "En mi trabajo me hacen sentir parte del grupo", invertida: true },
  { id: 45, categoria: "liderazgo", dominio: "relaciones_trabajo", dimension: "Relaciones sociales en el trabajo", texto: "Cuando tenemos que realizar trabajo de equipo los compañeros colaboran", invertida: true },
  { id: 46, categoria: "liderazgo", dominio: "relaciones_trabajo", dimension: "Relaciones sociales en el trabajo", texto: "Mis compañeros de trabajo me ayudan cuando tengo dificultades", invertida: true },
  
  // Reconocimiento y pertenencia (47-56)
  { id: 47, categoria: "entorno_organizacional", dominio: "reconocimiento", dimension: "Escasa o nula retroalimentación del desempeño", texto: "Me informan sobre lo que hago bien en mi trabajo", invertida: true },
  { id: 48, categoria: "entorno_organizacional", dominio: "reconocimiento", dimension: "Escasa o nula retroalimentación del desempeño", texto: "La forma como evalúan mi trabajo en mi centro de trabajo me ayuda a mejorar mi desempeño", invertida: true },
  { id: 49, categoria: "entorno_organizacional", dominio: "reconocimiento", dimension: "Escaso o nulo reconocimiento y compensación", texto: "En mi centro de trabajo me pagan a tiempo mi salario", invertida: true },
  { id: 50, categoria: "entorno_organizacional", dominio: "reconocimiento", dimension: "Escaso o nulo reconocimiento y compensación", texto: "El pago que recibo es el que merezco por el trabajo que realizo", invertida: true },
  { id: 51, categoria: "entorno_organizacional", dominio: "reconocimiento", dimension: "Escaso o nulo reconocimiento y compensación", texto: "Si obtengo los resultados esperados en mi trabajo me recompensan o reconocen", invertida: true },
  { id: 52, categoria: "entorno_organizacional", dominio: "reconocimiento", dimension: "Escaso o nulo reconocimiento y compensación", texto: "Las personas que hacen bien el trabajo pueden crecer laboralmente", invertida: true },
  { id: 53, categoria: "entorno_organizacional", dominio: "insuficiente_sentido", dimension: "Limitado sentido de pertenencia", texto: "Considero que mi trabajo es estable", invertida: true },
  { id: 54, categoria: "entorno_organizacional", dominio: "insuficiente_sentido", dimension: "Inestabilidad laboral", texto: "En mi trabajo existe continua rotación de personal", invertida: false },
  { id: 55, categoria: "entorno_organizacional", dominio: "insuficiente_sentido", dimension: "Limitado sentido de pertenencia", texto: "Siento orgullo de laborar en este centro de trabajo", invertida: true },
  { id: 56, categoria: "entorno_organizacional", dominio: "insuficiente_sentido", dimension: "Limitado sentido de pertenencia", texto: "Me siento comprometido con mi trabajo", invertida: true },
  
  // Violencia laboral (57-64)
  { id: 57, categoria: "liderazgo", dominio: "violencia", dimension: "Acoso, acoso psicológico", texto: "En mi trabajo puedo expresarme libremente sin interrupciones", invertida: true },
  { id: 58, categoria: "liderazgo", dominio: "violencia", dimension: "Acoso, acoso psicológico", texto: "Recibo críticas constantes a mi persona y/o trabajo", invertida: false },
  { id: 59, categoria: "liderazgo", dominio: "violencia", dimension: "Malos tratos", texto: "Recibo burlas, calumnias, difamaciones, humillaciones o ridiculizaciones", invertida: false },
  { id: 60, categoria: "liderazgo", dominio: "violencia", dimension: "Hostigamiento", texto: "Se ignora mi presencia o se me excluye de las reuniones de trabajo y en la toma de decisiones", invertida: false },
  { id: 61, categoria: "liderazgo", dominio: "violencia", dimension: "Acoso, acoso psicológico", texto: "Se manipulan las situaciones de trabajo para hacerme parecer un mal trabajador", invertida: false },
  { id: 62, categoria: "liderazgo", dominio: "violencia", dimension: "Hostigamiento", texto: "Se ignoran mis éxitos laborales y se atribuyen a otros trabajadores", invertida: false },
  { id: 63, categoria: "liderazgo", dominio: "violencia", dimension: "Hostigamiento", texto: "Me bloquean o impiden las oportunidades que tengo para obtener ascenso o mejora en mi trabajo", invertida: false },
  { id: 64, categoria: "liderazgo", dominio: "violencia", dimension: "Malos tratos", texto: "He presenciado actos de violencia en mi centro de trabajo", invertida: false },
  
  // Atención a clientes (65-68) - Condicionales
  { id: 65, categoria: "factores_actividad", dominio: "carga_trabajo", dimension: "Cargas psicológicas emocionales", texto: "Atiendo clientes o usuarios muy enojados", invertida: false },
  { id: 66, categoria: "factores_actividad", dominio: "carga_trabajo", dimension: "Cargas psicológicas emocionales", texto: "Mi trabajo me exige atender personas muy necesitadas de ayuda o enfermas", invertida: false },
  { id: 67, categoria: "factores_actividad", dominio: "carga_trabajo", dimension: "Cargas psicológicas emocionales", texto: "Para hacer mi trabajo debo demostrar sentimientos distintos a los míos", invertida: false },
  { id: 68, categoria: "factores_actividad", dominio: "carga_trabajo", dimension: "Cargas psicológicas emocionales", texto: "Mi trabajo me exige atender situaciones de violencia", invertida: false },
  
  // Supervisión de otros (69-72) - Condicionales
  { id: 69, categoria: "liderazgo", dominio: "relaciones_trabajo", dimension: "Deficiente relación con los colaboradores que supervisa", texto: "Comunican tarde los asuntos de trabajo", invertida: false },
  { id: 70, categoria: "liderazgo", dominio: "relaciones_trabajo", dimension: "Deficiente relación con los colaboradores que supervisa", texto: "Dificultan el logro de los resultados del trabajo", invertida: false },
  { id: 71, categoria: "liderazgo", dominio: "relaciones_trabajo", dimension: "Deficiente relación con los colaboradores que supervisa", texto: "Cooperan poco cuando se necesita", invertida: false },
  { id: 72, categoria: "liderazgo", dominio: "relaciones_trabajo", dimension: "Deficiente relación con los colaboradores que supervisa", texto: "Ignoran las sugerencias para mejorar su trabajo", invertida: false }
];

// Niveles de riesgo por categoría
export interface NivelRiesgo {
  nivel: "nulo" | "bajo" | "medio" | "alto" | "muy_alto";
  color: string;
  descripcion: string;
}

export const NIVELES_RIESGO: Record<string, NivelRiesgo> = {
  nulo: { nivel: "nulo", color: "bg-emerald-500", descripcion: "El riesgo es despreciable, por lo que no se requieren medidas adicionales" },
  bajo: { nivel: "bajo", color: "bg-green-500", descripcion: "Es necesario implementar medidas preventivas" },
  medio: { nivel: "medio", color: "bg-yellow-500", descripcion: "Se requiere identificar los elementos que provocan esta situación y adoptar medidas preventivas" },
  alto: { nivel: "alto", color: "bg-orange-500", descripcion: "Se requiere realizar un análisis de cada categoría y dominio para establecer las acciones de intervención" },
  muy_alto: { nivel: "muy_alto", color: "bg-red-500", descripcion: "Se requiere realizar el análisis de cada categoría y dominio, así como campañas de sensibilización, revisar la política de prevención" }
};

// Rangos de calificación para el resultado final
export const RANGOS_CALIFICACION_FINAL = {
  nulo: { min: 0, max: 50 },
  bajo: { min: 51, max: 75 },
  medio: { min: 76, max: 99 },
  alto: { min: 100, max: 139 },
  muy_alto: { min: 140, max: 999 }
};

// Función para calcular nivel de riesgo
export const calcularNivelRiesgo = (puntaje: number): NivelRiesgo => {
  if (puntaje <= 50) return NIVELES_RIESGO.nulo;
  if (puntaje <= 75) return NIVELES_RIESGO.bajo;
  if (puntaje <= 99) return NIVELES_RIESGO.medio;
  if (puntaje <= 139) return NIVELES_RIESGO.alto;
  return NIVELES_RIESGO.muy_alto;
};