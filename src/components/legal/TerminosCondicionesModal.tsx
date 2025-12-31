import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { FileText, Scale, Shield, Brain, Database, Copyright, ShoppingCart, CreditCard, AlertTriangle, Gavel, CheckCircle } from "lucide-react";

interface TerminosCondicionesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TerminosCondicionesModal({ open, onOpenChange }: TerminosCondicionesModalProps) {
  const sections = [
    {
      icon: <Scale className="h-5 w-5 text-primary" />,
      title: "Naturaleza y objeto de la plataforma",
      content: `VVGI es una plataforma tecnológica diseñada para apoyar, facilitar y optimizar procesos de reclutamiento, selección y gestión de talento mediante herramientas digitales y funcionalidades basadas en inteligencia artificial. VVGI actúa exclusivamente como un proveedor de tecnología y no como empleador, intermediario laboral directo, agencia de colocación, representante legal ni parte en las relaciones contractuales que puedan surgir entre los usuarios de la plataforma.

El uso de VVGI no garantiza la contratación de candidatos, el éxito de procesos de selección ni resultados específicos. Todas las decisiones relacionadas con reclutamiento, contratación, evaluación o descarte de candidatos son responsabilidad exclusiva de los usuarios que intervienen en dichos procesos.`
    },
    {
      icon: <Shield className="h-5 w-5 text-primary" />,
      title: "Registro de usuarios y obligaciones generales",
      content: `Para utilizar la plataforma, el usuario deberá registrarse proporcionando información veraz, completa y actualizada. El usuario declara tener la capacidad legal para aceptar estos términos y se compromete a mantener la confidencialidad de sus credenciales de acceso. Cada cuenta es personal e intransferible, y el usuario será responsable de cualquier actividad realizada desde su cuenta.

VVGI se reserva el derecho de verificar, suspender o cancelar cuentas que presenten información falsa, uso indebido, conductas fraudulentas, incumplimiento legal o violaciones a los presentes términos, sin que ello genere derecho a indemnización alguna.`
    },
    {
      icon: <FileText className="h-5 w-5 text-primary" />,
      title: "Responsabilidades de las empresas usuarias",
      content: `Las empresas que utilicen la plataforma se obligan a publicar únicamente vacantes reales, claras y conformes a la legislación laboral vigente en su país. Asimismo, se comprometen a utilizar la información de candidatos de manera ética, confidencial y exclusivamente para fines relacionados con procesos de selección.

Las empresas reconocen que son las únicas responsables de cumplir con las obligaciones laborales, fiscales, contractuales y de seguridad social derivadas de cualquier contratación, liberando expresamente a VVGI de cualquier responsabilidad relacionada con dichas relaciones.`
    },
    {
      icon: <FileText className="h-5 w-5 text-primary" />,
      title: "Responsabilidades de los reclutadores",
      content: `Los reclutadores que participen en VVGI actúan de forma independiente, ya sea como colaboradores internos de una empresa o como profesionales freelance. Son responsables de sus evaluaciones, entrevistas, recomendaciones y propuestas, y reconocen que VVGI no garantiza la asignación de procesos, ingresos, contratos ni resultados económicos.

El reclutador acepta que su desempeño pueda ser medido mediante métricas internas, indicadores de calidad y sistemas de ranking, con el único fin de mejorar la experiencia de la plataforma y facilitar decisiones informadas de otros usuarios.`
    },
    {
      icon: <FileText className="h-5 w-5 text-primary" />,
      title: "Responsabilidades de los candidatos",
      content: `Los candidatos declaran que la información proporcionada en su perfil, currículum y postulaciones es veraz, completa y actualizada. Al utilizar la plataforma, autorizan expresamente el tratamiento automatizado de su información con fines de análisis, evaluación y recomendación dentro de procesos de selección.

Los candidatos reconocen que VVGI no garantiza empleo, entrevistas ni contratación, y que la participación en la plataforma no genera relación laboral alguna con VVGI.`
    },
    {
      icon: <Brain className="h-5 w-5 text-primary" />,
      title: "Uso de inteligencia artificial",
      content: `VVGI incorpora herramientas de inteligencia artificial con fines de apoyo, automatización, análisis y recomendación dentro de los procesos de reclutamiento. Los resultados generados por dichas herramientas son de carácter orientativo y no sustituyen el criterio humano, ni constituyen asesoría profesional, legal o laboral.

El usuario reconoce que las herramientas de IA pueden basarse en información proporcionada por los propios usuarios y que, aunque VVGI adopta medidas razonables para mejorar su precisión, no garantiza resultados libres de error. VVGI no será responsable por decisiones tomadas por los usuarios con base en recomendaciones generadas por IA.`
    },
    {
      icon: <Database className="h-5 w-5 text-primary" />,
      title: "Tratamiento de datos personales y privacidad",
      content: `VVGI trata los datos personales conforme a los principios de licitud, consentimiento, información, proporcionalidad y responsabilidad, de acuerdo con la legislación aplicable en los países de Latinoamérica donde opera, así como con estándares internacionales de protección de datos.

Los datos personales podrán ser utilizados para operar la plataforma, ejecutar procesos de reclutamiento, generar análisis estadísticos, mejorar el servicio, garantizar la seguridad y cumplir obligaciones legales. VVGI no comercializa datos personales y únicamente podrá compartirlos con proveedores tecnológicos cuando sea necesario para la operación del servicio, bajo medidas de seguridad razonables.

Los usuarios podrán ejercer sus derechos de acceso, rectificación, cancelación, oposición y demás derechos aplicables mediante solicitud escrita al correo de contacto indicado en la plataforma.`
    },
    {
      icon: <Copyright className="h-5 w-5 text-primary" />,
      title: "Propiedad intelectual",
      content: `Todos los derechos de propiedad intelectual relacionados con la plataforma, incluyendo software, código fuente, algoritmos, diseños, marcas, logotipos, textos y funcionalidades, pertenecen exclusiva y plenamente a VVGI o a sus licenciantes.

El usuario conserva la propiedad de la información y contenidos que proporcione, pero otorga a VVGI una licencia no exclusiva, gratuita y de alcance internacional para utilizar dichos contenidos únicamente con fines operativos, analíticos y de mejora del servicio. Queda estrictamente prohibida la copia, modificación, ingeniería inversa o explotación no autorizada de la plataforma.`
    },
    {
      icon: <ShoppingCart className="h-5 w-5 text-primary" />,
      title: "Marketplace y relaciones entre usuarios",
      content: `VVGI proporciona un entorno digital que facilita la interacción entre empresas, reclutadores y candidatos. VVGI no es parte de los acuerdos, contratos, pagos o relaciones que puedan surgir entre los usuarios, ni asume responsabilidad alguna por incumplimientos, disputas o daños derivados de dichas relaciones.`
    },
    {
      icon: <CreditCard className="h-5 w-5 text-primary" />,
      title: "Pagos, planes y créditos",
      content: `Algunas funcionalidades de la plataforma pueden requerir el pago de suscripciones, tarifas o el consumo de créditos. El usuario acepta que los pagos realizados no son reembolsables, salvo que se indique expresamente lo contrario. VVGI se reserva el derecho de modificar precios, planes o condiciones comerciales, notificando previamente a los usuarios cuando corresponda.`
    },
    {
      icon: <AlertTriangle className="h-5 w-5 text-primary" />,
      title: "Limitación de responsabilidad",
      content: `VVGI no será responsable por daños directos o indirectos, pérdidas económicas, lucro cesante, interrupciones del servicio, decisiones tomadas por los usuarios ni por información proporcionada por terceros. El uso de la plataforma se realiza bajo responsabilidad exclusiva del usuario.`
    },
    {
      icon: <AlertTriangle className="h-5 w-5 text-primary" />,
      title: "Suspensión, terminación y modificaciones",
      content: `VVGI podrá suspender o cancelar el acceso a la plataforma en caso de incumplimiento de estos términos, uso ilícito, daño a la plataforma o a otros usuarios. Asimismo, VVGI podrá modificar los presentes términos en cualquier momento, siendo responsabilidad del usuario revisarlos periódicamente. El uso continuado de la plataforma implica la aceptación de las modificaciones.`
    },
    {
      icon: <Gavel className="h-5 w-5 text-primary" />,
      title: "Ley aplicable y jurisdicción",
      content: `Estos Términos y Condiciones se regirán por las leyes del país donde VVGI tenga su operación principal, priorizando el marco legal de los Estados Unidos Mexicanos, sin perjuicio de su aplicación en otros países de Latinoamérica conforme a las leyes locales aplicables.`
    }
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="text-2xl font-bold flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            Términos y Condiciones Generales de Uso
          </DialogTitle>
          <p className="text-sm text-muted-foreground mt-2">
            Plataforma VVGI | Sitio web: https://vvgi.com.mx | Última actualización: Diciembre 2024
          </p>
        </DialogHeader>

        <ScrollArea className="h-[60vh] px-6">
          <div className="space-y-6 pb-6">
            {/* Intro */}
            <div className="bg-muted/50 rounded-lg p-4 border border-border/50">
              <p className="text-sm text-muted-foreground leading-relaxed">
                El acceso, navegación, registro y uso de la plataforma VVGI implica la aceptación expresa, 
                informada y sin reservas de los presentes Términos y Condiciones de Uso. Si el usuario no 
                está de acuerdo con estos términos, deberá abstenerse de utilizar la plataforma.
              </p>
            </div>

            {/* Sections */}
            {sections.map((section, index) => (
              <div key={index} className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    {section.icon}
                  </div>
                  <h3 className="font-semibold text-lg">{section.title}</h3>
                </div>
                <div className="pl-11">
                  <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                    {section.content}
                  </p>
                </div>
              </div>
            ))}

            {/* Acceptance */}
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 mt-6">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                <div>
                  <h4 className="font-semibold mb-2">Aceptación</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    El uso de la plataforma VVGI implica la aceptación expresa, total y sin reservas de 
                    los presentes Términos y Condiciones.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>

        <div className="p-6 pt-4 border-t flex justify-end">
          <Button onClick={() => onOpenChange(false)}>
            Entendido
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
