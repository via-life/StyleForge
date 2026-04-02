export function trackPageView() {
  if (typeof window === 'undefined') {
    return;
  }

  if (typeof window.gtag === 'function') {
    window.gtag('event', 'page_view', { page_title: document.title });
  }
}

export function trackEvent(name, params = {}) {
  if (typeof window === 'undefined') {
    return;
  }

  if (typeof window.gtag === 'function') {
    window.gtag('event', name, params);
  }
}
