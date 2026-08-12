'use client';

import { useState } from 'react';
import {
  Sparkles,
  CheckCircle2,
  Cpu,
  ArrowRight,
  X,
  Copy,
  Check,
  Fingerprint,
  HeartHandshake,
  BookOpen,
  Code2,
  Leaf,
  Users,
  Briefcase
} from 'lucide-react';
import Link from 'next/link';

interface Step {
  id: number;
  title: string;
  subtitle: string;
  status: 'idle' | 'running' | 'completed';
  pilarTag?: string;
  txHash?: string;
  merkleRoot?: string;
}

export function JudgeDemoModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [isRunning, setIsRunning] = useState(false);
  const [copied, setCopied] = useState(false);

  const [steps, setSteps] = useState<Step[]>([
    {
      id: 1,
      title: 'Identidad Frictionless & Passkey (valeria.eth)',
      subtitle: 'Inicio de sesión instantáneo sin frases semilla ni fricciones de gas.',
      status: 'idle',
    },
    {
      id: 2,
      title: 'Pilar 1: Aprendizaje (DataCamp / Open Badges)',
      subtitle: 'Verificación de microcredencial en Data Analysis & Python sin exponer datos privados.',
      status: 'idle',
      pilarTag: 'Aprendizaje',
    },
    {
      id: 3,
      title: 'Pilar 2: Innovación y Tecnología (GitHub & ETH Hackathon)',
      subtitle: 'Atestación de proyecto open-source y demo desplegada en Arbitrum Stylus (Rust).',
      status: 'idle',
      pilarTag: 'Innovación y Tecnología',
    },
    {
      id: 4,
      title: 'Pilar 3: Impacto Ambiental (Piloto AgTech / Riego IoT)',
      subtitle: 'Constancia de 15% de ahorro de agua en piloto agrícola validado por facultad docente.',
      status: 'idle',
      pilarTag: 'Impacto Ambiental',
    },
    {
      id: 5,
      title: 'Verificación On-Chain Categórica (Arbitrum Stylus / Base)',
      subtitle: 'Emisión de Merkle Root categórica on-chain con gas $0.0001 (Cero PII en la cadena).',
      status: 'idle',
    },
  ]);

  const runFullHappyPath = async () => {
    setIsRunning(true);

    for (let i = 0; i < 5; i++) {
      setSteps((prev) =>
        prev.map((s, idx) => {
          if (idx === i) return { ...s, status: 'running' };
          if (idx < i) return { ...s, status: 'completed' };
          return s;
        })
      );
      await new Promise((r) => setTimeout(r, 650));
    }

    setSteps((prev) =>
      prev.map((s) => ({
        ...s,
        status: 'completed',
        txHash: '0xb1ab27efc78ea24f77a64ac1357678e3c25c8af11779f1223e357852461ce71e',
        merkleRoot: '0x15a42cb77a15a652506876e9c82357b5fac74061966bf399b3a8423dddedb696',
      }))
    );
    setIsRunning(false);
  };

  const handleCopyTx = () => {
    navigator.clipboard.writeText('0xb1ab27efc78ea24f77a64ac1357678e3c25c8af11779f1223e357852461ce71e');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl overflow-hidden rounded-3xl border border-primary/30 bg-[#0e1310] p-6 sm:p-8 text-white shadow-2xl shadow-primary/10">
        <button
          onClick={onClose}
          className="absolute right-5 top-5 rounded-full p-2 text-white/50 hover:bg-white/10 hover:text-white transition"
        >
          <X className="size-5" />
        </button>

        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-primary">
            <Sparkles className="size-3.5" /> Judge Demo Mode
          </span>
          <span className="text-xs text-white/40 font-mono">Happy Path (60s Demo)</span>
        </div>

        <h2 className="mt-3 text-2xl font-black uppercase tracking-tight sm:text-3xl text-white">
          ProofPath <span className="text-primary">6-Pillar Framework</span>
        </h2>
        <p className="mt-1 text-xs text-white/60">
          Transforma cursos, proyectos y acciones ambientales en evidencia verificable on-chain sin scores numéricos.
        </p>

        {/* 6 Pillars Quick Overview */}
        <div className="mt-4 grid grid-cols-3 sm:grid-cols-6 gap-2 text-[10px] text-center font-bold">
          <div className="rounded-xl border border-white/10 bg-white/5 p-2 text-white/80"><HeartHandshake className="size-3.5 mx-auto mb-1 text-rose-400" />Social</div>
          <div className="rounded-xl border border-primary/30 bg-primary/10 p-2 text-primary"><Leaf className="size-3.5 mx-auto mb-1 text-primary" />Ambiental</div>
          <div className="rounded-xl border border-primary/30 bg-primary/10 p-2 text-primary"><BookOpen className="size-3.5 mx-auto mb-1 text-sky-400" />Aprendizaje</div>
          <div className="rounded-xl border border-primary/30 bg-primary/10 p-2 text-primary"><Code2 className="size-3.5 mx-auto mb-1 text-amber-400" />Tecnología</div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-2 text-white/80"><Users className="size-3.5 mx-auto mb-1 text-purple-400" />Comunidad</div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-2 text-white/80"><Briefcase className="size-3.5 mx-auto mb-1 text-emerald-400" />Trayectoria</div>
        </div>

        <div className="mt-5 space-y-2.5">
          {steps.map((step, idx) => (
            <div
              key={step.id}
              className={`flex items-start gap-3.5 rounded-2xl border p-3.5 transition-all duration-300 ${
                step.status === 'completed'
                  ? 'border-primary/40 bg-primary/[0.06]'
                  : step.status === 'running'
                  ? 'border-primary/70 bg-primary/10 shadow-[0_0_20px_rgba(184,255,61,0.15)] scale-[1.01]'
                  : 'border-white/8 bg-white/[0.02]'
              }`}
            >
              <div className="mt-0.5 shrink-0">
                {step.status === 'completed' ? (
                  <span className="grid size-6 place-items-center rounded-full bg-primary text-primary-foreground font-bold">
                    <Check className="size-3.5 stroke-[3]" />
                  </span>
                ) : step.status === 'running' ? (
                  <span className="grid size-6 place-items-center rounded-full border-2 border-primary border-t-transparent animate-spin text-primary" />
                ) : (
                  <span className="grid size-6 place-items-center rounded-full border border-white/20 text-[10px] font-mono text-white/40">
                    0{step.id}
                  </span>
                )}
              </div>

              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className={`text-xs font-bold ${step.status === 'completed' ? 'text-primary' : 'text-white'}`}>
                    {step.title}
                  </h3>
                  {step.pilarTag && (
                    <span className="rounded-full bg-primary/20 px-2 py-0.5 text-[9px] font-bold text-primary">
                      {step.pilarTag}
                    </span>
                  )}
                  {idx === 0 && (
                    <span className="flex items-center gap-1 text-[9px] text-white/60">
                      <Fingerprint className="size-3 text-primary" /> Passkey Active
                    </span>
                  )}
                  {idx === 4 && (
                    <span className="flex items-center gap-1 text-[9px] font-mono text-primary font-bold">
                      <Cpu className="size-3" /> Arbitrum Stylus (Rust)
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-[11px] text-white/50">{step.subtitle}</p>

                {step.status === 'completed' && idx === 4 && (
                  <div className="mt-2.5 rounded-xl border border-primary/20 bg-black/40 p-2.5 font-mono text-[11px] space-y-1">
                    <div className="flex items-center justify-between text-white/70">
                      <span>Merkle Root:</span>
                      <span className="text-primary font-bold">{step.merkleRoot?.slice(0, 18)}...</span>
                    </div>
                    <div className="flex items-center justify-between text-white/70">
                      <span>Tx Hash On-Chain:</span>
                      <button
                        onClick={handleCopyTx}
                        className="inline-flex items-center gap-1 text-primary hover:underline"
                      >
                        {step.txHash?.slice(0, 16)}... {copied ? <Check className="size-3 text-green-400" /> : <Copy className="size-3" />}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-white/10 pt-4">
          <button
            onClick={runFullHappyPath}
            disabled={isRunning}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-2.5 text-xs font-bold text-primary-foreground transition hover:brightness-110 disabled:opacity-50"
          >
            {isRunning ? (
              <>
                <span className="size-3.5 rounded-full border-2 border-primary-foreground border-t-transparent animate-spin" />
                Ejecutando Demo 60s...
              </>
            ) : steps[4].status === 'completed' ? (
              <>
                <Sparkles className="size-3.5" /> Re-ejecutar Demo ⚡
              </>
            ) : (
              <>
                <Sparkles className="size-3.5" /> Ejecutar Happy Path Demo (60s)
              </>
            )}
          </button>

          {steps[4].status === 'completed' && (
            <Link
              href="/talento/1"
              onClick={onClose}
              className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-5 py-2.5 text-xs font-bold text-primary transition hover:bg-primary/20"
            >
              Ver TalentPass Resultante <ArrowRight className="size-3.5" />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
