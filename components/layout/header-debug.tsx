'use client';

import { Sparkles } from 'lucide-react';

export function HeaderDebug() {
  const handleClick = (url: string) => (e: React.MouseEvent) => {
    console.log('🔴 Header click:', url);
    console.log('🔴 Default prevented:', e.defaultPrevented);
    window.location.href = url;
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-black/50 backdrop-blur-xl">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <a href="/" className="flex items-center gap-2 group">
            <div className="relative">
              <Sparkles className="h-6 w-6 text-blue-400 group-hover:text-blue-300 transition-colors" />
              <div className="absolute inset-0 blur-lg bg-blue-400/20 group-hover:bg-blue-300/30 transition-all" />
            </div>
            <span className="text-xl font-semibold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Astral Evolution
            </span>
          </a>

          <nav className="hidden md:flex items-center gap-8">
            <button
              onClick={handleClick('/productos/lectura-esencial')}
              className="text-sm text-gray-300 hover:text-white transition-colors bg-transparent border-none cursor-pointer"
            >
              Lectura Esencial
            </button>
            <button
              onClick={handleClick('/productos/consulta-evolutiva')}
              className="text-sm text-gray-300 hover:text-white transition-colors bg-transparent border-none cursor-pointer"
            >
              Consulta Evolutiva
            </button>
            <button
              onClick={handleClick('/productos/especial-parejas')}
              className="text-sm text-gray-300 hover:text-white transition-colors bg-transparent border-none cursor-pointer"
            >
              Especial Parejas
            </button>
          </nav>

          <div className="flex items-center gap-4">
            <button
              onClick={handleClick('/productos/lectura-esencial')}
              className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all border-none cursor-pointer"
            >
              Comenzar
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
