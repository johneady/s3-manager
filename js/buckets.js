// Bucket sidebar: list, sizes, create, delete

// ---- Buckets ----
function loadBuckets() {
  setStatus('Connecting…', '');
  setProgress(30);
  var client = s3;
  s3.listBuckets(function(err, data) {
    if (client !== s3) return;
    setProgress(0);
    if (err) {
      setStatus('Error: ' + err.message, 'error');
      toast(err.message, 'error');
      return;
    }
    setStatus('Connected', 'connected');
    var list = document.getElementById('bucket-list');
    list.innerHTML = '';
    if (!data.Buckets || data.Buckets.length === 0) {
      list.innerHTML = '<div class="empty-state"><p>No buckets found</p></div>';
      return;
    }

    var buckets = data.Buckets.slice().sort(function(a, b) { return a.Name.localeCompare(b.Name); });
    var bucketEls = {};

    buckets.forEach(function(b) {
      var el = document.createElement('div');
      el.className = 'bucket-item';
      el.innerHTML =
        '<span>&#128274;</span>' +
        '<span>' + esc(b.Name) + '</span>' +
        '<span class="bucket-size" id="bsize-' + esc(b.Name) + '">…</span>' +
        '<button class="bucket-del" title="Delete bucket" onclick="requestDeleteBucket(\'' + escAttr(b.Name) + '\', event)">&#128465;</button>';
      el.onclick = function() {
        document.querySelectorAll('.bucket-item').forEach(function(x){ x.classList.remove('active'); });
        el.classList.add('active');
        currentBucket = b.Name;
        currentPrefix = '';
        enableToolbar();
        loadObjects();
      };
      list.appendChild(el);
      bucketEls[b.Name] = el;
    });

    // Fetch sizes for all buckets, then update header bar
    var totalBytes = 0;
    var pending = buckets.length;

    function onBucketSizeDone(name, bytes) {
      var badge = document.getElementById('bsize-' + name);
      if (badge) badge.textContent = fmtSize(bytes);
      totalBytes += bytes;
      pending--;
      if (pending === 0) updateStorageBar(totalBytes);
    }

    buckets.forEach(function(b) {
      getBucketSize(b.Name, function(bytes) {
        if (client !== s3) return;
        onBucketSizeDone(b.Name, bytes);
      });
    });
  });
}

function getBucketSize(bucket, cb, prefix) {
  var total = 0;
  function page(token) {
    var params = { Bucket: bucket };
    if (prefix) params.Prefix = prefix;
    if (token) params.ContinuationToken = token;
    s3.listObjectsV2(params, function(err, data) {
      if (err) { cb(total); return; }
      (data.Contents || []).forEach(function(o) { total += o.Size; });
      if (data.IsTruncated) {
        page(data.NextContinuationToken);
      } else {
        cb(total);
      }
    });
  }
  page(null);
}

var TB = 1099511627776; // 1 TiB in bytes
function updateStorageBar(bytes) {
  document.getElementById('storage-bar-wrap').style.display = 'flex';
  document.getElementById('storage-label').textContent = fmtSize(bytes) + ' / 1 TB';
  var pct = Math.min(100, (bytes / TB) * 100);
  document.getElementById('storage-fill').style.width = pct + '%';
}

// ---- New Bucket ----
function openNewBucket() {
  document.getElementById('bucket-name-input').value = '';
  document.getElementById('bucket-panel').classList.remove('hidden');
}

function createBucket() {
  var name = document.getElementById('bucket-name-input').value.trim();
  if (!name) { toast('Enter a bucket name', 'error'); return; }
  s3.createBucket({ Bucket: name }, function(err) {
    if (err) { toast('Failed: ' + err.message, 'error'); return; }
    toast('Bucket created', 'success');
    closeModal('bucket-panel');
    loadBuckets();
  });
}

// ---- Delete Bucket ----
var pendingDeleteBucket = null;

function requestDeleteBucket(name, ev) {
  if (ev) ev.stopPropagation();
  setProgress(30);
  s3.listObjectsV2({ Bucket: name, MaxKeys: 1 }, function(err, data) {
    setProgress(0);
    if (err) { toast('Check failed: ' + err.message, 'error'); return; }
    if ((data.Contents || []).length > 0) {
      toast('Bucket "' + name + '" is not empty — delete its contents first', 'error');
      return;
    }
    pendingDeleteBucket = name;
    document.getElementById('confirm-delete-bucket-name').textContent = name;
    document.getElementById('delete-bucket-panel').classList.remove('hidden');
  });
}

function confirmDeleteBucket() {
  if (!pendingDeleteBucket) return;
  var name = pendingDeleteBucket;
  var btn = document.getElementById('btn-confirm-delete-bucket');
  btn.disabled = true;
  s3.deleteBucket({ Bucket: name }, function(err) {
    btn.disabled = false;
    if (err) { toast('Delete failed: ' + err.message, 'error'); return; }
    closeModal('delete-bucket-panel');
    pendingDeleteBucket = null;
    toast('Bucket "' + name + '" deleted', 'success');
    if (currentBucket === name) resetMainPanel();
    loadBuckets();
  });
}
