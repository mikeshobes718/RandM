import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://reviewsandmarketing.com';

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/dashboard/',
          '/settings/',
          '/feedback/',
          '/onboarding/',
          '/__/',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}

