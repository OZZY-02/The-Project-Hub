// next.config.js
/** @type {import('next').NextConfig} */
// NOTE: The App Router (app/) handles routing differently than the pages router.
// `i18n` config in next.config.js is not supported for App Router in newer
// Next.js versions and can cause prerendering issues (e.g. expecting `/_document`).
// If you need internationalization with App Router, implement locale routing
// using route groups or the `generateStaticParams` approach per Next.js docs.
const nextConfig = {
  // Keep other Next.js config here if needed.
};

module.exports = nextConfig;