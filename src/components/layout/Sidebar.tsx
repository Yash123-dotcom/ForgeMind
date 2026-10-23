
'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  History,
  SearchCode,
  Sliders,
  ShieldAlert,
  CheckCircle2,
} from 'lucide-react';

const NAV_ITEMS = [
  {
    label: 'All Investigations',
    href: '/investigations',
    icon: History,
    exact: true,
  },
  {
    label: 'New Diagnostic',
    href: '/investigations/new',
    icon: SearchCode,
    exact: false,
  },
  {
    label: 'Configuration',
    href: '/settings',
    icon: Sliders,
    exact: false,
  },
];

const CAPABILITIES = [
  'URP / HDRP shader pass inspector',
  'C# assembly & namespace resolver',
  'NullReference stack trace locator',
  'manifest.json dependency audit',
  'MonoBehaviour filename validator',
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-60 shrink-0 flex-col justify-between border-r border-border bg-surface px-3 py-5 min-h-[calc(100vh-3.5rem)] hidden lg:flex">
      <div className="space-y-7">
        {/* Navigation */}
        <div>
          <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-foreground-muted">
            Workspace
          </p>

          <nav className="space-y-1">
            {NAV_ITEMS.map(({ label, href, icon: Icon, exact }) => {
              const active = exact
                ? pathname === href
                : pathname.startsWith(href);

              return (
                <Link
                  key={href}
                  href={href}
                  aria-current={active ? 'page' : undefined}
                  className={`
                    fm-nav-item flex items-center gap-2.5 rounded-md
                    border px-3 py-2.5 text-[13px] leading-5
                    transition-all duration-150
                    ${
                      active
                        ? 'active border-border bg-surface-elevated font-semibold text-foreground'
                        : 'border-transparent text-foreground-secondary hover:bg-surface-hover hover:text-foreground'
                    }
                  `}
                >
                  <Icon
                    aria-hidden="true"
                    className={`h-4 w-4 shrink-0 transition-colors duration-150 ${
                      active
                        ? 'text-brand'
                        : 'text-foreground-muted'
                    }`}
                  />

                  <span>{label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Diagnostic capabilities */}
        <div className="space-y-3 rounded-lg border border-border bg-background/60 px-3 py-3.5">
          <div className="flex items-center gap-2 text-xs font-semibold tracking-tight text-foreground">
            <CheckCircle2
              aria-hidden="true"
              className="h-3.5 w-3.5 shrink-0 text-brand"
            />
            <span>Unity Rules Engine</span>
          </div>

          <ul className="space-y-2 text-[11px] leading-[1.6] text-foreground-secondary">
            {CAPABILITIES.map((cap) => (
              <li key={cap} className="flex items-start gap-2">
                <span className="mt-[6px] h-1 w-1 shrink-0 rounded-full bg-brand/60" />
                <span>{cap}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Safety notice */}
      <div className="space-y-2 rounded-lg border border-border bg-surface-muted px-3 py-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-foreground-secondary">
          <ShieldAlert
            aria-hidden="true"
            className="h-3.5 w-3.5 shrink-0 text-brand"
          />
          <span>Local Safe Execution</span>
        </div>

        <p className="text-[11px] leading-[1.65] text-foreground-muted">
          Code and logs are processed in-memory. ForgeMind never executes
          uploaded scripts or modifies your Unity project.
        </p>
      </div>
    </aside>
  );
}
