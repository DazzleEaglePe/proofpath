'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { Brand } from '@/components/brand';

const navigation = [
  { href: '#como-funciona', label: 'Cómo funciona' },
  { href: '#organizaciones', label: 'Organizaciones' },
  { href: '#empresas', label: 'Empresas' },
  { href: '#app', label: 'App móvil' },
];

export function LandingHeader() {
  const [scrolled, setScrolled] = useState(false);
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
              ? 'mt-2 w-[calc(100%-1rem)] max-w-[76rem] rounded-[1.35rem]'
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

            <div className="hidden items-center gap-1 rounded-full border border-white/[.07] bg-black/10 p-1 lg:flex">
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

            <Link
              href="/org/login"
              className="group inline-flex min-h-9 items-center justify-center gap-2 rounded-full border border-white/14 bg-white/[.075] px-4 text-xs font-semibold text-white shadow-[inset_0_1px_0_rgb(255_255_255/.12)] transition hover:border-primary/35 hover:bg-primary hover:text-primary-foreground"
            >
              <span className="sm:hidden">Ingresar</span>
              <span className="hidden sm:inline">Acceso organizaciones</span>
              <span className="size-1.5 rounded-full bg-primary transition group-hover:bg-primary-foreground" aria-hidden="true" />
            </Link>
          </div>
        </nav>
      </header>
      <div className="h-[72px]" aria-hidden="true" />
    </>
  );
}
