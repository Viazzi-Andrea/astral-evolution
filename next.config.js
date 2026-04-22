/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Expone ADMIN_SECRET al bundle del Edge Middleware en build time (no llega al cliente porque ningún componente client lo usa)
  env: {
    ADMIN_SECRET: process.env.ADMIN_SECRET,
  },
  images: { unoptimized: true },

  // ─── Headers de seguridad adicionales (refuerza middleware.ts) ───────────
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload',
          },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ];
  },

  // ─── Webpack: evitar que secrets se filtren al bundle del cliente ─────────
  webpack(config, { isServer }) {
    if (!isServer) {
      // Asegurarse de que ningún módulo server-only llegue al cliente
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
      };
    }
    return config;
  },
};

module.exports = nextConfig;
