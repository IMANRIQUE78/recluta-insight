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

const formatLabel = (key: string) =>
  key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

const flattenObject = (obj: any, prefix = ""): string[][] => {
  if (!obj || typeof obj !== "object") return [];
  const rows: string[][] = [];

  Object.entries(obj).forEach(([key, val]) => {
    if (val === null || val === undefined || val === "") return;
    if (Array.isArray(val)) return; // arrays handled separately
    if (typeof val === "object") {
      rows.push(...flattenObject(val, `${prefix}${formatLabel(key)} > `));
    } else {
      const label = `${prefix}${formatLabel(key)}`;
      const value = typeof val === "boolean" ? (val ? "Sí" : "No") : String(val);
      rows.push([label, value]);
    }
  });

  return rows;
};

const getArrayEntries = (obj: any): [string, any[]][] => {
  if (!obj || typeof obj !== "object") return [];
  return Object.entries(obj).filter(([, v]) => Array.isArray(v)) as [string, any[]][];
};

export function useEstudioPdf() {
  const downloadEstudioPdf = (estudio: EstudioData) => {
    const doc = new jsPDF("p", "mm", "a4");
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;
    let y = 15;

    // ── HEADER ──
    doc.setFillColor(30, 58, 95);
    doc.rect(0, 0, pageWidth, 32, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("Estudio Socioeconómico", margin, 14);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Folio: ${estudio.folio}`, margin, 21);
    if (estudio.es_estudio_directo) {
      doc.text("Estudio Directo", margin, 27);
    }
    doc.text(formatDate(new Date().toISOString()), pageWidth - margin, 21, { align: "right" });
    doc.setTextColor(0, 0, 0);
    y = 38;

    // ── GENERAL INFO ──
    const generalRows: string[][] = [
      ["Candidato", estudio.nombre_candidato],
      ["Puesto / Vacante", estudio.vacante_puesto],
      ["Dirección de Visita", estudio.direccion_visita],
      ["Estatus", formatLabel(estudio.estatus)],
      ["Fecha Solicitud", formatDate(estudio.fecha_solicitud)],
      ["Fecha Límite", formatDate(estudio.fecha_limite)],
    ];
    if (estudio.cliente_empresa) generalRows.push(["Cliente / Empresa", estudio.cliente_empresa]);
    if (estudio.empresas?.nombre_empresa) generalRows.push(["Empresa (plataforma)", estudio.empresas.nombre_empresa]);
    if (estudio.telefono_candidato) generalRows.push(["Teléfono Candidato", estudio.telefono_candidato]);
    if (estudio.email_candidato) generalRows.push(["Email Candidato", estudio.email_candidato]);
    if (estudio.fecha_visita) generalRows.push(["Fecha Visita", `${formatDate(estudio.fecha_visita)} ${estudio.hora_visita || ""}`]);
    if (estudio.candidato_presente !== null && estudio.candidato_presente !== undefined)
      generalRows.push(["Candidato Presente", estudio.candidato_presente ? "Sí" : "No"]);
    if (estudio.fecha_entrega) generalRows.push(["Fecha Entrega", formatDate(estudio.fecha_entrega)]);

    autoTable(doc, {
      startY: y,
      body: generalRows,
      theme: "plain",
      bodyStyles: { fontSize: 8.5, cellPadding: { top: 2, bottom: 2, left: 4, right: 4 } },
      columnStyles: {
        0: { fontStyle: "bold", cellWidth: 48, textColor: [60, 60, 60] },
        1: { cellWidth: undefined },
      },
      alternateRowStyles: { fillColor: [245, 247, 250] },
      margin: { left: margin, right: margin },
    });
    y = (doc as any).lastAutoTable.finalY + 6;

    // ── SECTION HELPER ──
    const addSectionTitle = (title: string) => {
      if (y > 260) { doc.addPage(); y = 15; }
      doc.setFillColor(30, 58, 95);
      doc.rect(margin, y, pageWidth - margin * 2, 7, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.text(title.toUpperCase(), margin + 3, y + 5);
      doc.setTextColor(0, 0, 0);
      doc.setFont("helvetica", "normal");
      y += 9;
    };

    const addDataTable = (rows: string[][]) => {
      if (rows.length === 0) return;
      autoTable(doc, {
        startY: y,
        body: rows,
        theme: "plain",
        bodyStyles: { fontSize: 8, cellPadding: { top: 1.5, bottom: 1.5, left: 4, right: 4 } },
        columnStyles: {
          0: { fontStyle: "bold", cellWidth: 55, textColor: [80, 80, 80] },
        },
        alternateRowStyles: { fillColor: [250, 250, 252] },
        margin: { left: margin, right: margin },
      });
      y = (doc as any).lastAutoTable.finalY + 4;
    };

    const addArrayTable = (title: string, items: any[]) => {
      const filtered = items.filter((item) => {
        if (typeof item !== "object") return true;
        return Object.values(item).some((v) => v !== null && v !== undefined && v !== "");
      });
      if (filtered.length === 0) return;

      if (y > 250) { doc.addPage(); y = 15; }
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(60, 60, 60);
      doc.text(formatLabel(title), margin + 2, y + 3);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(0, 0, 0);
      y += 5;

      filtered.forEach((item, idx) => {
        if (typeof item !== "object") {
          addDataTable([[`#${idx + 1}`, String(item)]]);
          return;
        }
        const rows = Object.entries(item)
          .filter(([, v]) => v !== null && v !== undefined && v !== "")
          .map(([k, v]) => [formatLabel(k), typeof v === "boolean" ? (v ? "Sí" : "No") : String(v)]);
        if (rows.length > 0) addDataTable(rows);
      });
    };

    const addSection = (title: string, data: any) => {
      if (!data || typeof data !== "object" || Object.keys(data).length === 0) return;
      const flat = flattenObject(data);
      const arrays = getArrayEntries(data);
      if (flat.length === 0 && arrays.length === 0) return;

      addSectionTitle(title);
      if (flat.length > 0) addDataTable(flat);
      arrays.forEach(([key, arr]) => addArrayTable(key, arr));
    };

    // ── SECTIONS ──
    addSection("Datos Sociodemográficos", estudio.datos_sociodemograficos);
    addSection("Datos de Vivienda", estudio.datos_vivienda);

    // Economic section with special ingresos/egresos handling
    const econ = estudio.datos_economicos;
    if (econ && typeof econ === "object" && Object.keys(econ).length > 0) {
      const econCopy = { ...econ };
      const ingresos = econCopy.ingresos;
      const egresos = econCopy.egresos;
      const totalIng = econCopy.total_ingresos;
      const totalEgr = econCopy.total_egresos;
      delete econCopy.ingresos;
      delete econCopy.egresos;
      delete econCopy.total_ingresos;
      delete econCopy.total_egresos;

      addSectionTitle("Datos Económicos");

      const flatEcon = flattenObject(econCopy);
      if (flatEcon.length > 0) addDataTable(flatEcon);

      // Ingresos
      if (Array.isArray(ingresos) && ingresos.length > 0) {
        if (y > 250) { doc.addPage(); y = 15; }
        doc.setFontSize(8);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(34, 120, 60);
        doc.text("INGRESOS MENSUALES", margin + 2, y + 3);
        doc.setTextColor(0, 0, 0);
        y += 5;

        const ingRows = ingresos
          .filter((i: any) => i.concepto || i.monto)
          .map((i: any) => [i.concepto || "", `$${parseFloat(i.monto || 0).toLocaleString("es-MX", { minimumFractionDigits: 2 })}`]);
        const total = totalIng || ingresos.reduce((s: number, i: any) => s + (parseFloat(i.monto) || 0), 0);
        ingRows.push(["TOTAL INGRESOS", `$${parseFloat(total).toLocaleString("es-MX", { minimumFractionDigits: 2 })}`]);

        autoTable(doc, {
          startY: y,
          head: [["Concepto", "Monto"]],
          body: ingRows,
          theme: "striped",
          headStyles: { fillColor: [34, 120, 60], fontSize: 8, textColor: [255, 255, 255] },
          bodyStyles: { fontSize: 8 },
          columnStyles: { 1: { halign: "right" } },
          margin: { left: margin, right: margin },
        });
        y = (doc as any).lastAutoTable.finalY + 4;
      }

      // Egresos
      if (Array.isArray(egresos) && egresos.length > 0) {
        if (y > 250) { doc.addPage(); y = 15; }
        doc.setFontSize(8);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(180, 40, 40);
        doc.text("EGRESOS MENSUALES", margin + 2, y + 3);
        doc.setTextColor(0, 0, 0);
        y += 5;

        const egrRows = egresos
          .filter((e: any) => e.concepto || e.monto)
          .map((e: any) => [e.concepto || "", `$${parseFloat(e.monto || 0).toLocaleString("es-MX", { minimumFractionDigits: 2 })}`]);
        const total = totalEgr || egresos.reduce((s: number, e: any) => s + (parseFloat(e.monto) || 0), 0);
        egrRows.push(["TOTAL EGRESOS", `$${parseFloat(total).toLocaleString("es-MX", { minimumFractionDigits: 2 })}`]);

        autoTable(doc, {
          startY: y,
          head: [["Concepto", "Monto"]],
          body: egrRows,
          theme: "striped",
          headStyles: { fillColor: [180, 40, 40], fontSize: 8, textColor: [255, 255, 255] },
          bodyStyles: { fontSize: 8 },
          columnStyles: { 1: { halign: "right" } },
          margin: { left: margin, right: margin },
        });
        y = (doc as any).lastAutoTable.finalY + 4;
      }

      // Non-array economic data handled via flatEcon above, arrays (other than ingresos/egresos) below
      const otherArrays = getArrayEntries(econCopy);
      otherArrays.forEach(([key, arr]) => addArrayTable(key, arr));
    }

    addSection("Datos Laborales", estudio.datos_laborales);
    addSection("Referencias", estudio.datos_referencias);

    // ── RESULT ──
    if (estudio.resultado_general || estudio.calificacion_riesgo || estudio.observaciones_finales || estudio.observaciones_visita) {
      addSectionTitle("Resultado y Observaciones");
      const resultRows: string[][] = [];
      if (estudio.resultado_general) resultRows.push(["Resultado General", estudio.resultado_general]);
      if (estudio.calificacion_riesgo) resultRows.push(["Calificación de Riesgo", formatLabel(estudio.calificacion_riesgo)]);
      if (estudio.observaciones_visita) resultRows.push(["Observaciones de Visita", estudio.observaciones_visita]);
      if (estudio.observaciones_finales) resultRows.push(["Observaciones Finales", estudio.observaciones_finales]);
      addDataTable(resultRows);
    }

    // ── FOTOS PAGE ──
    doc.addPage();
    doc.setFillColor(30, 58, 95);
    doc.rect(0, 0, pageWidth, 32, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("Fotos", margin, 20);
    doc.setTextColor(0, 0, 0);

    // ── FOOTER ──
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setDrawColor(200);
      doc.line(margin, doc.internal.pageSize.getHeight() - 12, pageWidth - margin, doc.internal.pageSize.getHeight() - 12);
      doc.setFontSize(7);
      doc.setTextColor(140, 140, 140);
      doc.text(
        `${estudio.folio} — Generado el ${format(new Date(), "dd/MMM/yyyy HH:mm", { locale: es })}`,
        margin,
        doc.internal.pageSize.getHeight() - 7,
      );
      doc.text(
        `Página ${i} de ${totalPages}`,
        pageWidth - margin,
        doc.internal.pageSize.getHeight() - 7,
        { align: "right" },
      );
    }

    doc.save(`Estudio_${estudio.folio || "SE"}.pdf`);
  };

  return { downloadEstudioPdf };
}
