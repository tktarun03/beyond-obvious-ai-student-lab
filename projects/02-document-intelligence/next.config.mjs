/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // The @lab/* workspace packages ship TypeScript source rather than a build
  // artefact. One less build step for a student to run, and stack traces point
  // at real files.
  transpilePackages: [
    '@lab/ai',
    '@lab/auth',
    '@lab/database',
    '@lab/observability',
    '@lab/shared',
    '@lab/ui',
    '@lab/validation',
  ],

  // firebase-admin and @google/genai are optional peers, loaded dynamically at
  // runtime only in live mode. Marking them external keeps the bundler from
  // failing a build when they are not installed.
  serverExternalPackages: ['firebase-admin', '@google/genai'],

  async headers() {
    // Defence in depth at the edge. None of these replace server-side checks;
    // they close off whole classes of attack cheaply.
    return [
      {
        source: '/:path*',
        headers: [
          // Stops a browser from guessing a response is HTML when we said it is JSON.
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          // Blocks this app being framed, which is the clickjacking prerequisite.
          { key: 'X-Frame-Options', value: 'DENY' },
          // Do not leak the full URL (which can carry ids) to third parties.
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          // Explicitly turn off hardware APIs this app never uses.
          {
            key: 'Permissions-Policy',
            value: 'camera=(), geolocation=(), payment=(), usb=()',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
