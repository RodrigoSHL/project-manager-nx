import type { Metadata, Viewport } from 'next'
import './globals.css'

const CONTACT_EMAIL = 'contacto@atomdev.cl'
const SITE_URL = 'https://atomdev.cl'

export const metadata: Metadata = {
  title: 'AtomDev | Software para empresas y minería',
  description:
    'Diseñamos software a medida para empresas e industria minera. Desarrollamos plataformas de inspección y gestión de activos como GridAssets, además de soluciones web, cloud y DevOps.',
  keywords: [
    'desarrollo de software',
    'cloud',
    'devops',
    '.NET',
    'React',
    'Azure',
    'automatización',
    'software empresarial',
    'software minero',
    'software para minería',
    'inspección de activos',
    'GridAssets',
  ],
  authors: [{ name: 'Atom Dev', url: SITE_URL }],
  creator: 'Atom Dev',
  openGraph: {
    type: 'website',
    locale: 'es_CL',
    url: SITE_URL,
    siteName: 'Atom Dev',
    title: 'Atom Dev | Software para empresas y minería',
    description:
      'Diseñamos software a medida para empresas e industria minera, con plataformas de inspección y gestión de activos como GridAssets.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AtomDev | Software para empresas y minería',
    description:
      'Software a medida para empresas y minería. Conoce GridAssets, nuestra plataforma de inspección y gestión de activos.',
  },
  robots: {
    index: true,
    follow: true,
  },
  metadataBase: new URL(SITE_URL),
}

export const viewport: Viewport = {
  colorScheme: 'dark',
  themeColor: '#07090f',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Atom Dev',
    url: SITE_URL,
    description:
      'Desarrollo de software para empresas y minería. Creamos plataformas de inspección y gestión de activos, además de soluciones web, cloud y DevOps.',
    contactPoint: {
      '@type': 'ContactPoint',
      email: CONTACT_EMAIL,
      contactType: 'customer service',
    },
  }

  return (
    <html lang="es" className="bg-background">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
      </head>
      <body className="font-sans antialiased">
        {children}
      </body>
    </html>
  )
}
