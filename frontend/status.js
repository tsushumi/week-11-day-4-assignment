const config = window.APP_CONFIG ?? {};
const REFRESH_MS = 30000;

const LABELS = {
  operational: 'Operational',
  degraded: 'Degraded',
  down: 'Down',
  unknown: 'Not monitored',
};

// Status is shown as text as well as a coloured circle, so it never relies on colour alone.
function renderService(service) {
  const row = document.createElement('li');
  row.className = 'service-row';

  const dot = document.createElement('span');
  dot.className = `dot ${service.status === 'operational' ? 'ok' : service.status === 'unknown' ? 'unknown' : 'down'}`;

  const name = document.createElement('span');
  name.className = 'service-name';
  name.textContent = service.name;

  const label = document.createElement('span');
  label.className = 'service-label';
  label.textContent = LABELS[service.status] ?? service.status;
  if (service.detail) label.title = service.detail;

  row.append(dot, name, label);
  return row;
}

function renderError(message) {
  document.getElementById('services').replaceChildren(
    renderService({ name: 'API Server', status: 'down', detail: message }),
  );
  document.getElementById('overall').textContent = 'Status unavailable';
}

async function refresh() {
  if (!config.apiUrl) {
    renderError('API_URL is not configured for this build');
    return;
  }
  try {
    const res = await fetch(`${config.apiUrl}/api/status`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    document.getElementById('services').replaceChildren(...data.services.map(renderService));
    document.getElementById('overall').textContent = data.overall;
    const checked = new Date(data.lastChecked);
    const time = document.getElementById('last-checked');
    time.dateTime = checked.toISOString();
    time.textContent = checked.toLocaleString();
  } catch {
    renderError('Could not reach the API');
  }
}

refresh();
setInterval(refresh, REFRESH_MS);
