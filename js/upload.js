// Upload dialog and drag & drop

var pendingFiles = [];

// ---- Upload ----
function openUpload() {
  pendingFiles = [];
  document.getElementById('upload-list').innerHTML = '';
  document.getElementById('upload-file-input').value = '';
  document.getElementById('btn-do-upload').disabled = true;
  document.getElementById('upload-panel').classList.remove('hidden');
}

function closeUpload() {
  closeModal('upload-panel');
  loadObjects();
}

function handleFileSelect(files) {
  pendingFiles = Array.from(files);
  var ul = document.getElementById('upload-list');
  ul.innerHTML = '';
  pendingFiles.forEach(function(f) {
    var li = document.createElement('li');
    li.id = 'up-' + f.name.replace(/[^a-z0-9]/gi, '_');
    li.innerHTML = '<span>' + esc(f.name) + '</span><span>' + fmtSize(f.size) + '</span>';
    ul.appendChild(li);
  });
  document.getElementById('btn-do-upload').disabled = pendingFiles.length === 0;
}

function doUpload() {
  if (!pendingFiles.length) return;
  document.getElementById('btn-do-upload').disabled = true;
  var total = pendingFiles.length;
  var done = 0;
  var errors = 0;

  pendingFiles.forEach(function(file) {
    var key = currentPrefix + file.name;
    var id = 'up-' + file.name.replace(/[^a-z0-9]/gi, '_');
    var li = document.getElementById(id);
    if (li) li.querySelector('span:last-child').innerHTML = '<span class="spinner"></span>';

    s3.putObject({
      Bucket: currentBucket,
      Key: key,
      Body: file,
      ContentType: file.type || 'application/octet-stream'
    }, function(err) {
      if (err) {
        errors++;
        if (li) li.querySelector('span:last-child').innerHTML = '<span class="upload-error">&#10007; ' + esc(err.message) + '</span>';
      } else {
        done++;
        if (li) li.querySelector('span:last-child').innerHTML = '<span class="upload-status">&#10003; Done</span>';
      }
      if (done + errors === total) {
        toast(done + ' of ' + total + ' uploaded', errors === 0 ? 'success' : 'error');
        document.getElementById('btn-do-upload').disabled = false;
        pendingFiles = [];
      }
    });
  });
}

var dz = document.getElementById('drop-zone');
dz.addEventListener('dragover', function(e) { e.preventDefault(); dz.classList.add('dragover'); });
dz.addEventListener('dragleave', function() { dz.classList.remove('dragover'); });
dz.addEventListener('drop', function(e) {
  e.preventDefault();
  dz.classList.remove('dragover');
  handleFileSelect(e.dataTransfer.files);
});
