// Pure quota logic, no database calls in here on purpose, so it's testable
// without wiring up a database first. The caller (pages/api/audit/start.js)
// is responsible for loading `user` from the database before calling this,
// and persisting the returned user object back after.
//
// Two different gating shapes, on purpose:
//   free    — a LIFETIME cap (3 full audits, ever, no reset)
//   premium — a RECURRING weekly cap (10 full audits, resets every Monday UTC)
//
// Expected `user` shape once real auth + a database exist:
//   {
//     plan: "free" | "premium",
//     full_audits_used_lifetime: number,       // free plan counter, never resets
//     audits_used_this_period: number,         // premium plan counter, resets weekly
//     period_start: string (ISO) | null,        // premium plan only
//   }

const { PLANS, getCurrentPeriodStart } = require("./plans");

function checkQuota(user, now = new Date()) {
  if (user.plan === "premium") {
    return checkPremiumQuota(user, now);
  }
  return checkFreeQuota(user);
}

function checkFreeQuota(user) {
  const limit = PLANS.free.lifetimeFullAudits;
  const used = user.full_audits_used_lifetime || 0;
  const remaining = Math.max(0, limit - used);
  return {
    allowed: remaining > 0,
    tier: "full",
    scope: "lifetime",
    remaining,
    limit,
    resetsAt: null, // lifetime cap, never resets
    user,
  };
}

function checkPremiumQuota(user, now) {
  const plan = PLANS.premium;
  const currentPeriodStart = getCurrentPeriodStart(now);
  const storedPeriodStart = user.period_start ? new Date(user.period_start) : null;

  const periodHasRolledOver =
    !storedPeriodStart || storedPeriodStart.getTime() < currentPeriodStart.getTime();

  const auditsUsed = periodHasRolledOver ? 0 : user.audits_used_this_period || 0;
  const updatedUser = periodHasRolledOver
    ? { ...user, audits_used_this_period: 0, period_start: currentPeriodStart.toISOString() }
    : user;

  const remaining = Math.max(0, plan.fullAuditsPerPeriod - auditsUsed);
  const resetsAt = new Date(currentPeriodStart);
  resetsAt.setUTCDate(resetsAt.getUTCDate() + 7);

  return {
    allowed: remaining > 0,
    tier: "full",
    scope: "weekly",
    remaining,
    limit: plan.fullAuditsPerPeriod,
    resetsAt: resetsAt.toISOString(),
    user: updatedUser,
  };
}

// Call after a full (Claude-reasoned) audit actually runs, to consume one
// unit of quota. Returns the user record to persist.
function consumeQuota(user, now = new Date()) {
  if (user.plan === "premium") {
    const { user: rolledOverUser } = checkPremiumQuota(user, now);
    return {
      ...rolledOverUser,
      audits_used_this_period: (rolledOverUser.audits_used_this_period || 0) + 1,
    };
  }
  return {
    ...user,
    full_audits_used_lifetime: (user.full_audits_used_lifetime || 0) + 1,
  };
}

module.exports = { checkQuota, consumeQuota };
