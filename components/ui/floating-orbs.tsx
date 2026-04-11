'use client';

export function FloatingOrbs() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl animate-pulse-glow"
           style={{ animationDelay: '0s' }} />
      <div className="absolute top-40 right-20 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse-glow"
           style={{ animationDelay: '1s' }} />
      <div className="absolute bottom-40 left-1/2 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl animate-pulse-glow"
           style={{ animationDelay: '2s' }} />
      <div className="absolute top-1/2 left-1/4 w-64 h-64 bg-pink-500/8 rounded-full blur-3xl animate-float-slow"
           style={{ animationDelay: '1.5s' }} />
      <div className="absolute bottom-20 right-1/3 w-72 h-72 bg-indigo-500/8 rounded-full blur-3xl animate-float-slow"
           style={{ animationDelay: '0.5s' }} />
    </div>
  );
}
