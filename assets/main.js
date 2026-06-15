// AgentMetal — terminal typing demo + scroll reveals (no dependencies)
(function () {
  'use strict';

  /* ---------- scroll reveals ---------- */
  var els = document.querySelectorAll('.io-reveal');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.12 });
    els.forEach(function (el) { io.observe(el); });
  } else {
    els.forEach(function (el) { el.classList.add('is-in'); });
  }

  /* ---------- live activity ticker (hero) ---------- */
  // Feed the horizontal ticker from /v1/activity. Anonymized summaries only. Graceful: on any
  // failure the static fallback markup already in the DOM stays put, so the page never breaks.
  (function liveTicker() {
    var track = document.getElementById('live-ticker-track');
    if (!track) return;
    var API = 'https://api.agentmetal.dev/v1/activity?limit=18';
    function render(events) {
      if (!events || !events.length) return;
      var parts = [];
      // Duplicate the sequence so the CSS marquee (translateX -50%) loops seamlessly.
      for (var pass = 0; pass < 2; pass++) {
        for (var i = 0; i < events.length; i++) {
          var hidden = pass === 1 ? ' aria-hidden="true"' : '';
          if (i > 0) parts.push('<i' + hidden + '>·</i>');
          parts.push('<span' + hidden + '>' + escapeHtml(events[i].summary) + '</span>');
        }
        if (pass === 0) parts.push('<i aria-hidden="true">·</i>');
      }
      track.innerHTML = parts.join('');
    }
    function escapeHtml(s) {
      return String(s).replace(/[&<>"]/g, function (ch) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch];
      });
    }
    function poll() {
      fetch(API, { headers: { accept: 'application/json' } })
        .then(function (r) { return r.ok ? r.json() : null; })
        .then(function (d) { if (d && d.events) render(d.events); })
        .catch(function () { /* keep the static fallback */ });
    }
    poll();
    setInterval(poll, 15000);
  })();

  /* ---------- terminal demo ---------- */
  var body = document.getElementById('term-body');
  var clockEl = document.getElementById('term-clock');
  if (!body) return;

  var reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // [html, type-mode, pause-after-ms, clock-seconds]
  var SCRIPT = [
    ['<span class="t-dollar">$</span> <span class="t-cmd">curl -s -X POST https://api.agentmetal.dev/v1/servers \\</span>', 'type', 60, 0.4],
    ['    <span class="t-cmd">-d \'{"plan":"nano","days":7}\'</span>', 'type', 420, 1.1],
    ['<span class="t-status">← 402 Payment Required</span>   <span class="t-comment">usdc on base · $4.90 · pay-to 0x7c…e1</span>', 'line', 700, 1.6],
    ['<span class="t-comment"># wallet signs EIP-3009 transferWithAuthorization… retrying</span>', 'line', 900, 4.2],
    ['<span class="t-dollar">$</span> <span class="t-cmd">curl -s -X POST …/v1/servers -H "X-PAYMENT: eyJ4NDAyVmVyc2lvbi…"</span>', 'type', 500, 6.0],
    ['<span class="t-ok">← 201 Created</span>              <span class="t-comment">verified → provisioned → settled 0x9f…c2</span>', 'line', 600, 38.2],
    ['{', 'line', 40, 38.4],
    ['  <span class="t-key">"id"</span>: "srv_kx04qd",  <span class="t-key">"ipv4"</span>: "188.245.32.17",', 'line', 40, 38.5],
    ['  <span class="t-key">"ssh"</span>: "root@188.245.32.17",', 'line', 40, 38.6],
    ['  <span class="t-key">"expires_at"</span>: "2026-06-17T00:00:00Z",', 'line', 40, 38.7],
    ['  <span class="t-key">"renew"</span>: "POST /v1/servers/srv_kx04qd/extend"', 'line', 40, 38.8],
    ['}', 'line', 800, 39.0],
    ['<span class="t-dollar">$</span> <span class="t-cmd">ssh root@188.245.32.17 \'head -2 /root/SERVER.md\'</span>', 'type', 500, 47.0],
    ['<span class="t-comment"># You are srv_kx04qd — nano, ash. You expire 2026-06-17.</span>', 'line', 60, 52.8],
    ['<span class="t-comment"># To stay alive: pay the 402 at the renew URL. You know how.</span>', 'line', 3800, 53.1]
  ];

  var li = 0, started = false;

  function setClock(s) {
    if (clockEl) clockEl.textContent = 't+' + s.toFixed(1) + 's';
  }

  function showCursor() {
    var c = document.createElement('span');
    c.className = 't-cursor';
    body.appendChild(c);
    return c;
  }

  function typeLine(html, done) {
    // type the plain text progressively, then swap in the colored html
    var probe = document.createElement('div');
    probe.innerHTML = html;
    var text = probe.textContent;
    var node = document.createElement('span');
    body.appendChild(node);
    var cur = showCursor();
    var i = 0;
    (function tick() {
      node.textContent = text.slice(0, ++i);
      if (i < text.length) setTimeout(tick, 10 + Math.random() * 22);
      else { node.outerHTML = html; cur.remove(); body.appendChild(document.createTextNode('\n')); done(); }
    })();
  }

  function putLine(html, done) {
    var node = document.createElement('span');
    node.innerHTML = html;
    body.appendChild(node);
    body.appendChild(document.createTextNode('\n'));
    done();
  }

  function step() {
    if (li >= SCRIPT.length) {
      setTimeout(function () { body.textContent = ''; li = 0; setClock(0); step(); }, 1200);
      return;
    }
    var row = SCRIPT[li++];
    setClock(row[3]);
    var go = function () { setTimeout(step, row[2]); };
    if (row[1] === 'type') typeLine(row[0], go); else putLine(row[0], go);
  }

  function renderAllAtOnce() {
    body.innerHTML = SCRIPT.map(function (r) { return r[0]; }).join('\n');
    setClock(SCRIPT[SCRIPT.length - 1][3]);
  }

  if (reduced) { renderAllAtOnce(); return; }

  if ('IntersectionObserver' in window) {
    var tio = new IntersectionObserver(function (entries) {
      if (entries[0].isIntersecting && !started) { started = true; step(); tio.disconnect(); }
    }, { threshold: 0.35 });
    tio.observe(body);
  } else { step(); }
})();
