/** @type {import('next').NextConfig} */
const nextConfig = {
  pageExtensions: ['ts', 'tsx'],
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            // unsafe-eval is required by Mermaid (uses new Function() for diagram parsing)
            value: "script-src 'self' 'unsafe-inline' 'unsafe-eval'; object-src 'none';",
          },
        ],
      },
    ]
  },
}

export default nextConfig
