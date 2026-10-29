const config = window.APP_CONFIG ?? {};

function setStatus(state, text) {
  document.getElementById('status-dot').className = `dot ${state}`;
  document.getElementById('status-text').textContent = text;
}

function renderFooter() {
  if (config.builtAt) {
    const built = new Date(config.builtAt);
    const el = document.getElementById('built-at');
    el.dateTime = built.toISOString();
    el.textContent = built.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
  }
  if (config.commit) {
    document.getElementById('commit').textContent = config.commit;
    document.getElementById('commit-wrap').hidden = false;
  }
}

async function checkHealth() {
  if (!config.apiUrl) {
    setStatus('unknown', 'API_URL is not configured for this build');
    return;
  }
  try {
    const res = await fetch(`${config.apiUrl}/api/health`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const body = await res.json();
    setStatus('ok', `API is ${body.status}`);
  } catch {
    setStatus('down', 'API is unreachable');
  }
}

renderFooter();
checkHealth();
