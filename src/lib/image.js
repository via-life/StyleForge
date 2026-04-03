import { BACKGROUND_OPTIONS, EXPORT_SIZE, STYLE_OPTIONS } from './constants';
import { clampRgbChannel, hexToRgb, normalizeHexColor, rgbToCss } from './colors';

const SUPPORTED_TYPES = new Set(['image/jpeg', 'image/png']);
const SUPPORTED_EXTENSIONS = ['.jpg', '.jpeg', '.png'];
const SAMPLE_SIZE = 56;
const DEFAULT_CUSTOM_STYLE_COLORS = ['#6FD2FF', '#9AF3D0', '#FFFFFF'];
const PREVIEW_SIZE_BY_TIER = {
  desktop: 320,
  mobile: 224,
  'low-end-mobile': 160
};

const styledSampleCache = new WeakMap();
const extractedSampleCache = new WeakMap();
const previewCache = new WeakMap();

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function mix(start, end, amount) {
  return start + (end - start) * amount;
}

function roundChannel(value) {
  return Math.round(clamp(value, 0, 255));
}

function getImageSize(image) {
  return {
    width: image.naturalWidth || image.width,
    height: image.naturalHeight || image.height
  };
}

function createCanvas(size) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  return canvas;
}

function isSupportedFile(file) {
  const lowerName = file.name.toLowerCase();
  return SUPPORTED_TYPES.has(file.type) || SUPPORTED_EXTENSIONS.some(ext => lowerName.endsWith(ext));
}

function sanitizeFileName(name) {
  return name.replace(/\.[a-zA-Z0-9]+$/, '').replace(/[^a-zA-Z0-9-_]+/g, '-').replace(/-+/g, '-');
}

function rgbToHsl(red, green, blue) {
  const r = red / 255;
  const g = green / 255;
  const b = blue / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const lightness = (max + min) / 2;

  if (max === min) {
    return { h: 0, s: 0, l: lightness };
  }

  const delta = max - min;
  const saturation = lightness > 0.5 ? delta / (2 - max - min) : delta / (max + min);
  let hue = 0;

  switch (max) {
    case r:
      hue = (g - b) / delta + (g < b ? 6 : 0);
      break;
    case g:
      hue = (b - r) / delta + 2;
      break;
    default:
      hue = (r - g) / delta + 4;
  }

  return { h: hue / 6, s: saturation, l: lightness };
}

function hueToRgb(p, q, t) {
  let next = t;

  if (next < 0) {
    next += 1;
  }
  if (next > 1) {
    next -= 1;
  }
  if (next < 1 / 6) {
    return p + (q - p) * 6 * next;
  }
  if (next < 1 / 2) {
    return q;
  }
  if (next < 2 / 3) {
    return p + (q - p) * (2 / 3 - next) * 6;
  }
  return p;
}

function hslToRgb(hue, saturation, lightness) {
  const h = ((hue % 1) + 1) % 1;
  const s = clamp(saturation, 0, 1);
  const l = clamp(lightness, 0, 1);

  if (s === 0) {
    const channel = roundChannel(l * 255);
    return { r: channel, g: channel, b: channel };
  }

  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;

  return {
    r: roundChannel(hueToRgb(p, q, h + 1 / 3) * 255),
    g: roundChannel(hueToRgb(p, q, h) * 255),
    b: roundChannel(hueToRgb(p, q, h - 1 / 3) * 255)
  };
}

function blendRgb(source, target, amount) {
  return {
    r: roundChannel(mix(source.r, target.r, amount)),
    g: roundChannel(mix(source.g, target.g, amount)),
    b: roundChannel(mix(source.b, target.b, amount))
  };
}

function adjustContrast(channel, amount) {
  return roundChannel((channel - 128) * amount + 128);
}

function tintHex(hex, targetHex, amount) {
  const safeHex = hex === 'transparent' ? '#f4f8f6' : hex;
  const result = blendRgb(hexToRgb(safeHex), hexToRgb(targetHex), amount);
  return rgbToCss(result);
}

function normalizePreviewBackground(backgroundColor) {
  return backgroundColor === 'transparent' ? '#f4f8f6' : backgroundColor;
}

function getPreviewSizeForTier(tier = 'desktop') {
  return PREVIEW_SIZE_BY_TIER[tier] || PREVIEW_SIZE_BY_TIER.desktop;
}

function getPreviewCache(image) {
  let imageCache = previewCache.get(image);

  if (!imageCache) {
    imageCache = new Map();
    previewCache.set(image, imageCache);
  }

  return imageCache;
}

function getPreviewCacheKey({ style, backgroundColor, pixelLevel, tier, subjectOpacity }) {
  return [
    style,
    backgroundColor || 'transparent',
    pixelLevel || EXPORT_SIZE,
    tier || 'desktop',
    subjectOpacity ?? 100
  ].join('|');
}

function getContainFrame(image, size) {
  const { width, height } = getImageSize(image);
  const scale = Math.min(size / width, size / height);
  const drawWidth = Math.max(1, Math.round(width * scale));
  const drawHeight = Math.max(1, Math.round(height * scale));

  return {
    x: Math.round((size - drawWidth) / 2),
    y: Math.round((size - drawHeight) / 2),
    width: drawWidth,
    height: drawHeight
  };
}

function createPreviewCardSvg({ title, subtitle, fillA, fillB, accent, textColor = '#10202d' }) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 620 620">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${fillA}" />
          <stop offset="100%" stop-color="${fillB}" />
        </linearGradient>
      </defs>
      <rect width="620" height="620" rx="72" fill="url(#bg)" />
      <rect x="82" y="88" width="456" height="456" rx="62" fill="rgba(255,255,255,0.52)" />
      <circle cx="310" cy="242" r="100" fill="${accent}" opacity="0.92" />
      <rect x="186" y="334" width="248" height="138" rx="69" fill="${accent}" opacity="0.74" />
      <g fill="rgba(16,32,45,0.12)">
        <rect x="114" y="118" width="24" height="24" rx="7" />
        <rect x="484" y="118" width="24" height="24" rx="7" />
        <rect x="114" y="486" width="24" height="24" rx="7" />
        <rect x="484" y="486" width="24" height="24" rx="7" />
      </g>
      <text x="68" y="568" fill="${textColor}" font-size="44" font-weight="700" font-family="monospace">${title}</text>
      <text x="70" y="602" fill="${textColor}" opacity="0.7" font-size="20" font-family="monospace">${subtitle}</text>
    </svg>
  `;

  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

function colorDistance(redA, greenA, blueA, redB, greenB, blueB) {
  return Math.sqrt(
    (redA - redB) * (redA - redB) +
      (greenA - greenB) * (greenA - greenB) +
      (blueA - blueB) * (blueA - blueB)
  );
}

function sampleRegion(data, size, centerX, centerY) {
  let red = 0;
  let green = 0;
  let blue = 0;
  let count = 0;

  for (let offsetY = -1; offsetY <= 1; offsetY += 1) {
    for (let offsetX = -1; offsetX <= 1; offsetX += 1) {
      const x = clamp(centerX + offsetX, 0, size - 1);
      const y = clamp(centerY + offsetY, 0, size - 1);
      const index = (y * size + x) * 4;
      red += data[index];
      green += data[index + 1];
      blue += data[index + 2];
      count += 1;
    }
  }

  return {
    r: red / count,
    g: green / count,
    b: blue / count
  };
}

function collectReferenceColors(data, size) {
  return [
    sampleRegion(data, size, 0, 0),
    sampleRegion(data, size, size - 1, 0),
    sampleRegion(data, size, 0, size - 1),
    sampleRegion(data, size, size - 1, size - 1),
    sampleRegion(data, size, Math.floor(size / 2), 0),
    sampleRegion(data, size, Math.floor(size / 2), size - 1)
  ];
}

function averageSeedDeviation(seeds) {
  const base = seeds[0];
  return seeds.reduce((total, seed) => total + colorDistance(seed.r, seed.g, seed.b, base.r, base.g, base.b), 0) / seeds.length;
}

function distanceToSeeds(red, green, blue, seeds) {
  let nearest = Number.POSITIVE_INFINITY;

  for (const seed of seeds) {
    nearest = Math.min(nearest, colorDistance(red, green, blue, seed.r, seed.g, seed.b));
  }

  return nearest;
}

function softenEdges(data, backgroundMask, size) {
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const pixelIndex = y * size + x;

      if (backgroundMask[pixelIndex]) {
        data[pixelIndex * 4 + 3] = 0;
        continue;
      }

      let backgroundNeighbors = 0;

      for (let offsetY = -1; offsetY <= 1; offsetY += 1) {
        for (let offsetX = -1; offsetX <= 1; offsetX += 1) {
          if (offsetX === 0 && offsetY === 0) {
            continue;
          }

          const nextX = x + offsetX;
          const nextY = y + offsetY;

          if (nextX < 0 || nextY < 0 || nextX >= size || nextY >= size) {
            backgroundNeighbors += 1;
            continue;
          }

          if (backgroundMask[nextY * size + nextX]) {
            backgroundNeighbors += 1;
          }
        }
      }

      const alphaIndex = pixelIndex * 4 + 3;
      if (backgroundNeighbors >= 5) {
        data[alphaIndex] = Math.round(data[alphaIndex] * 0.58);
      } else if (backgroundNeighbors >= 3) {
        data[alphaIndex] = Math.round(data[alphaIndex] * 0.78);
      }
    }
  }
}

function removeBackground(data, size) {
  const seeds = collectReferenceColors(data, size);
  const threshold = clamp(averageSeedDeviation(seeds) * 1.35 + 26, 24, 78);
  const visited = new Uint8Array(size * size);
  const backgroundMask = new Uint8Array(size * size);
  const queue = [];

  const tryEnqueue = pixelIndex => {
    if (visited[pixelIndex]) {
      return;
    }

    const channelIndex = pixelIndex * 4;
    const alpha = data[channelIndex + 3];
    if (alpha < 8) {
      visited[pixelIndex] = 1;
      backgroundMask[pixelIndex] = 1;
      queue.push(pixelIndex);
      return;
    }

    const distance = distanceToSeeds(data[channelIndex], data[channelIndex + 1], data[channelIndex + 2], seeds);
    if (distance <= threshold) {
      visited[pixelIndex] = 1;
      backgroundMask[pixelIndex] = 1;
      queue.push(pixelIndex);
    }
  };

  for (let x = 0; x < size; x += 1) {
    tryEnqueue(x);
    tryEnqueue((size - 1) * size + x);
  }

  for (let y = 0; y < size; y += 1) {
    tryEnqueue(y * size);
    tryEnqueue(y * size + size - 1);
  }

  let queueIndex = 0;

  while (queueIndex < queue.length) {
    const pixelIndex = queue[queueIndex];
    queueIndex += 1;
    const x = pixelIndex % size;
    const y = Math.floor(pixelIndex / size);

    const neighbors = [
      [x - 1, y],
      [x + 1, y],
      [x, y - 1],
      [x, y + 1]
    ];

    for (const [nextX, nextY] of neighbors) {
      if (nextX < 0 || nextY < 0 || nextX >= size || nextY >= size) {
        continue;
      }

      const nextIndex = nextY * size + nextX;
      if (visited[nextIndex]) {
        continue;
      }

      const channelIndex = nextIndex * 4;
      const alpha = data[channelIndex + 3];
      const distance = distanceToSeeds(data[channelIndex], data[channelIndex + 1], data[channelIndex + 2], seeds);

      if (alpha < 8 || distance <= threshold + 8) {
        visited[nextIndex] = 1;
        backgroundMask[nextIndex] = 1;
        queue.push(nextIndex);
      }
    }
  }

  softenEdges(data, backgroundMask, size);
}

function getExtractedSample(image) {
  const cached = extractedSampleCache.get(image);

  if (cached) {
    return cached;
  }

  const sampleCanvas = createCanvas(EXPORT_SIZE);
  const sampleCtx = sampleCanvas.getContext('2d', { willReadFrequently: true });
  const frame = getContainFrame(image, EXPORT_SIZE);

  sampleCtx.drawImage(
    image,
    0,
    0,
    image.naturalWidth || image.width,
    image.naturalHeight || image.height,
    frame.x,
    frame.y,
    frame.width,
    frame.height
  );

  const imageData = sampleCtx.getImageData(0, 0, EXPORT_SIZE, EXPORT_SIZE);
  const { data } = imageData;
  removeBackground(data, EXPORT_SIZE);
  sampleCtx.putImageData(imageData, 0, 0);
  extractedSampleCache.set(image, sampleCanvas);

  return sampleCanvas;
}

function normalizeCustomStyleColors(colors = [], count = 1) {
  const safeCount = clamp(Number(count) || 1, 1, 3);
  const palette = Array.from({ length: safeCount }, (_, index) =>
    normalizeHexColor(colors[index] || DEFAULT_CUSTOM_STYLE_COLORS[index] || DEFAULT_CUSTOM_STYLE_COLORS[0])
  );
  return palette;
}

function buildStyleCacheKey(style, customStyleColors, customStyleColorCount) {
  if (style !== 'custom') {
    return style;
  }

  return `custom|${normalizeCustomStyleColors(customStyleColors, customStyleColorCount).join('|')}`;
}

function transformCustomPixel(red, green, blue, customStyleColors, customStyleColorCount) {
  const luminance = (0.2126 * red + 0.7152 * green + 0.0722 * blue) / 255;
  const palette = normalizeCustomStyleColors(customStyleColors, customStyleColorCount).map(hexToRgb);

  if (palette.length === 1) {
    const shadow = blendRgb({ r: 12, g: 18, b: 28 }, palette[0], 0.78);
    const highlight = blendRgb(palette[0], { r: 255, g: 255, b: 255 }, 0.34);
    return blendRgb(shadow, highlight, luminance);
  }

  if (palette.length === 2) {
    return blendRgb(palette[0], palette[1], luminance);
  }

  if (luminance < 0.5) {
    return blendRgb(palette[0], palette[1], luminance * 2);
  }

  return blendRgb(palette[1], palette[2], (luminance - 0.5) * 2);
}

function transformPixel(style, red, green, blue, options = {}) {
  const hsl = rgbToHsl(red, green, blue);
  const luminance = (0.2126 * red + 0.7152 * green + 0.0722 * blue) / 255;

  if (style === 'custom') {
    return transformCustomPixel(red, green, blue, options.customStyleColors, options.customStyleColorCount);
  }

  if (style === 'fresh') {
    const base = hslToRgb(hsl.h * 0.96 + 0.04, clamp(hsl.s * 0.9 + 0.06, 0, 1), clamp(hsl.l + 0.12, 0, 1));
    return blendRgb(base, { r: 174, g: 240, b: 220 }, 0.18);
  }

  if (style === 'cyber') {
    const palette = [
      { r: 5, g: 15, b: 30 },
      { r: 19, g: 52, b: 95 },
      { r: 10, g: 214, b: 214 },
      { r: 219, g: 55, b: 197 },
      { r: 244, g: 251, b: 255 }
    ];
    const segment = clamp(Math.round(luminance * (palette.length - 1)), 0, palette.length - 1);
    const paletteColor = palette[segment];
    const source = { r: red, g: green, b: blue };
    const intensity = clamp(Math.abs((blue - red) / 255) * 0.5 + 0.48, 0.42, 0.78);
    return blendRgb(source, paletteColor, intensity);
  }

  if (style === 'dopamine') {
    const hueSlots = [0.08, 0.14, 0.53, 0.9];
    const mappedHue = hueSlots[Math.floor(hsl.h * hueSlots.length) % hueSlots.length];
    const base = hslToRgb(mappedHue, clamp(hsl.s * 1.5 + 0.18, 0, 1), clamp(hsl.l + 0.08, 0, 1));
    const candy = luminance > 0.62 ? { r: 255, g: 214, b: 77 } : { r: 255, g: 86, b: 140 };
    return blendRgb(base, candy, luminance > 0.62 ? 0.18 : 0.12);
  }

  if (style === 'dark') {
    const shadow = { r: 10, g: 18, b: 30 };
    const mid = { r: 54, g: 73, b: 98 };
    const highlight = { r: 215, g: 224, b: 237 };
    const blend = luminance < 0.42 ? shadow : luminance < 0.76 ? mid : highlight;
    const cool = blendRgb({ r: red, g: green, b: blue }, blend, luminance < 0.42 ? 0.76 : 0.58);
    return {
      r: roundChannel(cool.r * 0.94),
      g: roundChannel(cool.g * 0.97),
      b: roundChannel(cool.b * 1.04)
    };
  }

  if (style === 'glass') {
    const desaturated = hslToRgb(hsl.h * 0.96 + 0.02, clamp(hsl.s * 0.26 + 0.04, 0, 1), clamp(0.2 + luminance * 0.62, 0, 1));
    const icyTone = luminance > 0.58 ? { r: 232, g: 245, b: 255 } : { r: 181, g: 213, b: 236 };
    const mixed = blendRgb(desaturated, icyTone, 0.42 + luminance * 0.08);
    return {
      r: roundChannel(mixed.r * (0.95 + luminance * 0.12)),
      g: roundChannel(mixed.g * (0.98 + luminance * 0.08)),
      b: roundChannel(mixed.b * (1.04 + luminance * 0.12))
    };
  }

  return {
    r: adjustContrast(red, 1.02),
    g: adjustContrast(green, 1.02),
    b: adjustContrast(blue, 1.02)
  };
}

function paintPixelGrid(ctx, size, opacity) {
  void ctx;
  void size;
  void opacity;
}

function paintOverlayToMask(ctx, size, style) {
  if (style === 'fresh') {
    const gradient = ctx.createLinearGradient(0, 0, size, size);
    gradient.addColorStop(0, 'rgba(139, 211, 199, 0.18)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
    paintPixelGrid(ctx, size, 0.045);
    return;
  }

  if (style === 'cyber') {
    const glow = ctx.createLinearGradient(0, 0, size, size);
    glow.addColorStop(0, 'rgba(6, 214, 214, 0.18)');
    glow.addColorStop(0.5, 'rgba(255, 0, 179, 0.06)');
    glow.addColorStop(1, 'rgba(3, 8, 19, 0.12)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, size, size);
    paintPixelGrid(ctx, size, 0.06);
    return;
  }

  if (style === 'dopamine') {
    const burst = ctx.createRadialGradient(size * 0.28, size * 0.22, size * 0.06, size * 0.5, size * 0.5, size * 0.7);
    burst.addColorStop(0, 'rgba(255, 214, 77, 0.18)');
    burst.addColorStop(0.35, 'rgba(255, 112, 146, 0.1)');
    burst.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = burst;
    ctx.fillRect(0, 0, size, size);
    paintPixelGrid(ctx, size, 0.035);
    return;
  }

  if (style === 'dark') {
    const vignette = ctx.createRadialGradient(size / 2, size / 2, size * 0.22, size / 2, size / 2, size * 0.74);
    vignette.addColorStop(0, 'rgba(255, 255, 255, 0)');
    vignette.addColorStop(1, 'rgba(4, 6, 12, 0.42)');
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, size, size);
    paintPixelGrid(ctx, size, 0.03);
    return;
  }

  if (style === 'glass') {
    const frost = ctx.createLinearGradient(0, 0, size, size);
    frost.addColorStop(0, 'rgba(255, 255, 255, 0.34)');
    frost.addColorStop(0.45, 'rgba(220, 240, 255, 0.14)');
    frost.addColorStop(1, 'rgba(150, 196, 228, 0.08)');
    ctx.fillStyle = frost;
    ctx.fillRect(0, 0, size, size);

    const reflection = ctx.createLinearGradient(size * 0.15, 0, size * 0.85, size);
    reflection.addColorStop(0, 'rgba(255, 255, 255, 0.38)');
    reflection.addColorStop(0.3, 'rgba(255, 255, 255, 0.08)');
    reflection.addColorStop(0.6, 'rgba(173, 219, 255, 0.16)');
    reflection.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = reflection;
    ctx.fillRect(0, 0, size, size);

    const rim = ctx.createRadialGradient(size * 0.35, size * 0.24, size * 0.04, size * 0.5, size * 0.5, size * 0.74);
    rim.addColorStop(0, 'rgba(255,255,255,0.22)');
    rim.addColorStop(0.55, 'rgba(255,255,255,0.04)');
    rim.addColorStop(1, 'rgba(125, 182, 221, 0.16)');
    ctx.fillStyle = rim;
    ctx.fillRect(0, 0, size, size);
    paintPixelGrid(ctx, size, 0.022);
    return;
  }

  if (style === 'custom') {
    paintPixelGrid(ctx, size, 0.028);
    return;
  }

  paintPixelGrid(ctx, size, 0.05);
}

function applySubjectOverlay(subjectCanvas, style) {
  const size = subjectCanvas.width;
  const overlayCanvas = createCanvas(size);
  const overlayCtx = overlayCanvas.getContext('2d');

  paintOverlayToMask(overlayCtx, size, style);
  overlayCtx.globalCompositeOperation = 'destination-in';
  overlayCtx.drawImage(subjectCanvas, 0, 0);

  const subjectCtx = subjectCanvas.getContext('2d');
  subjectCtx.drawImage(overlayCanvas, 0, 0);
}

function createStyledSample({ image, style, customStyleColors, customStyleColorCount }) {
  const baseCanvas = getExtractedSample(image);
  const sampleCanvas = createCanvas(EXPORT_SIZE);
  const sampleCtx = sampleCanvas.getContext('2d', { willReadFrequently: true });

  sampleCtx.clearRect(0, 0, EXPORT_SIZE, EXPORT_SIZE);
  sampleCtx.drawImage(baseCanvas, 0, 0);

  const imageData = sampleCtx.getImageData(0, 0, EXPORT_SIZE, EXPORT_SIZE);
  const { data } = imageData;

  for (let index = 0; index < data.length; index += 4) {
    if (data[index + 3] === 0) {
      continue;
    }

    const next = transformPixel(style, data[index], data[index + 1], data[index + 2], {
      customStyleColors,
      customStyleColorCount
    });
    data[index] = next.r;
    data[index + 1] = next.g;
    data[index + 2] = next.b;
  }

  sampleCtx.putImageData(imageData, 0, 0);
  applySubjectOverlay(sampleCanvas, style);
  return sampleCanvas;
}

function getStyledSample(image, style, customStyleColors, customStyleColorCount) {
  let styleCache = styledSampleCache.get(image);
  if (!styleCache) {
    styleCache = new Map();
    styledSampleCache.set(image, styleCache);
  }

  const cacheKey = buildStyleCacheKey(style, customStyleColors, customStyleColorCount);

  if (!styleCache.has(cacheKey)) {
    const styledSample = createStyledSample({
      image,
      style,
      customStyleColors,
      customStyleColorCount
    });
    styleCache.set(cacheKey, styledSample);
  }

  return styleCache.get(cacheKey);
}

function createPixelatedSubject({ image, style, size, pixelLevel, customStyleColors, customStyleColorCount }) {
  const styledSample = getStyledSample(image, style, customStyleColors, customStyleColorCount);
  const subjectCanvas = createCanvas(size);
  const subjectCtx = subjectCanvas.getContext('2d');
  const rasterSize = clamp(Math.min(Number(pixelLevel) || EXPORT_SIZE, size), 1, size);
  const rasterCanvas = createCanvas(rasterSize);
  const rasterCtx = rasterCanvas.getContext('2d');

  rasterCtx.clearRect(0, 0, rasterSize, rasterSize);
  rasterCtx.imageSmoothingEnabled = true;
  rasterCtx.drawImage(styledSample, 0, 0, rasterSize, rasterSize);

  subjectCtx.clearRect(0, 0, size, size);
  subjectCtx.imageSmoothingEnabled = false;
  subjectCtx.drawImage(rasterCanvas, 0, 0, rasterSize, rasterSize, 0, 0, size, size);

  return subjectCanvas;
}

function getEffectiveStyle(style, customStyleEnabled) {
  return customStyleEnabled ? 'custom' : style;
}

function renderToCanvas({
  canvas,
  image,
  style,
  backgroundColor,
  size,
  pixelLevel,
  subjectOpacity = 100,
  customStyleEnabled = false,
  customStyleColors = DEFAULT_CUSTOM_STYLE_COLORS,
  customStyleColorCount = 2
}) {
  const ctx = canvas.getContext('2d');
  canvas.width = size;
  canvas.height = size;

  ctx.clearRect(0, 0, size, size);

  if (backgroundColor && backgroundColor !== 'transparent') {
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, size, size);
  }

  const effectiveStyle = getEffectiveStyle(style, customStyleEnabled);
  const subjectCanvas = createPixelatedSubject({
    image,
    style: effectiveStyle,
    size,
    pixelLevel,
    customStyleColors,
    customStyleColorCount
  });

  ctx.save();
  ctx.globalAlpha = clamp((Number(subjectOpacity) || 0) / 100, 0, 1);
  ctx.drawImage(subjectCanvas, 0, 0);
  ctx.restore();
}

function yieldToBrowser() {
  return new Promise(resolve => {
    if (typeof window !== 'undefined' && typeof window.requestAnimationFrame === 'function') {
      window.requestAnimationFrame(() => resolve());
      return;
    }

    setTimeout(resolve, 0);
  });
}

export async function decodeLocalImage(file) {
  if (!file) {
    throw new Error('没有检测到图片文件。');
  }

  if (!isSupportedFile(file)) {
    throw new Error('仅支持 JPG、JPEG 和 PNG 图片。');
  }

  const objectUrl = URL.createObjectURL(file);

  return new Promise((resolve, reject) => {
    const image = new Image();
    image.decoding = 'async';
    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve({ file, image });
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('图片解析失败，请换一张更标准的图片。'));
    };
    image.src = objectUrl;
  });
}

export function renderAvatarPreview({
  canvas,
  image,
  style,
  backgroundColor,
  pixelLevel,
  subjectOpacity,
  customStyleEnabled,
  customStyleColors,
  customStyleColorCount
}) {
  renderToCanvas({
    canvas,
    image,
    style,
    backgroundColor,
    size: EXPORT_SIZE,
    pixelLevel,
    subjectOpacity,
    customStyleEnabled,
    customStyleColors,
    customStyleColorCount
  });
}

export async function buildStylePreview({
  image,
  style,
  backgroundColor,
  pixelLevel,
  subjectOpacity,
  tier = 'desktop'
}) {
  const previewSize = getPreviewSizeForTier(tier);
  const cacheKey = getPreviewCacheKey({ style, backgroundColor, pixelLevel, tier, subjectOpacity });
  const imageCache = getPreviewCache(image);

  if (imageCache.has(cacheKey)) {
    return imageCache.get(cacheKey);
  }

  const canvas = createCanvas(previewSize);
  renderToCanvas({
    canvas,
    image,
    style,
    backgroundColor,
    size: previewSize,
    pixelLevel,
    subjectOpacity
  });

  const previewDataUrl = canvas.toDataURL('image/png');
  imageCache.set(cacheKey, previewDataUrl);
  return previewDataUrl;
}

export async function buildStylePreviewsProgressive({
  image,
  backgroundColor,
  pixelLevel,
  priorityStyle,
  subjectOpacity,
  tier = 'desktop',
  onPreview,
  signal
}) {
  const orderedStyles = [
    ...STYLE_OPTIONS.filter(style => style.id === priorityStyle),
    ...STYLE_OPTIONS.filter(style => style.id !== priorityStyle)
  ];

  for (const style of orderedStyles) {
    if (signal?.aborted) {
      return;
    }

    const previewImage = await buildStylePreview({
      image,
      style: style.id,
      backgroundColor,
      pixelLevel,
      subjectOpacity,
      tier
    });

    if (signal?.aborted) {
      return;
    }

    onPreview?.({
      id: style.id,
      text: style.label,
      note: style.description,
      image: previewImage
    });

    await yieldToBrowser();
  }
}

export async function exportAvatarPng({
  image,
  style,
  backgroundColor,
  fileName,
  pixelLevel,
  subjectOpacity,
  customStyleEnabled,
  customStyleColors,
  customStyleColorCount
}) {
  const canvas = createCanvas(EXPORT_SIZE);
  renderToCanvas({
    canvas,
    image,
    style,
    backgroundColor,
    size: EXPORT_SIZE,
    pixelLevel,
    subjectOpacity,
    customStyleEnabled,
    customStyleColors,
    customStyleColorCount
  });

  const link = document.createElement('a');
  const cleanName = sanitizeFileName(fileName || 'avatar');
  const outputMode = customStyleEnabled ? 'custom' : style;
  link.href = canvas.toDataURL('image/png');
  link.download = `${cleanName}-${outputMode}.png`;
  link.click();
}

export function getDefaultGalleryItems(backgroundColor = BACKGROUND_OPTIONS[0].value) {
  const previewBackground = normalizePreviewBackground(backgroundColor);
  const fillBase = previewBackground;

  return STYLE_OPTIONS.map(style => {
    if (style.id === 'fresh') {
      return {
        id: style.id,
        text: style.label,
        note: style.description,
        image: createPreviewCardSvg({
          title: 'FRESH',
          subtitle: 'AIRY COOL TONE',
          fillA: fillBase,
          fillB: tintHex(previewBackground, '#b8efe2', 0.55),
          accent: '#8bd3c7'
        })
      };
    }

    if (style.id === 'cyber') {
      return {
        id: style.id,
        text: style.label,
        note: style.description,
        image: createPreviewCardSvg({
          title: 'CYBER',
          subtitle: 'NEON SPLIT GLOW',
          fillA: tintHex(previewBackground, '#071427', 0.45),
          fillB: '#1e1038',
          accent: '#17d4f2',
          textColor: '#f0fbff'
        })
      };
    }

    if (style.id === 'dopamine') {
      return {
        id: style.id,
        text: style.label,
        note: style.description,
        image: createPreviewCardSvg({
          title: 'DOPAMINE',
          subtitle: 'BRIGHT SOCIAL POP',
          fillA: tintHex(previewBackground, '#fff2a6', 0.4),
          fillB: '#ff8ab8',
          accent: '#ffb000'
        })
      };
    }

    if (style.id === 'dark') {
      return {
        id: style.id,
        text: style.label,
        note: style.description,
        image: createPreviewCardSvg({
          title: 'DARK',
          subtitle: 'LOW KEY COLD EDGE',
          fillA: '#161b24',
          fillB: tintHex(previewBackground, '#09111f', 0.82),
          accent: '#7a8fb5',
          textColor: '#eef6ff'
        })
      };
    }

    if (style.id === 'glass') {
      return {
        id: style.id,
        text: style.label,
        note: style.description,
        image: createPreviewCardSvg({
          title: 'GLASS',
          subtitle: 'LIQUID LIGHT LAYERS',
          fillA: tintHex(previewBackground, '#eff8ff', 0.6),
          fillB: tintHex(previewBackground, '#b4d3f0', 0.46),
          accent: '#d7eeff'
        })
      };
    }

    return {
      id: style.id,
      text: style.label,
      note: style.description,
      image: createPreviewCardSvg({
        title: 'NORMAL',
        subtitle: 'CLEAN PIXEL PORTRAIT',
        fillA: fillBase,
        fillB: tintHex(previewBackground, '#dbefff', 0.42),
        accent: '#ff9268'
      })
    };
  });
}
