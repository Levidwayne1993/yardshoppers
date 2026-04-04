/* ============================================================
   YardShoppers.com — Main JavaScript
   Static prototype interactions
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

  /* -------------------------------------------------------
     1. MOBILE MENU TOGGLE
  ------------------------------------------------------- */
  const mobileBtn = document.querySelector('.mobile-menu-btn');
  const navLinks  = document.querySelector('.navbar-links');

  if (mobileBtn) {
    mobileBtn.addEventListener('click', () => {
      navLinks.classList.toggle('open');
      const icon = mobileBtn.querySelector('i');
      icon.classList.toggle('fa-bars');
      icon.classList.toggle('fa-xmark');
    });
  }

  /* -------------------------------------------------------
     2. SAVE / HEART TOGGLE (Browse & Home listings)
  ------------------------------------------------------- */
  document.querySelectorAll('.listing-save').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      btn.classList.toggle('saved');
      const icon = btn.querySelector('i');
      if (btn.classList.contains('saved')) {
        icon.classList.remove('fa-regular');
        icon.classList.add('fa-solid');
        icon.style.color = '#EF4444';
      } else {
        icon.classList.remove('fa-solid');
        icon.classList.add('fa-regular');
        icon.style.color = '';
      }
    });
  });

  /* -------------------------------------------------------
     3. HERO SEARCH BAR (Homepage)
  ------------------------------------------------------- */
  const heroForm = document.querySelector('.hero-search');
  if (heroForm) {
    heroForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const keyword  = heroForm.querySelector('input[type="text"]').value.trim();
      const location = heroForm.querySelectorAll('input[type="text"]')[1]?.value.trim() || '';
      if (keyword || location) {
        window.location.href = `browse.html?q=${encodeURIComponent(keyword)}&loc=${encodeURIComponent(location)}`;
      }
    });
  }

  /* -------------------------------------------------------
     4. NAVBAR SEARCH BAR
  ------------------------------------------------------- */
  const navSearchInput = document.querySelector('.navbar-search input');
  if (navSearchInput) {
    navSearchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        const query = navSearchInput.value.trim();
        if (query) {
          window.location.href = `browse.html?q=${encodeURIComponent(query)}`;
        }
      }
    });
  }

  /* -------------------------------------------------------
     5. BROWSE PAGE — FILTER BUTTONS TOGGLE
  ------------------------------------------------------- */
  document.querySelectorAll('.browse-filters .filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.browse-filters .filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  /* -------------------------------------------------------
     6. BROWSE PAGE — APPLY / RESET FILTERS
  ------------------------------------------------------- */
  const applyBtn = document.querySelector('.btn-apply-filters');
  if (applyBtn) {
    applyBtn.addEventListener('click', () => {
      alert('Filters applied! (This will connect to a real database in the full build.)');
    });
  }

  const resetBtn = document.querySelector('.btn-reset');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      const sidebar = document.querySelector('.sidebar');
      if (sidebar) {
        sidebar.querySelectorAll('input[type="text"]').forEach(i => i.value = '');
        sidebar.querySelectorAll('select').forEach(s => s.selectedIndex = 0);
        sidebar.querySelectorAll('input[type="checkbox"]').forEach(c => c.checked = true);
        sidebar.querySelectorAll('input[type="date"]').forEach(d => d.value = '');
      }
    });
  }

  /* -------------------------------------------------------
     7. POST A SALE — FORM VALIDATION
  ------------------------------------------------------- */
  const postForm = document.getElementById('postSaleForm');
  if (postForm) {
    postForm.addEventListener('submit', (e) => {
      e.preventDefault();

      // Gather required fields
      const required = postForm.querySelectorAll('[required]');
      let firstInvalid = null;

      required.forEach(field => {
        const group = field.closest('.form-group') || field.closest('.form-group, label');
        if (!field.value || (field.type === 'checkbox' && !field.checked)) {
          field.classList.add('invalid');
          if (group) group.classList.add('has-error');
          if (!firstInvalid) firstInvalid = field;
        } else {
          field.classList.remove('invalid');
          if (group) group.classList.remove('has-error');
        }
      });

      if (firstInvalid) {
        firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
        firstInvalid.focus();
        return;
      }

      // "Success" modal for the prototype
      showSuccessModal();
    });

    // Clear validation styling on input
    postForm.querySelectorAll('[required]').forEach(field => {
      field.addEventListener('input', () => {
        field.classList.remove('invalid');
        const group = field.closest('.form-group');
        if (group) group.classList.remove('has-error');
      });
    });
  }

  /* -------------------------------------------------------
     8. POST A SALE — PHOTO UPLOAD PREVIEW
  ------------------------------------------------------- */
  const dropzone    = document.getElementById('photoDropzone');
  const photoInput  = document.getElementById('photoInput');
  const previewArea = document.getElementById('photoPreview');
  const chooseBtn   = document.querySelector('.btn-choose-files');

  if (dropzone && photoInput) {
    chooseBtn?.addEventListener('click', () => photoInput.click());

    dropzone.addEventListener('click', (e) => {
      if (e.target === dropzone || e.target.closest('.photo-upload-zone')) {
        photoInput.click();
      }
    });

    // Drag & drop visuals
    ['dragenter', 'dragover'].forEach(evt =>
      dropzone.addEventListener(evt, (e) => { e.preventDefault(); dropzone.classList.add('dragover'); })
    );
    ['dragleave', 'drop'].forEach(evt =>
      dropzone.addEventListener(evt, (e) => { e.preventDefault(); dropzone.classList.remove('dragover'); })
    );

    dropzone.addEventListener('drop', (e) => {
      const files = e.dataTransfer.files;
      handleFiles(files);
    });

    photoInput.addEventListener('change', () => {
      handleFiles(photoInput.files);
    });
  }

  function handleFiles(files) {
    if (!previewArea) return;
    for (const file of files) {
      if (!file.type.startsWith('image/')) continue;
      if (previewArea.children.length >= 10) break;

      const reader = new FileReader();
      reader.onload = (e) => {
        const thumb = document.createElement('div');
        thumb.className = 'photo-thumb';
        thumb.innerHTML = `
          <img src="${e.target.result}" alt="Preview">
          <button type="button" class="remove-photo" onclick="this.parentElement.remove()">
            <i class="fa-solid fa-xmark"></i>
          </button>
        `;
        previewArea.appendChild(thumb);
      };
      reader.readAsDataURL(file);
    }
  }

  /* -------------------------------------------------------
     9. LISTING DETAIL — PHOTO GALLERY
  ------------------------------------------------------- */
  // (changePhoto is a global function used via onclick in HTML)

  /* -------------------------------------------------------
     10. SMOOTH SCROLL FOR ANCHOR LINKS
  ------------------------------------------------------- */
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', (e) => {
      const target = document.querySelector(link.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });

  /* -------------------------------------------------------
     11. STICKY NAVBAR SHADOW ON SCROLL
  ------------------------------------------------------- */
  const navbar = document.querySelector('.navbar');
  if (navbar) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 10) {
        navbar.classList.add('scrolled');
      } else {
        navbar.classList.remove('scrolled');
      }
    });
  }

  /* -------------------------------------------------------
     12. CATEGORY CARD CLICKS (Homepage)
  ------------------------------------------------------- */
  document.querySelectorAll('.category-card').forEach(card => {
    card.addEventListener('click', () => {
      const category = card.querySelector('h3')?.textContent || '';
      window.location.href = `browse.html?category=${encodeURIComponent(category)}`;
    });
  });

}); // end DOMContentLoaded


/* ==========================================================
   GLOBAL FUNCTIONS (called from HTML onclick attributes)
========================================================== */

/* Listing Detail: Gallery photo switcher */
function changePhoto(thumbBtn) {
  const mainPhoto = document.getElementById('mainPhoto');
  if (mainPhoto && thumbBtn.dataset.src) {
    mainPhoto.src = thumbBtn.dataset.src;
    document.querySelectorAll('.gallery-thumbs .thumb').forEach(t => t.classList.remove('active'));
    thumbBtn.classList.add('active');
  }
}

/* Listing Detail: Save / Unsave button */
function toggleSave() {
  const btn  = document.getElementById('saveBtn');
  const icon = btn.querySelector('i');
  const text = btn.querySelector('span');
  btn.classList.toggle('saved');
  if (btn.classList.contains('saved')) {
    icon.classList.remove('fa-regular');
    icon.classList.add('fa-solid');
    icon.style.color = '#EF4444';
    text.textContent = 'Saved!';
  } else {
    icon.classList.remove('fa-solid');
    icon.classList.add('fa-regular');
    icon.style.color = '';
    text.textContent = 'Save';
  }
}

/* Listing Detail: Share button */
function shareListing() {
  if (navigator.share) {
    navigator.share({
      title: document.title,
      url: window.location.href
    });
  } else {
    navigator.clipboard.writeText(window.location.href).then(() => {
      alert('Link copied to clipboard!');
    });
  }
}

/* Post a Sale: Success modal */
function showSuccessModal() {
  const overlay = document.createElement('div');
  overlay.className = 'success-overlay';
  overlay.innerHTML = `
    <div class="success-modal">
      <div class="success-icon">
        <i class="fa-solid fa-circle-check"></i>
      </div>
      <h2>Your Sale is Live! 🎉</h2>
      <p>Your yard sale has been published and is now visible to shoppers in your area.</p>
      <div class="success-actions">
        <a href="listing.html" class="btn-view-listing">View My Listing</a>
        <a href="browse.html" class="btn-browse-more">Browse Sales</a>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
  // Fade in
  requestAnimationFrame(() => overlay.classList.add('visible'));
  // Close on overlay click
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.remove();
  });
}
