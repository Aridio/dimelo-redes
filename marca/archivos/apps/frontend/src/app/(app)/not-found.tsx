import { Metadata } from 'next';
import Link from 'next/link';
import { Logo } from '@gitroom/frontend/components/new-layout/logo';

// Dímelo Redes: página 404.
export const metadata: Metadata = {
  title: 'Página no encontrada · Dímelo Redes',
};

export default function NoEncontrada() {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center gap-[16px] p-[20px] text-center text-textColor">
      <Logo />
      <h1 className="text-[24px] font-[600]">Esta página no existe</h1>
      <p className="text-[14px] opacity-70 max-w-[360px]">
        Puede que el enlace esté mal escrito o que la página ya no esté.
      </p>
      <Link
        href="/launches"
        className="bg-[#c62f47] hover:bg-[#ad2840] text-white rounded-[8px] px-[20px] h-[44px] flex items-center text-[15px] font-[600] transition-colors"
      >
        Ir al calendario
      </Link>
    </div>
  );
}
