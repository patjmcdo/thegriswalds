/**
 * Extracts the ornate gold frame from the room photo and produces a PNG
 * with a transparent center window so the family photo can show through.
 *
 * Source: Web-Back photo (682×1024) — ornate gold mirror on wall.
 * The frame occupies roughly the top 44% of the portrait image.
 * We crop to the frame area, then punch a transparent hole in the center.
 */

import sharp from "sharp";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SRC = "/Users/rouge/.cursor/projects/Users-rouge-Code-THEGRISWALDS/assets/Web-Back-95f073ca-d019-4c97-827b-a0ec50b81060.png";
const OUT = join(__dirname, "../public/gold-frame.png");

// ── Source image: 682 × 1024 ──────────────────────────────────────────────
// The ornate gold frame sits from approx y=55 to y=488 (433px tall)
// Left edge starts at x=48, right ends at x=636 → width ~588
// Crop these constants to taste if the frame alignment needs tweaking.
const CROP = { left: 48, top: 55, width: 588, height: 433 };

// After crop, the inner mirror opening (where family photo should show) is
// roughly: 12% inset from each side of the crop box.
// Adjust these percentages if the frame border looks too thick/thin.
const INNER_TOP_PCT    = 0.135;
const INNER_LEFT_PCT   = 0.088;
const INNER_BOTTOM_PCT = 0.135;
const INNER_RIGHT_PCT  = 0.088;

async function run() {
  // 1. Crop to just the frame area
  const cropped = await sharp(SRC)
    .extract(CROP)
    .png()
    .toBuffer();

  const { width, height } = await sharp(cropped).metadata();
  console.log(`Cropped frame: ${width}×${height}`);

  // 2. Build an SVG mask: white = keep, black = transparent
  //    The "hole" is a rectangle inside the frame border.
  const holeX      = Math.round(width  * INNER_LEFT_PCT);
  const holeY      = Math.round(height * INNER_TOP_PCT);
  const holeW      = Math.round(width  * (1 - INNER_LEFT_PCT - INNER_RIGHT_PCT));
  const holeH      = Math.round(height * (1 - INNER_TOP_PCT  - INNER_BOTTOM_PCT));

  console.log(`Transparent hole: x=${holeX} y=${holeY} w=${holeW} h=${holeH}`);

  // SVG mask: white outside hole (keep frame), black inside hole (transparent)
  const maskSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
  <rect width="${width}" height="${height}" fill="white"/>
  <rect x="${holeX}" y="${holeY}" width="${holeW}" height="${holeH}" fill="black"/>
</svg>`.trim();

  const maskBuf = Buffer.from(maskSvg);

  // 3. Apply mask: black areas become transparent (requires extractChannel workaround)
  //    We composite the mask as an alpha channel.
  const maskAlpha = await sharp(maskBuf)
    .png()
    .toBuffer();

  // Extract just the luminance of the mask as our alpha map
  const alphaChannel = await sharp(maskAlpha)
    .extractChannel("red")
    .toBuffer();

  // Join the cropped RGB + our computed alpha
  const result = await sharp(cropped)
    .ensureAlpha()
    .joinChannel(alphaChannel)
    .png()
    .toFile(OUT);

  console.log(`✓ Saved: ${OUT}`);
  console.log(`  ${result.width}×${result.height}, ${result.size} bytes`);
}

run().catch((e) => { console.error(e); process.exit(1); });
