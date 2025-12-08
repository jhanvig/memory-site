/* dashboard-ui.js - interactive popups + toasts for your existing template */
/* No changes to your template required. This script auto-binds to your classes. */

(function(){
  // helpers
  const $ = sel => document.querySelector(sel);
  const $$ = sel => Array.from(document.querySelectorAll(sel));
  function el(html){ const tmp = document.createElement('div'); tmp.innerHTML = html.trim(); return tmp.firstElementChild; }

  /* ---------- inject UI containers (modal + toast) ---------- */
  const backdrop = el(`<div class="dash-backdrop" role="dialog" aria-hidden="true"></div>`);
  const modal = el(`<div class="dash-modal" role="document" aria-modal="true">
      <h3 id="dash-modal-title">Title</h3>
      <p id="dash-modal-desc">Description</p>
      <div id="dash-modal-body"></div>
      <div class="dash-actions" id="dash-modal-actions"></div>
  </div>`);
  const toast = el(`<div class="dash-toast" role="status" aria-live="polite"></div>`);
  backdrop.appendChild(modal);
  document.body.appendChild(backdrop);
  document.body.appendChild(toast);

  function showToast(msg, ms=2200){
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(()=> toast.classList.remove('show'), ms);
  }

  function showModal({title="Confirm", description="", body=null, confirmText="OK", cancelText="Cancel", onConfirm=null, onCancel=null}){
    $('#dash-modal-title').textContent = title;
    $('#dash-modal-desc').textContent = description;
    const bodyContainer = $('#dash-modal-body');
    bodyContainer.innerHTML = '';
    if(body) bodyContainer.appendChild(body);
    const actions = $('#dash-modal-actions');
    actions.innerHTML = '';

    const btnCancel = document.createElement('button');
    btnCancel.className = 'dash-btn-ui ghost';
    btnCancel.textContent = cancelText;
    btnCancel.addEventListener('click', () => {
      hideModal();
      if(onCancel) onCancel();
    });

    const btnConfirm = document.createElement('button');
    btnConfirm.className = 'dash-btn-ui primary';
    btnConfirm.textContent = confirmText;
    btnConfirm.addEventListener('click', () => {
      hideModal();
      if(onConfirm) onConfirm();
    });

    actions.appendChild(btnCancel);
    actions.appendChild(btnConfirm);

    backdrop.classList.add('show');
    backdrop.setAttribute('aria-hidden','false');

    // keyboard escape
    function onKey(e){
      if(e.key === 'Escape') { hideModal(); if(onCancel) onCancel(); }
    }
    document.addEventListener('keydown', onKey, { once: true });

    function hideModal(){
      backdrop.classList.remove('show');
      backdrop.setAttribute('aria-hidden','true');
    }
  }

  backdrop.addEventListener('click', function(e){
    if(e.target === backdrop){
      backdrop.classList.remove('show');
      backdrop.setAttribute('aria-hidden','true');
    }
  });

  /* ---------- bind to spotify container to confirm open ---------- */
  const spotifyWrap = document.querySelector('.spotify-container');
  if(spotifyWrap){
    spotifyWrap.addEventListener('click', function(e){
      // confirm opening in new tab (we preserve your embedded iframe appearance)
      showModal({
        title: 'Open playlist in Spotify?',
        description: 'This will open the playlist in a new tab. Continue?',
        confirmText: 'Open',
        onConfirm: () => {
          // try to obtain src from iframe
          const iframe = spotifyWrap.querySelector('iframe');
          if(iframe && iframe.src){
            // get canonical spotify url (strip /embed)
            let url = iframe.src.replace('/embed/playlist/','/playlist/').split('?')[0];
            // if embed source is a full embed url, fallback to a sensible playlist url
            window.open(url, '_blank', 'noopener');
            showToast('Playlist opened ✨');
          } else {
            showToast('No playlist found', 1600);
          }
        }
      });
    });
    // keyboard accessibility
    spotifyWrap.setAttribute('tabindex','0');
    spotifyWrap.addEventListener('keydown', (e) => { if(e.key === 'Enter') spotifyWrap.click(); });
  }

  /* ---------- editable note ---------- */
  const noteEl = document.querySelector('.note-card');
  if(noteEl){
    // load saved note from localStorage (if exists)
    const KEY_NOTE = 'dash_note_v1';
    const saved = localStorage.getItem(KEY_NOTE);
    if(saved) noteEl.innerHTML = saved;

    // create inline control section and append below note (so the template stays unchanged)
    const controls = el(`<div class="dash-inline-controls" aria-hidden="false">
      <button class="ghost" data-action="edit">Edit</button>
      <button class="save" data-action="save" style="display:none">Save</button>
      <button class="ghost" data-action="cancel" style="display:none">Cancel</button>
    </div>`);
    noteEl.insertAdjacentElement('afterend', controls);

    const btnEdit = controls.querySelector('[data-action="edit"]');
    const btnSave = controls.querySelector('[data-action="save"]');
    const btnCancel = controls.querySelector('[data-action="cancel"]');

    function enterEdit(){
      noteEl.setAttribute('contenteditable','true');
      noteEl.focus();
      btnEdit.style.display = 'none';
      btnSave.style.display = 'inline-block';
      btnCancel.style.display = 'inline-block';
      showToast('Edit mode — Ctrl+S to save or press Save');
    }
    function exitEdit(){
      noteEl.setAttribute('contenteditable','false');
      btnEdit.style.display = 'inline-block';
      btnSave.style.display = 'none';
      btnCancel.style.display = 'none';
    }

    btnEdit.addEventListener('click', enterEdit);
    btnCancel.addEventListener('click', () => {
      // revert to saved
      const prev = localStorage.getItem(KEY_NOTE) || noteEl.textContent;
      noteEl.innerHTML = prev;
      exitEdit();
      showToast('Edit cancelled');
    });

    btnSave.addEventListener('click', () => {
      const newHtml = noteEl.innerHTML.trim();
      // confirm save modal
      const body = el(`<div style="font-size:0.95rem">Save this note locally in your browser?</div>`);
      showModal({
        title: 'Save note?',
        description: '',
        body: body,
        confirmText: 'Save',
        cancelText: 'Cancel',
        onConfirm: () => {
          localStorage.setItem(KEY_NOTE, newHtml);
          exitEdit();
          showToast('Note saved locally 💾');
        },
        onCancel: () => showToast('Save cancelled', 1100)
      });
    });

    // keyboard: Ctrl+E = edit, Ctrl+S = save while editing
    document.addEventListener('keydown', (e) => {
      if((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'e'){
        e.preventDefault(); enterEdit();
      }
      if((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's'){
        if(noteEl.getAttribute('contenteditable') === 'true'){
          e.preventDefault();
          btnSave.click();
        }
      }
    });
  }

  /* ---------- Drive link management (persist to localStorage) ---------- */
  // choose the anchor that opens in new tab inside .button-container -> we assume that is your drive link
  const driveAnchor = document.querySelector('.button-container a[target="_blank"]');
  const KEY_DRIVE = 'dash_drive_v1';
  if(driveAnchor){
    // if a saved drive exists, replace href to that (so "Open" uses saved link)
    const savedDrive = localStorage.getItem(KEY_DRIVE);
    if(savedDrive){
      driveAnchor.href = savedDrive;
    }

    // create a small floating set-link button in top-right corner of your page
    const setBtn = el(`<button class="dash-btn-ui ghost" title="Set Drive link (Ctrl+D)" style="position:fixed;right:18px;top:88px;z-index:1200;border-radius:12px">Set Drive</button>`);
    document.body.appendChild(setBtn);

    setBtn.addEventListener('click', openSetDriveModal);
    document.addEventListener('keydown', function(e){
      if((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd'){
        e.preventDefault();
        openSetDriveModal();
      }
    });

    function openSetDriveModal(){
      const input = document.createElement('input');
      input.type = 'text';
      input.placeholder = 'Paste your drive/share link (https...)';
      input.value = localStorage.getItem(KEY_DRIVE) || driveAnchor.href || '';

      showModal({
        title: 'Set Drive link',
        description: 'Provide a shareable Google Drive link or any URL. It will be stored locally in your browser.',
        body: input,
        confirmText: 'Save link',
        cancelText: 'Cancel',
        onConfirm: () => {
          const v = input.value.trim();
          if(!v){
            showToast('Empty — nothing saved', 1000);
            return;
          }
          localStorage.setItem(KEY_DRIVE, v);
          // update anchor href so the template link opens the saved link
          driveAnchor.href = v;
          showToast('Drive link saved ✔');
        },
        onCancel: () => showToast('Canceled', 900)
      });
    }

    // intercept clicks on the drive anchor to confirm open (and ensure saved link used)
    driveAnchor.addEventListener('click', function(e){
      e.preventDefault();
      const href = localStorage.getItem(KEY_DRIVE) || driveAnchor.href;
      if(!href){
        showToast('No Drive link set — press Set Drive');
        return;
      }
      showModal({
        title: 'Open Drive?',
        description: 'This will open the saved Drive link in a new tab.',
        confirmText: 'Open',
        onConfirm: () => { window.open(href, '_blank', 'noopener'); showToast('Drive opened'); }
      });
    });
  }

  /* ---------- friendly load toast ---------- */
  setTimeout(()=> showToast('Interactive widgets loaded ✨'), 700);

})();
