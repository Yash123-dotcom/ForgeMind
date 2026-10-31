
import { SignIn } from '@clerk/nextjs';
import Link from 'next/link';

export default function SignInPage() {
  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center px-4 py-12"
      style={{
        background: 'var(--background)',
        color: 'var(--foreground)',
      }}
    >
      <Link
        href="/"
        className="mb-8 text-2xl font-semibold tracking-tight"
        style={{ color: 'var(--foreground)' }}
      >
        ForgeMind
      </Link>

      <div className="w-full max-w-md">
        <SignIn
          routing="hash"
          appearance={{
            variables: {
              colorPrimary: 'var(--brand)',
              colorBackground: 'var(--surface)',
              colorText: 'var(--foreground)',
              colorTextSecondary: 'var(--foreground-secondary)',
              colorInputBackground: 'var(--surface)',
              colorInputText: 'var(--foreground)',
              colorNeutral: 'var(--foreground)',
              fontFamily: 'var(--font-sans), Inter, sans-serif',
              borderRadius: '8px',
            },
            elements: {
              rootBox: 'w-full',
              cardBox: 'w-full shadow-none',
              card: 'w-full border rounded-xl',
              headerTitle: 'tracking-tight font-semibold',
              headerSubtitle: 'text-sm',
              formFieldLabel: 'font-medium',
              formFieldInput: 'fm-input',
              formButtonPrimary: 'font-semibold shadow-none',
              footerActionLink: 'font-medium',
              dividerLine: 'opacity-60',
              dividerText: 'text-sm',
            },
          }}
        />
      </div>

      <p
        className="mt-8 text-xs text-center"
        style={{ color: 'var(--foreground-muted)' }}
      >
        Built for developers who want their Unity projects to just work.
      </p>
    </main>
  );
}
