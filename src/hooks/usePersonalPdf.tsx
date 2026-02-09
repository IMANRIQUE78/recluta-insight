import jsPDF from 'jspdf';
import { format, differenceInYears, differenceInMonths, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

interface PersonalEmpleado {
  id: string;
  codigo_empleado: string;
  estatus: string;
  nombre_completo: string;
  genero: string | null;
  puesto: string | null;
  area: string | null;
  jefe_directo: string | null;
  fecha_nacimiento: string | null;
  fecha_ingreso: string | null;
  fecha_salida: string | null;
  domicilio: string | null;
  colonia: string | null;
  alcaldia_municipio: string | null;
  codigo_postal?: string | null;
  telefono_movil: string | null;
  telefono_emergencia: string | null;
  email_personal: string | null;
  email_corporativo: string | null;
  estado_civil: string | null;
  escolaridad: string | null;
  enfermedades_alergias: string | null;
  nss: string | null;
  cuenta_bancaria: string | null;
  curp: string | null;
  rfc: string | null;
  reclutador_asignado: string | null;
  sueldo_asignado: number | null;
  finiquito: number | null;
  observaciones: string | null;
  centro_trabajo?: string | null;
  tipo_jornada?: string | null;
  modalidad_contratacion?: string | null;
  fecha_fin_contrato?: string | null;
  es_supervisor?: boolean;
  created_at: string;
}

export function usePersonalPdf() {
  const calcularEdad = (fechaNacimiento: string | null): string => {
    if (!fechaNacimiento) return "-";
    const edad = differenceInYears(new Date(), parseISO(fechaNacimiento));
    return `${edad} años`;
  };

  const calcularAntiguedad = (fechaIngreso: string | null, fechaSalida: string | null): string => {
    if (!fechaIngreso) return "-";
    const fechaFin = fechaSalida ? parseISO(fechaSalida) : new Date();
    const fechaInicio = parseISO(fechaIngreso);
    
    const years = differenceInYears(fechaFin, fechaInicio);
    const months = differenceInMonths(fechaFin, fechaInicio) % 12;

    const parts = [];
    if (years > 0) parts.push(`${years} año${years > 1 ? 's' : ''}`);
    if (months > 0) parts.push(`${months} mes${months > 1 ? 'es' : ''}`);
    
    return parts.length > 0 ? parts.join(' ') : 'Menos de 1 mes';
  };

  const formatDate = (date: string | null): string => {
    if (!date) return "-";
    return format(parseISO(date), "dd/MM/yyyy", { locale: es });
  };

  const formatCurrency = (amount: number | null): string => {
    if (!amount) return "-";
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);
  };

  const generarExpedientePdf = (empleado: PersonalEmpleado, nombreEmpresa: string) => {
    const doc = new jsPDF('p', 'mm', 'a4');
    const fechaDescarga = format(new Date(), "dd 'de' MMMM 'de' yyyy, HH:mm", { locale: es });
    
    // Colores corporativos
    const primaryColor: [number, number, number] = [79, 70, 229]; // Indigo
    const grayColor: [number, number, number] = [107, 114, 128];
    const lightGray: [number, number, number] = [249, 250, 251];
    
    const pageWidth = 210;
    const margin = 15;
    const contentWidth = pageWidth - (margin * 2);
    let yPosition = 0;

    // ==================== HEADER ====================
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, pageWidth, 40, 'F');
    
    // Título principal
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('EXPEDIENTE DE TRABAJADOR', margin, 18);
    
    // Nombre empresa
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text(nombreEmpresa, margin, 28);
    
    // Fecha de descarga
    doc.setFontSize(8);
    doc.text(`Generado: ${fechaDescarga}`, pageWidth - margin, 35, { align: 'right' });
    
    yPosition = 50;

    // ==================== DATOS DEL EMPLEADO (HEADER) ====================
    doc.setFillColor(...lightGray);
    doc.roundedRect(margin, yPosition, contentWidth, 28, 3, 3, 'F');
    
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(empleado.nombre_completo, margin + 5, yPosition + 10);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...grayColor);
    doc.text(`Código: ${empleado.codigo_empleado}`, margin + 5, yPosition + 18);
    
    // Estatus badge
    const estatusX = pageWidth - margin - 25;
    const estatusColor: [number, number, number] = empleado.estatus === 'activo' 
      ? [34, 197, 94] 
      : empleado.estatus === 'inactivo' 
        ? [239, 68, 68] 
        : [59, 130, 246];
    doc.setFillColor(...estatusColor);
    doc.roundedRect(estatusX, yPosition + 4, 20, 8, 2, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text(empleado.estatus.charAt(0).toUpperCase() + empleado.estatus.slice(1), estatusX + 10, yPosition + 9.5, { align: 'center' });
    
    yPosition += 35;

    // ==================== FUNCIÓN HELPER PARA SECCIONES ====================
    const drawSectionTitle = (title: string) => {
      if (yPosition > 260) {
        doc.addPage();
        yPosition = 20;
      }
      doc.setFillColor(...primaryColor);
      doc.rect(margin, yPosition, 3, 8, 'F');
      doc.setTextColor(...primaryColor);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text(title, margin + 6, yPosition + 6);
      yPosition += 12;
    };

    const drawInfoRow = (label: string, value: string | null | undefined, isLast: boolean = false) => {
      if (yPosition > 275) {
        doc.addPage();
        yPosition = 20;
      }
      doc.setTextColor(...grayColor);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(label, margin + 3, yPosition);
      
      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'bold');
      doc.text(value || '-', margin + 55, yPosition);
      
      if (!isLast) {
        doc.setDrawColor(230, 230, 230);
        doc.setLineWidth(0.1);
        doc.line(margin + 3, yPosition + 2, margin + contentWidth - 3, yPosition + 2);
      }
      yPosition += 7;
    };

    // ==================== DATOS PERSONALES ====================
    drawSectionTitle('DATOS PERSONALES');
    drawInfoRow('Género', empleado.genero);
    drawInfoRow('Fecha de Nacimiento', formatDate(empleado.fecha_nacimiento));
    drawInfoRow('Edad', calcularEdad(empleado.fecha_nacimiento));
    drawInfoRow('Estado Civil', empleado.estado_civil);
    drawInfoRow('Escolaridad', empleado.escolaridad, true);
    yPosition += 5;

    // ==================== DATOS LABORALES ====================
    drawSectionTitle('DATOS LABORALES');
    drawInfoRow('Puesto', empleado.puesto);
    drawInfoRow('Área', empleado.area);
    drawInfoRow('Centro de Trabajo', empleado.centro_trabajo);
    drawInfoRow('Jefe Directo', empleado.jefe_directo);
    drawInfoRow('Tipo de Jornada', empleado.tipo_jornada);
    drawInfoRow('Modalidad Contratación', empleado.modalidad_contratacion);
    if (empleado.fecha_fin_contrato) {
      drawInfoRow('Fin de Contrato', formatDate(empleado.fecha_fin_contrato));
    }
    drawInfoRow('Fecha de Ingreso', formatDate(empleado.fecha_ingreso));
    drawInfoRow('Antigüedad', calcularAntiguedad(empleado.fecha_ingreso, empleado.fecha_salida));
    if (empleado.fecha_salida) {
      drawInfoRow('Fecha de Salida', formatDate(empleado.fecha_salida));
    }
    drawInfoRow('Es Supervisor', empleado.es_supervisor ? 'Sí' : 'No');
    drawInfoRow('Reclutador Asignado', empleado.reclutador_asignado, true);
    yPosition += 5;

    // ==================== COMPENSACIÓN ====================
    drawSectionTitle('COMPENSACIÓN');
    drawInfoRow('Sueldo Asignado', formatCurrency(empleado.sueldo_asignado));
    if (empleado.finiquito) {
      drawInfoRow('Finiquito', formatCurrency(empleado.finiquito), true);
    }
    yPosition += 5;

    // ==================== DIRECCIÓN ====================
    drawSectionTitle('DIRECCIÓN');
    drawInfoRow('Domicilio', empleado.domicilio);
    drawInfoRow('Colonia', empleado.colonia);
    drawInfoRow('Alcaldía/Municipio', empleado.alcaldia_municipio);
    drawInfoRow('Código Postal', empleado.codigo_postal, true);
    yPosition += 5;

    // ==================== CONTACTO ====================
    drawSectionTitle('CONTACTO');
    drawInfoRow('Teléfono Móvil', empleado.telefono_movil);
    drawInfoRow('Tel. Emergencia', empleado.telefono_emergencia);
    drawInfoRow('Email Personal', empleado.email_personal);
    drawInfoRow('Email Corporativo', empleado.email_corporativo, true);
    yPosition += 5;

    // ==================== DATOS FISCALES ====================
    drawSectionTitle('DATOS FISCALES Y BANCARIOS');
    drawInfoRow('NSS', empleado.nss);
    drawInfoRow('CURP', empleado.curp);
    drawInfoRow('RFC', empleado.rfc);
    drawInfoRow('Cuenta Bancaria', empleado.cuenta_bancaria, true);
    yPosition += 5;

    // ==================== SALUD (condicional) ====================
    if (empleado.enfermedades_alergias) {
      drawSectionTitle('SALUD');
      drawInfoRow('Enfermedades/Alergias', empleado.enfermedades_alergias, true);
      yPosition += 5;
    }

    // ==================== OBSERVACIONES (condicional) ====================
    if (empleado.observaciones) {
      drawSectionTitle('OBSERVACIONES');
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      const splitText = doc.splitTextToSize(empleado.observaciones, contentWidth - 10);
      doc.text(splitText, margin + 3, yPosition);
      yPosition += splitText.length * 5;
    }

    // ==================== FOOTER ====================
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(...grayColor);
      doc.text(
        `Página ${i} de ${pageCount}`,
        pageWidth / 2,
        287,
        { align: 'center' }
      );
      doc.text(
        'Documento Confidencial - Expediente de Personal',
        pageWidth / 2,
        292,
        { align: 'center' }
      );
    }

    // Descargar
    const nombreArchivo = `expediente_${empleado.codigo_empleado}_${format(new Date(), 'yyyyMMdd')}.pdf`;
    doc.save(nombreArchivo);
  };

  return { generarExpedientePdf };
}
