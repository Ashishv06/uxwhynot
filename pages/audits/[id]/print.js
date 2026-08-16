// Rendered server-side and screenshotted to a PDF by pages/api/audits/[id]/pdf.js.
// Not meant for a person to browse to directly, though it works fine if you do.

import Head from "next/head";
import { getAudit } from "../../../lib/db";
import PrintReport from "../../../components/PrintReport";

export async function getServerSideProps({ params }) {
  const audit = getAudit(params.id);
  if (!audit) return { notFound: true };
  return { props: { audit } };
}

export default function AuditPrintView({ audit }) {
  return (
    <>
      <Head>
        <title>{`${audit.title || audit.url} — UXWHYNOT`}</title>
      </Head>
      <PrintReport audit={audit} />
    </>
  );
}
