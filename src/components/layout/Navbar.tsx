'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Logo } from '../brand/Logo';
import { Plus, Cpu } from 'lucide-react';
import { StatusDot } from '../ui/Badges';

export function Navbar() {
  const pathname = usePathname();
  const [systemMode, setSystemMode] = useState<string | null>(null);
  const [aiEnabled, setAiEnabled] = useState(false);

  useEffect(() => {
    fetch('/api/system/status')
      .then((r) => r.json())
      .then((data) => {
        if (data.data?.ai?.configured) {
          setAiEnabled(true);
          setSystemMode(data.data.ai.model);
        } else {
          setAiEnabled(false);
          setSystemMode('Deterministic Mode');
        }
      })
      .catch(() => setSystemMode('Ready'));
  }, []);

  const navLinks = [
    { href: '/investigations', label: 'Investigations' },
    { href: '/investigations/new', label: 'New Diagnostic' },
    { href: '/settings', label: 'Configuration' },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/95 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-7 min-w-0">
          <Link href="/" className="hover:opacity-80 transition-opacity duration-150 shrink-0">
            <Logo size="md" />
          </Link>

          <nav className="hidden md:flex items-center gap-0.5 text-sm font-medium">
            {navLinks.map(({ href, label }) => {
              const active =
                href === '/investigations'
                  ? pathname === '/investigations'
                  : pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={`
                    relative px-3 py-1.5 rounded-md text-sm transition-all duration-150
                    ${active
                      ? 'text-foreground bg-surface-elevated border border-border'
                      : 'text-foreground-secondary hover:text-foreground hover:bg-surface-hover'
                    }
                  `}
                >
                  {label}
                  {active && (
                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3 h-0.5 rounded-full bg-brand" />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* System mode indicator */}
          <div className="hidden sm:flex items-center gap-2 px-2.5 py-1.5 rounded-md border border-border bg-surface text-[11px] font-mono text-foreground-secondary">
            {systemMode !== null ? (
              <>
                <StatusDot status={aiEnabled ? 'active' : 'warning'} />
                <Cpu className="w-3.5 h-3.5 text-foreground-muted" />
                <span className="truncate max-w-[160px]">{systemMode}</span>
              </>
            ) : (
              <span className="w-20 h-3 fm-skeleton" />
            )}
          </div>

          {/* New Investigation CTA */}
          <Link
            href="/investigations/new"
            className="group inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-brand text-background hover:bg-brand-light font-semibold text-xs transition-all duration-150 shadow-sm shadow-brand/20 active:scale-[0.97]"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5] transition-transform duration-150 group-hover:rotate-90" />
            <span>New</span>
            <span className="hidden sm:inline">Investigation</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
