/**
 * CSS feature detection fingerprinting.
 * Different browser versions support different CSS features.
 */

import { sha256 } from '../hash.js';

const CSS_FEATURES = [
  'display: grid', 'display: flex', 'display: contents',
  'position: sticky', 'backdrop-filter: blur(1px)',
  'color: color-mix(in srgb, red, blue)', 'accent-color: red',
  'aspect-ratio: 1', 'container-type: inline-size',
  'content-visibility: auto', 'contain: paint',
  'font-variant-alternates: styleset(ss01)',
  'gap: 1px', 'inset: 0', 'isolation: isolate',
  'margin-inline: 1px', 'overscroll-behavior: contain',
  'place-items: center', 'scroll-snap-type: x mandatory',
  'text-decoration-thickness: 1px', 'text-underline-offset: 1px',
  'touch-action: manipulation', 'user-select: none',
  'writing-mode: vertical-rl', 'will-change: transform',
  'overflow: clip', 'scroll-timeline-name: --test',
  'view-transition-name: test', 'anchor-name: --test',
  'text-wrap: balance', 'color-scheme: dark',
  'field-sizing: content', 'interpolate-size: allow-keywords',
  'mask-image: none', 'offset-path: none',
  'paint-order: stroke', 'rotate: 45deg',
  'scale: 1.5', 'translate: 10px',
];

export async function collectCSS() {
  const supported = [];
  const unsupported = [];

  for (const feature of CSS_FEATURES) {
    if (CSS.supports && CSS.supports(feature)) {
      supported.push(feature);
    } else {
      unsupported.push(feature);
    }
  }

  const hash = await sha256(supported.join(','));

  return {
    name: 'CSS Features',
    category: 'browser',
    value: { supported: supported.length, total: CSS_FEATURES.length, features: supported },
    displayValue: `${supported.length}/${CSS_FEATURES.length} features supported`,
    entropy: 4.5,
    description: `Tests ${CSS_FEATURES.length} CSS features via CSS.supports(). Different browser versions support different feature sets, creating a version fingerprint without reading the user agent string.`,
    mitigation: 'No practical mitigation. CSS feature support is fundamental to how browsers work.',
  };
}
