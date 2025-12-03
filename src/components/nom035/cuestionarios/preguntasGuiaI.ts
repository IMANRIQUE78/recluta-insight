// Guía de Referencia I - Acontecimientos Traumáticos Severos
// NOM-035-STPS-2018

export interface PreguntaGuiaI {
  id: number;
  seccion: string;
  texto: string;
}

export const SECCIONES_GUIA_I = {
  I: "Acontecimiento traumático severo",
  II: "Recuerdos persistentes sobre el acontecimiento",
  III: "Esfuerzo por evitar circunstancias parecidas o asociadas al acontecimiento",
  IV: "Afectación"
};

export const PREGUNTAS_GUIA_I: PreguntaGuiaI[] = [
  // Sección I - Acontecimiento traumático severo
  {
    id: 1,
    seccion: "I",
    texto: "¿Ha presenciado o sufrido alguna vez, durante o con motivo del trabajo un acontecimiento como los siguientes: Accidente que tenga como consecuencia la muerte, la pérdida de un miembro o una lesión grave?"
  },
  {
    id: 2,
    seccion: "I",
    texto: "¿Ha presenciado o sufrido asaltos?"
  },
  {
    id: 3,
    seccion: "I",
    texto: "¿Ha presenciado o sufrido actos violentos que derivaron en lesiones graves?"
  },
  {
    id: 4,
    seccion: "I",
    texto: "¿Ha presenciado o sufrido secuestro?"
  },
  {
    id: 5,
    seccion: "I",
    texto: "¿Ha presenciado o sufrido amenazas?"
  },
  {
    id: 6,
    seccion: "I",
    texto: "¿Ha presenciado o sufrido cualquier otro acontecimiento que ponga en riesgo su vida o salud, y/o la de otras personas?"
  },
  
  // Sección II - Recuerdos persistentes (durante el último mes)
  {
    id: 7,
    seccion: "II",
    texto: "¿Ha tenido recuerdos recurrentes sobre el acontecimiento que le provocan malestares?"
  },
  {
    id: 8,
    seccion: "II",
    texto: "¿Ha tenido sueños de carácter recurrente sobre el acontecimiento, que le producen malestar?"
  },
  
  // Sección III - Esfuerzo por evitar circunstancias (durante el último mes)
  {
    id: 9,
    seccion: "III",
    texto: "¿Se ha esforzado por evitar todo tipo de sentimientos, conversaciones o situaciones que le puedan recordar el acontecimiento?"
  },
  {
    id: 10,
    seccion: "III",
    texto: "¿Se ha esforzado por evitar todo tipo de actividades, lugares o personas que motivan recuerdos del acontecimiento?"
  },
  {
    id: 11,
    seccion: "III",
    texto: "¿Ha tenido dificultad para recordar alguna parte importante del evento?"
  },
  {
    id: 12,
    seccion: "III",
    texto: "¿Ha disminuido su interés en sus actividades cotidianas?"
  },
  {
    id: 13,
    seccion: "III",
    texto: "¿Se ha sentido usted alejado o distante de los demás?"
  },
  {
    id: 14,
    seccion: "III",
    texto: "¿Ha notado que tiene dificultad para expresar sus sentimientos?"
  },
  {
    id: 15,
    seccion: "III",
    texto: "¿Ha tenido la impresión de que su vida se va a acortar, que va a morir antes que otras personas o que tiene un futuro limitado?"
  },
  
  // Sección IV - Afectación (durante el último mes)
  {
    id: 16,
    seccion: "IV",
    texto: "¿Ha tenido dificultades para dormir?"
  },
  {
    id: 17,
    seccion: "IV",
    texto: "¿Ha tenido problemas para concentrarse?"
  },
  {
    id: 18,
    seccion: "IV",
    texto: "¿Ha tenido la sensación de estar en alerta o como en peligro?"
  },
  {
    id: 19,
    seccion: "IV",
    texto: "¿Se ha sobresaltado fácilmente?"
  },
  {
    id: 20,
    seccion: "IV",
    texto: "¿Ha tenido reacciones físicas (sudoración, temblores, aumento en la frecuencia cardiaca, dificultad para respirar) al recordar el acontecimiento?"
  }
];

// Criterios de evaluación Guía I
export const evaluarGuiaI = (respuestas: Record<number, boolean>): {
  requiereAtencion: boolean;
  seccionesPositivas: string[];
  mensaje: string;
} => {
  const seccionI = [1, 2, 3, 4, 5, 6].some(id => respuestas[id] === true);
  const seccionII = [7, 8].some(id => respuestas[id] === true);
  const seccionIII = [9, 10, 11, 12, 13, 14, 15].some(id => respuestas[id] === true);
  const seccionIV = [16, 17, 18, 19, 20].some(id => respuestas[id] === true);
  
  const seccionesPositivas: string[] = [];
  if (seccionI) seccionesPositivas.push("I");
  if (seccionII) seccionesPositivas.push("II");
  if (seccionIII) seccionesPositivas.push("III");
  if (seccionIV) seccionesPositivas.push("IV");
  
  // Requiere atención clínica si respondió SÍ a la Sección I Y a alguna de las secciones II, III o IV
  const requiereAtencion = seccionI && (seccionII || seccionIII || seccionIV);
  
  let mensaje = "";
  if (!seccionI) {
    mensaje = "No se identificaron acontecimientos traumáticos severos relacionados con el trabajo.";
  } else if (requiereAtencion) {
    mensaje = "Se identificó exposición a acontecimiento traumático severo con posibles secuelas. Se recomienda canalización para valoración clínica especializada.";
  } else {
    mensaje = "Se identificó exposición a acontecimiento traumático severo, sin evidencia de secuelas actuales. Se recomienda seguimiento.";
  }
  
  return { requiereAtencion, seccionesPositivas, mensaje };
};