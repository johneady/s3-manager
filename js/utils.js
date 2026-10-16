// Formatting and escaping helpers

function esc(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function escAttr(s) {
  return String(s).replace(/\\/g,'\\\\').replace(/'/g,"\\'");
}

function fmtSize(bytes) {
  if (bytes == null) return '—';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  if (bytes < 1073741824) return (bytes / 1048576).toFixed(1) + ' MB';
  return (bytes / 1073741824).toFixed(2) + ' GB';
}

function fileIcon(name) {
  var ext = name.split('.').pop().toLowerCase();
  var imgs = { jpg:1, jpeg:1, png:1, gif:1, svg:1, webp:1 };
  var vids = { mp4:1, mov:1, avi:1, mkv:1, webm:1 };
  var auds = { mp3:1, wav:1, flac:1, ogg:1 };
  var zips = { zip:1, gz:1, tar:1, rar:1, '7z':1 };
  if (imgs[ext]) return '&#128247;';
  if (vids[ext]) return '&#127902;';
  if (auds[ext]) return '&#127925;';
  if (zips[ext]) return '&#128230;';
  if (ext === 'pdf') return '&#128196;';
  return '&#128196;';
}
