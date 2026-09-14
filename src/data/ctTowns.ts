// Approximate town-center coordinates for Connecticut municipalities.
// Used to place map pins for LIVE license records, which include a town/zip
// but no latitude/longitude. Pins derived this way are flagged approxLocation.
// Sample data uses its own precise coordinates and does not rely on this table.

export const CT_CENTER: [number, number] = [41.6, -72.7]

export const CT_TOWNS: Record<string, [number, number]> = {
  hartford: [41.7637, -72.6851],
  'west hartford': [41.762, -72.742],
  'east hartford': [41.7823, -72.612],
  'new haven': [41.3083, -72.9279],
  bridgeport: [41.1792, -73.1894],
  stamford: [41.0534, -73.5387],
  waterbury: [41.5581, -73.0515],
  norwalk: [41.1177, -73.4079],
  danbury: [41.3948, -73.454],
  'new britain': [41.6612, -72.7795],
  bristol: [41.6718, -72.9493],
  meriden: [41.5382, -72.807],
  milford: [41.2307, -73.064],
  'west haven': [41.2707, -72.947],
  middletown: [41.5623, -72.6506],
  norwich: [41.5243, -72.0759],
  shelton: [41.3165, -73.0932],
  torrington: [41.8007, -73.1212],
  naugatuck: [41.4859, -73.0507],
  newington: [41.6979, -72.7237],
  cheshire: [41.499, -72.9007],
  vernon: [41.8176, -72.4668],
  rockville: [41.8676, -72.4523],
  windsor: [41.8526, -72.6437],
  'new london': [41.3557, -72.0995],
  wallingford: [41.457, -72.8231],
  enfield: [41.9761, -72.5917],
  manchester: [41.7759, -72.5215],
  stratford: [41.1845, -73.1332],
  hamden: [41.3959, -72.8968],
  fairfield: [41.1408, -73.2613],
  greenwich: [41.0262, -73.6282],
  trumbull: [41.2428, -73.2007],
  glastonbury: [41.7123, -72.6081],
  farmington: [41.7198, -72.832],
  simsbury: [41.8759, -72.8007],
  southington: [41.6001, -72.8779],
  wethersfield: [41.7143, -72.6531],
  branford: [41.2795, -72.8151],
  groton: [41.3498, -72.079],
  guilford: [41.289, -72.6817],
  berlin: [41.6215, -72.7457],
  'rocky hill': [41.664, -72.6392],
  ellington: [41.9037, -72.4695],
  ledyard: [41.439, -72.0148],
  montville: [41.464, -72.152],
  plainville: [41.6743, -72.8579],
  watertown: [41.6062, -73.1187],
  wolcott: [41.6034, -72.9865],
  ansonia: [41.3459, -73.079],
  derby: [41.3229, -73.089],
  seymour: [41.3965, -73.0759],
  oxford: [41.4331, -73.1165],
  monroe: [41.3323, -73.2015],
  newtown: [41.4137, -73.3079],
  bethel: [41.3712, -73.414],
  ridgefield: [41.2818, -73.4979],
  wilton: [41.1953, -73.4379],
  'new canaan': [41.1465, -73.4948],
  darien: [41.0784, -73.4693],
  westport: [41.1415, -73.3579],
  weston: [41.2011, -73.3812],
  easton: [41.2523, -73.2965],
  brookfield: [41.4534, -73.404],
  'new milford': [41.5765, -73.409],
  avon: [41.8098, -72.8305],
  bloomfield: [41.8261, -72.7298],
  canton: [41.8342, -72.8901],
  granby: [41.9487, -72.7898],
  'south windsor': [41.8244, -72.5384],
  'windsor locks': [41.9295, -72.6284],
  suffield: [41.9812, -72.65],
  tolland: [41.8712, -72.3687],
  coventry: [41.7702, -72.305],
  mansfield: [41.7938, -72.2298],
  storrs: [41.8084, -72.2495],
  willimantic: [41.7101, -72.2081],
  windham: [41.7001, -72.155],
  waterford: [41.3418, -72.1364],
  stonington: [41.3354, -71.9053],
  mystic: [41.3543, -71.9662],
  clinton: [41.279, -72.5276],
  'old saybrook': [41.2915, -72.3762],
  madison: [41.2795, -72.5984],
  'north haven': [41.3907, -72.859],
  'east haven': [41.2762, -72.8681],
  orange: [41.2784, -73.0257],
  woodbridge: [41.3529, -73.0087],
  prospect: [41.5023, -72.9784],
  southbury: [41.4812, -73.2131],
  litchfield: [41.7476, -73.191],
  woodbury: [41.5442, -73.2089],
  'new fairfield': [41.4662, -73.4857],
  putnam: [41.9151, -71.9095],
  stafford: [41.9852, -72.302],
  'stafford springs': [41.9552, -72.302],
  somers: [41.9852, -72.446],
  portland: [41.5723, -72.6406],
  'east hampton': [41.5757, -72.5015],
  essex: [41.3542, -72.391],
}

/** Normalize a town name for table lookup. */
function keyFor(town: string): string {
  return town
    .toLowerCase()
    .replace(/\bct\b/g, '')
    .replace(/[^a-z\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Small deterministic hash → stable pseudo-random in [-1, 1]. */
function hashUnit(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return ((h >>> 0) / 0xffffffff) * 2 - 1
}

/**
 * Resolve a town (and optional address seed for jitter) to coordinates.
 * Returns { lat, lng, approx }. Known towns are exact-ish town centers;
 * unknown towns fall back to the CT centroid with a small deterministic
 * offset so multiple unknown-town pins don't stack on one point.
 */
export function geocodeTown(
  town: string | undefined,
  seed = '',
): { lat: number; lng: number; approx: boolean } {
  const k = keyFor(town || '')
  const hit = k && CT_TOWNS[k]
  if (hit) {
    // Small jitter (~0.5 mi) keyed on the seed so co-located businesses
    // in the same town don't render as a single overlapping pin.
    const jx = hashUnit(seed + 'x') * 0.008
    const jy = hashUnit(seed + 'y') * 0.008
    return { lat: hit[0] + jx, lng: hit[1] + jy, approx: true }
  }
  const jx = hashUnit(seed + k + 'x') * 0.25
  const jy = hashUnit(seed + k + 'y') * 0.35
  return { lat: CT_CENTER[0] + jx, lng: CT_CENTER[1] + jy, approx: true }
}
