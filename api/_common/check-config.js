/**
 * Logic for enabling/disabling specific checks on the API.
 * By default all checks are run.
 * Self-hosters can change this with either of the environmental variables:
 * API_DISABLED_CHECKS - comma seperated list of checks to skip
 * API_ENABLED_CHECKS - comma seperated list of checks to run (all others will be skipped)
 *
 * Note that the get-ip check is probably always needed. Since IP used for most checks.
 */

/* Returns array of strings of check IDs from the enable/disable env vars */
const checkListFromEnv = (name) =>
  (process.env[name] || '')
    .toLowerCase()
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

/* Returns true if a given check is disabled with env var */
export const isCheckDisabled = (check) => {
  if (!check) return false;
  if (checkListFromEnv('API_DISABLED_CHECKS').includes(check)) return true;
  const enabled = checkListFromEnv('API_ENABLED_CHECKS');
  return enabled.length > 0 && check !== 'get-ip' && !enabled.includes(check);
};

/* Gets check ID from the request path (like /api/firewall/ --> firewall) */
export const getCheckName = (path) => {
  const name = (path || '').split('?')[0].toLowerCase().split('/').filter(Boolean).pop() || '';
  return name === 'api' ? '' : name.replace(/\.js$/, '');
};

/* Message for the skip reason in the API response */
export const checkDisabledMsg = (check) =>
  `The ${check} check is disabled on this instance.\n\n` +
  'Contact your admin to get the API_DISABLED_CHECKS list updated.';
