import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
    return {
        rules: {
            userAgent: '*',
            allow: ["/", "infinite"],
            disallow: []
        },
        sitemap: 'https://idolguessr.fun/sitemap.xml'
    }
}
