import Image from 'next/image';
import Link from 'next/link';
import type { ComponentType, ReactNode } from 'react';
import {
  Apple,
  ArrowRight,
  Briefcase,
  Building2,
  Check,
  CheckCircle2,
  Eye,
  FileCheck2,
  HeartHandshake,
  LockKeyhole,
  ShieldCheck,
  Smartphone,
  Sparkles,
  UserCheck,
  Users,
} from 'lucide-react';
import { Brand } from '@/components/brand';
import { LandingHeader } from '@/components/landing-header';

export default function Home() {
  return (
    <main className="app-canvas selection:bg-primary selection:text-primary-foreground">
      <LandingHeader />

      <section className="relative mx-auto grid max-w-7xl items-center gap-14 px-5 pb-20 pt-12 sm:px-8 sm:pt-20 lg:grid-cols-[1.02fr_.98fr] lg:px-10 lg:pb-28 lg:pt-24">
        <div className="relative z-10 max-w-3xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-3.5 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-primary sm:text-[11px]">
            <Sparkles className="size-3.5 text-primary" /> ETHGlobal / ETH Lima Hackathon Demo · Arbitrum Stylus & Base
          </div>

          <h1 className="max-w-4xl text-[clamp(3.35rem,8vw,7.4rem)] font-medium leading-[0.88] tracking-[-0.075em] text-white">
            Tu experiencia
            <span className="block text-primary">
              sí <span className="font-editorial text-white">cuenta.</span>
            </span>
          </h1>

          <p className="mt-8 max-w-xl text-base leading-7 text-white/58 sm:text-lg">
            Convierte voluntariados, proyectos y aprendizajes reales en una historia profesional que las
            organizaciones respaldan y las empresas pueden comprender.
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link
              href="#como-funciona"
              className="group inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-primary px-6 text-sm font-bold text-primary-foreground transition hover:brightness-110"
            >
              Descubre cómo funciona
              {/* <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" /> */}
            </Link>
            <Link
              href="/talento/1"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-white/14 bg-white/5 px-6 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Ver una historia real
              {/* <Eye className="size-4 text-primary" /> */}
            </Link>
          </div>

          {/* <div className="mt-10 flex flex-wrap gap-x-5 gap-y-2 text-xs text-white/48">
            {['Sin puntajes', 'Con evidencia real', 'Siempre tuyo'].map((item) => (
              <span key={item} className="inline-flex items-center gap-1.5">
                <Check className="size-3.5 text-primary" /> {item}
              </span>
            ))}
          </div> */}
        </div>

        <HeroProduct />
      </section>

      <section className="border-y border-white/8 bg-black/15">
        <div className="mx-auto grid max-w-7xl gap-px bg-white/8 sm:grid-cols-3">
          <ProofFact number="01" title="Experiencias reales" copy="Proyectos, voluntariados y trabajo que ya hiciste." />
          <ProofFact number="02" title="Competencias con contexto" copy="Cada habilidad apunta a una experiencia concreta." />
          <ProofFact number="03" title="Una historia que crece" copy="Tu perfil evoluciona contigo, experiencia tras experiencia." />
        </div>
      </section>

      <section id="como-funciona" className="scroll-mt-20 px-5 py-24 sm:px-8 lg:px-10 lg:py-32">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col items-start justify-between gap-8 lg:flex-row lg:items-end">
            <div className="max-w-3xl">
              <p className="inline-flex items-center gap-2 text-[11px] font-light  tracking-[0.16em] text-primary">
                <span className="grid size-4 place-items-center rounded-full bg-primary text-[11px] leading-none text-primary-foreground">+</span>
                ¿CÓMO FUNCIONA?
              </p>
              <h2 className="mt-5 text-4xl font-black uppercase leading-[.92] tracking-[-0.06em] text-white sm:text-6xl lg:text-7xl">
                Lo que hiciste
                <span className="block text-white/42">merece ser visto.</span>
              </h2>
            </div>

            <Link
              href="/talento/1"
              className="group inline-flex min-h-11 items-center gap-3 rounded-full bg-primary px-5 text-[11px] font-black uppercase tracking-[0.08em] text-primary-foreground transition hover:brightness-110"
            >
              Ver un TalentPass
              <span className="grid size-6 place-items-center rounded-full bg-primary-foreground text-primary">
                <ArrowRight className="size-3.5 -rotate-45 transition-transform group-hover:rotate-0" />
              </span>
            </Link>
          </div>

          <div className="mt-12 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            <article className="group relative flex min-h-[380px] flex-col overflow-hidden rounded-[1.15rem] border border-white/8 bg-[#181a19] p-6 sm:p-7 lg:min-h-[430px]">
              <span className="pointer-events-none absolute -right-3 top-10 font-mono text-[8rem] font-black leading-none tracking-[-0.12em] text-white/[.025]">01</span>
              <div className="relative flex items-start justify-between">
                <HeartHandshake className="size-9 stroke-[2.2] text-primary" />
                <span className="font-mono text-[10px] text-white/30">01 / TU HISTORIA</span>
              </div>

              <div className="relative mt-auto">
                <h3 className="max-w-[12ch] text-3xl font-black uppercase leading-[.95] tracking-[-0.055em] text-white">
                  Registra una experiencia
                </h3>
                <p className="mt-4 max-w-[29ch] text-sm leading-6 text-white/48">
                  Ese proyecto, voluntariado o primer trabajo que todavía no cabe en tu CV.
                </p>
                <div className="mt-7 flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-white/10 pt-5 text-[9px] font-bold uppercase tracking-[0.1em] text-primary">
                  Proyectos <span className="size-1 rounded-full bg-white/25" /> Voluntariados <span className="size-1 rounded-full bg-white/25" /> Trabajo
                </div>
              </div>
            </article>

            <div className="grid min-h-[430px] grid-rows-[1.08fr_.92fr] gap-3">
              <article className="flex flex-col rounded-[1.15rem] border border-white/8 bg-[#202221] p-6">
                <FileCheck2 className="size-8 stroke-[2.2] text-primary" />
                <div className="mt-auto">
                  <h3 className="text-2xl font-black uppercase leading-[.95] tracking-[-0.05em] text-white">Cuenta tu aporte</h3>
                  <p className="mt-3 text-xs leading-5 text-white/48">Qué hiciste tú. Qué decisión tomaste. Qué cambió después.</p>
                </div>
              </article>

              <article className="flex flex-col rounded-[1.15rem] bg-primary p-6 text-primary-foreground">
                <CheckCircle2 className="size-8 stroke-[2.4]" />
                <div className="mt-auto">
                  <h3 className="text-2xl font-black uppercase leading-[.95] tracking-[-0.05em]">Suma pruebas</h3>
                  <p className="mt-3 text-xs font-semibold leading-5 opacity-65">Un enlace, una entrega o una foto puede dar todo el contexto.</p>
                </div>
              </article>
            </div>

            <article className="relative flex min-h-[400px] flex-col overflow-hidden rounded-[1.15rem] border border-white/8 bg-[#181a19] p-6 sm:p-7 lg:min-h-[430px]">
              <div className="absolute inset-x-0 top-0 h-36 bg-[radial-gradient(circle_at_50%_0%,rgb(184_255_61/.13),transparent_72%)]" />
              <div className="relative flex items-start justify-between">
                <UserCheck className="size-9 stroke-[2.2] text-primary" />
                <span className="font-mono text-[10px] text-white/30">02 / RESPALDO</span>
              </div>

              <div className="relative mt-auto">
                <h3 className="text-3xl font-black uppercase leading-[.95] tracking-[-0.055em] text-white">
                  Alguien que estuvo ahí lo confirma
                </h3>
                <p className="mt-4 text-sm leading-6 text-white/48">
                  La organización revisa la historia y reconoce las competencias que vio en acción.
                </p>
                {/* <div className="mt-6 rounded-xl border border-white/10 bg-black/20 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[10px] font-black uppercase tracking-[0.12em] text-white">Revisión humana</span>
                    <span className="grid size-6 place-items-center rounded-full bg-primary text-primary-foreground"><Check className="size-3.5" /></span>
                  </div>
                  <p className="mt-2 text-[10px] leading-4 text-white/35">Sin puntajes. Sin decisiones automáticas.</p>
                </div> */}
              </div>
            </article>

            <article className="group relative min-h-[430px] overflow-hidden rounded-[1.15rem] border border-white/8 bg-[#181a19]">
              <Image
                src="/talent_portrait.jpg"
                alt="Profesional mostrando el talento que construyó con su experiencia"
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw"
                className="object-cover object-[52%_center] grayscale-[18%] transition duration-700 group-hover:scale-[1.035] group-hover:grayscale-0"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-black/15 via-black/5 to-black/90" />
              <div className="absolute inset-x-0 top-0 flex items-center justify-between p-6">
                <span className="font-mono text-[10px] text-white/65">03 / TALENTPASS</span>
                <span className="grid size-9 place-items-center rounded-full bg-primary text-primary-foreground"><Briefcase className="size-4" /></span>
              </div>
              <div className="absolute inset-x-0 bottom-0 p-6 sm:p-7">
                <span className="mb-4 inline-flex rounded-full bg-primary px-3 py-1 text-[9px] font-black uppercase tracking-[0.12em] text-primary-foreground">Listo para compartir</span>
                <h3 className="text-3xl font-black uppercase leading-[.95] tracking-[-0.055em] text-white">
                  Todo junto.<br />Siempre contigo.
                </h3>
                <p className="mt-3 text-xs leading-5 text-white/58">Una historia profesional que crece experiencia tras experiencia.</p>
              </div>
            </article>
          </div>

          {/* <div className="mt-5 flex flex-col justify-between gap-2 border-t border-white/8 pt-5 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/30 sm:flex-row">
            <span>Una experiencia · una revisión · un respaldo</span>
            <span className="text-primary">No calificamos personas. Verificamos experiencias.</span>
          </div> */}
        </div>
      </section>

      <section className="px-5 pb-24 sm:px-8 lg:px-10 lg:pb-32">
        <div className="surface relative mx-auto max-w-7xl overflow-hidden rounded-[2rem] p-6 sm:p-10 lg:p-14">
          <div className="absolute -right-24 -top-32 size-96 rounded-full bg-primary/13 blur-3xl" />
          <div className="relative grid items-center gap-12 lg:grid-cols-[.9fr_1.1fr]">
            <div className="max-w-xl">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Confianza sin complicaciones</p>
              <h2 className="mt-4 text-4xl font-medium leading-[1.02] tracking-[-0.055em] text-white sm:text-5xl">
                Tecnología invisible.
                <span className="font-editorial block text-white/50">Confianza visible.</span>
              </h2>
              <p className="mt-5 text-sm leading-6 text-white/50 sm:text-base">
                ProofPath utiliza tecnología blockchain para proteger la historia detrás de cada experiencia.
                Tú ves un perfil sencillo; por debajo, la evidencia conserva su integridad.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
              <QuietTech icon={LockKeyhole} title="Privado" copy="Tus datos personales no se publican en blockchain." />
              <QuietTech icon={ShieldCheck} title="Confiable" copy="Cualquier cambio en la evidencia puede detectarse." />
              <QuietTech icon={Eye} title="Claro" copy="No hace falta entender cripto para comprobar un perfil." />
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-white/8 bg-[#0b0f0c] px-5 py-24 sm:px-8 lg:px-10 lg:py-32">
        <div className="mx-auto max-w-7xl">
          <AllianceMarquee />

          <div className="mx-auto mt-24 max-w-3xl text-center">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-primary">Una red, dos soluciones</p>
            <h2 className="mt-5 text-4xl font-medium leading-[.98] tracking-[-0.06em] text-white sm:text-6xl">
              Una red para hacer visible el talento.
              <span className="font-editorial block text-white/42">Desde donde se forma hasta donde se contrata.</span>
            </h2>
            <p className="mx-auto mt-6 max-w-2xl text-sm leading-6 text-white/42">
              ProofPath conserva el contexto entre quienes acompañan una experiencia y quienes buscan incorporar
              ese talento a sus equipos.
            </p>
          </div>

          <div className="mt-16 grid items-center gap-12 lg:grid-cols-[.9fr_1.1fr_.9fr] lg:gap-14">
            <article id="organizaciones" className="scroll-mt-24">
              <div className="flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-full bg-primary/10 text-primary"><Building2 className="size-4" /></span>
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-primary">01 / Organizaciones</p>
              </div>
              <h3 className="mt-7 text-3xl font-semibold leading-[1.02] tracking-[-0.05em] text-white">Haz visible el impacto de tus programas.</h3>
              <p className="mt-4 text-sm leading-6 text-white/42">Confirma lo que cada participante hizo y entrégale una historia profesional que pueda llevar consigo.</p>
              <div className="mt-8 space-y-5">
                <AudiencePoint icon={FileCheck2}>Revisa experiencias con evidencia y contexto.</AudiencePoint>
                <AudiencePoint icon={UserCheck}>Mantén una decisión humana antes de publicar.</AudiencePoint>
                <AudiencePoint icon={CheckCircle2}>Emite respaldos para programas completos.</AudiencePoint>
              </div>
              <Link href="/org/login" className="group mt-9 inline-flex min-h-11 items-center gap-3 rounded-full bg-primary px-5 text-[11px] font-bold text-primary-foreground transition hover:brightness-110">
                Acceder como organización <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" />
              </Link>
            </article>

            <div className="relative mx-auto w-full max-w-md overflow-hidden rounded-[1.8rem] border border-white/10 bg-[#111512] p-5 shadow-[0_35px_90px_rgb(0_0_0/35%)] sm:p-7">
              <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(rgb(184_255_61/.10)_1px,transparent_1px),linear-gradient(90deg,rgb(184_255_61/.10)_1px,transparent_1px)] [background-size:54px_54px]" />
              <div className="relative flex items-center justify-between">
                <p className="text-[9px] font-black uppercase tracking-[0.16em] text-white/35">Red ProofPath</p>
                <span className="rounded-full border border-primary/20 bg-primary/8 px-2.5 py-1 text-[8px] font-bold uppercase tracking-[0.12em] text-primary">Contexto conectado</span>
              </div>

              <div className="relative my-14 flex items-center justify-between">
                <div className="relative z-10 text-center">
                  <span className="mx-auto grid size-14 place-items-center rounded-full border border-white/12 bg-[#171c18] text-white"><Building2 className="size-5" /></span>
                  <p className="mt-3 text-[8px] font-black uppercase tracking-[0.12em] text-white/32">Respalda</p>
                </div>
                <div className="absolute left-12 right-12 top-7 h-px bg-gradient-to-r from-white/10 via-primary/70 to-white/10" />
                <span className="relative z-10 grid size-20 place-items-center rounded-full border-[6px] border-[#111512] bg-primary text-primary-foreground shadow-[0_0_45px_rgb(184_255_61/18%)]">
                  <span className="relative grid size-8 place-items-center" aria-hidden="true">
                    <span className="absolute h-7 w-2 rotate-45 rounded-full bg-primary-foreground" />
                    <span className="absolute h-7 w-2 -rotate-45 rounded-full border border-primary-foreground/55 bg-primary" />
                  </span>
                </span>
                <div className="relative z-10 text-center">
                  <span className="mx-auto grid size-14 place-items-center rounded-full border border-white/12 bg-[#171c18] text-white"><Users className="size-5" /></span>
                  <p className="mt-3 text-[8px] font-black uppercase tracking-[0.12em] text-white/32">Descubre</p>
                </div>
              </div>

              <div className="relative overflow-hidden rounded-[1.3rem] border border-white/10 bg-black/25 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-primary">TalentPass</p>
                    <p className="mt-2 text-lg font-semibold tracking-[-0.035em] text-white">La experiencia conserva su historia.</p>
                  </div>
                  <ShieldCheck className="size-6 shrink-0 text-primary" />
                </div>
                <div className="mt-6 flex items-center gap-2 text-[9px] font-semibold text-white/35">
                  <span>Programa</span><ArrowRight className="size-3 text-primary" /><span>Respaldo</span><ArrowRight className="size-3 text-primary" /><span className="text-primary">Oportunidad</span>
                </div>
              </div>
            </div>

            <article id="empresas" className="scroll-mt-24">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="grid size-10 place-items-center rounded-full bg-white/6 text-primary"><Users className="size-4" /></span>
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-primary">02 / Empresas</p>
                </div>
                <span className="rounded-full border border-white/10 px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.12em] text-white/32">Próximamente</span>
              </div>
              <h3 className="mt-7 text-3xl font-semibold leading-[1.02] tracking-[-0.05em] text-white">Descubre talento más allá del currículum.</h3>
              <p className="mt-4 text-sm leading-6 text-white/42">Comprende qué hizo una persona, en qué contexto y quién respaldó su experiencia.</p>
              <div className="mt-8 space-y-5">
                <AudiencePoint icon={Eye}>Explora perfiles con evidencia contextual.</AudiencePoint>
                <AudiencePoint icon={Briefcase}>Encuentra competencias demostradas en acción.</AudiencePoint>
                <AudiencePoint icon={ShieldCheck}>Comprueba respaldos sin entender blockchain.</AudiencePoint>
              </div>
              <Link href="/talento/1" className="group mt-9 inline-flex min-h-11 items-center gap-3 rounded-full border border-white/12 bg-white/5 px-5 text-[11px] font-bold text-white transition hover:bg-white/10">
                Explorar un TalentPass <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" />
              </Link>
            </article>
          </div>
        </div>
      </section>

      <section id="app" className="scroll-mt-20 px-5 py-24 sm:px-8 lg:px-10 lg:py-32">
        <div className="mx-auto grid max-w-7xl items-center gap-14 overflow-hidden rounded-[2.2rem] bg-primary p-6 text-primary-foreground sm:p-10 lg:grid-cols-[.9fr_1.1fr] lg:p-14">
          <div className="relative mx-auto h-[460px] w-full max-w-sm sm:h-[520px]">
            <AppPhone />
          </div>

          <div className="max-w-2xl">
            {/* <p className="text-xs font-black uppercase tracking-[0.18em] opacity-55">ProofPath para iPhone</p> */}
            <h2 className="mt-5 text-4xl font-medium leading-[.98] tracking-[-0.055em] sm:text-6xl">
              Tu historia profesional,
              <span className="font-editorial block">siempre contigo.</span>
            </h2>
            <p className="mt-6 max-w-xl text-sm font-medium leading-6 opacity-60 sm:text-base">
              Registra nuevas experiencias, reúne tus credenciales y comparte tu TalentPass directamente desde
              el teléfono. Estamos preparando la app para su lanzamiento en App Store.
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {['Registra experiencias en minutos', 'Comparte tu perfil cuando lo necesites', 'Recibe nuevas credenciales', 'Consulta tu evidencia desde cualquier lugar'].map(
                (item) => (
                  <span key={item} className="flex items-center gap-2 text-xs font-semibold">
                    <CheckCircle2 className="size-4" /> {item}
                  </span>
                ),
              )}
            </div>

            <AppStoreBadge className="mt-9" />
          </div>
        </div>
      </section>

      <section className="px-5 pb-24 sm:px-8 lg:px-10 lg:pb-32">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-8 rounded-[2rem] border border-white/8 bg-white/[.025] p-7 sm:p-10 lg:flex-row lg:items-center">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Empieza por una experiencia</p>
            <h2 className="mt-3 text-3xl font-medium tracking-[-0.045em] text-white sm:text-4xl">
              El talento ya existe. Hagámoslo visible.
            </h2>
          </div>
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <Link
              href="#organizaciones"
              className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/12 bg-white/5 px-6 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Soy una organización
            </Link>
            <Link
              href="#empresas"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-primary px-6 text-sm font-bold text-primary-foreground transition hover:brightness-110"
            >
              Soy una empresa 
              {/* <ArrowRight className="size-4" /> */}
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/8 px-5 py-10 sm:px-8 lg:px-10">
        <div className="mx-auto grid max-w-7xl gap-10 sm:grid-cols-2 lg:grid-cols-[1.2fr_.8fr_.8fr_1fr]">
          <div>
            <Brand />
            <p className="mt-4 max-w-xs text-xs leading-5 text-white/38">
              Experiencias reales convertidas en oportunidades profesionales.
            </p>
            <AppStoreBadge dark className="mt-6" />
          </div>

          <FooterGroup title="Producto">
            <Link href="#como-funciona">Cómo funciona</Link>
            <Link href="/talento/1">Ver TalentPass</Link>
            <Link href="#app">App móvil</Link>
          </FooterGroup>

          <FooterGroup title="Soluciones">
            <Link href="#organizaciones">Organizaciones</Link>
            <Link href="#empresas">Empresas</Link>
            <Link href="/org/login">Iniciar sesión</Link>
          </FooterGroup>

          <div className="lg:text-right">
            <p className="text-xs font-semibold text-white">Nuestra promesa</p>
            <p className="mt-4 text-xs leading-5 text-white/38">
              No calificamos personas.<br />Verificamos experiencias.
            </p>
          </div>
        </div>

        <div className="mx-auto mt-10 flex max-w-7xl flex-col gap-2 border-t border-white/7 pt-6 text-[10px] text-white/25 sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 ProofPath. Todos los derechos reservados.</p>
          <p>Construido para ampliar el acceso al primer empleo.</p>
        </div>
      </footer>
    </main>
  );
}

function HeroProduct() {
  return (
   
   <></>
    // <div className="relative mx-auto w-full max-w-[560px] py-6 lg:py-0">
    //   <div className="absolute left-1/2 top-1/2 h-[75%] w-[75%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/14 blur-[90px]" />
    //   <div className="surface relative mx-auto w-[78%] overflow-hidden rounded-[2.4rem] border-white/14 p-2 shadow-[0_40px_100px_rgb(0_0_0/55%)] sm:w-[70%]">
    //     <div className="relative min-h-[520px] overflow-hidden rounded-[2rem] bg-[#0d120e] p-5 sm:min-h-[570px] sm:p-6">
    //       <div className="absolute inset-x-0 top-0 h-48 bg-[radial-gradient(circle_at_top,#314718,transparent_68%)]" />
    //       <div className="relative flex items-center justify-between text-[10px] text-white/65">
    //         <span>9:41</span>
    //         <span className="rounded-full bg-black/35 px-3 py-1">Mi TalentPass</span>
    //       </div>

    //       <div className="relative mt-10">
    //         <p className="text-xs text-white/45">Buenos días,</p>
    //         <h2 className="mt-1 text-2xl font-semibold tracking-[-0.04em]">Bruno Valdez</h2>
    //       </div>

    //       <div className="relative mt-6 overflow-hidden rounded-[1.6rem] bg-primary p-5 text-primary-foreground shadow-[0_20px_50px_rgb(184_255_61/12%)]">
    //         <div className="flex items-start justify-between">
    //           <div>
    //             <p className="text-[10px] font-bold uppercase tracking-[0.14em] opacity-60">Perfil profesional</p>
    //             <p className="mt-8 text-3xl font-bold tracking-[-0.06em]">TalentPass</p>
    //           </div>
    //           <ShieldCheck className="size-7" />
    //         </div>
    //         <div className="mt-10 flex items-center justify-between text-[10px] font-semibold">
    //           <span>5 competencias</span>
    //           <span>Respaldado ✓</span>
    //         </div>
    //       </div>

    //       <div className="relative mt-5 grid grid-cols-2 gap-3">
    //         <div className="surface-soft rounded-2xl p-4">
    //           <p className="text-[10px] text-white/40">Experiencias</p>
    //           <p className="mt-2 text-2xl font-semibold">02</p>
    //         </div>
    //         <div className="surface-soft rounded-2xl p-4">
    //           <p className="text-[10px] text-white/40">Perfil</p>
    //           <p className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-primary">
    //             <CheckCircle2 className="size-3.5" /> Listo
    //           </p>
    //         </div>
    //       </div>

    //       <div className="relative mt-5 rounded-2xl border border-white/8 bg-white/[.035] p-4">
    //         <div className="flex items-center justify-between">
    //           <p className="text-xs font-semibold">Experiencia reciente</p>
    //           <ArrowRight className="size-3.5 text-primary" />
    //         </div>
    //         <p className="mt-3 text-sm text-white/80">Plataforma de mentorías</p>
    //         <p className="mt-1 text-[10px] text-white/38">Full Stack Developer · Impulso Joven</p>
    //       </div>
    //     </div>
    //   </div>

    //   <div className="surface absolute -left-1 top-[38%] hidden w-52 rounded-2xl p-4 sm:block">
    //     <p className="text-[10px] text-white/42">Experiencia confirmada</p>
    //     <p className="mt-2 text-sm font-semibold">5 competencias</p>
    //     <div className="mt-3 flex gap-1">
    //       {[0, 1, 2, 3, 4].map((item) => <span key={item} className="h-1 flex-1 rounded-full bg-primary" />)}
    //     </div>
    //   </div>

    //   <div className="surface absolute -right-1 bottom-[18%] hidden w-48 rounded-2xl p-4 sm:block">
    //     <p className="flex items-center gap-1.5 text-xs font-semibold text-primary">
    //       <CheckCircle2 className="size-3.5" /> Listo para compartir
    //     </p>
    //     <p className="mt-2 text-[10px] leading-4 text-white/35">Tu historia profesional, en un solo lugar.</p>
    //   </div>
    // </div>
  );
}

function ProofFact({ number, title, copy }: { number: string; title: string; copy: string }) {
  return (
    <div className="bg-background px-6 py-7 sm:px-8">
      <div className="flex items-start gap-4">
        <span className="font-mono text-[10px] text-primary">{number}</span>
        <div>
          <p className="text-sm font-semibold text-white">{title}</p>
          <p className="mt-1 text-xs leading-5 text-white/42">{copy}</p>
        </div>
      </div>
    </div>
  );
}

const allianceItems = [
  { mark: 'IJ', name: 'Fundación Impulso Joven', real: true },
  { mark: '+', name: 'Próxima alianza', real: false },
  { mark: '○', name: 'Próxima alianza', real: false },
  { mark: '◇', name: 'Próxima alianza', real: false },
  { mark: '✦', name: 'Próxima alianza', real: false },
];

function AllianceMarquee() {
  const group = (hidden = false) => (
    <div className="flex shrink-0 gap-3 pr-3" aria-hidden={hidden || undefined}>
      {allianceItems.map((item, index) => (
        <div key={`${item.mark}-${index}`} className={`flex min-w-[230px] items-center gap-4 rounded-2xl border px-5 py-4 ${item.real ? 'border-primary/18 bg-primary/[.055]' : 'border-white/7 bg-white/[.025]'}`}>
          <span className={`grid size-10 shrink-0 place-items-center rounded-full text-xs font-black ${item.real ? 'bg-primary text-primary-foreground' : 'border border-dashed border-white/16 text-white/25'}`}>{item.mark}</span>
          <div>
            <p className={`text-xs font-semibold ${item.real ? 'text-white' : 'text-white/30'}`}>{item.name}</p>
            <p className={`mt-1 text-[8px] font-bold uppercase tracking-[0.12em] ${item.real ? 'text-primary' : 'text-white/16'}`}>{item.real ? 'Organización de demostración' : 'Espacio reservado'}</p>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div>
      <div className="mb-7 flex flex-col items-center justify-between gap-2 text-center sm:flex-row sm:text-left">
        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/34">Alianzas en formación</p>
        <p className="text-[10px] text-white/22">Construyendo oportunidades junto a organizaciones de impacto.</p>
      </div>
      <div className="alliance-marquee">
        <div className="alliance-marquee__track">
          {group()}
          {group(true)}
        </div>
      </div>
    </div>
  );
}

function AudiencePoint({ icon: Icon, children }: { icon: ComponentType<{ className?: string }>; children: ReactNode }) {
  return (
    <div className="flex items-start gap-3 border-t border-white/8 pt-5">
      <Icon className="mt-0.5 size-4 shrink-0 text-primary" />
      <p className="text-xs leading-5 text-white/48">{children}</p>
    </div>
  );
}

function QuietTech({ icon: Icon, title, copy }: { icon: ComponentType<{ className?: string }>; title: string; copy: string }) {
  return (
    <article className="rounded-2xl border border-white/8 bg-black/20 p-5">
      <Icon className="size-4 text-primary" />
      <p className="mt-6 text-sm font-semibold text-white">{title}</p>
      <p className="mt-2 text-xs leading-5 text-white/38">{copy}</p>
    </article>
  );
}

function AppPhone() {
  return (
    <div className="absolute left-1/2 top-1/2 w-[270px] -translate-x-1/2 -translate-y-1/2 rotate-[-5deg] rounded-[2.5rem] border-[7px] border-[#111612] bg-[#0b0f0c] p-4 text-white shadow-[0_30px_60px_rgb(13_25_6/35%)] sm:w-[310px]">
      <div className="mx-auto h-5 w-24 rounded-full bg-black" />
      <div className="mt-7">
        <p className="text-[10px] text-white/38">Hola, Bruno</p>
        <p className="mt-1 text-xl font-semibold">Mi TalentPass</p>
      </div>
      <div className="mt-5 rounded-[1.6rem] bg-primary p-5 text-primary-foreground">
        <div className="flex items-start justify-between">
          <p className="text-[9px] font-black uppercase tracking-wider opacity-60">Perfil profesional</p>
          <ShieldCheck className="size-5" />
        </div>
        <p className="mt-12 text-2xl font-bold">TalentPass</p>
        <p className="mt-1 text-[10px] font-semibold opacity-60">2 experiencias respaldadas</p>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-white/8 bg-white/[.04] p-4"><Smartphone className="size-4 text-primary" /><p className="mt-6 text-[10px] font-semibold">Registrar</p></div>
        <div className="rounded-2xl border border-white/8 bg-white/[.04] p-4"><FileCheck2 className="size-4 text-primary" /><p className="mt-6 text-[10px] font-semibold">Compartir</p></div>
      </div>
      <div className="mt-4 rounded-2xl border border-white/8 bg-white/[.04] p-4">
        <p className="text-[9px] text-white/30">Experiencia reciente</p>
        <p className="mt-2 text-xs font-semibold">Plataforma de mentorías</p>
        <p className="mt-1 text-[9px] text-white/35">Impulso Joven</p>
      </div>
    </div>
  );
}

function AppStoreBadge({ className = '', dark = false }: { className?: string; dark?: boolean }) {
  return (
    <div className={`inline-flex items-center gap-3 rounded-xl border px-4 py-2.5 ${dark ? 'border-white/12 bg-white/5 text-white' : 'border-black/15 bg-black text-white'} ${className}`} aria-label="Aplicación para iPhone, próximamente en App Store">
      <Apple className="size-7" />
      <div>
        <p className="text-[8px] font-medium uppercase tracking-wide opacity-60">Próximamente en</p>
        <p className="text-sm font-semibold leading-none">App Store</p>
      </div>
    </div>
  );
}

function FooterGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold text-white">{title}</p>
      <div className="mt-4 flex flex-col items-start gap-3 text-xs text-white/38 [&_a]:transition [&_a:hover]:text-primary">{children}</div>
    </div>
  );
}
