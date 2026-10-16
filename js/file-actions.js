// File operations: download, delete, selection, new folder

// ---- Download ----
function downloadFile(key) {
  var params = { Bucket: currentBucket, Key: key, Expires: 300 };
  var url = s3.getSignedUrl('getObject', params);
  var a = document.createElement('a');
  a.href = url;
  a.download = key.split('/').pop();
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

// ---- Delete ----
function deleteSingle(key) {
  if (!confirm('Delete "' + key + '"?')) return;
  s3.deleteObject({ Bucket: currentBucket, Key: key }, function(err) {
    if (err) { toast('Delete failed: ' + err.message, 'error'); return; }
    toast('Deleted', 'success');
    loadObjects();
  });
}

function deleteFolder(prefix) {
  if (!confirm('Delete folder "' + prefix + '" and all its contents?')) return;
  // list all then delete
  var keys = [];
  function listAll(token) {
    var params = { Bucket: currentBucket, Prefix: prefix };
    if (token) params.ContinuationToken = token;
    s3.listObjectsV2(params, function(err, data) {
      if (err) { toast('List failed: ' + err.message, 'error'); return; }
      (data.Contents || []).forEach(function(o) { keys.push({ Key: o.Key }); });
      if (data.IsTruncated) {
        listAll(data.NextContinuationToken);
      } else {
        if (keys.length === 0) { toast('Folder already empty', 'info'); loadObjects(); return; }
        s3.deleteObjects({ Bucket: currentBucket, Delete: { Objects: keys } }, function(err2) {
          if (err2) { toast('Delete failed: ' + err2.message, 'error'); return; }
          toast('Deleted ' + keys.length + ' objects', 'success');
          loadObjects();
        });
      }
    });
  }
  listAll(null);
}

function toggleSelectAll(cb) {
  document.querySelectorAll('.row-check').forEach(function(c) { c.checked = cb.checked; });
  updateDeleteBtn();
}

function updateDeleteBtn() {
  var any = document.querySelectorAll('.row-check:checked').length > 0;
  document.getElementById('btn-delete-selected').style.display = any ? '' : 'none';
}

function deleteSelected() {
  var checked = Array.from(document.querySelectorAll('.row-check:checked'));
  if (!checked.length) return;
  if (!confirm('Delete ' + checked.length + ' selected object(s)?')) return;
  var objects = checked.map(function(cb) { return { Key: cb.dataset.key }; });
  s3.deleteObjects({ Bucket: currentBucket, Delete: { Objects: objects } }, function(err) {
    if (err) { toast('Delete failed: ' + err.message, 'error'); return; }
    toast('Deleted ' + objects.length + ' objects', 'success');
    loadObjects();
  });
}

// ---- New Folder ----
function openNewFolder() {
  document.getElementById('folder-name-input').value = '';
  document.getElementById('folder-panel').classList.remove('hidden');
}

function createFolder() {
  var name = document.getElementById('folder-name-input').value.trim();
  if (!name) { toast('Enter a folder name', 'error'); return; }
  var key = currentPrefix + name.replace(/\/+$/, '') + '/';
  s3.putObject({ Bucket: currentBucket, Key: key, Body: '' }, function(err) {
    if (err) { toast('Failed: ' + err.message, 'error'); return; }
    toast('Folder created', 'success');
    closeModal('folder-panel');
    loadObjects();
  });
}
