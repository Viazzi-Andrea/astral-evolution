export default function TerminosPage() {
  return (
    <div className="min-h-screen py-20">
      <div className="container mx-auto px-4 max-w-4xl">
        <h1 className="text-4xl font-bold mb-8">Términos y Condiciones</h1>

        <div className="space-y-6 text-gray-300">
          <section>
            <h2 className="text-2xl font-semibold mb-4 text-white">1. Aceptación de Términos</h2>
            <p>
              Al acceder y utilizar este sitio web y nuestros servicios, aceptas estos términos y condiciones
              en su totalidad. Si no estás de acuerdo con alguna parte de estos términos, no debes utilizar
              nuestros servicios.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-white">2. Descripción del Servicio</h2>
            <p>
              Ofrecemos servicios de análisis astrológico personalizado basado en la información de nacimiento
              que proporcionas. Los informes se generan mediante inteligencia artificial y conocimientos
              astrológicos tradicionales.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-white">3. Exactitud de la Información</h2>
            <p>
              Eres responsable de proporcionar información exacta y completa. La precisión de tu análisis
              astrológico depende de la exactitud de los datos que proporciones (fecha, hora y lugar de
              nacimiento).
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-white">4. Naturaleza de los Servicios</h2>
            <p>
              Los análisis astrológicos son de naturaleza interpretativa y están destinados únicamente para
              fines de entretenimiento y reflexión personal. No deben considerarse como:
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
              <li>Asesoramiento médico, legal o financiero</li>
              <li>Predicciones absolutas o garantizadas</li>
              <li>Sustituto de servicios profesionales certificados</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-white">5. Pagos y Reembolsos</h2>
            <p>
              Todos los pagos se procesan de forma segura a través de Paddle. Los precios se muestran en USD
              y pueden ajustarse según tu región. Para información detallada sobre nuestra política de reembolsos,
              consulta nuestra <a href="/reembolsos" className="text-blue-400 hover:text-blue-300 underline">Política de Reembolsos</a>.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-white">6. Entrega del Servicio</h2>
            <p>
              Los informes se entregan por correo electrónico en formato PDF dentro del tiempo especificado
              para cada producto. Si no recibes tu informe, verifica tu carpeta de spam antes de contactarnos.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-white">7. Propiedad Intelectual</h2>
            <p>
              Los informes generados son para tu uso personal. No está permitido:
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
              <li>Redistribuir o revender los informes</li>
              <li>Usar el contenido con fines comerciales</li>
              <li>Copiar o reproducir el material sin autorización</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-white">8. Limitación de Responsabilidad</h2>
            <p>
              No somos responsables por decisiones tomadas en base a los análisis astrológicos proporcionados.
              El uso de nuestros servicios es bajo tu propio riesgo y responsabilidad.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-white">9. Privacidad</h2>
            <p>
              El uso de tu información personal está regulado por nuestra Política de Privacidad, que forma
              parte integral de estos términos.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-white">10. Modificaciones</h2>
            <p>
              Nos reservamos el derecho de modificar estos términos en cualquier momento. Los cambios entrarán
              en vigencia inmediatamente después de su publicación en este sitio web.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-white">11. Contacto</h2>
            <p>
              Para cualquier pregunta sobre estos términos y condiciones, contáctanos a través del correo
              electrónico proporcionado en nuestro sitio web.
            </p>
          </section>

          <div className="mt-12 pt-6 border-t border-white/10 text-sm text-gray-400">
            <p>Última actualización: Abril 2026</p>
          </div>
        </div>
      </div>
    </div>
  );
}
