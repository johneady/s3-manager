// Generic UI helpers: modals, toolbar, status, toasts

// ---- Helpers ----
function closeModal(id) {
  document.getElementById(id).classList.add('hidden');
}

function enableToolbar() {
  document.getElementById('btn-refresh').disabled = false;
  document.getElementById('btn-new-folder').disabled = false;
  document.getElementById('btn-upload').disabled = false;
  updateBreadcrumb();
}

function showTable() {
  document.getElementById('empty-state').style.display = 'none';
  document.getElementById('file-table').style.display = '';
  document.getElementById('select-all').checked = false;
  document.getElementById('btn-delete-selected').style.display = 'none';
}

function setStatus(msg, cls) {
  var el = document.getElementById('status-bar');
  el.textContent = msg;
  el.className = cls;
}

function setProgress(val) {
  document.getElementById('progress-bar').style.width = val + '%';
}

var toastTimer;
function toast(msg, type) {
  var el = document.getElementById('toast');
  el.textContent = msg;
  el.className = 'show ' + (type || 'info');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(function() { el.classList.remove('show'); }, 3500);
}

function resetMainPanel() {
  currentBucket = null;
  currentPrefix = '';
  document.getElementById('btn-refresh').disabled = true;
  document.getElementById('btn-new-folder').disabled = true;
  document.getElementById('btn-upload').disabled = true;
  document.getElementById('btn-delete-selected').style.display = 'none';
  document.getElementById('breadcrumb').innerHTML = '<span>Home</span>';
  document.getElementById('file-table').style.display = 'none';
  document.getElementById('empty-state').style.display = '';
  document.querySelectorAll('.bucket-item').forEach(function(x) { x.classList.remove('active'); });
}
