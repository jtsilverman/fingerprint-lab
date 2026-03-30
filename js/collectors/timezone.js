/**
 * Timezone and locale fingerprinting.
 */

import { sha256 } from '../hash.js';

export async function collectTimezone() {
  const dateOptions = Intl.DateTimeFormat().resolvedOptions();

  const data = {
    timezone: dateOptions.timeZone,
    offset: new Date().getTimezoneOffset(),
    locale: dateOptions.locale,
    calendar: dateOptions.calendar,
    numberingSystem: dateOptions.numberingSystem,
    // Date formatting quirks
    dateString: new Date(2026, 0, 1, 12, 0, 0).toLocaleString(),
    hourCycle: dateOptions.hourCycle || 'unknown',
  };

  const hash = await sha256(JSON.stringify(data));

  return {
    name: 'Timezone',
    category: 'browser',
    value: data,
    displayValue: `${data.timezone} (UTC${data.offset > 0 ? '-' : '+'}${Math.abs(data.offset / 60)})`,
    entropy: 3.8,
    description: 'Your timezone, locale, and date formatting preferences. Combined with other signals, this narrows your geographic location.',
    mitigation: 'Firefox resistFingerprinting reports UTC. VPNs do not change your timezone.',
  };
}
