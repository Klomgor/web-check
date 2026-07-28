/**
 * Logic for deciding if a check should be skipped, and why.
 * By default all checks are run, but a check will be skipped if:
 * VITE_DISABLE_EVERYTHING is set - turns off the whole instance
 * API_DISABLED_CHECKS - comma seperated list of checks to skip
 * API_ENABLED_CHECKS - comma seperated list of checks to run (all others will be skipped)
 * Or the target is a private IP and the check needs a public one (like for external API)
 *
 * Note that the get-ip check is probably always needed. Since IP used for most checks.
 */

import { parseTarget } from './parse-target.js';

/* The list of response messages, for the skip reason in API response */
const getSkipMessage = (skipReason, check) => {
  // Check disabled by admin with black/white list
  if (skipReason === 'check-disabled') {
    return `The ${check} check is disabled on this instance.`;
  }
  // The check can't run against private IPs
  if (skipReason === 'private-ip') {
    return `The ${check} check can\'t run for private hosts`;
  }
  // The instance is turned off :(
  if (skipReason === 'instance-fucked') {
    return (
      'This instance of web-check is temporarily disabled.\n' +
      'This is due to excess abuse and bot traffic making hosting unfordable. ' +
      "We're sorry for any inconvenience caused. " +
      'In the meantime, you can self-host your own instance, ' +
      'see instructions in our repo, at: github.com/lissy93/web-check. ' +
      'All checks will continue to fail until the `VITE_DISABLE_EVERYTHING` is unset.'
    );
  }
  // Not sure why this'd happen
  return 'Lookup was skipped for an unknown reason 🤔';
};

/* Gets check ID from the request path (like /api/firewall/ --> firewall) */
const getCheckName = (path) => {
  const name = (path || '').split('?')[0].toLowerCase().split('/').filter(Boolean).pop() || '';
  return name === 'api' ? '' : name.replace(/\.js$/, '');
};

/* Returns array of strings of check IDs from the enable/disable env vars */
const checkListFromEnv = (name) =>
  (process.env[name] || '')
    .toLowerCase()
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

/* Returns true if a given check is disabled with env var */
const isCheckDisabled = (check) => {
  if (!check) return false;
  if (checkListFromEnv('API_DISABLED_CHECKS').includes(check)) return true;
  const enabled = checkListFromEnv('API_ENABLED_CHECKS');
  return enabled.length > 0 && check !== 'get-ip' && !enabled.includes(check);
};

/* Checks which send the target to an outside service, so are useless for private hosts */
const publicOnlyChecks = [
  'archives',
  'block-lists',
  'dnssec',
  'location',
  'quality',
  'rank',
  'shodan',
  'subdomains',
  'threats',
  'tls-labs',
  'whois',
];

/* Returns true if the target is a private IP, localhost or a .local address */
const isPrivateTarget = (target) => {
  let host;
  try {
    host = parseTarget(target).hostname;
  } catch {
    return false;
  }
  if (host === 'localhost' || host.endsWith('.local')) return true;
  if (host.includes(':')) return host === '::1' || /^f[cde]/.test(host);
  if (!/^\d+\.\d+\.\d+\.\d+$/.test(host)) return false;
  const [a, b] = host.split('.').map(Number);
  if (a === 10 || a === 127) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 169 && b === 254) return true;
  return a === 100 && b >= 64 && b <= 127;
};

/* Checks every reason a check might not run, returns skip status with a reason */
export const shouldSkip = (path, target) => {
  const check = getCheckName(path);
  if (process.env.VITE_DISABLE_EVERYTHING)
    return { skip: true, reason: getSkipMessage('instance-fucked') };
  if (isCheckDisabled(check))
    return { skip: true, reason: getSkipMessage('check-disabled', check) };
  if (publicOnlyChecks.includes(check) && isPrivateTarget(target))
    return { skip: true, reason: getSkipMessage('private-ip', check) };
  return { skip: false };
};
