/* ======== Utility Functions ======== */
function showToast(message, duration = 3000) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  
  toast.textContent = message;
  toast.setAttribute('aria-hidden', 'false');
  toast.classList.add('show');
  
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.setAttribute('aria-hidden', 'true'), 300);
  }, duration);
}

/* ======== Minecraft Color Codes Parser old ======== */
const minecraftColors = {
  '0': '#000000', '1': '#0000AA', '2': '#00AA00', '3': '#00AAAA',
  '4': '#AA0000', '5': '#AA00AA', '6': '#FFAA00', '7': '#AAAAAA',
  '8': '#555555', '9': '#5555FF', 'a': '#55FF55', 'b': '#55FFFF',
  'c': '#FF5555', 'd': '#FF55FF', 'e': '#FFFF55', 'f': '#FFFFFF'
};

const minecraftFormats = {
  'l': 'font-weight: bold',
  'o': 'font-style: italic',
  'n': 'text-decoration: underline',
  'm': 'text-decoration: line-through',
  'k': 'animation: obfuscate 0.1s infinite'
};

function parseMinecraftText(text) {
  if (!text) return text;
  
  // Decode HTML entities manually (CSP-safe)
  function decodeHTMLEntities(str) {
    const entities = {
      '&amp;': '&',
      '&lt;': '<',
      '&gt;': '>',
      '&quot;': '"',
      '&#39;': "'",
      '&sect;': '§'
    };
    
    return str.replace(/&[a-z]+;|&#\d+;/gi, match => {
      return entities[match.toLowerCase()] || match;
    });
  }
  
  const decodedText = decodeHTMLEntities(text);
  
  // Replace color codes that are stuck together (e.g., "§6У§e") with proper format
  const result = [];
  let i = 0;
  let currentColor = '#FFFFFF';
  let currentStyles = [];
  
  while (i < decodedText.length) {
    const char = decodedText[i];
    const next = decodedText[i + 1]?.toLowerCase();
    
    // Check if this is a color/format code
    if ((char === '§' || char === '&') && next) {
      // Apply the code
      if (minecraftColors[next]) {
        currentColor = minecraftColors[next];
        currentStyles = []; // Reset formatting on color change
      } else if (minecraftFormats[next]) {
        currentStyles.push(minecraftFormats[next]);
      } else if (next === 'r') {
        currentColor = '#FFFFFF';
        currentStyles = [];
      }
      
      i += 2; // Skip both § and the code
      continue;
    }
    
    // Regular character - wrap it in a span with current color
    if (char.trim()) { // Only for non-whitespace
      const styles = currentStyles.join(';');
      const escapedChar = char.replace(/</g, '&lt;').replace(/>/g, '&gt;');
      result.push(`<span style="color:${currentColor};${styles}">${escapedChar}</span>`);
    } else {
      result.push(char); // Keep whitespace as-is
    }
    
    i++;
  }
  
  return result.join('');
}

/* ======== Server Status with Colored MOTD ======== */
async function fetchServerStatus() {
  try {
    const res = await fetch("СКОРО", { cache: 'no-store' });
    const data = await res.json();

    const onlineCountEl = document.getElementById('onlineCount');
    const motdEl = document.getElementById('serverMotd');
    const versionEl = document.getElementById('serverVersion');
    const modalCount = document.getElementById('modalCount');

    if (data && data.online) {
      const online = (data.players?.online) || 0;
      const max = (data.players?.max) || '—';
      
      // Update online count
      onlineCountEl.innerHTML = `<i class="fa-solid fa-users"></i> <strong>${online} / ${max}</strong>`;
      
      // Parse and display colored MOTD
      if (data.motd) {
        // Use HTML version which already has colors
        let motdLines = data.motd.html || data.motd.raw || data.motd.clean || [];
        
        if (motdLines.length > 0) {
          motdLines = motdLines.slice(0, 2); // Take first 2 lines
          
          // If html exists, it's already formatted - just join
          if (data.motd.html) {
            motdEl.innerHTML = motdLines.join('<br>');
          } else {
            // Otherwise parse raw codes
            const htmlLines = motdLines.map(line => parseMinecraftText(line));
            motdEl.innerHTML = htmlLines.join('<br>');
          }
        } else {
          motdEl.textContent = 'Магній Ванільний Український сервер';
        }
      } else {
        motdEl.textContent = 'Магній Ванільний Український сервер';
      }
      
      // Update last refresh time
      updateLastRefreshTime();
      
      // Update version
      if (data.version) {
        versionEl.textContent = data.version;
      }
      
      // Update modal count
      if (modalCount) {
        modalCount.innerHTML = `<i class="fa-solid fa-user"></i> Гравців онлайн: <strong>${online} / ${max}</strong>`;
      }
    } else {
      onlineCountEl.innerHTML = '<span style="color:#ff5555;"><i class="fa-solid fa-circle-xmark"></i> Сервер зараз офлайн</span>';
      motdEl.innerHTML = '<span style="color:#ff5555;">Сервер офлайн</span>';
      if (modalCount) {
        modalCount.innerHTML = '<span style="color:#ff5555;">Сервер офлайн</span>';
      }
    }
  } catch (err) {
    console.error('fetchServerStatus error:', err);
    const onlineCountEl = document.getElementById('onlineCount');
    const motdEl = document.getElementById('serverMotd');
    const modalCount = document.getElementById('modalCount');
    
    if (onlineCountEl) {
      onlineCountEl.innerHTML = '<span style="color:#ffaa00;"><i class="fa-solid fa-triangle-exclamation"></i> Не вдалося отримати статус</span>';
    }
    if (motdEl) {
      motdEl.innerHTML = '<span style="color:#ffaa00;">Помилка завантаження</span>';
    }
    if (modalCount) {
      modalCount.innerHTML = '<span style="color:#ffaa00;">Не вдалося отримати дані</span>';
    }
  }
}

// Initial fetch and periodic updates every 10 seconds
fetchServerStatus();
const statusInterval = setInterval(fetchServerStatus, 10000);

/* ======== Last Refresh Time Display ======== */
let lastRefreshTime = new Date();

function updateLastRefreshTime() {
  lastRefreshTime = new Date();
  const timeString = lastRefreshTime.toLocaleTimeString('uk-UA', { 
    hour: '2-digit', 
    minute: '2-digit',
    second: '2-digit'
  });
  
  // Add refresh time indicator if element exists
  let refreshIndicator = document.getElementById('lastRefresh');
  if (!refreshIndicator) {
    const statusWrap = document.querySelector('.server-status');
    if (statusWrap) {
      refreshIndicator = document.createElement('div');
      refreshIndicator.id = 'lastRefresh';
      refreshIndicator.style.cssText = 'color: var(--muted); font-size: 0.85rem; margin-top: 8px;';
      statusWrap.appendChild(refreshIndicator);
    }
  }
  

}

// Update time on initial load
updateLastRefreshTime();

/* ======== Copy IP Functionality ======== */
const copyIpBtn = document.getElementById('copyIp');
if (copyIpBtn) {
  copyIpBtn.addEventListener('click', async () => {
    const serverIp = 'СКОРО';
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(serverIp);
      } else {
        const ta = document.createElement('textarea');
        ta.value = serverIp;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        ta.remove();
      }
      showToast('✅ IP скопійовано: ' + serverIp);
    } catch (err) {
      console.error('Copy IP error:', err);
      showToast('❌ Не вдалося скопіювати IP');
    }
  });
}

/* ======== Players Modal & Rendering ======== */
const showPlayersBtn = document.getElementById('showPlayersBtn');
const modalBackdrop = document.getElementById('modalBackdrop');
const playersContainer = document.getElementById('playersContainer');
const playersEmpty = document.getElementById('playersEmpty');
const closeModal = document.getElementById('closeModal');
const refreshPlayers = document.getElementById('refreshPlayers');

async function loadPlayers() {
  if (!playersContainer || !playersEmpty) return;
  
  playersContainer.innerHTML = '';
  playersEmpty.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Завантаження списку гравців...';
  playersEmpty.style.display = 'block';
  
  try {
    const res = await fetch('https://api.mcsrvstat.us/2/mc.cleverfox.com.ua', { cache: 'no-store' });
    const data = await res.json();

    let rawList = [];
    if (data?.players) {
      rawList = data.players.list || data.players.sample || [];
    }

    const list = Array.isArray(rawList) 
      ? rawList.map(p => (typeof p === 'string' ? p : (p.name || p.id || JSON.stringify(p)))) 
      : [];

    if (!list.length) {
      playersEmpty.innerHTML = '<i class="fa-solid fa-user-slash"></i> Наразі гравців не виявлено або сервер не надав список.';
      playersEmpty.style.display = 'block';
      return;
    }

    playersEmpty.style.display = 'none';

    // Helper to create URL-safe slug
    const makeSlug = (n) => String(n).toLowerCase().replace(/[^a-z0-9_\-]/g, '');

    list.forEach(name => {
      const slug = makeSlug(name);

      const card = document.createElement('div');
      card.className = 'player-card';

      const link = document.createElement('a');
      link.className = 'player-link';
      link.href = `/players/profile/${slug}/`;
      link.title = `Перейти до профілю ${name}`;

      const img = document.createElement('img');
      img.src = `https://crafthead.net/helm/${encodeURIComponent(name)}/128`;
      img.alt = `${name} head`;
      img.loading = 'lazy';
      img.onerror = () => { img.src = '/images/logo.png'; };

      const label = document.createElement('div');
      label.className = 'player-name';
      label.textContent = name;

      link.appendChild(img);
      link.appendChild(label);

      // Actions container
      const actions = document.createElement('div');
      actions.className = 'player-actions';

      const copyBtn = document.createElement('button');
      copyBtn.className = 'player-action-btn';
      copyBtn.type = 'button';
      copyBtn.title = 'Копіювати нік';
      copyBtn.innerHTML = '<i class="fa-regular fa-copy"></i>';
      copyBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        e.preventDefault();
        try {
          if (navigator.clipboard?.writeText) {
            await navigator.clipboard.writeText(name);
          } else {
            const ta = document.createElement('textarea');
            ta.value = name;
            ta.style.position = 'fixed';
            ta.style.opacity = '0';
            document.body.appendChild(ta);
            ta.select();
            document.execCommand('copy');
            ta.remove();
          }
          showToast(`✅ Нік "${name}" скопійовано`);
        } catch (err) {
          console.error('Copy nickname error:', err);
          showToast('❌ Не вдалось скопіювати нік');
        }
      });

      const openBtn = document.createElement('a');
      openBtn.className = 'player-action-btn';
      openBtn.href = link.href;
      openBtn.target = '_blank';
      openBtn.rel = 'noopener noreferrer';
      openBtn.title = `Відкрити профіль ${name} у новому вікні`;
      openBtn.innerHTML = '<i class="fa-solid fa-arrow-up-right-from-square"></i>';

      actions.appendChild(copyBtn);
      actions.appendChild(openBtn);

      card.appendChild(link);
      card.appendChild(actions);

      playersContainer.appendChild(card);
    });
  } catch (err) {
    console.error('loadPlayers error:', err);
    playersEmpty.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> Не вдалося завантажити гравців. Спробуйте пізніше.';
    playersEmpty.style.display = 'block';
  }
}

function openModal() {
  if (!modalBackdrop) return;
  modalBackdrop.classList.add('show');
  modalBackdrop.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
  loadPlayers();
}

function closeModalFn() {
  if (!modalBackdrop) return;
  modalBackdrop.classList.remove('show');
  modalBackdrop.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

if (showPlayersBtn) showPlayersBtn.addEventListener('click', openModal);
if (closeModal) closeModal.addEventListener('click', closeModalFn);
if (refreshPlayers) refreshPlayers.addEventListener('click', loadPlayers);
if (modalBackdrop) {
  modalBackdrop.addEventListener('click', (e) => {
    if (e.target === modalBackdrop) closeModalFn();
  });
}
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeModalFn();
});

/* ======== Mobile Menu Toggle ======== */
const burgerBtn = document.getElementById('burgerBtn');
const navLinks = document.getElementById('navLinks');

if (burgerBtn && navLinks) {
  burgerBtn.addEventListener('click', () => {
    const isExpanded = burgerBtn.getAttribute('aria-expanded') === 'true';
    burgerBtn.setAttribute('aria-expanded', !isExpanded);
    burgerBtn.classList.toggle('active');
    navLinks.classList.toggle('active');
  });
}

/* ======== Scroll to Top Button ======== */
const scrollTop = document.getElementById('scrollTop');

if (scrollTop) {
  window.addEventListener('scroll', () => {
    if (window.pageYOffset > 300) {
      scrollTop.classList.add('visible');
    } else {
      scrollTop.classList.remove('visible');
    }
  });

  scrollTop.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  scrollTop.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  });
}

/* ======== Current Year in Footer ======== */
const currentYear = document.getElementById('currentYear');
if (currentYear) {
  currentYear.textContent = new Date().getFullYear();
}

/* ======== Particles Animation (Optional) ======== */
const particlesContainer = document.getElementById('particles');
if (particlesContainer) {
  function createParticle() {
    const particle = document.createElement('div');
    particle.className = 'particle';
    particle.style.left = Math.random() * 100 + '%';
    particle.style.animationDuration = (Math.random() * 3 + 2) + 's';
    particle.style.opacity = Math.random() * 0.5 + 0.1;
    particlesContainer.appendChild(particle);

    setTimeout(() => {
      particle.remove();
    }, 5000);
  }

  // Create particles periodically
  setInterval(createParticle, 300);
}