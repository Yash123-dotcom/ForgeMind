
import Link from 'next/link';
import type { ReactNode } from 'react';
import { ArrowLeft, ArrowUpRight, ShieldCheck } from 'lucide-react';

type LegalPageLayoutProps = {
  eyebrow: string;
  title: string;
  description: string;
  updated: string;
  children: ReactNode;
};

export function LegalPageLayout({
  eyebrow,
  title,
  description,
  updated,
  children,
}: LegalPageLayoutProps) {
  return (
    <main className="min-h-screen bg-[#f7f8f4] text-[#171914]">
      <header className="sticky top-0 z-30 border-b border-[#171914]/10 bg-[#f7f8f4]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-5 sm:px-8">
          <Link
            href="/"
            aria-label="ForgeMind home"
            className="flex items-center gap-3"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#171914] text-[#b9ff66]">
              <ShieldCheck size={19} />
            </span>
            <span className="text-lg font-semibold tracking-[-0.05em]">
              Forge<span className="font-normal">Mind</span>
            </span>
          </Link>

          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full border border-[#171914]/15 px-4 py-2 text-sm font-medium transition hover:bg-white"
          >
            <ArrowLeft size={15} />
            Back to home
          </Link>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-12 px-5 py-12 sm:px-8 sm:py-16 lg:grid-cols-[minmax(0,1fr)_260px] lg:gap-20 lg:py-20">
        <article className="min-w-0">
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-[#171914]/10 bg-white/70 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.13em] text-[#50554a]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#79b83e]" />
            {eyebrow}
          </div>

          <h1 className="max-w-4xl text-4xl font-semibold leading-[1.05] tracking-[-0.065em] sm:text-6xl">
            {title}
          </h1>

          <p className="mt-6 max-w-3xl text-lg leading-8 text-[#55594f]">
            {description}
          </p>

          <p className="mt-5 text-xs font-medium uppercase tracking-[0.12em] text-[#777b70]">
            Last updated: {updated}
          </p>

          <div className="mt-12 max-w-3xl space-y-10 border-t border-[#171914]/10 pt-10 sm:mt-16 sm:pt-12">
            {children}
          </div>
        </article>

        <aside className="order-first h-fit rounded-2xl border border-[#171914]/10 bg-white/70 p-5 lg:order-last lg:sticky lg:top-28">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#777b70]">
            Legal information
          </p>

          <p className="mt-3 text-sm leading-6 text-[#55594f]">
            Understand how ForgeMind handles diagnostic information and the
            software used to build the product.
          </p>

          <div className="mt-5 flex flex-col gap-3 text-sm">
            <Link href="/privacy" className="font-medium hover:underline">
              Privacy policy <ArrowUpRight className="ml-1 inline" size={13} />
            </Link>
            <Link href="/licenses" className="font-medium hover:underline">
              Licenses <ArrowUpRight className="ml-1 inline" size={13} />
            </Link>
          </div>

          <div className="mt-6 rounded-xl bg-[#b9ff66]/35 p-4 text-xs leading-5 text-[#414638]">
            ForgeMind provides diagnostic guidance. You remain in control of
            your Unity project and should verify suggested changes yourself.
          </div>
        </aside>
      </div>

      <footer className="border-t border-[#171914]/10">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-7 text-sm text-[#686d62] sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <span>
            © {new Date().getFullYear()} ForgeMind. Third-party software
            remains subject to its own license.
          </span>

          <div className="flex gap-5">
            <Link href="/privacy" className="hover:text-[#171914]">
              Privacy
            </Link>
            <Link href="/licenses" className="hover:text-[#171914]">
              Licenses
            </Link>
            <Link href="/" className="hover:text-[#171914]">
              Home
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}

export function LegalSection({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-28">
      <h2 className="text-2xl font-semibold tracking-[-0.04em] sm:text-3xl">
        {title}
      </h2>

      <div className="mt-4 space-y-4 text-[15px] leading-7 text-[#55594f] [&_a]:font-medium [&_a]:text-[#171914] [&_a]:underline [&_a]:decoration-[#171914]/30 [&_a]:underline-offset-4 [&_li]:pl-1 [&_strong]:font-semibold [&_strong]:text-[#252920]">
        {children}
      </div>
    </section>
  );
}
