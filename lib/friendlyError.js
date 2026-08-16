// Turns raw upstream error text (Anthropic API errors, Playwright navigation
// failures, etc.) into something a user should actually see. The raw message
// is always still logged server-side via console.error, this only controls
// what gets sent back in the HTTP response.

function toFriendlyError(err) {
  const msg = (err && err.message) || "";

  if (/credit balance is too low/i.test(msg)) {
    return "The audit service is temporarily unavailable (provider account issue on our end). We've been notified, please try again shortly.";
  }
  if (/rate.?limit/i.test(msg)) {
    return "We're handling a lot of audit requests right now. Please try again in a minute.";
  }
  if (/authentication_error|invalid x-api-key|invalid api key/i.test(msg)) {
    return "The audit service is temporarily unavailable (configuration issue on our end). We've been notified.";
  }
  if (/timed out|timeout/i.test(msg)) {
    return "This page took too long to load, so the audit timed out. Try again, or try a different URL.";
  }
  if (/^Could not load /i.test(msg)) {
    // Already written for a human by captureSite.js — pass it through as-is.
    return msg;
  }

  return "Something went wrong running this audit. Please try again in a moment.";
}

module.exports = { toFriendlyError };
