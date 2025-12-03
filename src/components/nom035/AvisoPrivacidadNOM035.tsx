import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { Shield, FileText } from "lucide-react";

interface AvisoPrivacidadNOM035Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nombreTrabajador: string;
  onAceptar: () => void;
}

export const AvisoPrivacidadNOM035 = ({
  open,
  onOpenChange,
  nombreTrabajador,
  onAceptar,
}: AvisoPrivacidadNOM035Props) => {
  const [aceptado, setAceptado] = useState(false);

  const handleClose = () => {
    setAceptado(false);
    onOpenChange(false);
  };

  const handleAceptar = () => {
    if (aceptado) {
      onAceptar();
      setAceptado(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle>Aviso de Privacidad - NOM-035-STPS-2018</DialogTitle>
              <DialogDescription>
                Evaluación de Factores de Riesgo Psicosocial
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-4 text-sm">
            <div className="bg-muted/50 rounded-lg p-4">
              <p className="font-medium">Trabajador: {nombreTrabajador}</p>
            </div>

            <section className="space-y-2">
              <h3 className="font-semibold text-base">1. Responsable del Tratamiento</h3>
              <p className="text-muted-foreground">
                La empresa es responsable del tratamiento de los datos personales recabados, 
                con domicilio en las instalaciones del centro de trabajo correspondiente.
              </p>
            </section>

            <section className="space-y-2">
              <h3 className="font-semibold text-base">2. Datos Personales Recabados</h3>
              <p className="text-muted-foreground">
                Para dar cumplimiento a la NOM-035-STPS-2018, se recabarán los siguientes datos:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-2">
                <li>Datos de identificación: nombre, puesto, área de trabajo</li>
                <li>Datos laborales: antigüedad, tipo de jornada, modalidad de contratación</li>
                <li>Respuestas a cuestionarios sobre condiciones laborales y entorno organizacional</li>
                <li>Información sobre exposición a acontecimientos traumáticos severos (sin diagnóstico clínico)</li>
              </ul>
            </section>

            <section className="space-y-2">
              <h3 className="font-semibold text-base">3. Finalidades del Tratamiento</h3>
              <p className="text-muted-foreground">Los datos serán utilizados para:</p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-2">
                <li>Identificar y analizar los factores de riesgo psicosocial conforme a la NOM-035</li>
                <li>Evaluar el entorno organizacional del centro de trabajo</li>
                <li>Generar reportes estadísticos agregados (sin identificación individual)</li>
                <li>Implementar medidas preventivas y de mejora en el ambiente laboral</li>
                <li>Cumplir con las obligaciones normativas ante la STPS</li>
              </ul>
            </section>

            <section className="space-y-2">
              <h3 className="font-semibold text-base">4. Fundamento Legal</h3>
              <p className="text-muted-foreground">
                El tratamiento de datos se realiza con fundamento en:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-2">
                <li>NOM-035-STPS-2018 - Factores de riesgo psicosocial en el trabajo</li>
                <li>Artículo 16 de la Ley Federal del Trabajo</li>
                <li>Ley Federal de Protección de Datos Personales en Posesión de los Particulares</li>
              </ul>
            </section>

            <section className="space-y-2">
              <h3 className="font-semibold text-base">5. Confidencialidad</h3>
              <p className="text-muted-foreground">
                <strong>Importante:</strong> La información proporcionada es estrictamente confidencial. 
                Los resultados individuales no serán compartidos con terceros ni utilizados para 
                evaluaciones de desempeño, promociones o cualquier otro fin laboral.
              </p>
              <p className="text-muted-foreground">
                Los reportes generados son de carácter estadístico y agregado, sin posibilidad de 
                identificar respuestas individuales.
              </p>
            </section>

            <section className="space-y-2">
              <h3 className="font-semibold text-base">6. Derechos ARCO</h3>
              <p className="text-muted-foreground">
                Usted tiene derecho a Acceder, Rectificar, Cancelar u Oponerse al tratamiento de 
                sus datos personales. Para ejercer estos derechos, puede dirigirse al área de 
                Recursos Humanos de la empresa.
              </p>
            </section>

            <section className="space-y-2">
              <h3 className="font-semibold text-base">7. Modificaciones al Aviso</h3>
              <p className="text-muted-foreground">
                Cualquier modificación a este aviso de privacidad será comunicada a través de 
                los medios internos de la empresa.
              </p>
            </section>

            <section className="space-y-2">
              <h3 className="font-semibold text-base">8. Aceptación</h3>
              <p className="text-muted-foreground">
                La participación en la evaluación es voluntaria. Al aceptar este aviso, usted 
                consiente el tratamiento de sus datos personales conforme a lo aquí establecido.
              </p>
            </section>
          </div>
        </ScrollArea>

        <div className="border-t pt-4 space-y-4">
          <div className="flex items-start gap-3">
            <Checkbox
              id="acepto"
              checked={aceptado}
              onCheckedChange={(checked) => setAceptado(checked === true)}
            />
            <Label htmlFor="acepto" className="text-sm leading-relaxed cursor-pointer">
              He leído y acepto el aviso de privacidad. Consiento el tratamiento de mis 
              datos personales para los fines establecidos en la evaluación de factores 
              de riesgo psicosocial conforme a la NOM-035-STPS-2018.
            </Label>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button onClick={handleAceptar} disabled={!aceptado}>
              <FileText className="h-4 w-4 mr-2" />
              Aceptar y Continuar
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
};