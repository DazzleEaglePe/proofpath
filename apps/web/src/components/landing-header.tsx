'use client';

import { ArrowUpRight } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { Brand } from '@/components/brand';
import { JudgeDemoModal } from '@/components/judge-demo-modal';

const navigation = [
  { href: '#como-funciona', label: 'Cómo funciona' },
  { href: '#organizaciones', label: 'Organizaciones' },
  { href: '#empresas', label: 'Empresas' },
  { href: '#app', label: 'App móvil' },
];

export function LandingHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [isJudgeModalOpen, setJudgeModalOpen] = useState(false);
  const scrollMarker = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const marker = scrollMarker.current;
    const update = () => setScrolled(window.scrollY > 24);

    const observer = marker && typeof window.IntersectionObserver === 'function'
      ? new window.IntersectionObserver(([entry]) => setScrolled(!entry.isIntersecting), { threshold: 0 })
      : null;

    if (marker) observer?.observe(marker);
    update();
    window.addEventListener('scroll', update, { passive: true });
    document.addEventListener('scroll', update, { passive: true });

    return () => {
      observer?.disconnect();
      window.removeEventListener('scroll', update);
      document.removeEventListener('scroll', update);
    };
  }, []);

  return (
    <>
      <span ref={scrollMarker} className="pointer-events-none absolute left-0 top-6 size-px" aria-hidden="true" />
      <header className="pointer-events-none fixed inset-x-0 top-0 z-50 h-[72px]">
        <nav
          aria-label="Navegación principal"
          data-scrolled={scrolled}
          className={`liquid-header pointer-events-auto relative mx-auto overflow-hidden transition-[width,max-width,margin,border-radius,background-color,box-shadow] duration-500 ease-[cubic-bezier(.22,1,.36,1)] ${
            scrolled
              ? 'mt-2 w-[calc(100%-1rem)] max-w-[76rem] rounded-full'
              : 'w-full max-w-none rounded-none border-x-0 border-t-0'
          }`}
        >
          <span className="liquid-header__lens" aria-hidden="true" />
          <span className="liquid-header__orb" aria-hidden="true" />

          <div
            className={`liquid-header__content relative z-10 mx-auto flex max-w-7xl items-center justify-between px-5 transition-[height,padding] duration-500 ease-[cubic-bezier(.22,1,.36,1)] sm:px-8 lg:px-10 ${
              scrolled ? 'h-[58px]' : 'h-[68px]'
            }`}
          >
            <Brand />

            <div className="hidden items-center lg:flex">
              {navigation.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-full px-4 py-2 text-[11px] font-medium text-white/52 transition hover:bg-white/[.07] hover:text-white"
                >
                  {item.label}
                </Link>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setJudgeModalOpen(true)}
                className="inline-flex h-10 items-center justify-center gap-1.5 rounded-full border border-primary/40 bg-primary/10 px-4 text-xs font-bold text-primary transition hover:bg-primary/20"
              >
                <span className="size-2 rounded-full bg-primary animate-pulse" />
                ⚡ Judge Mode
              </button>

              <Link
                href="/org/login"
                aria-label="Acceder al portal para organizaciones"
                className="group inline-flex h-10 shrink-0 items-center justify-center gap-3 whitespace-nowrap rounded-full border border-white/12 bg-white/[.055] py-1 pl-4 pr-1 text-xs font-semibold text-white shadow-[inset_0_1px_0_rgb(255_255_255/.12),0_8px_24px_rgb(0_0_0/.12)] backdrop-blur-md transition-[transform,border-color,background-color,box-shadow] duration-300 hover:border-primary/35 hover:bg-white/[.09] hover:shadow-[inset_0_1px_0_rgb(255_255_255/.16),0_10px_30px_rgb(0_0_0/.2)] active:scale-[.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70"
              >
                <span className="sm:hidden">Ingresar</span>
                <span className="hidden sm:inline">Acceso organizaciones</span>
                <span
                  className="grid size-8 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground shadow-[inset_0_1px_0_rgb(255_255_255/.35)] transition-transform duration-300 group-hover:rotate-45"
                  aria-hidden="true"
                >
                  <ArrowUpRight className="size-3.5" strokeWidth={2.25} />
                </span>
              </Link>
            </div>
          </div>
        </nav>
      </header>

      <JudgeDemoModal isOpen={isJudgeModalOpen} onClose={() => setJudgeModalOpen(false)} />
      <div className="h-[72px]" aria-hidden="true" />
    </>
  );
}
