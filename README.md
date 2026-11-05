# Philip Portfolio (Edge Mirror)

High-performance cyberpunk architectural portfolio deployed on Cloudflare Pages.

- **Live URL:** https://philip-portfolio-8v0.pages.dev
- **Architecture:** 1:1 Bit-for-bit Static Edge Mirror with Cloudflare Pages Functions
- **Zero-loss Hydration:** Includes `functions/_next/image.ts` edge handler for zero-config image routing on Cloudflare Pages.

## Project Structure

```text
├── dist/                   # Static assets, chunks, CSS, and media
│   ├── assets/             # Project visual graphics & hero renders
│   ├── _next/              # Next.js static JS chunks, CSS, and woff2 fonts
│   └── index.html          # Main HTML entry point
├── functions/              # Cloudflare Pages edge functions
│   └── _next/image.ts      # Cloudflare Pages Image proxy/fallback
├── package.json
└── README.md
```

## Deployment

```bash
npm run deploy
```
