import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface KPIDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  data: Array<Record<string, any>>;
  columns: Array<{ key: string; label: string }>;
  loading?: boolean;
}

export const KPIDetailModal = ({ 
  open, 
  onOpenChange, 
  title, 
  description, 
  data, 
  columns,
  loading = false
}: KPIDetailModalProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <div className="mt-4">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Cargando datos...</div>
          ) : data.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No hay datos disponibles</div>
          ) : (
            <div className="space-y-6">
              {/* Estadísticas resumidas */}
              {data.some(row => row.metrica) && (
                <div className="grid gap-4 md:grid-cols-2">
                  {data.filter(row => row.metrica).map((stat, idx) => (
                    <div key={idx} className="p-4 bg-muted/30 rounded-lg border">
                      <p className="text-sm font-medium text-muted-foreground">{stat.metrica}</p>
                      <p className="text-2xl font-bold mt-1">{stat.valor}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Tabla de detalles */}
              {data.some(row => !row.metrica) && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">Detalle por vacante</h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {columns.filter(col => col.key !== 'metrica' && col.key !== 'valor').map((col) => (
                          <TableHead key={col.key}>{col.label}</TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.filter(row => !row.metrica).map((row, idx) => (
                        <TableRow key={idx}>
                          {columns.filter(col => col.key !== 'metrica' && col.key !== 'valor').map((col) => (
                            <TableCell key={col.key}>
                              {row[col.key] !== undefined ? row[col.key] : ""}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};