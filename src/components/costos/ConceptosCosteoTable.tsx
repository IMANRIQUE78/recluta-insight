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
import { 
  ConceptoCosteo, 
  getPeriodicidadLabel, 
  getUnidadMedidaLabel 
} from "@/hooks/useCostosReclutamiento";
import { MoreHorizontal, Pencil, Trash2, DollarSign } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface ConceptosCosteoTableProps {
  conceptos: ConceptoCosteo[];
  onEdit: (concepto: ConceptoCosteo) => void;
  onDelete: (id: string) => Promise<boolean>;
}

export const ConceptosCosteoTable = ({
  conceptos,
  onEdit,
  onDelete,
}: ConceptosCosteoTableProps) => {
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const handleDelete = async () => {
    if (deleteId) {
      await onDelete(deleteId);
      setDeleteId(null);
    }
  };

  const getUnidadBadgeVariant = (unidad: string) => {
    switch (unidad) {
      case "por_contratacion":
        return "default";
      case "por_candidato":
        return "secondary";
      case "por_reclutador":
        return "outline";
      default:
        return "secondary";
    }
  };

  const getTipoBadge = (periodicidad: string) => {
    if (periodicidad.startsWith("unico_")) {
      return <Badge variant="outline" className="text-xs">Único</Badge>;
    }
    return <Badge variant="secondary" className="text-xs">Recurrente</Badge>;
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
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[200px]">Concepto</TableHead>
              <TableHead className="text-right min-w-[100px]">Costo</TableHead>
              <TableHead className="min-w-[140px]">Unidad de Medida</TableHead>
              <TableHead className="min-w-[100px]">Tipo</TableHead>
              <TableHead className="min-w-[130px]">Periodicidad</TableHead>
              <TableHead className="hidden md:table-cell min-w-[120px]">Actualización</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {conceptos.map((concepto) => (
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
                  <Badge variant={getUnidadBadgeVariant(concepto.unidad_medida)}>
                    {getUnidadMedidaLabel(concepto.unidad_medida)}
                  </Badge>
                </TableCell>
                <TableCell>
                  {getTipoBadge(concepto.periodicidad)}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {getPeriodicidadLabel(concepto.periodicidad)}
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
            ))}
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
