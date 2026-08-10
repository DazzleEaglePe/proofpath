'use client';

import { cn } from '@/lib/utils';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

interface HashDiffViewerProps {
  computedHash: string;
  anchoredHash: string;
  className?: string;
}

export function HashDiffViewer({ computedHash, anchoredHash, className }: HashDiffViewerProps) {
  const isMatch = computedHash.toLowerCase() === anchoredHash.toLowerCase();

  const maxLen = Math.max(computedHash.length, anchoredHash.length);
  const computedChars = computedHash.split('');
  const anchoredChars = anchoredHash.split('');

  const mismatchesCount = Array.from({ length: maxLen }).reduce<number>((acc, _, i) => {
    const c1 = computedChars[i]?.toLowerCase();
    const c2 = anchoredChars[i]?.toLowerCase();
    return c1 !== c2 ? acc + 1 : acc;
  }, 0);

  return (
    <div
      className={cn(
        'space-y-4 rounded-2xl border p-4 font-mono text-xs',
        isMatch ? 'border-white/8 bg-black/20' : 'border-destructive/30 bg-destructive/5',
        className,
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-2 font-sans text-xs font-semibold">
        <div className="flex items-center gap-2">
          {isMatch ? (
            <CheckCircle2 className="size-4 text-primary" />
          ) : (
            <AlertCircle className="size-4 text-destructive" />
          )}
          <span>
            {isMatch ? 'Hashes coincidentes' : 'Diferencia detectada en el contenido'}
          </span>
        </div>
        {!isMatch && (
          <span className="rounded-full bg-destructive/10 px-2.5 py-1 text-[9px] font-bold text-destructive">
            {mismatchesCount} {mismatchesCount === 1 ? 'carácter alterado' : 'caracteres alterados'}
          </span>
        )}
      </div>

      {/* Hash local recomputado */}
      <div className="space-y-1">
        <div className="flex justify-between font-sans text-[11px] text-muted-foreground">
          <span>Hash recomputado localmente (JSON)</span>
          {!isMatch && <span className="text-destructive font-medium">Contenido modificado</span>}
        </div>
        <div className="break-all rounded-xl border border-white/7 bg-white/[.025] p-3 text-[10px] leading-relaxed">
          {computedChars.map((char, index) => {
            const matches = char.toLowerCase() === anchoredChars[index]?.toLowerCase();
            return (
              <span
                key={`c-${index}-${char}`}
                className={cn(
                  matches
                    ? 'text-foreground'
                    : 'bg-destructive text-destructive-foreground font-bold px-0.5 rounded',
                )}
              >
                {char}
              </span>
            );
          })}
        </div>
      </div>

      {/* Hash anclado en la cadena */}
      <div className="space-y-1">
        <div className="flex justify-between font-sans text-[11px] text-muted-foreground">
          <span>Hash anclado inmutable en Arbitrum</span>
          <span className="font-medium text-primary">On-chain</span>
        </div>
        <div className="break-all rounded-xl border border-white/7 bg-white/[.025] p-3 text-[10px] leading-relaxed text-white/38">
          {anchoredChars.map((char, index) => {
            const matches = char.toLowerCase() === computedChars[index]?.toLowerCase();
            return (
              <span
                key={`a-${index}-${char}`}
                className={cn(matches ? 'text-white/70' : 'font-medium text-primary underline')}
              >
                {char}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}
