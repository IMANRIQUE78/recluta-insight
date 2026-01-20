import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ConceptoCosteo, PERIODICIDADES, UNIDADES_MEDIDA } from "@/hooks/useCostosReclutamiento";
import { MoreHorizontal, Pencil, Trash2, Calendar, DollarSign } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface ConceptosCosteoTableProps {
  conceptos: ConceptoCosteo[];
  onEdit: (concepto: ConceptoCosteo) => void;
  onDelete: (id: string) => Promise<boolean>;
}

// Factor de conversión a costo mensual
const FACTOR_PERIODICIDAD: Record<string, number> = {
  diario: 30,
  semanal: 4.33,
  quincenal: 2,
  mensual: 1,
  bimestral: 0.5,
  trimestral: 0.333,
  semestral: 0.167,
  anual: 0.0833,
  unico: 0.0833,
};

export const ConceptosCosteoTable = ({
  conceptos,
  onEdit,
  onDelete,
}: ConceptosCosteoTableProps) => {
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const getPeriodicidadLabel = (value: string) => {
    return PERIODICIDADES.find(p => p.value === value)?.label || value;
  };

  const getUnidadLabel = (value: string) => {
    return UNIDADES_MEDIDA.find(u => u.value === value)?.label || value;
  };

  const calcularCostoMensual = (costo: number, periodicidad: string) => {
    const factor = FACTOR_PERIODICIDAD[periodicidad] || 1;
    return costo * factor;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(value);
  };

  const handleDelete = async () => {
    if (deleteId) {
      await onDelete(deleteId);
      setDeleteId(null);
    }
  };

  if (conceptos.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p className="text-lg font-medium">No hay conceptos de costo registrados</p>
        <p className="text-sm">Agrega tus primeros conceptos para calcular el costo de reclutamiento</p>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Concepto</TableHead>
              <TableHead className="text-right">Costo Original</TableHead>
              <TableHead>Periodicidad</TableHead>
              <TableHead className="text-right">Costo Mensual</TableHead>
              <TableHead>Unidad</TableHead>
              <TableHead className="hidden md:table-cell">Última Actualización</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {conceptos.map((concepto) => {
              const costoMensual = calcularCostoMensual(concepto.costo, concepto.periodicidad);
              return (
                <TableRow key={concepto.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{concepto.concepto}</p>
                      {concepto.descripcion && (
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {concepto.descripcion}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatCurrency(concepto.costo)}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="flex items-center gap-1 w-fit">
                      <Calendar className="h-3 w-3" />
                      {getPeriodicidadLabel(concepto.periodicidad)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono font-semibold text-primary">
                    {formatCurrency(costoMensual)}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{getUnidadLabel(concepto.unidad_medida)}</Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground text-sm">
                    {format(new Date(concepto.updated_at), "dd MMM yyyy", { locale: es })}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onEdit(concepto)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-destructive"
                          onClick={() => setDeleteId(concepto.id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar este concepto?</AlertDialogTitle>
            <AlertDialogDescription>
              El concepto será desactivado y no aparecerá en los cálculos de costo.
              Esta acción se puede revertir contactando soporte.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
