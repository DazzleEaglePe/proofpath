import Link from 'next/link';
import { cn } from '@/lib/utils';

export function Brand({ compact = false, className }: { compact?: boolean; className?: string }) {
  return (
    <Link
      href="/"
      aria-label="Ir al inicio de ProofPath"
      className={cn('inline-flex items-center gap-2.5 text-white', className)}
    >
      <span className="relative grid size-8 place-items-center" aria-hidden="true">
        <span className="absolute h-7 w-2 rotate-45 rounded-full bg-primary" />
        <span className="absolute h-7 w-2 -rotate-45 rounded-full border border-white/70 bg-background" />
      </span>
      {!compact && <span className="text-[17px] font-semibold tracking-[-0.03em]">ProofPath</span>}
    </Link>
  );
}

export function NetworkPill({ className }: { className?: string }) {
  return (

  <div/>
    // <span
    //   className={cn(
    //     'inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-medium text-white/70',
    //     className,
    //   )}
    // >
    //   <span className="size-1.5 rounded-full bg-primary shadow-[0_0_10px_#b8ff3d]" />
    //   Arbitrum Sepolia
    // </span>
  );
}
