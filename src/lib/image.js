import { BACKGROUND_OPTIONS, EXPORT_SIZE, STYLE_OPTIONS } from './appConstants';

const SUPPORTED_TYPES = new Set(['image/jpeg', 'image/png']);
const SUPPORTED_EXTENSIONS = ['.jpg', '.jpeg', '.png'];
const SAMPLE_SIZE = 56;

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

function drawRoundedRect(ctx, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
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

function hexToRgb(hex) {
  const normalized = hex.replace('#', '');
  const value = normalized.length === 3
    ? normalized
        .split('')
        .map(char => char + char)
        .join('')
    : normalized;

  const numeric = Number.parseInt(value, 16);
  return {
    r: (numeric >> 16) & 255,
    g: (numeric >> 8) & 255,
    b: numeric & 255
  };
}

function tintHex(hex, targetHex, amount) {
  const safeHex = hex === 'transparent' ? '#f4f8f6' : hex;
  const result = blendRgb(hexToRgb(safeHex), hexToRgb(targetHex), amount);
  return `rgb(${result.r}, ${result.g}, ${result.b})`;
}

function normalizePreviewBackground(backgroundColor) {
  return backgroundColor === 'transparent' ? '#f4f8f6' : backgroundColor;
}

const styledSampleCache = new WeakMap();

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

function adjustContrast(channel, amount) {
  return roundChannel((channel - 128) * amount + 128);
}

function transformPixel(style, red, green, blue) {
  const hsl = rgbToHsl(red, green, blue);
  const luminance = (0.2126 * red + 0.7152 * green + 0.0722 * blue) / 255;

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

  return {
    r: adjustContrast(red, 1.02),
    g: adjustContrast(green, 1.02),
    b: adjustContrast(blue, 1.02)
  };
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

  while (queue.length) {
    const pixelIndex = queue.shift();
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

function createStyledSample({ image, style }) {
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

  for (let index = 0; index < data.length; index += 4) {
    if (data[index + 3] === 0) {
      continue;
    }

    const next = transformPixel(style, data[index], data[index + 1], data[index + 2]);
    data[index] = next.r;
    data[index + 1] = next.g;
    data[index + 2] = next.b;
  }

  sampleCtx.putImageData(imageData, 0, 0);
  return sampleCanvas;
}

function drawPixelGrid(ctx, size, opacity) {
  const step = size / SAMPLE_SIZE;
  ctx.save();
  ctx.strokeStyle = `rgba(16, 32, 45, ${opacity})`;
  ctx.lineWidth = Math.max(0.8, size / 640);

  for (let index = 1; index < SAMPLE_SIZE; index += 1) {
    const offset = step * index;
    ctx.beginPath();
    ctx.moveTo(offset, 0);
    ctx.lineTo(offset, size);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, offset);
    ctx.lineTo(size, offset);
    ctx.stroke();
  }

  ctx.restore();
}

function paintOverlayToMask(ctx, size, style) {
  if (style === 'fresh') {
    const gradient = ctx.createLinearGradient(0, 0, size, size);
    gradient.addColorStop(0, 'rgba(139, 211, 199, 0.18)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
    drawPixelGrid(ctx, size, 0.045);
    return;
  }

  if (style === 'cyber') {
    const glow = ctx.createLinearGradient(0, 0, size, size);
    glow.addColorStop(0, 'rgba(6, 214, 214, 0.18)');
    glow.addColorStop(0.5, 'rgba(255, 0, 179, 0.06)');
    glow.addColorStop(1, 'rgba(3, 8, 19, 0.12)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, size, size);
    drawPixelGrid(ctx, size, 0.06);
    return;
  }

  if (style === 'dopamine') {
    const burst = ctx.createRadialGradient(size * 0.28, size * 0.22, size * 0.06, size * 0.5, size * 0.5, size * 0.7);
    burst.addColorStop(0, 'rgba(255, 214, 77, 0.18)');
    burst.addColorStop(0.35, 'rgba(255, 112, 146, 0.1)');
    burst.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = burst;
    ctx.fillRect(0, 0, size, size);
    drawPixelGrid(ctx, size, 0.035);
    return;
  }

  if (style === 'dark') {
    const vignette = ctx.createRadialGradient(size / 2, size / 2, size * 0.22, size / 2, size / 2, size * 0.74);
    vignette.addColorStop(0, 'rgba(255, 255, 255, 0)');
    vignette.addColorStop(1, 'rgba(4, 6, 12, 0.42)');
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, size, size);
    drawPixelGrid(ctx, size, 0.03);
    return;
  }

  drawPixelGrid(ctx, size, 0.05);
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

function getStyledSample(image, style) {
  let styleCache = styledSampleCache.get(image);
  if (!styleCache) {
    styleCache = new Map();
    styledSampleCache.set(image, styleCache);
  }

  if (!styleCache.has(style)) {
    const styledSample = createStyledSample({ image, style });
    applySubjectOverlay(styledSample, style);
    styleCache.set(style, styledSample);
  }

  return styleCache.get(style);
}

function createPixelatedSubject({ image, style, size, pixelLevel }) {
  const styledSample = getStyledSample(image, style);
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

function drawStyledImage({ ctx, image, style, size, pixelLevel }) {
  const subjectCanvas = createPixelatedSubject({ image, style, size, pixelLevel });
  ctx.drawImage(subjectCanvas, 0, 0);
}

function renderToCanvas({ canvas, image, style, backgroundColor, size, pixelLevel }) {
  const ctx = canvas.getContext('2d');
  canvas.width = size;
  canvas.height = size;

  ctx.clearRect(0, 0, size, size);

  if (backgroundColor && backgroundColor !== 'transparent') {
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, size, size);
  }

  drawStyledImage({ ctx, image, style, size, pixelLevel });

  ctx.save();
  ctx.strokeStyle = style === 'dark' ? 'rgba(221, 230, 244, 0.18)' : 'rgba(16, 32, 45, 0.12)';
  ctx.lineWidth = size * 0.018;
  ctx.strokeRect(size * 0.018, size * 0.018, size * 0.964, size * 0.964);
  ctx.restore();
}

/*
export async function decodeLocalImage(file) {
  if (!file) {
    throw new Error('没有检测到图片文件。');
  }

  if (!isSupportedFile(file)) {
    throw new Error('仅支持 JPG、JPEG、PNG 图片。');
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

*/

export async function decodeLocalImage(file) {
  if (!file) {
    throw new Error('No image file was detected.');
  }

  if (!isSupportedFile(file)) {
    throw new Error('Only JPG, JPEG, and PNG files are supported.');
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
      reject(new Error('Image parsing failed. Please try another picture.'));
    };
    image.src = objectUrl;
  });
}

export function createCenteredCropRect(image, zoom = 1, focusX = 0.5, focusY = 0.5) {
  const { width, height } = getImageSize(image);
  const square = Math.min(width, height);
  const size = square / zoom;
  const x = clamp(width * focusX - size / 2, 0, width - size);
  const y = clamp(height * focusY - size / 2, 0, height - size);

  return {
    x,
    y,
    size,
    zoom,
    focusX: (x + size / 2) / width,
    focusY: (y + size / 2) / height
  };
}

export function zoomCropRect(image, cropRect, zoom) {
  return createCenteredCropRect(image, zoom, cropRect.focusX, cropRect.focusY);
}

export function moveCropRect(image, cropRect, deltaX, deltaY) {
  const { width, height } = getImageSize(image);
  const x = clamp(cropRect.x + deltaX, 0, width - cropRect.size);
  const y = clamp(cropRect.y + deltaY, 0, height - cropRect.size);

  return {
    ...cropRect,
    x,
    y,
    focusX: (x + cropRect.size / 2) / width,
    focusY: (y + cropRect.size / 2) / height
  };
}

export function renderAvatarPreview({ canvas, image, style, backgroundColor, pixelLevel }) {
  renderToCanvas({
    canvas,
    image,
    style,
    backgroundColor,
    size: EXPORT_SIZE,
    pixelLevel
  });
}

export async function buildStylePreview({ image, style, backgroundColor, pixelLevel }) {
  const canvas = createCanvas(320);
  renderToCanvas({
    canvas,
    image,
    style,
    backgroundColor,
    size: 320,
    pixelLevel
  });
  return canvas.toDataURL('image/png');
}

export async function exportAvatarPng({ image, style, backgroundColor, fileName, pixelLevel }) {
  const canvas = createCanvas(EXPORT_SIZE);
  renderToCanvas({
    canvas,
    image,
    style,
    backgroundColor,
    size: EXPORT_SIZE,
    pixelLevel
  });

  const link = document.createElement('a');
  const cleanName = sanitizeFileName(fileName || 'avatar');
  link.href = canvas.toDataURL('image/png');
  link.download = `${cleanName}-${style}.png`;
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
