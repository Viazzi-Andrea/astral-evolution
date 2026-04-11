export default function ReembolsosPage() {
  return (
    <div className="min-h-screen py-20">
      <div className="container mx-auto px-4 max-w-4xl">
        <h1 className="text-4xl font-bold mb-8">Política de Reembolsos</h1>

        <div className="space-y-6 text-gray-300">
          <section>
            <h2 className="text-2xl font-semibold mb-4 text-white">1. Compromiso de Calidad</h2>
            <p>
              En Astral Evolution nos comprometemos a entregar informes astrológicos de alta calidad generados
              con precisión técnica y entregados de manera oportuna. Nuestra política de reembolsos refleja este
              compromiso.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-white">2. Elegibilidad para Reembolsos</h2>
            <p className="mb-3">
              Ofrecemos reembolsos completos en las siguientes situaciones:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>
                <strong className="text-white">Fallo en la entrega:</strong> Si no recibes tu informe dentro de
                las 24 horas posteriores a la compra debido a problemas técnicos de nuestra parte.
              </li>
              <li>
                <strong className="text-white">Error técnico grave:</strong> Si el informe contiene errores
                técnicos significativos que impiden su lectura o comprensión (archivos corruptos, páginas faltantes, etc.).
              </li>
              <li>
                <strong className="text-white">Cargo duplicado:</strong> Si se te cobró dos veces por la misma
                transacción debido a un error del sistema.
              </li>
              <li>
                <strong className="text-white">Información incorrecta procesada:</strong> Si demostrablemente
                procesamos datos de nacimiento diferentes a los que proporcionaste.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-white">3. Situaciones No Elegibles para Reembolso</h2>
            <p className="mb-3">
              No podemos ofrecer reembolsos en los siguientes casos:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>
                <strong className="text-white">Cambio de opinión:</strong> Una vez generado y entregado el
                informe, no aceptamos solicitudes de reembolso por cambio de preferencias.
              </li>
              <li>
                <strong className="text-white">Datos incorrectos proporcionados:</strong> Si proporcionaste
                información de nacimiento incorrecta o inexacta, el informe será generado con esos datos y no
                será elegible para reembolso.
              </li>
              <li>
                <strong className="text-white">Desacuerdo con la interpretación:</strong> La astrología es
                interpretativa por naturaleza. No ofrecemos reembolsos por desacuerdo con el contenido o
                interpretación astrológica.
              </li>
              <li>
                <strong className="text-white">Problemas de correo:</strong> Si el informe fue enviado
                correctamente pero no revisaste tu carpeta de spam o proporcionaste un correo electrónico
                incorrecto.
              </li>
              <li>
                <strong className="text-white">Uso del informe:</strong> Una vez que el informe ha sido
                descargado o visualizado, se considera entregado y utilizado.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-white">4. Período para Solicitar Reembolsos</h2>
            <p>
              Las solicitudes de reembolso deben realizarse dentro de los <strong className="text-white">7 días</strong> posteriores
              a la fecha de compra. Después de este período, no podremos procesar solicitudes de reembolso.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-white">5. Proceso para Solicitar un Reembolso</h2>
            <p className="mb-3">
              Para solicitar un reembolso:
            </p>
            <ol className="list-decimal list-inside space-y-2 ml-4">
              <li>
                Contacta nuestro equipo de soporte por correo electrónico con tu número de transacción y una
                descripción detallada del problema.
              </li>
              <li>
                Proporciona evidencia del problema si es aplicable (capturas de pantalla, archivos, etc.).
              </li>
              <li>
                Nuestro equipo revisará tu solicitud dentro de 48 horas hábiles.
              </li>
              <li>
                Si tu solicitud es aprobada, el reembolso se procesará en 5-10 días hábiles dependiendo de tu
                institución financiera.
              </li>
            </ol>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-white">6. Reembolsos Parciales</h2>
            <p>
              En casos excepcionales donde el informe fue entregado pero con deficiencias menores, podemos ofrecer
              un reembolso parcial o un informe adicional complementario sin costo. La decisión se tomará caso por
              caso según la naturaleza del problema.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-white">7. Método de Reembolso</h2>
            <p>
              Todos los reembolsos aprobados se procesarán mediante el método de pago original utilizado en la
              compra. Los reembolsos son procesados a través de Paddle, nuestro procesador de pagos seguro.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-white">8. Resolución de Problemas Antes del Reembolso</h2>
            <p>
              Antes de solicitar un reembolso, te recomendamos:
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
              <li>Revisar tu carpeta de spam o correo no deseado</li>
              <li>Verificar que proporcionaste el correo electrónico correcto</li>
              <li>Intentar descargar el informe nuevamente desde el enlace en tu correo</li>
              <li>Contactar nuestro soporte técnico para asistencia inmediata</li>
            </ul>
            <p className="mt-3">
              Muchos problemas pueden resolverse rápidamente sin necesidad de procesar un reembolso.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-white">9. Transacciones Fraudulentas</h2>
            <p>
              Si detectamos actividad fraudulenta o abuso de nuestra política de reembolsos, nos reservamos el
              derecho de rechazar la solicitud y tomar las medidas legales apropiadas.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-white">10. Modificaciones a la Política</h2>
            <p>
              Nos reservamos el derecho de modificar esta política de reembolsos en cualquier momento. Los cambios
              entrarán en vigencia inmediatamente después de su publicación en nuestro sitio web. Las compras
              realizadas antes de un cambio estarán sujetas a la política vigente en el momento de la compra.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-white">11. Contacto</h2>
            <p>
              Para solicitar un reembolso o hacer consultas sobre esta política, contáctanos en:
            </p>
            <ul className="list-none mt-2 space-y-1 ml-4">
              <li><strong className="text-white">Email:</strong> support@astralevolution.com</li>
              <li><strong className="text-white">Web:</strong> https://astralevolution.com</li>
              <li><strong className="text-white">Tiempo de respuesta:</strong> 24-48 horas hábiles</li>
            </ul>
          </section>

          <div className="mt-12 pt-6 border-t border-white/10 text-sm text-gray-400">
            <p>Última actualización: Abril 2026</p>
            <p className="mt-2">
              Esta política de reembolsos complementa nuestros Términos y Condiciones y Política de Privacidad.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
