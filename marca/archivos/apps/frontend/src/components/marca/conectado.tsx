'use client';

// Dímelo Redes (dw11): abajo del menú lateral, como en Dímelo Bot, «Volver a Mi Dímelo» (o a DWA si entra alguien del
// equipo de Dímelo Web) y, debajo, quién está conectado: el negocio y la persona que entró. El globo da la frase entera.
// Solo con la entrada de Mi Dímelo (el servidor manda `dimelo` en /user/self); con otra cuenta no se ve nada.
import { FC, useEffect, useState } from 'react';
import clsx from 'clsx';
import { useUser } from '@gitroom/frontend/components/layout/user.context';

type Dimelo = { negocio: string | null; persona: string | null; equipo: boolean; volver: string };

const iniciales = (nombre: string) =>
  nombre
    .split(/\s+/)
    .filter((palabra) => /^[\p{L}\p{N}]/u.test(palabra))
    .map((palabra) => palabra[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

export const DimeloConectado: FC = () => {
  const dimelo = (useUser() as unknown as { dimelo?: Dimelo } | undefined)?.dimelo;
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(id);
  }, []);
  if (!dimelo) return null;

  const texto = dimelo.equipo ? 'Volver a DWA' : 'Volver a Mi Dímelo';
  const quien = dimelo.persona
    ? dimelo.equipo
      ? `Entraste como ${dimelo.persona}, del equipo de Dímelo Web`
      : `Entraste como ${dimelo.persona}`
    : '';
  const globo = [dimelo.negocio, quien].filter(Boolean).join('. ');

  return (
    <div
      data-dimelo="conectado"
      className={clsx(
        'flex flex-col gap-[8px] pt-[8px] border-t border-blockSeparator transition-opacity duration-300',
        visible ? 'opacity-100' : 'opacity-0'
      )}
      // No cierra el menú del celular al tocar el nombre (solo el botón de volver sale de aquí)
      onClick={(event) => event.stopPropagation()}
    >
      <a
        href={dimelo.volver}
        className="group w-full minCustom:h-[54px] custom:h-[44px] py-[8px] px-[4px] minCustom:gap-[4px] custom:gap-[2px] flex flex-col font-[600] items-center justify-center rounded-[12px] text-textItemBlur hover:text-textItemFocused hover:bg-boxFocused transition-colors"
      >
        <div className="custom:scale-90 transition-transform">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M19 12H5M11 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <div className="custom:text-[9px] minCustom:text-[10px] leading-[1.1] text-center">{texto}</div>
      </a>
      {dimelo.negocio && (
        <div
          className="flex flex-col items-center gap-[4px] px-[2px] text-center cursor-default"
          tabIndex={0}
          role="note"
          aria-label={globo}
          data-tooltip-id="tooltip"
          data-tooltip-content={globo}
        >
          <div
            className="w-[32px] h-[32px] shrink-0 rounded-full bg-boxFocused text-textItemFocused flex items-center justify-center text-[12px] font-[700]"
            aria-hidden="true"
          >
            {iniciales(dimelo.negocio) || '·'}
          </div>
          <div className="w-full text-[10px] font-[600] leading-[1.15] text-newTextColor break-words line-clamp-2" aria-hidden="true">
            {dimelo.negocio}
          </div>
          {dimelo.persona && (
            <div className="w-full text-[9px] leading-[1.15] text-textItemBlur break-words line-clamp-2" aria-hidden="true">
              {dimelo.persona}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
