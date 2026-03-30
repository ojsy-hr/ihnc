(function () {
  const SUPABASE_URL = "https://mrlvgvbwmmnfdqqadjjx.supabase.co";
  const SUPABASE_KEY = "sb_publishable_oGM47Qwl3QOfKSrgwGlCpw_m2ET95CI";

  // Generate or retrieve a session ID
  let sessionId = sessionStorage.getItem("analytics_session_id");
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    sessionStorage.setItem("analytics_session_id", sessionId);
  }

  const payload = {
    page: window.location.pathname,
    referrer: document.referrer || null,
    user_agent: navigator.userAgent,
    screen_width: window.screen.width,
    screen_height: window.screen.height,
    language: navigator.language || null,
    platform: navigator.platform || null,
    session_id: sessionId,
  };

  fetch(SUPABASE_URL + "/rest/v1/page_views", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_KEY,
      Authorization: "Bearer " + SUPABASE_KEY,
    },
    body: JSON.stringify(payload),
  }).catch(function () {
    // Silently fail — analytics should never break the site
  });
})();
