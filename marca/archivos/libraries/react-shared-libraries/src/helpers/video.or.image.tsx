'use client';

// Dímelo Redes (dw15): la vista previa del video arranca sin sonido (los navegadores no dejan reproducir solos
// los videos con sonido) y lleva un botón para oírlo. Sin él parecía que el video no tenía audio.
import { FC, MouseEvent, useRef, useState } from 'react';
import { clsx } from 'clsx';
import { hasExtension } from '@gitroom/helpers/utils/has.extension';
export const VideoOrImage: FC<{
  src: string;
  autoplay: boolean;
  isContain?: boolean;
  imageClassName?: string;
  videoClassName?: string;
}> = (props) => {
  const { src, autoplay, isContain, imageClassName, videoClassName } = props;
  const video = useRef<HTMLVideoElement>(null);
  const [conSonido, setConSonido] = useState(false);
  if (hasExtension(src, 'mp4')) {
    // Dentro de un enlace: el botón no abre el archivo
    const cambiarSonido = (event: MouseEvent) => {
      event.preventDefault();
      event.stopPropagation();
      const actual = video.current;
      if (!actual) return;
      const nuevo = !conSonido;
      actual.muted = !nuevo;
      if (nuevo) actual.play().catch(() => undefined);
      setConSonido(nuevo);
    };
    return (
      <div className="relative w-full h-full">
        <video
          ref={video}
          src={src}
          autoPlay={autoplay}
          className={clsx('w-full h-full', videoClassName)}
          muted={true}
          loop={true}
          playsInline={true}
        />
        <button
          type="button"
          onClick={cambiarSonido}
          aria-label={conSonido ? 'Quitar el sonido' : 'Escuchar el sonido'}
          title={conSonido ? 'Quitar el sonido' : 'Escuchar el sonido'}
          className="absolute bottom-[8px] end-[8px] z-[2] w-[32px] h-[32px] rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center transition-colors duration-200 pointer-events-auto"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M11 5 6 9H2v6h4l5 4V5z" />
            {conSonido ? (
              <path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14" />
            ) : (
              <path d="m22 9-6 6M16 9l6 6" />
            )}
          </svg>
        </button>
      </div>
    );
  }
  return (
    <img
      className={clsx(
        isContain ? 'object-contain' : 'object-cover',
        'w-full h-full',
        imageClassName
      )}
      src={src}
    />
  );
};
