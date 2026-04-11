export default function PrivacidadPage() {
  return (
    <div className="min-h-screen py-20">
      <div className="container mx-auto px-4 max-w-4xl">
        <h1 className="text-4xl font-bold mb-8">Política de Privacidad</h1>

        <div className="space-y-6 text-gray-300">
          <section>
            <h2 className="text-2xl font-semibold mb-4 text-white">1. Información que Recopilamos</h2>
            <p>
              Recopilamos información personal que nos proporcionas directamente, incluyendo:
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
              <li>Nombre completo</li>
              <li>Fecha, hora y lugar de nacimiento</li>
              <li>Correo electrónico</li>
              <li>Información de pago (procesada de forma segura por Paddle)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-white">2. Uso de la Información</h2>
            <p>
              Utilizamos tu información para:
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
              <li>Generar tu carta astral y análisis personalizado</li>
              <li>Enviar tu informe por correo electrónico</li>
              <li>Procesar pagos de forma segura</li>
              <li>Mejorar nuestros servicios</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-white">3. Protección de Datos</h2>
            <p>
              Implementamos medidas de seguridad para proteger tu información personal. Utilizamos cifrado SSL
              y servicios seguros de terceros (Supabase, Paddle) que cumplen con estándares internacionales de
              seguridad.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-white">4. Compartir Información</h2>
            <p>
              No vendemos ni compartimos tu información personal con terceros, excepto:
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
              <li>Procesadores de pago necesarios para completar transacciones</li>
              <li>Cuando sea requerido por ley</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-white">5. Tus Derechos</h2>
            <p>
              Tienes derecho a:
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
              <li>Acceder a tu información personal</li>
              <li>Solicitar la corrección de datos inexactos</li>
              <li>Solicitar la eliminación de tus datos</li>
              <li>Oponerte al procesamiento de tus datos</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-white">6. Cookies</h2>
            <p>
              Utilizamos cookies esenciales para el funcionamiento del sitio web. No utilizamos cookies de
              seguimiento o publicidad de terceros.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-white">7. Contacto</h2>
            <p>
              Para cualquier consulta sobre nuestra política de privacidad o para ejercer tus derechos,
              contáctanos a través del correo electrónico proporcionado en nuestro sitio web.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-white">8. Actualizaciones</h2>
            <p>
              Esta política de privacidad puede ser actualizada ocasionalmente. La fecha de la última
              actualización se indicará al final de este documento.
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
