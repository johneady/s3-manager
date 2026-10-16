// S3 managers, active connection and shared state

// ---- Managers ----
// S3_MANAGERS is defined in js/managers.local.js (gitignored)
var MANAGERS = (typeof S3_MANAGERS !== 'undefined') ? S3_MANAGERS : [];
var ACTIVE_KEY = 's3_active_manager';

var activeManager = null;
var CFG = null;

var s3 = null;
var currentBucket = null;
var currentPrefix = '';

function overrideKey(id) {
  return 's3_config_override:' + id;
}

// Values from managers.local.js, overridden by anything saved through the Settings dialog
function managerConfig(m) {
  var cfg = { accessKey: m.accessKey, secretKey: m.secretKey, endpoint: m.endpoint, region: m.region };
  var saved = localStorage.getItem(overrideKey(m.id));
  if (saved) try { Object.assign(cfg, JSON.parse(saved)); } catch(e) {}
  return cfg;
}

function findManager(id) {
  return MANAGERS.filter(function(m) { return m.id === id; })[0] || null;
}

function renderManagerSelect() {
  var sel = document.getElementById('manager-select');
  sel.innerHTML = MANAGERS.map(function(m) {
    return '<option value="' + esc(m.id) + '">' + esc(m.name) + '</option>';
  }).join('');
  if (activeManager) sel.value = activeManager.id;
  sel.style.display = MANAGERS.length ? '' : 'none';
}

function selectManager(id) {
  var m = findManager(id);
  if (!m) return;
  activeManager = m;
  CFG = managerConfig(m);
  localStorage.setItem(ACTIVE_KEY, id);
  document.getElementById('manager-select').value = id;

  resetMainPanel();
  document.getElementById('storage-bar-wrap').style.display = 'none';
  document.getElementById('bucket-list').innerHTML = '<div class="empty-state"><p>Connecting…</p></div>';

  if (!CFG.accessKey || !CFG.secretKey || !CFG.endpoint) {
    s3 = null;
    setStatus('Not configured', '');
    document.getElementById('bucket-list').innerHTML = '<div class="empty-state"><p>Add credentials in Settings</p></div>';
    openConfig();
    return;
  }
  s3 = buildS3(CFG);
  loadBuckets();
}

function buildS3(cfg) {
  return new AWS.S3({
    accessKeyId:     cfg.accessKey,
    secretAccessKey: cfg.secretKey,
    region:          cfg.region || 'ca-east-1',
    endpoint:        cfg.endpoint,
    s3ForcePathStyle: true,
    signatureVersion: 'v4',
  });
}

// ---- Config modal ----
function openConfig() {
  if (!activeManager) { toast('No managers defined in js/managers.local.js', 'error'); return; }
  document.getElementById('cfg-manager-name').textContent = activeManager.name;
  document.getElementById('cfg-access-key').value = CFG.accessKey || '';
  document.getElementById('cfg-secret-key').value = CFG.secretKey || '';
  document.getElementById('cfg-endpoint').value = CFG.endpoint || '';
  document.getElementById('cfg-region').value = CFG.region || 'ca-east-1';
  document.getElementById('config-panel').classList.remove('hidden');
}

function saveConfig() {
  var cfg = {
    accessKey: document.getElementById('cfg-access-key').value.trim(),
    secretKey: document.getElementById('cfg-secret-key').value.trim(),
    endpoint:  document.getElementById('cfg-endpoint').value.trim(),
    region:    document.getElementById('cfg-region').value.trim() || 'ca-east-1',
  };
  if (!cfg.accessKey || !cfg.secretKey || !cfg.endpoint) {
    toast('Please fill in all fields', 'error'); return;
  }
  localStorage.setItem(overrideKey(activeManager.id), JSON.stringify(cfg));
  closeModal('config-panel');
  selectManager(activeManager.id);
}

function resetConfig() {
  localStorage.removeItem(overrideKey(activeManager.id));
  closeModal('config-panel');
  toast('Using saved settings for ' + activeManager.name, 'info');
  selectManager(activeManager.id);
}
