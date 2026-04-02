export function detectPerformanceTier() {
  if (typeof window === 'undefined') {
    return 'desktop';
  }

  const coarsePointer = window.matchMedia('(pointer: coarse)').matches;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const width = window.innerWidth;
  const memory = navigator.deviceMemory ?? 8;
  const cores = navigator.hardwareConcurrency ?? 8;
  const userAgent = navigator.userAgent || '';
  const isAndroid = /Android/i.test(userAgent);

  if (!coarsePointer && width >= 900 && !reducedMotion) {
    return 'desktop';
  }

  if (
    reducedMotion ||
    (coarsePointer && memory <= 2) ||
    (coarsePointer && cores <= 4) ||
    (isAndroid && coarsePointer && (memory <= 4 || cores <= 6 || width < 480))
  ) {
    return 'low-end-mobile';
  }

  if (coarsePointer || width < 900) {
    return 'mobile';
  }

  return 'desktop';
}

export function isMobilePerformanceTier(performanceTier) {
  return performanceTier !== 'desktop';
}
