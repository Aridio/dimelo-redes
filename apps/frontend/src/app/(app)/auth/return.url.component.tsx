'use client';

import { useSearchParams } from 'next/navigation';
import { FC, useCallback, useEffect } from 'react';

import { rutaInterna } from './ruta.interna';

// Only an address on this app, so signing in can never send someone to
// another site or run a javascript: URL. Dímelo Redes (RED-03): always kept
// as a relative path of this site (ruta.interna.ts)
const sameOriginUrl = (url: string | null) =>
  rutaInterna(url, window.location.origin);

const ReturnUrlComponent: FC = () => {
  const params = useSearchParams();
  const url = params.get('returnUrl');
  useEffect(() => {
    const returnUrl = sameOriginUrl(url);
    if (returnUrl) {
      localStorage.setItem('returnUrl', returnUrl);
    }
  }, [url]);
  return null;
};
export const useReturnUrl = () => {
  return {
    getAndClear: useCallback(() => {
      const data = localStorage.getItem('returnUrl');
      localStorage.removeItem('returnUrl');
      // also on read: localStorage can hold a value saved before this check
      return sameOriginUrl(data);
    }, []),
  };
};
export default ReturnUrlComponent;
