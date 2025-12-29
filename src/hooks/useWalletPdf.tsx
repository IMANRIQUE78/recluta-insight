import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface MovimientoPdf {
  id: string;
  tipo_accion: string;
  creditos_cantidad: number;
  creditos_antes: number;
  creditos_despues: number;
  descripcion: string;
  created_at: string;
  origen_pago: string;
}

interface WalletInfo {
  tipo: 'empresa' | 'reclutador';
  nombreTitular: string;
  creditosDisponibles: number;
  creditosTotalesComprados: number;
  creditosHeredados?: number;
}

const tipoAccionLabels: Record<string, string> = {
  compra_creditos: 'Compra de créditos',
  publicacion_vacante: 'Publicación de vacante',
  acceso_pool_candidatos: 'Acceso a pool',
  descarga_cv: 'Descarga de CV',
  contacto_candidato: 'Contacto candidato',
  estudio_socioeconomico: 'Estudio socioeconómico',
  evaluacion_psicometrica: 'Evaluación psicométrica',
  sourcing_ia: 'Sourcing IA',
  herencia_creditos: 'Asignación a reclutador',
  devolucion_creditos: 'Devolución',
  ajuste_manual: 'Ajuste manual',
  expiracion_creditos: 'Expiración'
};

const origenPagoLabels: Record<string, string> = {
  empresa: 'Empresa',
  reclutador: 'Propio',
  heredado_empresa: 'Empresa (Heredado)'
};

export function useWalletPdf() {
  const generarPdf = (
    walletInfo: WalletInfo,
    movimientos: MovimientoPdf[],
    periodoLabel?: string
  ) => {
    const doc = new jsPDF();
    const fechaGeneracion = format(new Date(), "dd 'de' MMMM 'de' yyyy, HH:mm", { locale: es });
    
    // Colores corporativos
    const primaryColor: [number, number, number] = [79, 70, 229]; // Indigo
    const grayColor: [number, number, number] = [107, 114, 128];
    
    // Header con logo/marca
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, 210, 35, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('ESTADO DE CUENTA', 14, 18);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Wallet de ${walletInfo.tipo === 'empresa' ? 'Empresa' : 'Reclutador'}`, 14, 26);
    
    doc.setFontSize(8);
    doc.text(`Generado: ${fechaGeneracion}`, 210 - 14, 26, { align: 'right' });
    
    // Información del titular
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Titular:', 14, 48);
    doc.setFont('helvetica', 'normal');
    doc.text(walletInfo.nombreTitular, 35, 48);
    
    if (periodoLabel) {
      doc.setFontSize(9);
      doc.setTextColor(...grayColor);
      doc.text(`Periodo: ${periodoLabel}`, 14, 55);
    }
    
    // Resumen de saldo
    const yResumen = 65;
    doc.setFillColor(249, 250, 251);
    doc.roundedRect(14, yResumen, 182, 25, 3, 3, 'F');
    
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('Créditos Disponibles', 30, yResumen + 10);
    doc.text('Total Comprados', 90, yResumen + 10);
    if (walletInfo.tipo === 'reclutador' && walletInfo.creditosHeredados !== undefined) {
      doc.text('Heredados', 150, yResumen + 10);
    }
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...primaryColor);
    doc.text(walletInfo.creditosDisponibles.toLocaleString(), 30, yResumen + 20);
    doc.setTextColor(34, 197, 94);
    doc.text(walletInfo.creditosTotalesComprados.toLocaleString(), 90, yResumen + 20);
    if (walletInfo.tipo === 'reclutador' && walletInfo.creditosHeredados !== undefined) {
      doc.setTextColor(59, 130, 246);
      doc.text(walletInfo.creditosHeredados.toLocaleString(), 150, yResumen + 20);
    }
    
    // Tabla de movimientos
    const tableData = movimientos.map(mov => [
      format(new Date(mov.created_at), 'dd/MM/yyyy HH:mm'),
      tipoAccionLabels[mov.tipo_accion] || mov.tipo_accion,
      origenPagoLabels[mov.origen_pago] || mov.origen_pago,
      mov.descripcion?.substring(0, 35) + (mov.descripcion?.length > 35 ? '...' : ''),
      mov.creditos_antes?.toLocaleString() || '0',
      (mov.creditos_cantidad > 0 ? '+' : '') + mov.creditos_cantidad.toLocaleString(),
      mov.creditos_despues?.toLocaleString() || '0'
    ]);
    
    autoTable(doc, {
      startY: yResumen + 35,
      head: [['Fecha', 'Concepto', 'Origen', 'Descripción', 'Anterior', 'Movimiento', 'Saldo']],
      body: tableData,
      theme: 'striped',
      headStyles: {
        fillColor: primaryColor,
        fontSize: 8,
        fontStyle: 'bold'
      },
      bodyStyles: {
        fontSize: 7
      },
      columnStyles: {
        0: { cellWidth: 28 },
        1: { cellWidth: 32 },
        2: { cellWidth: 22 },
        3: { cellWidth: 45 },
        4: { cellWidth: 18, halign: 'right' },
        5: { cellWidth: 20, halign: 'right' },
        6: { cellWidth: 18, halign: 'right' }
      },
      didParseCell: (data) => {
        // Colorear movimientos positivos/negativos
        if (data.column.index === 5 && data.section === 'body') {
          const value = data.cell.raw as string;
          if (value.startsWith('+')) {
            data.cell.styles.textColor = [34, 197, 94];
            data.cell.styles.fontStyle = 'bold';
          } else if (value.startsWith('-')) {
            data.cell.styles.textColor = [239, 68, 68];
            data.cell.styles.fontStyle = 'bold';
          }
        }
      }
    });
    
    // Footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(...grayColor);
      doc.text(
        `Página ${i} de ${pageCount}`,
        105,
        doc.internal.pageSize.height - 10,
        { align: 'center' }
      );
      doc.text(
        'VVGI Reclutamiento - Estado de Cuenta de Créditos',
        105,
        doc.internal.pageSize.height - 5,
        { align: 'center' }
      );
    }
    
    // Descargar
    const nombreArchivo = `estado_cuenta_${walletInfo.tipo}_${format(new Date(), 'yyyyMMdd_HHmm')}.pdf`;
    doc.save(nombreArchivo);
  };

  return { generarPdf };
}
