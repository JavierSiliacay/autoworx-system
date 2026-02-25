import { MetadataRoute } from 'next'
import { PRODUCTION_URL } from '@/lib/constants'

export default function robots(): MetadataRoute.Robots {
    return {
        rules: {
            userAgent: '*',
            allow: '/',
            disallow: '/admin/',
        },
        sitemap: `${PRODUCTION_URL}/sitemap.xml`,
    }
}
