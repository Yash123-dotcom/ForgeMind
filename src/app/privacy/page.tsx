
import type { Metadata } from 'next';
import { LegalPageLayout, LegalSection } from '@/components/legal/LegalPageLayout';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description:
    'Learn what diagnostic information ForgeMind processes, how it may be stored, and how third-party AI services are involved.',
  robots: { index: true, follow: true },
};

const UPDATED = 'October 23, 2026';

export default function PrivacyPage() {
  return (
    <LegalPageLayout
      eyebrow="Privacy"
      title="Your code is yours. Understand what happens to it."
      description="This policy explains how ForgeMind processes information when you visit the website or use its Unity diagnostic features."
      updated={UPDATED}
    >
      <LegalSection id="overview" title="01. Overview">
        <p>
          ForgeMind is a diagnostic tool for Unity developers. It can help
          investigate errors using console messages, stack traces, code
          snippets, project settings and other context you choose to provide.
        </p>
        <p>
          This policy describes the information the service may process.
          Actual processing depends on which features are enabled, how the
          deployment is configured and which third-party services are used.
        </p>
      </LegalSection>

      <LegalSection id="information" title="02. Information you provide">
        <p>Depending on the features you use, information may include:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong>Diagnostic inputs:</strong> Unity Console errors, stack
            traces, investigation titles and relevant messages.
          </li>
          <li>
            <strong>Code and files:</strong> code snippets and supported
            attachments that you intentionally provide for analysis.
          </li>
          <li>
            <strong>Project context:</strong> Unity version, render pipeline,
            target platform and other diagnostic settings you submit.
          </li>
          <li>
            <strong>Investigation records:</strong> generated findings,
            suggested next steps, report content and feedback associated with
            an investigation.
          </li>
          <li>
            <strong>Technical information:</strong> information that may be
            processed by the hosting provider or infrastructure to deliver,
            secure and troubleshoot the service.
          </li>
        </ul>
        <p>
          Do not submit passwords, API keys, access tokens, private signing
          keys, personal information belonging to others or confidential
          source code unless you are authorised to share it and understand
          the processing involved.
        </p>
      </LegalSection>

      <LegalSection id="use" title="03. How information is used">
        <p>Information may be used to:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>Run diagnostic rules and analyse submitted error context.</li>
          <li>Generate findings, hypotheses and troubleshooting guidance.</li>
          <li>Save and retrieve investigation records when that feature is enabled.</li>
          <li>Maintain the service, investigate failures and protect its security.</li>
          <li>Respond to support, privacy or other service-related requests.</li>
        </ul>
        <p>
          ForgeMind is intended to assist your debugging workflow. Its
          findings may be incomplete or incorrect and should not be treated
          as a substitute for reviewing your project and testing changes.
        </p>
      </LegalSection>

      <LegalSection id="ai" title="04. AI processing and third parties">
        <p>
          When AI-powered diagnosis is enabled, relevant information from
          your submission may be sent to the AI provider configured for the
          deployment. The current code supports a configurable provider
          endpoint, API key and model; the default endpoint is the OpenAI API.
        </p>
        <p>
          Depending on the request and feature, this may include your error
          message, code snippet, project context, supported attachment
          contents and results from deterministic checks.
        </p>
        <p>
          The configured AI provider processes that information under its
          own applicable terms and privacy policies. Its retention, security
          and data-use practices depend on the provider, account and settings
          in use. Review those terms before submitting sensitive material.
        </p>
        <p>
          ForgeMind may also rely on hosting, database and infrastructure
          providers. The deployment can use Neon when a database connection
          is configured, or a local JSON data store in supported
          self-hosted configurations.
        </p>
      </LegalSection>

      <LegalSection id="storage" title="05. Storage and retention">
        <p>
          Investigation records may contain submitted diagnostic information
          and generated reports. When persistence is enabled, records may be
          saved in the database or storage configured for the deployment.
        </p>
        <p>
          The exact storage location, retention period, backups and deletion
          process depend on the active deployment and its providers. This
          page does not promise a fixed deletion schedule or immediate
          removal from backups and third-party systems.
        </p>
        <p>
          If you self-host ForgeMind, you are responsible for configuring
          access controls, storage security, backups and deletion practices
          for your installation.
        </p>
      </LegalSection>

      <LegalSection id="security" title="06. Security">
        <p>
          Reasonable technical and organisational safeguards should be used
          to protect information processed by the service. However, no
          website, transmission method or storage system can be guaranteed
          completely secure.
        </p>
        <p>
          You are responsible for reviewing submitted files and removing
          secrets or unrelated sensitive content before sending diagnostic
          material.
        </p>
      </LegalSection>

      <LegalSection id="rights" title="07. Your choices and rights">
        <p>
          Depending on your location and applicable law, you may have rights
          to request access to, correction of, deletion of or information
          about the processing of your personal data.
        </p>
        <p>
          To make a privacy request, contact the ForgeMind operator through
          an official contact channel published by the service. Do not post
          private data or sensitive diagnostic content in public issue
          trackers.
        </p>
        <p>
          Before using ForgeMind for production or confidential workloads,
          confirm that a monitored privacy contact and a workable request
          process have been published.
        </p>
      </LegalSection>

      <LegalSection id="children" title="08. Children">
        <p>
          ForgeMind is a developer tool and is not designed to solicit
          personal information from children. If you believe a child has
          provided personal information to the service, contact the operator
          through an official contact channel.
        </p>
      </LegalSection>

      <LegalSection id="changes" title="09. Changes to this policy">
        <p>
          This policy may be updated as ForgeMind's features, infrastructure
          or legal obligations change. The date at the top indicates the
          latest stated revision. Material changes should be reflected here
          before the updated practices are relied upon.
        </p>
      </LegalSection>

      <LegalSection id="contact" title="10. Contact">
        <p>
          A dedicated privacy email address has not yet been configured in
          this page. Publish a monitored contact address and update this
          section before inviting users to submit personal or confidential
          information.
        </p>
      </LegalSection>

      <p className="border-t border-[#171914]/10 pt-6 text-xs leading-6 text-[#777b70]">
        This page is a product-policy draft, not legal advice. Review it
        against the live deployment, the providers actually enabled and the
        laws applicable to the operator and users before relying on it as a
        final legal policy.
      </p>
    </LegalPageLayout>
  );
}
