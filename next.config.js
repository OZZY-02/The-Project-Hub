// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Add i18n configuration
  i18n: {
    locales: ['en', 'ar'], // English and Arabic
    defaultLocale: 'en',
    localeDetection: true, // Optional: Detect user's browser language
  },
};

module.exports = nextConfig;