import { Metadata } from 'next';

// Dímelo Redes: título, icono y tarjeta de enlace por defecto. Cada página puede poner su propio título.
export const metadatosDimelo = async (): Promise<Metadata> => {
  const base = process.env.FRONTEND_URL;
  return {
    ...(base ? { metadataBase: new URL(base) } : {}),
    title: 'Dímelo Redes',
    applicationName: 'Dímelo Redes',
    description: 'Programa y publica en tus redes desde un solo lugar.',
    icons: {
      icon: '/favicon.ico',
      apple: '/apple-touch-icon.png',
    },
    appleWebApp: { title: 'Dímelo Redes' },
    openGraph: {
      siteName: 'Dímelo Redes',
      title: 'Dímelo Redes',
      description: 'Programa y publica en tus redes desde un solo lugar.',
      images: [{ url: '/dimelo-redes-512.png', width: 512, height: 512 }],
    },
    twitter: { card: 'summary' },
  };
};
