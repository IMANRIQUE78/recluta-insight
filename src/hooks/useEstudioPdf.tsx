import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface EstudioData {
  folio: string;
  nombre_candidato: string;
  vacante_puesto: string;
  direccion_visita: string;
  fecha_solicitud: string;
  fecha_limite: string;
  fecha_visita?: string | null;
  hora_visita?: string | null;
  fecha_entrega?: string | null;
  estatus: string;
  es_estudio_directo?: boolean;
  cliente_empresa?: string | null;
  telefono_candidato?: string | null;
  email_candidato?: string | null;
  resultado_general?: string | null;
  calificacion_riesgo?: string | null;
  observaciones_finales?: string | null;
  observaciones_visita?: string | null;
  candidato_presente?: boolean | null;
  datos_sociodemograficos?: any;
  datos_vivienda?: any;
  datos_economicos?: any;
  datos_laborales?: any;
  datos_referencias?: any;
  empresas?: { nombre_empresa: string } | null;
}

const formatDate = (dateStr: string | null | undefined) => {
  if (!dateStr) return "—";
  try {
    return format(new Date(dateStr), "dd/MMM/yyyy", { locale: es });
  } catch {
    return dateStr;
  }
};

const jsonToRows = (obj: any): string[][] => {
  if (!obj || typeof obj !== "object") return [];
  return Object.entries(obj)
    .filter(([, v]) => v !== null && v !== undefined && v !== "")
    .map(([k, v]) => {
      const label = k.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
      const value = typeof v === "object" ? JSON.stringify(v) : String(v);
      return [label, value];
    });
};

export function useEstudioPdf() {
  const downloadEstudioPdf = (estudio: EstudioData) => {
    const doc = new jsPDF("p", "mm", "a4");
    const pageWidth = doc.internal.pageSize.getWidth();
    let y = 15;

    // Header
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("Estudio Socioeconómico", pageWidth / 2, y, { align: "center" });
    y += 8;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Folio: ${estudio.folio}`, pageWidth / 2, y, { align: "center" });
    y += 5;

    if (estudio.es_estudio_directo) {
      doc.setTextColor(0, 100, 180);
      doc.text("Estudio Directo", pageWidth / 2, y, { align: "center" });
      doc.setTextColor(0, 0, 0);
      y += 5;
    }

    doc.setDrawColor(200);
    doc.line(15, y, pageWidth - 15, y);
    y += 8;

    // General info table
    const generalRows: string[][] = [
      ["Candidato", estudio.nombre_candidato],
      ["Puesto", estudio.vacante_puesto],
      ["Dirección de Visita", estudio.direccion_visita],
      ["Estatus", estudio.estatus.replace(/_/g, " ").toUpperCase()],
      ["Fecha Solicitud", formatDate(estudio.fecha_solicitud)],
      ["Fecha Límite", formatDate(estudio.fecha_limite)],
    ];

    if (estudio.cliente_empresa) {
      generalRows.push(["Cliente / Empresa", estudio.cliente_empresa]);
    }
    if (estudio.empresas?.nombre_empresa) {
      generalRows.push(["Empresa (plataforma)", estudio.empresas.nombre_empresa]);
    }
    if (estudio.telefono_candidato) {
      generalRows.push(["Teléfono Candidato", estudio.telefono_candidato]);
    }
    if (estudio.email_candidato) {
      generalRows.push(["Email Candidato", estudio.email_candidato]);
    }
    if (estudio.fecha_visita) {
      generalRows.push(["Fecha Visita", `${formatDate(estudio.fecha_visita)} ${estudio.hora_visita || ""}`]);
    }
    if (estudio.candidato_presente !== null && estudio.candidato_presente !== undefined) {
      generalRows.push(["Candidato Presente", estudio.candidato_presente ? "Sí" : "No"]);
    }
    if (estudio.fecha_entrega) {
      generalRows.push(["Fecha Entrega", formatDate(estudio.fecha_entrega)]);
    }

    autoTable(doc, {
      startY: y,
      head: [["Campo", "Valor"]],
      body: generalRows,
      theme: "striped",
      headStyles: { fillColor: [41, 98, 255], fontSize: 9 },
      bodyStyles: { fontSize: 9 },
      columnStyles: { 0: { fontStyle: "bold", cellWidth: 55 } },
      margin: { left: 15, right: 15 },
    });

    y = (doc as any).lastAutoTable.finalY + 10;

    // Helper to add section
    const addSection = (title: string, data: any) => {
      const rows = jsonToRows(data);
      if (rows.length === 0) return;

      if (y > 260) {
        doc.addPage();
        y = 15;
      }

      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text(title, 15, y);
      y += 5;

      autoTable(doc, {
        startY: y,
        head: [["Campo", "Valor"]],
        body: rows,
        theme: "striped",
        headStyles: { fillColor: [80, 80, 80], fontSize: 8 },
        bodyStyles: { fontSize: 8 },
        columnStyles: { 0: { fontStyle: "bold", cellWidth: 55 } },
        margin: { left: 15, right: 15 },
      });

      y = (doc as any).lastAutoTable.finalY + 10;
    };

    addSection("Datos Sociodemográficos", estudio.datos_sociodemograficos);
    addSection("Datos de Vivienda", estudio.datos_vivienda);
    addSection("Datos Económicos", estudio.datos_economicos);
    addSection("Datos Laborales", estudio.datos_laborales);
    addSection("Referencias", estudio.datos_referencias);

    // Results
    if (estudio.resultado_general || estudio.calificacion_riesgo || estudio.observaciones_finales || estudio.observaciones_visita) {
      if (y > 260) {
        doc.addPage();
        y = 15;
      }

      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("Resultado y Observaciones", 15, y);
      y += 5;

      const resultRows: string[][] = [];
      if (estudio.resultado_general) resultRows.push(["Resultado General", estudio.resultado_general]);
      if (estudio.calificacion_riesgo) resultRows.push(["Calificación de Riesgo", estudio.calificacion_riesgo]);
      if (estudio.observaciones_visita) resultRows.push(["Observaciones de Visita", estudio.observaciones_visita]);
      if (estudio.observaciones_finales) resultRows.push(["Observaciones Finales", estudio.observaciones_finales]);

      autoTable(doc, {
        startY: y,
        body: resultRows,
        theme: "plain",
        bodyStyles: { fontSize: 9 },
        columnStyles: { 0: { fontStyle: "bold", cellWidth: 55 } },
        margin: { left: 15, right: 15 },
      });

      y = (doc as any).lastAutoTable.finalY + 10;
    }

    // Blank "Fotos" page
    doc.addPage();
    const fotosY = 20;
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0);
    doc.text("Fotos", pageWidth / 2, fotosY, { align: "center" });
    doc.setDrawColor(200);
    doc.line(15, fotosY + 4, pageWidth - 15, fotosY + 4);

    // Footer
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(7);
      doc.setTextColor(150);
      doc.text(
        `Generado el ${format(new Date(), "dd/MMM/yyyy HH:mm", { locale: es })} — Página ${i} de ${totalPages}`,
        pageWidth / 2,
        doc.internal.pageSize.getHeight() - 8,
        { align: "center" }
      );
    }

    doc.save(`Estudio_${estudio.folio || "SE"}.pdf`);
  };

  return { downloadEstudioPdf };
}
