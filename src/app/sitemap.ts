import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
    const baseUrl = 'https://idolguessr.fun'

    return [
        {
            url: baseUrl,
            lastModified: new Date(),
        },
        {
            url: `${baseUrl}/infinite`,
            lastModified: new Date(),
        },
        {
            url: `${baseUrl}/hangul`,
            lastModified: new Date(),
        },
        {
            url: `${baseUrl}/challenge`,
            lastModified: new Date(),
        },
    ]
}
