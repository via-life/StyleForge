function clampChannel(value) {
  return Math.min(Math.max(Number.isFinite(value) ? value : 0, 0), 255);
}

export function clampRgbChannel(value) {
  return Math.round(clampChannel(value));
}

export function normalizeHexColor(value, fallback = '#ffffff') {
  if (typeof value !== 'string') {
    return fallback;
  }

  const normalized = value.trim().replace('#', '');

  if (/^[0-9a-fA-F]{3}$/.test(normalized)) {
    const doubled = normalized
      .split('')
      .map(char => char + char)
      .join('');
    return `#${doubled.toLowerCase()}`;
  }

  if (/^[0-9a-fA-F]{6}$/.test(normalized)) {
    return `#${normalized.toLowerCase()}`;
  }

  return fallback;
}

export function hexToRgb(value) {
  const normalized = normalizeHexColor(value);
  const numeric = Number.parseInt(normalized.slice(1), 16);

  return {
    r: (numeric >> 16) & 255,
    g: (numeric >> 8) & 255,
    b: numeric & 255
  };
}

export function rgbToHex({ r, g, b }) {
  const toHex = channel => clampRgbChannel(channel).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export function rgbToCss({ r, g, b }) {
  return `rgb(${clampRgbChannel(r)}, ${clampRgbChannel(g)}, ${clampRgbChannel(b)})`;
}
