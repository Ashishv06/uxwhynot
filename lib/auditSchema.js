// The shape Claude must return, and that the frontend renders directly.
// Keep this in sync with components/Results.jsx if you change it.
//
// This is deliberately the v1 scope from UX_Audit_Plugin_Spec_v2.md:
// one product, up to ~6 flows, no competitor benchmarking yet (that's v2).

const AUDIT_JSON_SCHEMA = {
  type: "object",
  required: ["scoreProjection", "heuristics", "findings"],
  properties: {
    scoreProjection: {
      type: "array",
      description:
        "Exactly 5 categories: Usability, Accessibility, Visual Design, Conversion Readiness, " +
        "Agentic Browsing. (Performance is added separately from real Lighthouse data, not by you.) " +
        "'initial' is the score as audited (0-100). 'optimized' is always 100 (the score if every " +
        "recommendation below were applied) unless a category has zero findings, in which case it " +
        "should equal 'initial'.",
      items: {
        type: "object",
        required: ["category", "initial", "optimized"],
        properties: {
          category: { type: "string" },
          initial: { type: "integer", minimum: 0, maximum: 100 },
          optimized: { type: "integer", minimum: 0, maximum: 100 },
        },
      },
    },
    heuristics: {
      type: "array",
      description: "All 10 of Nielsen's heuristics, in this fixed order, every time.",
      items: {
        type: "object",
        required: ["name", "score", "notes"],
        properties: {
          name: { type: "string" },
          score: { type: "integer", minimum: 1, maximum: 10 },
          notes: {
            type: "string",
            description:
              "Specific and evidence-based. Never generic filler like 'could be improved'. " +
              "Reference the actual element or pattern observed.",
          },
        },
      },
    },
    findings: {
      type: "array",
      description:
        "Every finding above Minor severity. Group logically (e.g. by page/section the agent " +
        "actually looked at). No fixed count, real audits find what they find.",
      items: {
        type: "object",
        required: ["section", "severity", "verification", "observation", "issue", "recommendation"],
        properties: {
          section: { type: "string", description: "e.g. 'Homepage', 'Onboarding', 'Dashboard'" },
          severity: { type: "string", enum: ["Critical", "Major", "Moderate", "Minor", "What Works"] },
          verification: {
            type: "string",
            enum: ["Automated", "Simulated", "Unable to verify"],
            description: "See the Core Principle in the methodology prompt. Never omit this.",
          },
          observation: {
            type: "string",
            description: "The specific concrete thing seen, step 1 of the reasoning chain.",
          },
          issue: { type: "string" },
          userImpact: { type: "string" },
          recommendation: { type: "string" },
          wcagReference: { type: "string", description: "Optional. Only if directly applicable." },
        },
      },
    },
    benchmarking: {
      type: "object",
      description:
        "Only include this if competitor screenshots were provided in the request. Competitor " +
        "scores are estimates from browsing a screenshot, not independent audits — that caveat " +
        "must also appear in a report-level note, this field alone isn't the disclosure.",
      properties: {
        featureComparison: {
          type: "array",
          description:
            "Meaningful feature/capability differences between the audited product and each " +
            "competitor. Not a checkbox list — explain what the difference means for the user.",
          items: {
            type: "object",
            required: ["feature", "product", "competitors", "explanation"],
            properties: {
              feature: { type: "string" },
              product: { type: "string", description: "State for the audited product, e.g. 'Present', 'Partial — no filtering', 'Absent'." },
              competitors: {
                type: "array",
                items: {
                  type: "object",
                  required: ["name", "status"],
                  properties: {
                    name: { type: "string" },
                    status: { type: "string" },
                  },
                },
              },
              explanation: { type: "string", description: "Why this difference matters to a real user." },
            },
          },
        },
        flowComparison: {
          type: "array",
          description: "2-3 shared critical flows (e.g. signup, core task) compared step-by-step.",
          items: {
            type: "object",
            required: ["flow", "product", "competitors"],
            properties: {
              flow: { type: "string" },
              product: {
                type: "object",
                required: ["steps", "friction"],
                properties: {
                  steps: { type: "integer", description: "Estimated step count to complete the flow." },
                  friction: { type: "string", description: "Specific friction points observed." },
                },
              },
              competitors: {
                type: "array",
                items: {
                  type: "object",
                  required: ["name", "steps", "friction"],
                  properties: {
                    name: { type: "string" },
                    steps: { type: "integer" },
                    friction: { type: "string" },
                  },
                },
              },
            },
          },
        },
        scoringMatrix: {
          type: "array",
          description:
            "1-5 per dimension: Learnability, Task Focus, Search/Discovery, Accessibility, " +
            "Consistency, plus 1-2 product-specific dimensions. Every score needs a rationale " +
            "tied back to an actual finding, not a bare number.",
          items: {
            type: "object",
            required: ["dimension", "product", "competitors"],
            properties: {
              dimension: { type: "string" },
              product: {
                type: "object",
                required: ["score", "rationale"],
                properties: {
                  score: { type: "integer", minimum: 1, maximum: 5 },
                  rationale: { type: "string" },
                },
              },
              competitors: {
                type: "array",
                items: {
                  type: "object",
                  required: ["name", "score", "rationale"],
                  properties: {
                    name: { type: "string" },
                    score: { type: "integer", minimum: 1, maximum: 5 },
                    rationale: { type: "string" },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
};

module.exports = { AUDIT_JSON_SCHEMA };
