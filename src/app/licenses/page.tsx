
import type { Metadata } from 'next';
import { ExternalLink } from 'lucide-react';
import { LegalPageLayout, LegalSection } from '@/components/legal/LegalPageLayout';

export const metadata: Metadata = {
  title: 'Software Licenses',
  description:
    'Third-party software acknowledgements and licensing information for ForgeMind.',
  robots: { index: true, follow: true },
};

const UPDATED = 'October 23, 2026';

const dependencies = [
  {
    name: 'Next.js',
    license: 'MIT',
    url: 'https://github.com/vercel/next.js/blob/canary/license.md',
    purpose: 'Web framework and application routing',
  },
  {
    name: 'React',
    license: 'MIT',
    url: 'https://github.com/facebook/react/blob/main/LICENSE',
    purpose: 'User interface library',
  },
  {
    name: 'Tailwind CSS',
    license: 'MIT',
    url: 'https://github.com/tailwindlabs/tailwindcss/blob/master/LICENSE',
    purpose: 'Utility-first styling framework',
  },
  {
    name: 'Lucide',
    license: 'ISC',
    url: 'https://github.com/lucide-icons/lucide/blob/main/LICENSE',
    purpose: 'Icons and interface symbols',
  },
  {
    name: 'Neon Serverless Driver',
    license: 'MIT',
    url: 'https://github.com/neondatabase/serverless',
    purpose: 'Database connectivity when configured',
  },
  {
    name: 'clsx',
    license: 'MIT',
    url: 'https://github.com/lukeed/clsx/blob/master/license',
    purpose: 'Conditional class-name construction',
  },
  {
    name: 'tailwind-merge',
    license: 'MIT',
    url: 'https://github.com/dcastil/tailwind-merge/blob/main/LICENSE.md',
    purpose: 'Tailwind class conflict resolution',
  },
  {
    name: 'Zod',
    license: 'MIT',
    url: 'https://github.com/colinhacks/zod/blob/main/LICENSE',
    purpose: 'Runtime input and data validation',
  },
  {
    name: 'TypeScript',
    license: 'Apache-2.0',
    url: 'https://github.com/microsoft/TypeScript/blob/main/LICENSE.txt',
    purpose: 'Type checking and developer tooling',
  },
];

export default function LicensesPage() {
  return (
    <LegalPageLayout
      eyebrow="Software notices"
      title="Built with tools worth acknowledging."
      description="ForgeMind relies on open-source software and third-party tools. This page identifies key direct dependencies and points to their license information."
      updated={UPDATED}
    >
      <LegalSection id="overview" title="01. Overview">
        <p>
          ForgeMind uses third-party libraries and tools to provide its
          interface, application framework, validation and infrastructure
          integrations. Those components remain subject to their respective
          licenses and copyright notices.
        </p>
        <p>
          The list below is based on direct dependencies declared in the
          project manifest. It is not a complete inventory of every
          transitive dependency, bundled asset or service used by every
          deployment.
        </p>
      </LegalSection>

      <LegalSection id="dependencies" title="02. Third-party dependencies">
        <div className="overflow-x-auto rounded-xl border border-[#171914]/10 bg-white">
          <table className="w-full min-w-[560px] border-collapse text-left text-sm">
            <thead className="bg-[#171914]/[0.035]">
              <tr>
                <th className="px-4 py-3 font-semibold text-[#252920]">Package</th>
                <th className="px-4 py-3 font-semibold text-[#252920]">License</th>
                <th className="px-4 py-3 font-semibold text-[#252920]">Role</th>
                <th className="px-4 py-3 font-semibold text-[#252920]">Notice</th>
              </tr>
            </thead>
            <tbody>
              {dependencies.map((dependency) => (
                <tr
                  key={dependency.name}
                  className="border-t border-[#171914]/10 align-top"
                >
                  <td className="px-4 py-3 font-medium text-[#252920]">
                    {dependency.name}
                  </td>
                  <td className="px-4 py-3">{dependency.license}</td>
                  <td className="px-4 py-3">{dependency.purpose}</td>
                  <td className="px-4 py-3">
                    <a
                      href={dependency.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 font-medium text-[#252920] underline decoration-[#171914]/30 underline-offset-4 hover:decoration-[#171914]"
                    >
                      View <ExternalLink size={13} />
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs leading-6 text-[#777b70]">
          License labels are provided as a convenience. Verify the exact
          license and required notices against the package version in the
          installed lockfile before distributing a release.
        </p>
      </LegalSection>

      <LegalSection id="obligations" title="03. License obligations">
        <p>
          Permissive licenses such as MIT and ISC generally allow broad use,
          modification and redistribution subject to their terms, which
          commonly include preserving applicable copyright and permission
          notices. Apache-2.0 has its own conditions, including notice and
          patent-related provisions.
        </p>
        <p>
          The license text supplied with each package is authoritative.
          Where a package bundles other software, fonts, icons or assets,
          additional notices or terms may apply.
        </p>
      </LegalSection>

      <LegalSection id="forgemind" title="04. ForgeMind ownership">
        <p>
          Unless a separate license or written permission says otherwise,
          this page does not grant a license to ForgeMind's own branding,
          product content or original source code. Third-party components
          retain their own licensing terms.
        </p>
        <p>
          The presence of open-source dependencies does not mean the entire
          ForgeMind product is open source, nor does it remove the obligations
          attached to those dependencies.
        </p>
      </LegalSection>

      <LegalSection id="ai-services" title="05. External services">
        <p>
          Depending on the deployment configuration, ForgeMind may connect
          to external AI or database services. Those services are governed
          by their own terms, service agreements and policies; they are not
          covered by the licenses listed for the frontend dependencies above.
        </p>
      </LegalSection>

      <LegalSection id="updates" title="06. Updates and requests">
        <p>
          Dependencies can change as the application evolves. This page
          should be reviewed whenever the project manifest or lockfile is
          updated, and before distributing a build that includes new
          third-party components.
        </p>
        <p>
          For licensing questions, use an official contact channel published
          by the ForgeMind operator. Do not assume that a package's license
          applies to ForgeMind's own code or brand.
        </p>
      </LegalSection>

      <p className="border-t border-[#171914]/10 pt-6 text-xs leading-6 text-[#777b70]">
        This page is an informational summary, not a substitute for the
        complete license texts, copyright notices or legal review required
        for a specific distribution.
      </p>
    </LegalPageLayout>
  );
}
