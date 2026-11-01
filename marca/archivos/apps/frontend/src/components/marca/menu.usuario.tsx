'use client';

// Dímelo Redes (dw19, Aridio 2026-11-01): arriba a la derecha, solo un círculo con las iniciales del negocio. Al pulsarlo
// se abre un menú con el nombre una vez, «Configuración», «Volver a Mi Dímelo» (o a DWA si entra alguien del equipo de
// Dímelo Web) y «Cerrar sesión». Sustituye al bloque de abajo del menú lateral (dw11) y al botón suelto de Configuración.
// «Volver» solo sale con la entrada de Mi Dímelo (el servidor manda `dimelo` en /user/self).
import { FC, useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import clsx from 'clsx';
import { useUser } from '@gitroom/frontend/components/layout/user.context';
import { useFetch } from '@gitroom/helpers/utils/custom.fetch';
import { useVariables } from '@gitroom/react/helpers/variable.context';
import { setCookie } from '@gitroom/frontend/components/layout/layout.context';
import { deleteDialog } from '@gitroom/react/helpers/delete.dialog';

type Dimelo = { negocio: string | null; persona: string | null; equipo: boolean; volver: string };

const iniciales = (nombre: string) =>
  nombre
    .split(/\s+/)
    .filter((palabra) => /^[\p{L}\p{N}]/u.test(palabra))
    .map((palabra) => palabra[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

const opcion =
  'flex items-center gap-[10px] w-full px-[12px] h-[40px] rounded-[8px] text-[14px] font-[500] text-start text-newTextColor hover:bg-boxFocused transition-colors';

export const MenuUsuario: FC = () => {
  const user = useUser() as unknown as { name?: string; email?: string; dimelo?: Dimelo } | undefined;
  const fetch = useFetch();
  const { isSecured } = useVariables();
  const [abierto, setAbierto] = useState(false);
  const caja = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!abierto) return;
    const fuera = (event: MouseEvent) => {
      if (!caja.current?.contains(event.target as Node)) setAbierto(false);
    };
    const tecla = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setAbierto(false);
    };
    document.addEventListener('mousedown', fuera);
    document.addEventListener('keydown', tecla);
    return () => {
      document.removeEventListener('mousedown', fuera);
      document.removeEventListener('keydown', tecla);
    };
  }, [abierto]);

  const salir = useCallback(async () => {
    setAbierto(false);
    if (!(await deleteDialog('¿Seguro que quieres cerrar sesión?', 'Sí, cerrar sesión'))) return;
    if (!isSecured) {
      setCookie('auth', '', -10);
    } else {
      await fetch('/user/logout', { method: 'POST' });
    }
    window.location.href = '/';
  }, [isSecured]);

  if (!user) return null;
  const dimelo = user.dimelo;
  const nombre = dimelo?.negocio || user.name || user.email || '';

  return (
    <div ref={caja} className="relative flex items-center">
      <button
        type="button"
        onClick={() => setAbierto((valor) => !valor)}
        aria-haspopup="menu"
        aria-expanded={abierto}
        aria-label={nombre ? `Menú de ${nombre}` : 'Menú'}
        className={clsx(
          'w-[36px] h-[36px] shrink-0 rounded-full bg-boxFocused text-textItemFocused flex items-center justify-center text-[13px] font-[700] transition-shadow',
          abierto ? 'ring-2 ring-btnPrimary' : 'hover:ring-2 hover:ring-blockSeparator'
        )}
      >
        {iniciales(nombre) || '·'}
      </button>
      <div
        role="menu"
        aria-hidden={!abierto}
        className={clsx(
          'absolute end-0 top-[calc(100%+8px)] z-[500] w-[240px] max-w-[calc(100vw-24px)] p-[6px] rounded-[12px] bg-newBgColorInner border border-blockSeparator shadow-lg origin-top-right transition duration-150 ease-out',
          abierto ? 'opacity-100 scale-100 visible' : 'opacity-0 scale-95 invisible pointer-events-none'
        )}
      >
        {nombre && (
          <div className="px-[12px] pt-[8px] pb-[10px] mb-[4px] border-b border-blockSeparator text-[14px] font-[600] text-newTextColor break-words">
            {nombre}
          </div>
        )}
        <Link href="/settings" role="menuitem" tabIndex={abierto ? 0 : -1} className={opcion} onClick={() => setAbierto(false)}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" stroke="currentColor" strokeWidth="1.8" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1.08-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1.08 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
          </svg>
          Configuración
        </Link>
        {dimelo?.volver && (
          <a href={dimelo.volver} role="menuitem" tabIndex={abierto ? 0 : -1} className={opcion}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M19 12H5M11 18l-6-6 6-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {dimelo.equipo ? 'Volver a DWA' : 'Volver a Mi Dímelo'}
          </a>
        )}
        <button type="button" role="menuitem" tabIndex={abierto ? 0 : -1} className={clsx(opcion, '!text-red-400')} onClick={salir}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 17l5-5-5-5M15 12H3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Cerrar sesión
        </button>
      </div>
    </div>
  );
};
