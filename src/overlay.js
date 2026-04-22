let bookCount = 1;
let leftShelf = null;
let rightShelf = null;
let audioRef = null;

export function setupOverlay(scene, cameraCtrl, audio) {
  audioRef = audio;

  // Store shelf refs for adding books
  scene.traverse(obj => {
    if (obj.userData.addBook) {
      // Find which shelf is which by scanning children
    }
  });

  const overlay = document.getElementById('bookmark-overlay');
  const closeBtn = document.getElementById('bm-close-btn');
  const submitBtn = document.getElementById('bm-submit');

  // Open when camera focuses on desk
  cameraCtrl.onDeskFocus = () => {
    openOverlay();
  };

  closeBtn.addEventListener('click', closeOverlay);

  submitBtn.addEventListener('click', () => {
    const title  = document.getElementById('bm-title').value.trim();
    const author = document.getElementById('bm-author').value.trim();
    const date   = document.getElementById('bm-date').value.trim() || formatToday();

    if (!title) {
      document.getElementById('bm-title').focus();
      return;
    }

    // Flash shelf
    flashShelf();

    // Play book appear sound
    if (audioRef) audioRef.playBookAppear();

    // Increment book number
    bookCount++;
    document.getElementById('bm-no').textContent = String(bookCount).padStart(3, '0');

    // Add logged row
    appendLogRow(date, title, author);

    // Clear inputs
    document.getElementById('bm-title').value = '';
    document.getElementById('bm-author').value = '';
    document.getElementById('bm-date').value = '';

    // Animate shelf via userData (world update)
    triggerShelfAppear(scene);

    setTimeout(closeOverlay, 600);
  });

  // Keyboard: Enter submits
  document.getElementById('bm-author').addEventListener('keydown', e => {
    if (e.key === 'Enter') submitBtn.click();
  });
}

function openOverlay() {
  document.getElementById('bookmark-overlay').classList.add('open');
  setTimeout(() => document.getElementById('bm-title').focus(), 450);
  if (audioRef) audioRef.playPaper();
}

function closeOverlay() {
  document.getElementById('bookmark-overlay').classList.remove('open');
}

function flashShelf() {
  const el = document.getElementById('shelf-flash');
  el.classList.add('flash');
  setTimeout(() => el.classList.remove('flash'), 400);
}

function appendLogRow(date, title, author) {
  const tbody = document.querySelector('#bookmark-overlay .bm-table tbody');
  // Find empty row or add
  const rows = tbody.querySelectorAll('tr');
  let placed = false;
  rows.forEach(tr => {
    const inputs = tr.querySelectorAll('input');
    if (!placed && inputs.length && !inputs[1].value) {
      inputs[0].value = date;
      inputs[1].value = title;
      inputs[2].value = author;
      // Convert to text cells (written)
      inputs[0].style.fontStyle = 'italic';
      inputs[1].style.fontStyle = 'italic';
      inputs[2].style.fontStyle = 'italic';
      placed = true;
    }
  });
}

function triggerShelfAppear(scene) {
  scene.traverse(obj => {
    if (obj.userData && obj.userData.addBook) {
      obj.userData.addBook('まちこ');
    }
  });
}

function formatToday() {
  const d = new Date();
  return `${d.getMonth() + 1}/${d.getDate()}`;
}
