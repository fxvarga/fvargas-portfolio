import { ApplicationInsights } from '@microsoft/applicationinsights-web';

type AnalyticsProperties = Record<string, string | number | boolean | null | undefined>;

declare global {
  interface Window {
    __TT_NATIVE_TELEMETRY?: Array<{ kind: 'event' | 'error'; name: string; properties?: AnalyticsProperties }>;
    __tinytoesAnalyticsTrack?: (kind: 'event' | 'error', name: string, properties?: AnalyticsProperties) => void;
  }
}

const SESSION_KEY = 'tinytoes-analytics-session-id';
const ACTIVATION_KEY = 'tinytoes-activation-tracked';
const MEMORY_COUNT_KEY = 'tinytoes-analytics-memory-count';
const FOOD_PHOTO_KEY = 'tinytoes-analytics-food-photo-created';

let appInsights: ApplicationInsights | null = null;

function getSessionId() {
  try {
    const existing = localStorage.getItem(SESSION_KEY);
    if (existing) return existing;

    const id = crypto.randomUUID();
    localStorage.setItem(SESSION_KEY, id);
    return id;
  } catch {
    return 'unavailable';
  }
}

function safeProperties(properties: AnalyticsProperties = {}) {
  const result: Record<string, string | number | boolean> = {
    platform: typeof window !== 'undefined' && (window as any).__TINYTOES_NATIVE ? 'ios' : 'web',
    session_id: getSessionId(),
  };

  for (const [key, value] of Object.entries(properties)) {
    if (value !== null && value !== undefined) {
      result[key] = value;
    }
  }

  return result;
}

function flushTelemetry() {
  appInsights?.flush();
}

export const analytics = {
  init() {
    const connectionString = import.meta.env.VITE_APPLICATIONINSIGHTS_CONNECTION_STRING;
    if (!connectionString || appInsights) return;

    appInsights = new ApplicationInsights({
      config: {
        connectionString,
        enableAutoRouteTracking: false,
        disableAjaxTracking: false,
        disableFetchTracking: false,
        enableCorsCorrelation: true,
      },
    });
    appInsights.loadAppInsights();
    appInsights.context.application.ver = import.meta.env.VITE_APP_VERSION || 'unknown';
    window.__tinytoesAnalyticsTrack = (kind, name, properties) => {
      if (kind === 'error') {
        analytics.error(new Error(name), properties);
      } else {
        analytics.event(name, properties);
      }
    };

    for (const item of window.__TT_NATIVE_TELEMETRY ?? []) {
      window.__tinytoesAnalyticsTrack(item.kind, item.name, item.properties);
    }
    window.__TT_NATIVE_TELEMETRY = [];

    window.addEventListener('tinytoes:native-telemetry', (event) => {
      const detail = (event as CustomEvent).detail as { kind?: 'event' | 'error'; name?: string; properties?: AnalyticsProperties };
      if (detail?.kind && detail.name) {
        window.__tinytoesAnalyticsTrack?.(detail.kind, detail.name, detail.properties);
      }
    });

    window.addEventListener('error', (event) => {
      analytics.error(event.error ?? event.message, {
        area: 'window_error',
        source: event.filename,
        line: event.lineno,
        column: event.colno,
      });
    });

    window.addEventListener('unhandledrejection', (event) => {
      analytics.error(event.reason, { area: 'unhandled_rejection' });
    });
  },

  pageView(name: string, properties?: AnalyticsProperties) {
    appInsights?.trackPageView({ name, properties: safeProperties(properties) });
    flushTelemetry();
  },

  event(name: string, properties?: AnalyticsProperties) {
    appInsights?.trackEvent({ name }, safeProperties(properties));
    flushTelemetry();
  },

  error(error: unknown, properties?: AnalyticsProperties) {
    const exception = error instanceof Error ? error : new Error(String(error));
    appInsights?.trackException({ exception, properties: safeProperties(properties) });
    flushTelemetry();
  },

  activation(memoryCount: number, hasFoodPhoto: boolean) {
    if (localStorage.getItem(ACTIVATION_KEY) === 'true') return;
    const activationType = hasFoodPhoto ? 'food_with_photo' : memoryCount >= 3 ? 'three_memories' : null;
    if (!activationType) return;

    localStorage.setItem(ACTIVATION_KEY, 'true');
    analytics.event('activation_completed', {
      activation_type: activationType,
      memory_count: memoryCount,
      has_food_photo: hasFoodPhoto,
    });
  },

  memoryCreated(memoryType: string, hasPhoto: boolean, properties?: AnalyticsProperties) {
    const currentCount = Number(localStorage.getItem(MEMORY_COUNT_KEY) || '0') + 1;
    const hasFoodPhoto = memoryType === 'food' && hasPhoto
      ? true
      : localStorage.getItem(FOOD_PHOTO_KEY) === 'true';

    localStorage.setItem(MEMORY_COUNT_KEY, String(currentCount));
    if (hasFoodPhoto) localStorage.setItem(FOOD_PHOTO_KEY, 'true');

    analytics.event('memory_created', { memory_type: memoryType, has_photo: hasPhoto, ...properties });
    analytics.activation(currentCount, hasFoodPhoto);
  },
};
