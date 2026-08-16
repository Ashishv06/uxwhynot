// Sample content for the "Preview full Senior UX Review" demo toggle in
// Results.jsx. This is NOT a real analysis of any specific page — it's
// illustrative content shown when someone clicks "Upgrade to Premium" on a
// locked/free-tier result, so they can see what the unlocked UI looks like
// before actually running (or paying for) a real Claude-reasoned audit.
// Keep this generic enough that it never reads as a claim about a real URL.

export const SAMPLE_CATEGORY_SCORES = {
  Usability: 58,
  "Visual Design": 74,
  "Conversion Readiness": 66,
  "Agentic Browsing": 61,
};

export const SAMPLE_HEURISTICS = [
  { name: "Visibility of System Status", score: 6, notes: "Sample note: form submissions show no loading or success state." },
  { name: "Match Between System and the Real World", score: 8, notes: "Sample note: terminology generally matches how users describe the product." },
  { name: "User Control and Freedom", score: 5, notes: "Sample note: no visible way to back out of a multi-step flow once started." },
  { name: "Consistency and Standards", score: 6, notes: "Sample note: button styles vary slightly across pages." },
  { name: "Error Prevention", score: 4, notes: "Sample note: forms allow submission with required fields empty." },
  { name: "Recognition Rather Than Recall", score: 7, notes: "Sample note: navigation stays visible, reducing reliance on memory." },
  { name: "Flexibility and Efficiency of Use", score: 5, notes: "Sample note: no shortcuts for returning, familiar users." },
  { name: "Aesthetic and Minimalist Design", score: 8, notes: "Sample note: generous white space keeps each section focused." },
  { name: "Help Users Recognize, Diagnose, and Recover from Errors", score: 3, notes: "Sample note: failed actions show a generic error with no specific cause." },
  { name: "Help and Documentation", score: 6, notes: "Sample note: help content exists but isn't linked from where it's needed." },
];

export const SAMPLE_FINDINGS = [
  {
    section: "Primary Call-to-Action",
    severity: "Critical",
    verification: "Simulated",
    observation: "Sample finding — a real audit inspects your actual page for issues like this.",
    issue: "Example: a primary action button with insufficient color contrast against its background.",
    userImpact: "Example: users with low vision, or in bright ambient light, may not register the button as clickable.",
    recommendation: "Example: increase contrast to meet WCAG AA (4.5:1) and verify the fix visually.",
    wcagReference: "WCAG 1.4.3",
  },
  {
    section: "Form",
    severity: "Major",
    verification: "Simulated",
    observation: "Sample finding — a real audit inspects your actual page for issues like this.",
    issue: "Example: a multi-step form with no visible progress indicator or way to review earlier steps.",
    userImpact: "Example: users who want to correct an earlier answer have no safe way to do so without losing progress.",
    recommendation: "Example: add a step indicator with clickable previous steps, and persist form state.",
  },
  {
    section: "Navigation",
    severity: "Moderate",
    verification: "Simulated",
    observation: "Sample finding — a real audit inspects your actual page for issues like this.",
    issue: "Example: navigation labels that are stylistically distinctive but not immediately self-explanatory.",
    userImpact: "Example: first-time visitors may skip sections relevant to what they came to do.",
    recommendation: "Example: pair distinctive labels with a familiar secondary cue until the terminology is established.",
  },
  {
    section: "Homepage",
    severity: "What Works",
    verification: "Simulated",
    observation: "Sample finding — a real audit inspects your actual page for things that work well too.",
    issue: "This is a positive example, not an issue.",
    userImpact: "Example: a clear single message and one primary action reduce early bounce.",
    recommendation: "Keep patterns like this as the template for future pages.",
  },
];
