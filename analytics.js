// Road Trip Arcade product analytics. Only intentional gameplay events are sent;
// autocapture, page snapshots, and session replay remain disabled.
(function (global) {
  "use strict";

  const PROJECT_KEY = "phc_oushmAHKiCrmtfMhyajRhR22LKWugwxRh7QUDLoCTn5Z";
  const API_HOST = "https://us.i.posthog.com";
  const PREFERENCE_KEY = "rtr_analytics_enabled";
  const capturedErrors = new Set();

  function surfaceName() {
    const title = document.title || "";
    if (title.includes("Window Dash")) return "window_dash";
    if (title.includes("Wheel Jam")) return "wheel_jam";
    if (title.includes("Pack the Car")) return "pack_the_car";
    return "game_hub";
  }

  function platformName() {
    try {
      if (global.Capacitor && typeof global.Capacitor.getPlatform === "function") {
        return global.Capacitor.getPlatform();
      }
    } catch (error) {}
    return "web";
  }

  const Analytics = {
    surface: surfaceName(),
    enabled: true,
    isEnabled() {
      return this.enabled;
    },
    capture(event, properties) {
      if (!this.enabled) return;
      if (!event || !global.posthog || typeof global.posthog.capture !== "function") return;
      global.posthog.capture(event, Object.assign({
        surface: this.surface,
        platform: platformName(),
        playtest: localStorage.getItem("rtr_playtest_active") === "1",
      }, properties || {}));
    },
    screen(screen, properties) {
      this.capture("screen_viewed", Object.assign({ screen }, properties || {}));
    },
    optOut() {
      this.enabled = false;
      try { localStorage.setItem(PREFERENCE_KEY, "0"); } catch (error) {}
      global.posthog?.opt_out_capturing?.();
    },
    optIn() {
      this.enabled = true;
      try { localStorage.setItem(PREFERENCE_KEY, "1"); } catch (error) {}
      global.posthog?.opt_in_capturing?.();
    },
    setEnabled(enabled) {
      if (enabled) this.optIn();
      else this.optOut();
      return this.enabled;
    },
    captureError(kind, error, details) {
      if (!this.enabled || capturedErrors.size >= 10) return;
      const message = String((error && error.message) || error || "Unknown error").slice(0, 300);
      const source = String((details && details.source) || "").split("/").pop().slice(0, 120);
      const signature = [kind, message, source, details && details.line].join("|");
      if (capturedErrors.has(signature)) return;
      capturedErrors.add(signature);
      this.capture("app_error", {
        error_kind: kind,
        error_name: String((error && error.name) || "Error").slice(0, 80),
        error_message: message,
        source,
        line: Math.max(0, Number(details && details.line) || 0),
        column: Math.max(0, Number(details && details.column) || 0),
      });
    },
  };

  global.RoadTripAnalytics = Analytics;

  !function(t,e){var o,n,p,r;e.__SV||(global.posthog&&global.posthog.__loaded)||(global.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type="text/javascript",p.crossOrigin="anonymous",p.async=!0,p.src=s.api_host.replace(".i.posthog.com","-assets.i.posthog.com")+"/static/array.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],u.toString=function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e},u.people.toString=function(){return u.toString(1)+".people (stub)"},o="capture opt_in_capturing opt_out_capturing has_opted_in_capturing has_opted_out_capturing get_distinct_id reset set_config".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,global.posthog||[]);

  global.posthog.init(PROJECT_KEY, {
    api_host: API_HOST,
    defaults: "2026-05-30",
    person_profiles: "identified_only",
    autocapture: false,
    capture_pageview: false,
    capture_pageleave: false,
    disable_session_recording: true,
    persistence: "localStorage",
  });

  const privacySignal = navigator.globalPrivacyControl === true || navigator.doNotTrack === "1";
  let explicitPreference = "";
  try { explicitPreference = localStorage.getItem(PREFERENCE_KEY) || ""; } catch (error) {}
  Analytics.enabled = explicitPreference === "1" || (explicitPreference !== "0" && !privacySignal);
  if (Analytics.enabled) {
    global.posthog?.opt_in_capturing?.();
    Analytics.capture("app_opened");
  } else {
    global.posthog?.opt_out_capturing?.();
  }

  global.addEventListener("error", (event) => {
    if (!event || !event.error) return;
    Analytics.captureError("javascript", event.error, {
      source: event.filename,
      line: event.lineno,
      column: event.colno,
    });
  });
  global.addEventListener("unhandledrejection", (event) => {
    Analytics.captureError("promise", event && event.reason);
  });
})(window);
