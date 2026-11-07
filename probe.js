/* Stage 1 check: can a page from the static host reach Apps Script, and how large a part can be sent?
   Sends random bytes only. Run it once with PROBE_ENABLED=1, then switch that property off. */
(function (global) {
  "use strict";
  const MB = 1024 * 1024;
  const SIZES = [1, 6, 10, 15, 20];

  function randomBase64(bytes) {
    const chunk = new Uint8Array(30000);
    let out = "";
    for (let left = bytes; left > 0; left -= chunk.length) {
      global.crypto.getRandomValues(chunk);
      out += btoa(String.fromCharCode.apply(null, chunk));
    }
    return out;
  }

  function row(name, result, ms) {
    const tr = document.createElement("tr");
    for (const text of [name, result, ms === null ? "" : `${(ms / 1000).toFixed(1)} שניות`]) {
      const td = document.createElement("td");
      td.textContent = text;
      tr.append(td);
    }
    document.getElementById("rows").append(tr);
  }

  async function timed(name, action, fields, read) {
    const started = performance.now();
    try {
      const reply = await global.Api.call(action, fields);
      row(name, read(reply), performance.now() - started);
      return reply.ok;
    } catch (e) {
      row(name, "נכשל: " + e.message, performance.now() - started);
      return false;
    }
  }

  async function run() {
    const status = document.getElementById("status");
    document.getElementById("rows").textContent = "";
    status.textContent = "רץ...";
    const alive = await timed("חיבור", "ping", {}, (r) => (r.ok ? "עובד" : "נכשל"));
    if (alive) {
      for (const size of SIZES) {
        const data = randomBase64(size * MB);
        const ok = await timed(`קובץ של ${size}MB, כולל כתיבה ל-Drive`, "probe", { data, drive: true },
          (r) => (r.ok ? `התקבל, ${r.ms}ms בשרת` : r.error));
        if (!ok) break;
      }
    }
    status.textContent = "הסתיים.";
  }

  document.getElementById("run").addEventListener("click", run);
})(window);
