'use client';

import { Star, Quote } from 'lucide-react';

const testimonials = [
  {
    name: 'María S.',
    location: 'Argentina',
    product: 'Consulta Evolutiva',
    text: 'La interpretación de mi carta fue increíblemente precisa. Describió aspectos de mi personalidad que nunca había podido articular. La sección del Nodo Norte me dio una claridad que no esperaba. Totalmente recomendado.',
    stars: 5,
  },
  {
    name: 'Carlos M.',
    location: 'México',
    product: 'Especial Parejas',
    text: 'Pedí el análisis de sinastría para mi pareja y yo. La precisión con que describió nuestra dinámica fue sorprendente. Nos ayudó a entender patrones que repetíamos sin darnos cuenta. Vale cada peso.',
    stars: 5,
  },
  {
    name: 'Laura V.',
    location: 'España',
    product: 'Lectura Esencial',
    text: 'Fue la primera vez que un análisis astrológico me habló directamente a mí, no como a cualquier Escorpio. El nivel de profundidad es completamente diferente a lo que había leído antes. Lo recomendaría a cualquiera que quiera conocerse más.',
    stars: 5,
  },
];

export function Testimonials() {
  return (
    <section className="relative container mx-auto px-4 py-20">
      <div className="text-center mb-12">
        <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
          Lo que dicen nuestros clientes
        </h2>
        <p className="text-xl text-gray-400">
          Experiencias reales de personas que recibieron su auditoría astral
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {testimonials.map((t, i) => (
          <div
            key={i}
            className="relative p-8 rounded-2xl border border-white/10 bg-gradient-to-b from-white/5 to-transparent flex flex-col"
          >
            {/* Comillas decorativas */}
            <Quote className="h-8 w-8 text-purple-500/30 mb-4 flex-shrink-0" />

            {/* Texto */}
            <p className="text-gray-300 leading-relaxed flex-1 mb-6 text-sm">
              "{t.text}"
            </p>

            {/* Estrellas */}
            <div className="flex gap-1 mb-3">
              {Array.from({ length: t.stars }).map((_, s) => (
                <Star key={s} className="h-4 w-4 text-amber-400 fill-amber-400" />
              ))}
            </div>

            {/* Autor */}
            <div>
              <p className="font-semibold text-white text-sm">{t.name}</p>
              <p className="text-xs text-gray-500">{t.location} · {t.product}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
