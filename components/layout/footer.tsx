import { Sparkles } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-black/50 backdrop-blur-xl">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="h-6 w-6 text-blue-400" />
              <span className="text-xl font-semibold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Astral Evolution
              </span>
            </div>
            <p className="text-gray-400 text-sm max-w-md">
              Descubre tu camino evolutivo a través de la astrología de precisión.
              Auditorías astrales personalizadas basadas en cálculos astronómicos precisos y principios herméticos evolutivos.
            </p>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">Productos</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>
                <a href="/productos/lectura-esencial" className="hover:text-white transition-colors">
                  Lectura Esencial
                </a>
              </li>
              <li>
                <a href="/productos/consulta-evolutiva" className="hover:text-white transition-colors">
                  Consulta Evolutiva
                </a>
              </li>
              <li>
                <a href="/productos/especial-parejas" className="hover:text-white transition-colors">
                  Especial Parejas
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">Legal</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>
                <a href="/privacidad" className="hover:text-white transition-colors">
                  Privacidad
                </a>
              </li>
              <li>
                <a href="/terminos" className="hover:text-white transition-colors">
                  Términos
                </a>
              </li>
              <li>
                <a href="/reembolsos" className="hover:text-white transition-colors">
                  Reembolsos
                </a>
              </li>
              <li>
                <a href="/precios" className="hover:text-white transition-colors">
                  Precios
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-white/10">
          <p className="text-center text-sm text-gray-500">
            © {new Date().getFullYear()} Astral Evolution. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
