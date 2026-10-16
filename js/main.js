// Bootstrapping and global event handlers

function init() {
  if (!MANAGERS.length) {
    setStatus('No managers configured', 'error');
    document.getElementById('bucket-list').innerHTML =
      '<div class="empty-state"><p>Create js/managers.local.js (see managers.local.example.js)</p></div>';
    return;
  }
  var saved = findManager(localStorage.getItem(ACTIVE_KEY));
  activeManager = saved || MANAGERS[0];
  renderManagerSelect();
  selectManager(activeManager.id);
}

// Close overlays on backdrop click
document.querySelectorAll('.overlay').forEach(function(el) {
  el.addEventListener('click', function(e) {
    if (e.target === el) {
      el.classList.add('hidden');
      if (el.id === 'upload-panel') loadObjects();
    }
  });
});

document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') {
    document.querySelectorAll('.overlay').forEach(function(el) {
      el.classList.add('hidden');
    });
  }
});

// Start
init();
