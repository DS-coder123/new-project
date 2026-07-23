// === UI ===
// HUD updates, menus, notifications

class UI {
  constructor() {
    this.elements = {};
    this._cacheElements();
  }

  _cacheElements() {
    const ids = [
      'hp-fill', 'hp-value', 'sp-fill', 'sp-value',
      'timeline-progress', 'timeline-time',
      'combo-display', 'combo-count',
      'echo-slots', 'fps-counter',
      'pause-menu', 'gameover-screen', 'gameover-stats',
      'loading-screen', 'loading-bar', 'loading-text',
      'slowmo-overlay', 'boss-intro', 'boss-name', 'boss-subtitle',
      'hud',
    ];
    ids.forEach(id => {
      this.elements[id] = document.getElementById(id);
    });

    // Echo slot buttons
    this.echoSlotEls = document.querySelectorAll('.echo-slot');

    // Damage vignette (create on the fly)
    if (!document.getElementById('damage-vignette')) {
      var dv = document.createElement('div');
      dv.id = 'damage-vignette';
      document.body.appendChild(dv);
    }
    this.elements['damage-vignette'] = document.getElementById('damage-vignette');
  }

  setLoading(percent, text) {
    const bar = this.elements['loading-bar'];
    const txt = this.elements['loading-text'];
    if (bar) bar.style.width = percent + '%';
    if (txt) txt.textContent = text;
  }

  hideLoading() {
    const el = this.elements['loading-screen'];
    if (el) {
      el.style.opacity = '0';
      el.style.transition = 'opacity 0.5s';
      setTimeout(() => { el.style.display = 'none'; }, 500);
    }
  }

  showHUD() {
    const hud = this.elements['hud'];
    if (hud) hud.style.display = 'block';
  }

  updateHealth(hp, maxHp) {
    const fill = this.elements['hp-fill'];
    const val = this.elements['hp-value'];
    if (!fill || !val) return;
    const pct = Math.max(0, hp / maxHp * 100);
    fill.style.width = pct + '%';
    val.textContent = Math.ceil(hp) + '/' + maxHp;

    // Color shift on low HP
    if (pct < 25) {
      fill.style.background = 'linear-gradient(90deg, #ef4444, #dc2626)';
    } else if (pct < 50) {
      fill.style.background = 'linear-gradient(90deg, #facc15, #eab308)';
    } else {
      fill.style.background = 'linear-gradient(90deg, #4ade80, #22c55e)';
    }
  }

  updateStamina(sp, maxSp) {
    const fill = this.elements['sp-fill'];
    const val = this.elements['sp-value'];
    if (!fill || !val) return;
    fill.style.width = Math.max(0, sp / maxSp * 100) + '%';
    val.textContent = Math.ceil(sp) + '/' + maxSp;
  }

  updateEchoTimeline(recording, duration, maxDuration) {
    const progress = this.elements['timeline-progress'];
    const timeEl = this.elements['timeline-time'];
    if (!progress || !timeEl) return;

    if (recording) {
      progress.style.width = (duration / maxDuration * 100) + '%';
      const secs = Math.floor(duration);
      timeEl.textContent = String(Math.floor(secs / 60)).padStart(2, '0') + ':' +
        String(secs % 60).padStart(2, '0');
    } else {
      progress.style.width = '0%';
      timeEl.textContent = '00:00';
    }
  }

  updateEchoSlots(slots, activeRecording) {
    this.echoSlotEls.forEach((el, i) => {
      el.classList.remove('recording', 'saved');
      if (activeRecording !== null && activeRecording.slot === i) {
        el.classList.add('recording');
        el.textContent = '●';
      } else if (slots[i]) {
        el.classList.add('saved');
        el.textContent = (i + 1);
      } else {
        el.textContent = (i + 1);
      }
    });
  }

  updateCombo(count) {
    const display = this.elements['combo-display'];
    const countEl = this.elements['combo-count'];
    if (!display || !countEl) return;

    if (count > 1) {
      display.style.opacity = '1';
      countEl.textContent = count;
      // Scale animation
      countEl.style.transform = 'scale(1.3)';
      setTimeout(() => { countEl.style.transform = 'scale(1)'; }, 100);
    } else {
      display.style.opacity = '0';
    }
  }

  showDamageVignette(intensity = 0.5) {
    const dv = this.elements['damage-vignette'];
    if (dv) {
      dv.style.opacity = intensity;
      setTimeout(() => { dv.style.opacity = '0'; }, 200);
    }
  }

  showSlowmo(show) {
    const el = this.elements['slowmo-overlay'];
    if (el) el.style.display = show ? 'block' : 'none';
  }

  showPauseMenu() {
    const el = this.elements['pause-menu'];
    if (el) el.style.display = 'flex';
  }

  hidePauseMenu() {
    const el = this.elements['pause-menu'];
    if (el) el.style.display = 'none';
  }

  showGameOver(stats) {
    const el = this.elements['gameover-screen'];
    const statsEl = this.elements['gameover-stats'];
    if (el) el.style.display = 'flex';
    if (statsEl && stats) {
      statsEl.textContent = `Enemies Defeated: ${stats.kills || 0} | Echoes Used: ${stats.echoesUsed || 0} | Max Combo: ${stats.maxCombo || 0}`;
    }
  }

  hideGameOver() {
    const el = this.elements['gameover-screen'];
    if (el) el.style.display = 'none';
  }

  showBossIntro(name, subtitle) {
    const el = this.elements['boss-intro'];
    const nameEl = this.elements['boss-name'];
    const subEl = this.elements['boss-subtitle'];
    if (el) {
      el.style.display = 'flex';
      nameEl.textContent = name || '';
      subEl.textContent = subtitle || '';
      setTimeout(() => { el.style.display = 'none'; }, 3000);
    }
  }

  updateAbilityCooldowns(abilities) {
    const echoIcon = document.getElementById('ability-echo');
    const dashIcon = document.getElementById('ability-dash');
    const specIcon = document.getElementById('ability-special');

    if (echoIcon) echoIcon.className = 'ability-icon ' + (abilities.echo ? 'ready' : 'cooldown');
    if (dashIcon) dashIcon.className = 'ability-icon ' + (abilities.dash ? 'ready' : 'cooldown');
    if (specIcon) specIcon.className = 'ability-icon ' + (abilities.special ? 'ready' : 'cooldown');
  }

  updateMinimap(playerPos, enemies, worldSize = 100) {
    const canvas = document.getElementById('minimap');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width, h = canvas.height;
    const scale = w / worldSize;

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(0, 0, w, h);

    // Center on player
    const cx = w / 2, cy = h / 2;

    // Player dot
    ctx.fillStyle = '#4dc9f6';
    ctx.beginPath();
    ctx.arc(cx, cy, 3, 0, Math.PI * 2);
    ctx.fill();

    // Enemy dots
    if (enemies) {
      enemies.forEach(e => {
        if (e.isDead && e.isDead()) return;
        const dx = (e.position.x - playerPos.x) * scale;
        const dy = (e.position.z - playerPos.z) * scale;
        const dist = Math.sqrt(dx*dx + dy*dy);
        if (dist < w / 2) {
          ctx.fillStyle = e.type === 'BOSS' ? '#ff2266' : '#ff4444';
          ctx.beginPath();
          ctx.arc(cx + dx, cy + dy, 2, 0, Math.PI * 2);
          ctx.fill();
        }
      });
    }
  }
}

export { UI };
