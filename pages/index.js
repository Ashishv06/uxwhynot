import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import Landing from "../components/Landing";
import Processing from "../components/Processing";

const POLL_INTERVAL_MS = 1200;

// idle -> loading -> (redirects to /audits/{id} once the job is done)
export default function Home() {
  const router = useRouter();
  const [status, setStatus] = useState("idle");
  const [phase, setPhase] = useState("capturing");
  const [hasCompetitors, setHasCompetitors] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const pollTimeout = useRef(null);

  useEffect(() => () => clearTimeout(pollTimeout.current), []);

  function pollStatus(jobId) {
    async function poll() {
      try {
        const res = await fetch(`/api/audit/status?jobId=${encodeURIComponent(jobId)}`);
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Lost track of the audit. Try again.");
        }

        if (data.phase) setPhase(data.phase);

        if (data.status === "done") {
          // The result is already persisted (see lib/db.js), so this is a
          // durable URL — refreshing it re-fetches from the database instead
          // of losing the result.
          router.push(`/audits/${jobId}`);
          return;
        }

        if (data.status === "error") {
          setErrorMessage(data.error || "The audit failed. Try a different URL.");
          setStatus("idle");
          return;
        }

        pollTimeout.current = setTimeout(poll, POLL_INTERVAL_MS);
      } catch (err) {
        setErrorMessage(err.message);
        setStatus("idle");
      }
    }

    poll();
  }

  async function runAudit(url, competitorUrls = []) {
    if (!url) {
      setErrorMessage("Enter a URL first.");
      return;
    }
    setErrorMessage("");
    setStatus("loading");
    setPhase("capturing");
    setHasCompetitors(competitorUrls.length > 0);

    try {
      const res = await fetch("/api/audit/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, competitorUrls }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "The audit failed. Try a different URL.");
      }

      pollStatus(data.jobId);
    } catch (err) {
      setErrorMessage(err.message);
      setStatus("idle");
    }
  }

  return (
    <>
      <Head>
        <title>UXWHYNOT</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>

      <Landing onStart={runAudit} errorMessage={errorMessage} />
      <Processing active={status === "loading"} phase={phase} hasCompetitors={hasCompetitors} />
    </>
  );
}
