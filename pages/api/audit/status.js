// GET /api/audit/status?jobId=...  ->  { status, phase, result, error }
//
// status: "queued" | "running" | "done" | "error"
// phase:  "queued" | "capturing" | "scanning" | "analyzing" | "done"

const { getJob } = require("../../../lib/jobStore");

export default function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { jobId } = req.query;
  const job = typeof jobId === "string" ? getJob(jobId) : null;

  if (!job) {
    return res.status(404).json({ error: "Audit job not found. Start a new audit." });
  }

  const { status, phase, result, error } = job;
  return res.status(200).json({ status, phase, result, error });
}
