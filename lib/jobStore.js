// In-memory audit job store, keyed by job id. This is fine for an always-on
// single Node process (see README) — swap for Redis/a DB if you ever run
// multiple instances behind a load balancer.
//
// Each API route file is compiled into its own bundle by Next.js (even in a
// single Node process), so a plain module-level `const jobs = new Map()`
// ends up as a separate instance per route — /start and /status would each
// see their own empty map. Stashing it on `global` guarantees one shared
// instance for the whole process regardless of bundling.

const crypto = require("crypto");

const JOB_TTL_MS = 30 * 60 * 1000;
const SWEEP_INTERVAL_MS = 5 * 60 * 1000;

if (!global.__uxauditJobs) {
  global.__uxauditJobs = new Map();
}
const jobs = global.__uxauditJobs;

function createJob() {
  const id = crypto.randomUUID();
  jobs.set(id, {
    status: "queued",
    phase: "queued",
    result: null,
    error: null,
    createdAt: Date.now(),
  });
  return id;
}

function updateJob(id, patch) {
  const job = jobs.get(id);
  if (!job) return;
  jobs.set(id, { ...job, ...patch });
}

function getJob(id) {
  return jobs.get(id) || null;
}

setInterval(() => {
  const cutoff = Date.now() - JOB_TTL_MS;
  for (const [id, job] of jobs) {
    if (job.createdAt < cutoff) jobs.delete(id);
  }
}, SWEEP_INTERVAL_MS).unref();

module.exports = { createJob, updateJob, getJob };
