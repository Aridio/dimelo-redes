'use client';

// Dímelo Redes (dw14): la pantalla de entrada solo tiene «Iniciar sesión con Mi Dímelo». Los negocios entran siempre con su
// cuenta de Mi Dímelo; no hay registro, ni correo y contraseña, ni «¿Olvidaste tu contraseña?».
import { useCallback, useEffect, useState } from 'react';
import clsx from 'clsx';
import { useFetch } from '@gitroom/helpers/utils/custom.fetch';
import { Button } from '@gitroom/react/form/button';

export const EntrarConMiDimelo = () => {
  const fetch = useFetch();
  const [cargando, setCargando] = useState(false);
  const [fallo, setFallo] = useState(false);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const entrar = useCallback(async () => {
    setCargando(true);
    setFallo(false);
    try {
      const response = await fetch('/auth/oauth/GENERIC');
      if (!response.ok) throw new Error(String(response.status));
      window.location.href = await response.text();
    } catch {
      setFallo(true);
      setCargando(false);
    }
  }, []);

  return (
    <div
      className={clsx(
        'flex flex-1 flex-col gap-[16px] transition-opacity duration-300',
        visible ? 'opacity-100' : 'opacity-0'
      )}
    >
      <h1 className="text-[28px] font-bold leading-[1.2]">Entra a Dímelo Redes</h1>
      <p className="text-[15px] opacity-80">Con la misma cuenta de Mi Dímelo.</p>
      <Button
        onClick={entrar}
        loading={cargando}
        className="w-full !h-[48px] rounded-[8px] text-[16px] font-semibold mt-[8px]"
      >
        Iniciar sesión con Mi Dímelo
      </Button>
      {fallo && (
        <p role="alert" className="text-[14px] text-[#ff7a8c] animate-fadeIn">
          No se pudo abrir Mi Dímelo ahora. Inténtalo en un momento.
        </p>
      )}
    </div>
  );
};
