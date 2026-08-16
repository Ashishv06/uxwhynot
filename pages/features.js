import Head from "next/head";
import Features from "../components/Features";

export default function FeaturesPage() {
  return (
    <>
      <Head>
        <title>Features — UXWHYNOT</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta
          name="description"
          content="What UXWHYNOT actually does: Audit, Senior UX Review, Fix, and Test, built on a reasoning chain instead of a rule-violation scanner."
        />
      </Head>
      <Features />
    </>
  );
}
