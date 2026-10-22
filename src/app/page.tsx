import Link from "next/link";
import {
  ArrowDownRight,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronDown,
  Code2,
  FileCode2,
  GitBranch,
  Layers3,
  LockKeyhole,
  ScanSearch,
  ShieldCheck,
  Sparkles,
  Terminal,
  Workflow,
} from "lucide-react";

const features = [
  {
    number: "01",
    title: "Trace the actual cause",
    italic: "Not just the symptom.",
    description:
      "Bring together console errors, stack traces, code snippets, and project context to investigate what may be breaking your Unity project.",
    icon: ScanSearch,
    tone: "lime",
    tag: "ROOT-CAUSE ANALYSIS",
  },
  {
    number: "02",
    title: "Catch pipeline conflicts",
    italic: "Before another guess.",
    description:
      "Check common compatibility issues across render pipelines, package dependencies, namespaces, and shader setup.",
    icon: Layers3,
    tone: "white",
    tag: "PROJECT CONTEXT",
  },
  {
    number: "03",
    title: "Know what to try next",
    italic: "With evidence to follow.",
    description:
      "Get a structured investigation with likely causes, supporting evidence, suggested next steps, and checks to verify a fix.",
    icon: Workflow,
    tone: "dark",
    tag: "TRACEABLE FINDINGS",
  },
  {
    number: "04",
    title: "Stay in control",
    italic: "You review every change.",
    description:
      "ForgeMind provides diagnostic guidance. You stay in your Unity project, review suggestions, and decide what to apply.",
    icon: ShieldCheck,
    tone: "white",
    tag: "DEVELOPER-IN-CONTROL",
  },
];

const steps = [
  {
    number: "01",
    title: "Bring the error",
    description:
      "Paste the Unity Console message, stack trace, and relevant code. Add your Unity version and render pipeline for better context.",
  },
  {
    number: "02",
    title: "Investigate with context",
    description:
      "Deterministic checks and available context help narrow down likely causes instead of treating every error as an isolated message.",
  },
  {
    number: "03",
    title: "Review the findings",
    description:
      "Read the evidence, inspect suggested changes, and follow verification steps in the Unity Editor before deciding whether a fix works.",
  },
];

function BrandMark() {
  return (
    <Link href="/" className="fm-brand" aria-label="ForgeMind home">
      <span className="fm-brand-symbol" aria-hidden="true">
        <span />
        <span />
        <span />
      </span>
      <span>
        Forge<span className="fm-brand-light">Mind</span>
      </span>
    </Link>
  );
}

function MarketingNav() {
  return (
    <header className="fm-site-header">
      <div className="fm-container fm-nav-inner">
        <BrandMark />
        <nav className="fm-nav-links" aria-label="Main navigation">
          <a href="#product">Product</a>
          <a href="#how-it-works">How it works</a>
          <a href="#safety">Safety</a>
        </nav>
        <Link
          href="/investigations/new"
          className="fm-button fm-button-dark fm-nav-cta"
        >
          Start debugging <ArrowRight size={16} />
        </Link>
      </div>
    </header>
  );
}

function HeroIllustration() {
  return (
    <div
      className="fm-hero-art"
      aria-label="Illustration of a Unity error being investigated"
    >
      <div className="fm-art-orbit fm-art-orbit-a" />
      <div className="fm-art-orbit fm-art-orbit-b" />
      <div className="fm-art-cross fm-art-cross-a">+</div>
      <div className="fm-art-cross fm-art-cross-b">+</div>
      <div className="fm-art-label fm-art-label-top">
        <span className="fm-label-dot" /> INVESTIGATION IN PROGRESS
      </div>
      <div className="fm-art-error-card">
        <div className="fm-art-card-top">
          <span className="fm-art-file-icon">
            <FileCode2 size={17} />
          </span>
          <span>Console / Error</span>
          <span className="fm-art-error-pill">ERROR</span>
        </div>
        <div className="fm-art-code-line">
          <span>CS</span> shader pass not supported
        </div>
        <div className="fm-art-code-sub">Assets/Shaders/Water.shader:42</div>
        <div className="fm-art-mini-code">
          <span>42</span>
          <code>Tags {"{"} &quot;LightMode&quot; =</code>
          <span>43</span>
          <code className="fm-art-code-highlight">
            &quot;UniversalForward&quot; {"}"}
          </code>
        </div>
      </div>
      <div className="fm-art-trace-line">
        <span />
        <span />
        <span />
      </div>
      <div className="fm-art-cause-card">
        <div className="fm-art-cause-head">
          <span className="fm-art-cause-icon">
            <CheckCircle2 size={18} />
          </span>
          <span>LIKELY ROOT CAUSE</span>
          <span className="fm-art-match">RULE MATCH</span>
        </div>
        <p>Render pipeline mismatch</p>
        <div className="fm-art-cause-foot">
          <GitBranch size={14} /> URP shader in Built-in project
        </div>
      </div>
      <div className="fm-art-stamp">
        <Sparkles size={15} /> FIND THE CONNECTION
      </div>
      <div className="fm-art-label fm-art-label-bottom">
        EXAMPLE DIAGNOSTIC · SYNTHETIC DATA
      </div>
    </div>
  );
}

function Hero() {
  return (
    <section className="fm-hero">
      <div className="fm-hero-grid-bg" aria-hidden="true" />
      <div className="fm-container fm-hero-layout">
        <div className="fm-hero-copy">
          <div className="fm-eyebrow">
            <span className="fm-eyebrow-icon">
              <Terminal size={14} />
            </span>{" "}
            UNITY DEBUGGING, WITH CONTEXT
          </div>
          <h1>
            Stop guessing.
            <br />
            <em>Start debugging.</em>
          </h1>
          <p className="fm-hero-description">
            Unity errors rarely tell the whole story. ForgeMind helps connect
            stack traces, code, and project context to find a clearer path to
            the cause.
          </p>
          <div className="fm-hero-actions">
            <Link
              href="/investigations/new"
              className="fm-button fm-button-lime"
            >
              Start an investigation <ArrowRight size={17} />
            </Link>
            <Link href="/investigations" className="fm-text-link">
              Explore dashboard <ArrowDownRight size={17} />
            </Link>
          </div>
          <div className="fm-hero-note">
            <span className="fm-note-check">
              <Check size={13} />
            </span>{" "}
            Structured checks <span className="fm-note-divider">/</span>{" "}
            <span className="fm-note-check">
              <Check size={13} />
            </span>{" "}
            Evidence-backed guidance <span className="fm-note-divider">/</span>{" "}
            You stay in control
          </div>
        </div>
        <HeroIllustration />
      </div>
      <div className="fm-container fm-hero-bottomline">
        <span>BUILT FOR THE REALITIES OF UNITY DEVELOPMENT</span>
        <span className="fm-bottomline-right">
          ERROR <i /> CONTEXT <i /> CAUSE <i /> NEXT STEP
        </span>
      </div>
    </section>
  );
}

function CapabilityStrip() {
  return (
    <section
      className="fm-capability-strip"
      aria-label="ForgeMind capabilities"
    >
      <div className="fm-container fm-capability-inner">
        <span className="fm-capability-intro">A clearer way through</span>
        <span>
          <Code2 size={17} /> Stack traces
        </span>
        <span>
          <Layers3 size={17} /> Pipeline conflicts
        </span>
        <span>
          <GitBranch size={17} /> Dependency context
        </span>
        <span>
          <ShieldCheck size={17} /> Verification steps
        </span>
      </div>
    </section>
  );
}

function SectionHeading({
  eyebrow,
  title,
  italic,
  description,
  dark = false,
}: {
  eyebrow: string;
  title: string;
  italic?: string;
  description: string;
  dark?: boolean;
}) {
  return (
    <div
      className={`fm-section-heading${dark ? " fm-section-heading-dark" : ""}`}
    >
      <div className="fm-section-title-group">
        <span className="fm-section-eyebrow">{eyebrow}</span>
        <h2>
          {title} {italic && <em>{italic}</em>}
        </h2>
      </div>
      <p>{description}</p>
    </div>
  );
}

function Features() {
  return (
    <section id="product" className="fm-section fm-features-section">
      <div className="fm-container">
        <SectionHeading
          eyebrow="WHAT FORGEMIND DOES"
          title="Debug with more"
          italic="direction."
          description="A focused investigation workflow for the messy, interconnected problems that show up in real Unity projects."
        />
        <div className="fm-feature-grid">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <article
                key={feature.number}
                className={`fm-feature-card fm-feature-${feature.tone}`}
              >
                <div className="fm-feature-card-top">
                  <span className="fm-feature-number">
                    {feature.number} / 04
                  </span>
                  <span className="fm-feature-icon">
                    <Icon size={21} strokeWidth={1.8} />
                  </span>
                </div>
                <div className="fm-feature-copy">
                  <h3>{feature.title}</h3>
                  <h4>
                    <em>{feature.italic}</em>
                  </h4>
                  <p>{feature.description}</p>
                </div>
                <div className="fm-feature-card-bottom">
                  <span>{feature.tag}</span>
                  <span className="fm-feature-arrow">
                    <ArrowDownRight size={18} />
                  </span>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function ProductPreview() {
  return (
    <section className="fm-product-section">
      <div className="fm-container fm-product-layout">
        <div className="fm-product-copy">
          <span className="fm-section-eyebrow">INSIDE AN INVESTIGATION</span>
          <h2>
            From a cryptic error to a <em>clear next step.</em>
          </h2>
          <p>
            Instead of a wall of generated text, review a structured report that
            separates the observed error, likely cause, and what still needs
            verification.
          </p>
          <ul className="fm-product-checklist">
            <li>
              <CheckCircle2 size={18} />{" "}
              <span>
                <strong>Evidence first</strong>
                <small>See which details support a finding.</small>
              </span>
            </li>
            <li>
              <CheckCircle2 size={18} />{" "}
              <span>
                <strong>Clear uncertainty</strong>
                <small>Distinguish likely causes from confirmed facts.</small>
              </span>
            </li>
            <li>
              <CheckCircle2 size={18} />{" "}
              <span>
                <strong>Practical next steps</strong>
                <small>Know what to inspect in the Unity Editor.</small>
              </span>
            </li>
          </ul>
          <Link href="/investigations/new" className="fm-button fm-button-dark">
            Try an investigation <ArrowRight size={16} />
          </Link>
        </div>
        <div className="fm-report-window">
          <div className="fm-report-topbar">
            <div className="fm-window-controls">
              <i />
              <i />
              <i />
            </div>
            <span>FORGEMIND / INVESTIGATION PREVIEW</span>
            <span className="fm-report-status">
              <span /> EXAMPLE
            </span>
          </div>
          <div className="fm-report-content">
            <div className="fm-report-heading">
              <div>
                <span className="fm-report-kicker">INVESTIGATION / 0042</span>
                <h3>Shader pipeline mismatch</h3>
                <p>
                  Unity 2022.3 LTS <b>·</b> Built-in Render Pipeline
                </p>
              </div>
              <span className="fm-report-severity">HIGH</span>
            </div>
            <div className="fm-report-observation">
              <span className="fm-report-label">OBSERVED ERROR</span>
              <code>LightMode = &quot;UniversalForward&quot;</code>
              <p>
                Shader pass appears to target URP while project context
                indicates Built-in Render Pipeline.
              </p>
            </div>
            <div className="fm-report-cause">
              <div className="fm-report-cause-title">
                <CheckCircle2 size={16} /> LIKELY ROOT CAUSE{" "}
                <span>RULE MATCH</span>
              </div>
              <p>
                Potential incompatibility between shader pass conventions and
                the active render pipeline.
              </p>
              <code>UNITY-RULE-PIPELINE-MISMATCH</code>
            </div>
            <div className="fm-report-next">
              <div className="fm-report-next-icon">
                <ArrowRight size={16} />
              </div>
              <div>
                <span className="fm-report-label">SUGGESTED NEXT STEP</span>
                <p>
                  Review shader tags and includes, then validate compilation and
                  material rendering in the Editor.
                </p>
              </div>
            </div>
            <div className="fm-report-foot">
              <span>
                <LockKeyhole size={13} /> Illustrative sample — not a live
                result
              </span>
              <span>01 / 03</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  return (
    <section id="how-it-works" className="fm-section fm-process-section">
      <div className="fm-container">
        <SectionHeading
          eyebrow="A SIMPLE WORKFLOW"
          title="Three steps to"
          italic="a better lead."
          description="You bring the context. ForgeMind helps organize the investigation. You verify the result."
        />
        <div className="fm-process-list">
          {steps.map((step, index) => (
            <article className="fm-process-row" key={step.number}>
              <div className="fm-process-number">
                {step.number}
                <span>.</span>
              </div>
              <div className="fm-process-title">
                <h3>{step.title}</h3>
                <span>
                  {index === 0 ? "INPUT" : index === 1 ? "ANALYSIS" : "REVIEW"}
                </span>
              </div>
              <p>{step.description}</p>
              <ChevronDown className="fm-process-chevron" size={20} />
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function SafetySection() {
  return (
    <section id="safety" className="fm-safety-section">
      <div className="fm-container fm-safety-inner">
        <div className="fm-safety-icon">
          <ShieldCheck size={26} />
        </div>
        <div className="fm-safety-copy">
          <span className="fm-section-eyebrow">
            BUILT FOR DEVELOPER CONTROL
          </span>
          <h2>
            Your code stays <em>your call.</em>
          </h2>
          <p>
            ForgeMind analyzes the information you submit and does not execute
            arbitrary code on the web host or run shell commands. Review
            suggested changes yourself and verify behavior in your Unity
            project.
          </p>
        </div>
        <Link href="/investigations/new" className="fm-button fm-button-lime">
          Investigate an error <ArrowRight size={16} />
        </Link>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="fm-footer">
      <div className="fm-container">
        <div className="fm-footer-main">
          <div>
            <BrandMark />
            <p>Less guessing. More understanding.</p>
          </div>
          <div className="fm-footer-links">
            <a href="#product">Product</a>
            <a href="#how-it-works">How it works</a>
            <a href="#safety">Safety</a>
            <Link href="/investigations">Dashboard</Link>
            <Link href="/settings">Settings</Link>
          </div>
          <Link href="/investigations/new" className="fm-footer-cta">
            Have an error? Let’s investigate <ArrowRight size={16} />
          </Link>
        </div>
        <div className="fm-footer-bottom">
          <span>
            © {new Date().getFullYear()} ForgeMind. Built for Unity developers.
          </span>
          <span>
            DESIGNED FOR CLARITY <i /> POWERED BY CONTEXT
          </span>
        </div>
      </div>
    </footer>
  );
}

export default function LandingPage() {
  return (
    <div className="fm-marketing">
      <MarketingNav />
      <main>
        <Hero />
        <CapabilityStrip />
        <Features />
        <ProductPreview />
        <HowItWorks />
        <SafetySection />
      </main>
      <Footer />
    </div>
  );
}
