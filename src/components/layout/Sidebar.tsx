'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { History, SearchCode, Sliders, ShieldAlert, CheckCircle2 } from 'lucide-react';

const NAV_ITEMS = [
  { label: 'All Investigations', href: '/investigations', icon: History, exact: true },
  { label: 'New Diagnostic', href: '/investigations/new', icon: SearchCode, exact: false },
  { label: 'Configuration', href: '/settings', icon: Sliders, exact: false },
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
    <aside className="w-60 border-r border-border bg-surface shrink-0 hidden lg:flex flex-col justify-between py-5 px-3 min-h-[calc(100vh-3.5rem)]">
      <div className="space-y-7">
        {/* Navigation */}
        <div>
          <p className="text-[10px] font-mono uppercase tracking-widest text-foreground-muted px-3 mb-2">
            Workspace
          </p>
          <nav className="space-y-0.5">
            {NAV_ITEMS.map(({ label, href, icon: Icon, exact }) => {
              const active = exact ? pathname === href : pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={`
                    fm-nav-item flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-all duration-150
                    ${active
                      ? 'active bg-surface-elevated text-foreground border border-border font-medium'
                      : 'text-foreground-secondary hover:text-foreground hover:bg-surface-hover'
                    }
                  `}
                >
                  <Icon
                    className={`w-4 h-4 shrink-0 transition-colors duration-150 ${
                      active ? 'text-brand' : 'text-foreground-muted'
                    }`}
                  />
                  <span>{label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Diagnostic capabilities */}
        <div className="px-3 py-3.5 rounded-lg border border-border bg-background/60 space-y-2.5">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-foreground">
            <CheckCircle2 className="w-3.5 h-3.5 text-brand shrink-0" />
            Unity Rules Engine
          </div>
          <ul className="space-y-1.5 text-[11px] text-foreground-secondary">
            {CAPABILITIES.map((cap) => (
              <li key={cap} className="flex items-start gap-1.5">
                <span className="w-1 h-1 rounded-full bg-brand/60 shrink-0 mt-1.5" />
                <span>{cap}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Safety notice */}
      <div className="px-3 py-3 rounded-lg border border-border bg-surface-muted text-[11px] text-foreground-muted space-y-1.5">
        <div className="flex items-center gap-1.5 font-semibold text-foreground-secondary">
          <ShieldAlert className="w-3 h-3 text-brand" />
          Local Safe Execution
        </div>
        <p className="leading-relaxed">
          Code and logs are processed in-memory. ForgeMind never executes uploaded scripts or
          modifies your Unity project.
        </p>
      </div>
    </aside>
  );
}
