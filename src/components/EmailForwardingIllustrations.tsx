import React from "react";

type IllustrationProps = {
  readonly title: string;
};

const frameStyle: React.CSSProperties = {
  borderRadius: 16,
  border: "1px solid rgba(255,255,255,0.10)",
  background: "linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))",
  padding: "0.9rem",
  width: "100%",
};

const captionStyle: React.CSSProperties = {
  marginTop: "0.5rem",
  color: "rgba(255,255,255,0.75)",
  fontSize: "0.9rem",
  lineHeight: 1.5,
};

function WindowFrame({
  title,
  children,
}: React.PropsWithChildren<IllustrationProps>): React.JSX.Element {
  return (
    <div style={frameStyle} aria-label={title}>
      <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", marginBottom: "0.75rem" }}>
        <div style={{ display: "flex", gap: "0.35rem" }}>
          <div style={{ width: 10, height: 10, borderRadius: 99, background: "rgba(255,255,255,0.14)" }} />
          <div style={{ width: 10, height: 10, borderRadius: 99, background: "rgba(255,255,255,0.12)" }} />
          <div style={{ width: 10, height: 10, borderRadius: 99, background: "rgba(255,255,255,0.10)" }} />
        </div>
        <div style={{ fontWeight: 800, color: "rgba(255,255,255,0.9)", fontSize: "0.95rem" }}>{title}</div>
      </div>
      {children}
    </div>
  );
}

function HintCaption({ children }: React.PropsWithChildren): React.JSX.Element {
  return <div style={captionStyle}>{children}</div>;
}

export function GmailForwardingIllustration(): React.JSX.Element {
  return (
    <div>
      <WindowFrame title="Gmail → Settings → Forwarding">
        <svg viewBox="0 0 760 320" width="100%" role="img" aria-label="Gmail forwarding settings illustration">
          <rect x="18" y="20" width="724" height="280" rx="18" fill="rgba(0,0,0,0.25)" stroke="rgba(255,255,255,0.10)" />
          <rect x="40" y="52" width="160" height="24" rx="8" fill="rgba(255,255,255,0.07)" />
          <rect x="212" y="52" width="140" height="24" rx="8" fill="rgba(249,47,96,0.28)" stroke="rgba(249,47,96,0.7)" />
          <text x="222" y="69" fontSize="12" fill="rgba(255,255,255,0.92)" fontFamily="system-ui">
            Forwarding
          </text>

          <text x="40" y="110" fontSize="14" fill="rgba(255,255,255,0.92)" fontFamily="system-ui" fontWeight="700">
            Forwarding and POP/IMAP
          </text>

          <rect x="40" y="132" width="540" height="34" rx="10" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.10)" />
          <text x="54" y="154" fontSize="13" fill="rgba(255,255,255,0.82)" fontFamily="system-ui">
            Add a forwarding address
          </text>
          <rect x="592" y="132" width="130" height="34" rx="10" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.10)" />
          <text x="608" y="154" fontSize="13" fill="rgba(255,255,255,0.75)" fontFamily="system-ui">
            Next →
          </text>

          <path d="M 620 196 C 620 176 670 176 670 196 C 670 216 620 216 620 196" fill="rgba(249,47,96,0.20)" />
          <text x="40" y="214" fontSize="13" fill="rgba(255,255,255,0.8)" fontFamily="system-ui">
            You’ll see a verification step (code/email). Come back to Pack to get the code if needed.
          </text>

          <rect x="40" y="232" width="340" height="42" rx="12" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.10)" />
          <text x="54" y="258" fontSize="13" fill="rgba(255,255,255,0.78)" fontFamily="system-ui">
            Enable forwarding (new mail)
          </text>

          <rect x="392" y="232" width="190" height="42" rx="12" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.10)" />
          <text x="406" y="258" fontSize="13" fill="rgba(255,255,255,0.78)" fontFamily="system-ui">
            Keep Gmail copy
          </text>
        </svg>
      </WindowFrame>
      <HintCaption>
        Look for the <strong>Forwarding and POP/IMAP</strong> tab, then click <strong>Add a forwarding address</strong>.
      </HintCaption>
    </div>
  );
}

export function GmailFiltersImportIllustration(): React.JSX.Element {
  return (
    <div>
      <WindowFrame title="Gmail → Settings → Filters → Import">
        <svg viewBox="0 0 760 320" width="100%" role="img" aria-label="Gmail filter import illustration">
          <rect x="18" y="20" width="724" height="280" rx="18" fill="rgba(0,0,0,0.25)" stroke="rgba(255,255,255,0.10)" />

          <text x="40" y="78" fontSize="14" fill="rgba(255,255,255,0.92)" fontFamily="system-ui" fontWeight="700">
            Filters and Blocked Addresses
          </text>

          <rect x="40" y="104" width="680" height="64" rx="14" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.10)" />
          <text x="54" y="134" fontSize="13" fill="rgba(255,255,255,0.82)" fontFamily="system-ui">
            Import filters
          </text>
          <text x="54" y="156" fontSize="12" fill="rgba(255,255,255,0.72)" fontFamily="system-ui">
            Choose file → Upload
          </text>

          <rect x="40" y="196" width="360" height="84" rx="14" fill="rgba(249,47,96,0.14)" stroke="rgba(249,47,96,0.55)" />
          <text x="56" y="226" fontSize="13" fill="rgba(255,255,255,0.9)" fontFamily="system-ui" fontWeight="700">
            After import
          </text>
          <text x="56" y="252" fontSize="12" fill="rgba(255,255,255,0.78)" fontFamily="system-ui">
            You should see filters labeled Pack/TravelProviderDomains
          </text>

          <rect x="420" y="196" width="300" height="84" rx="14" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.10)" />
          <text x="436" y="226" fontSize="13" fill="rgba(255,255,255,0.82)" fontFamily="system-ui">
            If forwarding isn’t selected…
          </text>
          <text x="436" y="252" fontSize="12" fill="rgba(255,255,255,0.72)" fontFamily="system-ui">
            Edit a filter → choose “Forward it to”
          </text>
        </svg>
      </WindowFrame>
      <HintCaption>
        In Pack, tap <strong>Share Gmail filter XML</strong>, then import it in Gmail’s Filters settings.
      </HintCaption>
    </div>
  );
}

export function GmailBackfillScriptIllustration(): React.JSX.Element {
  return (
    <div>
      <WindowFrame title="Bulk backfill (runs in your Gmail)">
        <svg viewBox="0 0 760 320" width="100%" role="img" aria-label="Gmail Apps Script backfill illustration">
          <rect x="18" y="20" width="724" height="280" rx="18" fill="rgba(0,0,0,0.25)" stroke="rgba(255,255,255,0.10)" />

          <rect x="40" y="60" width="300" height="34" rx="10" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.10)" />
          <text x="54" y="82" fontSize="13" fill="rgba(255,255,255,0.8)" fontFamily="system-ui">
            script.google.com → New project
          </text>

          <rect x="40" y="110" width="680" height="140" rx="14" fill="rgba(10,10,10,0.45)" stroke="rgba(255,255,255,0.10)" />
          <text x="54" y="140" fontSize="12" fill="rgba(255,255,255,0.68)" fontFamily="system-ui">
            Paste the Pack script…
          </text>
          <text x="54" y="164" fontSize="12" fill="rgba(255,255,255,0.68)" fontFamily="system-ui">
            Run: packBackfillTravelEmails()
          </text>
          <text x="54" y="188" fontSize="12" fill="rgba(255,255,255,0.68)" fontFamily="system-ui">
            It forwards travel emails (known travel domains)
          </text>

          <rect x="540" y="260" width="180" height="34" rx="10" fill="rgba(249,47,96,0.22)" stroke="rgba(249,47,96,0.70)" />
          <text x="560" y="282" fontSize="13" fill="rgba(255,255,255,0.9)" fontFamily="system-ui" fontWeight="700">
            Run ▶
          </text>
        </svg>
      </WindowFrame>
      <HintCaption>
        This is privacy-first: Pack never reads your inbox. The script forwards travel emails from your account.
      </HintCaption>
    </div>
  );
}

export function OutlookRulesIllustration(): React.JSX.Element {
  return (
    <div>
      <WindowFrame title="Outlook → Rules → Add rule">
        <svg viewBox="0 0 760 320" width="100%" role="img" aria-label="Outlook rules illustration">
          <rect x="18" y="20" width="724" height="280" rx="18" fill="rgba(0,0,0,0.25)" stroke="rgba(255,255,255,0.10)" />
          <text x="40" y="78" fontSize="14" fill="rgba(255,255,255,0.92)" fontFamily="system-ui" fontWeight="700">
            Mail rules
          </text>

          <rect x="40" y="104" width="680" height="52" rx="14" fill="rgba(249,47,96,0.16)" stroke="rgba(249,47,96,0.55)" />
          <text x="54" y="134" fontSize="13" fill="rgba(255,255,255,0.9)" fontFamily="system-ui" fontWeight="700">
            Add new rule
          </text>

          <rect x="40" y="176" width="680" height="92" rx="14" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.10)" />
          <text x="54" y="206" fontSize="12" fill="rgba(255,255,255,0.78)" fontFamily="system-ui">
            If from domain is (airlines/hotels) → Redirect/Forward to: trips@itsdoneai.com
          </text>
          <text x="54" y="232" fontSize="12" fill="rgba(255,255,255,0.68)" fontFamily="system-ui">
            Save rule → it applies to new emails
          </text>
        </svg>
      </WindowFrame>
      <HintCaption>
        Create a rule that forwards/redirects travel confirmations to your Pack forwarding address.
      </HintCaption>
    </div>
  );
}
