import Head from "next/head";
import Link from "next/link";
import { listAudits } from "../../lib/db";

// A pinned locale, not the runtime default: toLocaleString() otherwise
// renders differently on the server (Node's default locale) vs the client
// (the browser's), which React flags as a hydration mismatch.
function formatGeneratedAt(iso) {
  return new Date(iso).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export async function getServerSideProps() {
  return { props: { audits: listAudits() } };
}

export default function AuditsIndex({ audits }) {
  return (
    <>
      <Head>
        <title>Past Audits — UXWHYNOT</title>
      </Head>
      <section className="screen active" style={{ padding: "32px 48px" }}>
        <div className="nav">
          <Link href="/" className="logo" style={{ textDecoration: "none" }}>
            UXWHYNOT
          </Link>
        </div>

        <h1 style={{ marginTop: 24, fontSize: 24 }}>Past Audits</h1>

        {audits.length === 0 && (
          <p className="placeholder-text" style={{ marginTop: 16 }}>
            No audits yet. Run one from the home page.
          </p>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 24, maxWidth: 640 }}>
          {audits.map((a) => (
            <Link
              key={a.id}
              href={`/audits/${a.id}`}
              className="card"
              style={{ textDecoration: "none", color: "inherit", display: "block" }}
            >
              <strong>{a.title || a.url}</strong>
              <div className="placeholder-text">{a.url}</div>
              <div className="placeholder-text">{formatGeneratedAt(a.generatedAt)}</div>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
