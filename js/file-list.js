// File browser: listing, sorting, rendering, navigation

var currentRows = [];
var sortKey = 'name';
var sortDir = 1;

// ---- Objects ----
function loadObjects() {
  if (!currentBucket) return;
  setProgress(20);
  showTable();
  currentRows = [];
  document.getElementById('file-tbody').innerHTML =
    '<tr><td colspan="5" style="text-align:center;padding:30px"><span class="spinner"></span></td></tr>';

  s3.listObjectsV2({
    Bucket: currentBucket,
    Prefix: currentPrefix,
    Delimiter: '/'
  }, function(err, data) {
    setProgress(0);
    var tbody = document.getElementById('file-tbody');
    if (err) {
      tbody.innerHTML = '<tr><td colspan="5" style="color:#f87171;padding:20px">' + esc(err.message) + '</td></tr>';
      toast('Error: ' + err.message, 'error');
      return;
    }

    tbody.innerHTML = '';
    var rows = [];

    (data.CommonPrefixes || []).forEach(function(cp) {
      var label = cp.Prefix.slice(currentPrefix.length).replace(/\/$/, '');
      rows.push({ type: 'folder', key: cp.Prefix, label: label });
    });

    (data.Contents || []).forEach(function(obj) {
      if (obj.Key === currentPrefix) return;
      var label = obj.Key.slice(currentPrefix.length);
      if (!label) return;
      rows.push({ type: 'file', key: obj.Key, label: label, size: obj.Size, lastModified: obj.LastModified });
    });

    currentRows = rows;

    if (rows.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5"><div class="empty-state"><div class="big-icon">&#128193;</div><p>Folder is empty</p></div></td></tr>';
      return;
    }

    renderRows();
  });
}

function setSort(key) {
  if (sortKey === key) {
    sortDir = -sortDir;
  } else {
    sortKey = key;
    sortDir = 1;
  }
  updateSortHeaders();
  if (currentRows.length) renderRows();
}

function updateSortHeaders() {
  document.querySelectorAll('th.sortable').forEach(function(th) {
    var active = th.dataset.sort === sortKey;
    th.classList.toggle('sorted', active);
    th.querySelector('.sort-ind').textContent = active ? (sortDir === 1 ? '▲' : '▼') : '';
  });
}

function compareRows(a, b) {
  // Folders always stay above files
  if (a.type !== b.type) return a.type === 'folder' ? -1 : 1;
  var cmp = 0;
  if (sortKey === 'size') {
    cmp = (a.size == null ? -1 : a.size) - (b.size == null ? -1 : b.size);
  } else if (sortKey === 'date') {
    cmp = (a.lastModified ? new Date(a.lastModified).getTime() : 0) -
          (b.lastModified ? new Date(b.lastModified).getTime() : 0);
  }
  if (cmp === 0) cmp = a.label.localeCompare(b.label, undefined, { numeric: true, sensitivity: 'base' });
  return cmp * sortDir;
}

function renderRows() {
  var tbody = document.getElementById('file-tbody');
  var checked = {};
  tbody.querySelectorAll('.row-check:checked').forEach(function(cb) { checked[cb.dataset.key] = true; });
  tbody.innerHTML = '';

  currentRows.slice().sort(compareRows).forEach(function(r) {
    var tr = document.createElement('tr');
    if (r.type === 'folder') {
      var safeKey = escAttr(r.key);
      var sizeId = 'fsize-' + r.key.replace(/[^a-z0-9]/gi, '_');
      tr.innerHTML =
        '<td></td>' +
        '<td><div class="file-name" onclick="navigateInto(\'' + safeKey + '\')">' +
          '<span>&#128193;</span><span>' + esc(r.label) + '</span></div></td>' +
        '<td class="size-col" id="' + sizeId + '">' + (r.size == null ? '<span class="spinner"></span>' : fmtSize(r.size)) + '</td>' +
        '<td class="date-col">—</td>' +
        '<td class="actions-col"><button class="btn btn-danger btn-sm" onclick="deleteFolder(\'' + safeKey + '\')">Delete</button></td>';
      tbody.appendChild(tr);
      if (r.size == null && !r.sizeLoading) {
        r.sizeLoading = true;
        (function(row, bucket) {
          getBucketSize(bucket, function(bytes) {
            row.size = bytes;
            var el = document.getElementById('fsize-' + row.key.replace(/[^a-z0-9]/gi, '_'));
            if (el) el.textContent = fmtSize(bytes);
          }, row.key);
        }(r, currentBucket));
      }
      return;
    } else {
      tr.innerHTML =
        '<td><input type="checkbox" class="row-check" data-key="' + escAttr(r.key) + '"></td>' +
        '<td><div class="file-name">' +
          '<span>' + fileIcon(r.label) + '</span>' +
          '<span onclick="downloadFile(\'' + escAttr(r.key) + '\')" title="' + escAttr(r.key) + '">' + esc(r.label) + '</span>' +
        '</div></td>' +
        '<td class="size-col">' + fmtSize(r.size) + '</td>' +
        '<td class="date-col">' + (r.lastModified ? new Date(r.lastModified).toLocaleString() : '—') + '</td>' +
        '<td class="actions-col">' +
          '<button class="btn btn-ghost btn-sm" onclick="downloadFile(\'' + escAttr(r.key) + '\')">&#8681; Download</button>' +
          '<button class="btn btn-danger btn-sm" onclick="deleteSingle(\'' + escAttr(r.key) + '\')">Delete</button>' +
        '</td>';
    }
    tbody.appendChild(tr);
  });

  tbody.querySelectorAll('.row-check').forEach(function(cb) {
    if (checked[cb.dataset.key]) cb.checked = true;
    cb.addEventListener('change', updateDeleteBtn);
  });
}

function navigateInto(prefix) {
  currentPrefix = prefix;
  updateBreadcrumb();
  loadObjects();
}

function updateBreadcrumb() {
  var bc = document.getElementById('breadcrumb');
  var html = '<span onclick="navToRoot()">&#127968; ' + esc(currentBucket) + '</span>';
  if (currentPrefix) {
    var parts = currentPrefix.replace(/\/$/, '').split('/');
    var built = '';
    parts.forEach(function(p) {
      built += p + '/';
      var snap = built;
      html += '<span class="sep">/</span><span onclick="navigateInto(\'' + escAttr(snap) + '\')">' + esc(p) + '</span>';
    });
  }
  bc.innerHTML = html;
}

function navToRoot() {
  currentPrefix = '';
  updateBreadcrumb();
  loadObjects();
}

function refresh() {
  loadObjects();
}
