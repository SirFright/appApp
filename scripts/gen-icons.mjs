// Zero-dependency PWA icon generator.
// Renders a teal rounded-square badge with an amber lightning bolt and encodes
// it to PNG using Node's built-in zlib. Avoids native image dependencies.
import { deflateSync } from 'node:zlib'
import { writeFileSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const outDir = join(__dirname, '..', 'public')
mkdirSync(outDir, { recursive: true })

// Lightning bolt polygon (Feather "zap"), normalized to a 0..1 unit square.
const BOLT = [
  [13, 2],
  [3, 14],
  [12, 14],
  [11, 22],
  [21, 10],
  [12, 10],
].map(([x, y]) => [x / 24, y / 24])

// Scale the bolt about the center so it sits inside the maskable safe zone.
const BOLT_SCALE = 0.82
const boltScaled = BOLT.map(([x, y]) => [
  0.5 + (x - 0.5) * BOLT_SCALE,
  0.5 + (y - 0.5) * BOLT_SCALE,
])

function pointInPolygon(px, py, poly) {
  let inside = false
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i]
    const [xj, yj] = poly[j]
    const intersect =
      yi > py !== yj > py &&
      px < ((xj - xi) * (py - yi)) / (yj - yi) + xi
    if (intersect) inside = !inside
  }
  return inside
}

function lerp(a, b, t) {
  return Math.round(a + (b - a) * t)
}

function makeIcon(size) {
  const buf = Buffer.alloc(size * size * 4)
  const radius = size * 0.23 // rounded corner radius
  const SS = 4 // supersampling for anti-aliasing
  // Brand gradient (teal, top -> bottom)
  const top = [15, 138, 120]
  const bot = [10, 90, 80]
  const bolt = [255, 210, 63]

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let bgCov = 0
      let boltCov = 0
      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const fx = (x + (sx + 0.5) / SS) / size
          const fy = (y + (sy + 0.5) / SS) / size
          if (inRoundedRect(fx * size, fy * size, size, radius)) bgCov++
          if (pointInPolygon(fx, fy, boltScaled)) boltCov++
        }
      }
      const total = SS * SS
      bgCov /= total
      boltCov /= total
      const ty = y / size
      const r0 = lerp(top[0], bot[0], ty)
      const g0 = lerp(top[1], bot[1], ty)
      const b0 = lerp(top[2], bot[2], ty)
      // Composite bolt over background.
      const r = Math.round(r0 * (1 - boltCov) + bolt[0] * boltCov)
      const g = Math.round(g0 * (1 - boltCov) + bolt[1] * boltCov)
      const b = Math.round(b0 * (1 - boltCov) + bolt[2] * boltCov)
      const a = Math.round(255 * bgCov)
      const idx = (y * size + x) * 4
      buf[idx] = r
      buf[idx + 1] = g
      buf[idx + 2] = b
      buf[idx + 3] = a
    }
  }
  return buf
}

function inRoundedRect(px, py, size, radius) {
  const min = radius
  const max = size - radius
  // Straight regions
  if (px >= min && px <= max) return py >= 0 && py <= size
  if (py >= min && py <= max) return px >= 0 && px <= size
  // Corners
  const cx = px < min ? min : max
  const cy = py < min ? min : max
  const dx = px - cx
  const dy = py - cy
  return dx * dx + dy * dy <= radius * radius
}

// --- Minimal PNG encoder (RGBA, filter 0 per row) ---
function crc32(buf) {
  let c = ~0
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i]
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1))
  }
  return ~c >>> 0
}

function chunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length, 0)
  const typeBuf = Buffer.from(type, 'ascii')
  const crcBuf = Buffer.alloc(4)
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0)
  return Buffer.concat([len, typeBuf, data, crcBuf])
}

function encodePng(rgba, size) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 6 // color type RGBA
  ihdr[10] = 0
  ihdr[11] = 0
  ihdr[12] = 0
  // raw scanlines with filter byte 0
  const raw = Buffer.alloc(size * (size * 4 + 1))
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0
    rgba.copy(raw, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4)
  }
  const idat = deflateSync(raw, { level: 9 })
  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', idat),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

const targets = [
  ['pwa-192x192.png', 192],
  ['pwa-512x512.png', 512],
  ['apple-touch-icon.png', 180],
]

for (const [name, size] of targets) {
  const rgba = makeIcon(size)
  const png = encodePng(rgba, size)
  writeFileSync(join(outDir, name), png)
  console.log(`wrote ${name} (${size}x${size}, ${png.length} bytes)`)
}
