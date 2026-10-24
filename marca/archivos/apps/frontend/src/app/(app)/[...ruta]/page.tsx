import { notFound } from 'next/navigation';

// Dímelo Redes: cualquier dirección que no existe muestra la página 404 propia (not-found.tsx).
export default function RutaQueNoExiste() {
  notFound();
}
