
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, Plus, X } from 'lucide-react';
import { Logo } from '../brand/Logo';

export function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { href: '/investigations', label: 'Dashboard' },
    { href: '/settings', label: 'Settings' },
  ];

  const isActive = (href: string) => {
    if (href === '/investigations') {
      return pathname === href;
    }

    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <Link
          href="/"
          onClick={closeMobileMenu}
          aria-label="ForgeMind home"
          className="shrink-0 transition-opacity duration-150 hover:opacity-80"
        >
          <Logo size="md" theme="light" />
        </Link>

        {/* Desktop navigation */}
        <nav
          aria-label="Main navigation"
          className="hidden items-center gap-1 md:flex"
        >
          {navLinks.map(({ href, label }) => {
            const active = isActive(href);

            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? 'page' : undefined}
                className={`relative rounded-md border px-3 py-2 text-sm font-medium transition-colors duration-150 ${
                  active
                    ? 'border-border bg-surface-elevated text-foreground'
                    : 'border-transparent text-foreground-secondary hover:bg-surface-hover hover:text-foreground'
                }`}
              >
                {label}
                {active && (
                  <span className="absolute bottom-0 left-1/2 h-0.5 w-4 -translate-x-1/2 rounded-full bg-brand" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Primary action and mobile menu */}
        <div className="flex shrink-0 items-center gap-2">
          <Link
            href="/investigations/new"
            onClick={closeMobileMenu}
            className="group inline-flex items-center justify-center gap-1.5 rounded-md bg-brand px-3 py-2.5 text-xs font-semibold text-background shadow-sm shadow-brand/15 transition-all duration-150 hover:-translate-y-0.5 hover:bg-brand-light active:translate-y-0 sm:px-4 sm:text-sm"
          >
            <Plus className="h-4 w-4 shrink-0 transition-transform duration-150 group-hover:rotate-90" />
            <span className="sm:hidden">New</span>
            <span className="hidden sm:inline">New diagnostic</span>
          </Link>

          <button
            type="button"
            aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-navigation"
            onClick={() => setMobileMenuOpen((open) => !open)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-border text-foreground-secondary transition-colors hover:bg-surface-hover hover:text-foreground md:hidden"
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile navigation */}
      {mobileMenuOpen && (
        <nav
          id="mobile-navigation"
          aria-label="Mobile navigation"
          className="border-t border-border bg-background px-4 py-3 sm:px-6 md:hidden"
        >
          <div className="mx-auto flex max-w-7xl flex-col gap-1">
            {navLinks.map(({ href, label }) => {
              const active = isActive(href);

              return (
                <Link
                  key={href}
                  href={href}
                  onClick={closeMobileMenu}
                  aria-current={active ? 'page' : undefined}
                  className={`rounded-md px-3 py-3 text-sm font-medium transition-colors ${
                    active
                      ? 'bg-surface-elevated text-foreground'
                      : 'text-foreground-secondary hover:bg-surface-hover hover:text-foreground'
                  }`}
                >
                  {label}
                </Link>
              );
            })}
          </div>
        </nav>
      )}
    </header>
  );
}
