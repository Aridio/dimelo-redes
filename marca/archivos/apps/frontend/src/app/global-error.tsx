'use client';
import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';

// Dímelo Redes: error general en español (sustituye la página de error de Next).
export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);
  return (
    <html lang="es">
      <head>
        <title>Algo salió mal · Dímelo Redes</title>
      </head>
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 16,
          padding: 20,
          textAlign: 'center',
          fontFamily: 'system-ui, sans-serif',
          background: '#14201c',
          color: '#eef2ee',
        }}
      >
        <h1 style={{ fontSize: 24, margin: 0 }}>Algo salió mal</h1>
        <p style={{ fontSize: 14, opacity: 0.75, margin: 0 }}>
          Vuelve a cargar la página. Si sigue pasando, escríbenos.
        </p>
        <a
          href="/launches"
          style={{
            background: '#c62f47',
            color: '#fff',
            borderRadius: 8,
            padding: '12px 20px',
            textDecoration: 'none',
            fontWeight: 600,
          }}
        >
          Ir al calendario
        </a>
      </body>
    </html>
  );
}
