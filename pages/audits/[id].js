import Head from "next/head";
import { useRouter } from "next/router";
import { getAudit } from "../../lib/db";
import Results from "../../components/Results";

export async function getServerSideProps({ params }) {
  const audit = getAudit(params.id);
  if (!audit) return { notFound: true };
  return { props: { audit } };
}

export default function AuditDetail({ audit }) {
  const router = useRouter();

  return (
    <>
      <Head>
        <title>{`${audit.title || audit.url} — UXWHYNOT`}</title>
      </Head>
      <Results audit={audit} onNewAudit={() => router.push("/")} />
    </>
  );
}
