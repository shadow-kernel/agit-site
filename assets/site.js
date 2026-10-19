/* agit site: theme, navigation, reveal animations, tabs, copy buttons,
   terminal demo, table of contents and the feature list. Vanilla JS. */
(function () {
  "use strict";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ---- theme -----------------------------------------------------------------
  const root = document.documentElement;
  function applyTheme(t) {
    if (t === "light") root.setAttribute("data-theme", "light");
    else root.removeAttribute("data-theme");
    document.querySelectorAll("[data-theme-toggle]").forEach((b) => {
      b.setAttribute("aria-label", t === "light" ? "Switch to dark theme" : "Switch to light theme");
    });
  }
  let theme = null;
  try {
    theme = localStorage.getItem("agit.theme");
  } catch (e) {
    /* ignore */
  }
  if (!theme && window.matchMedia("(prefers-color-scheme: light)").matches) theme = "light";
  applyTheme(theme);
  document.addEventListener("click", (e) => {
    const b = e.target.closest("[data-theme-toggle]");
    if (!b) return;
    theme = root.getAttribute("data-theme") === "light" ? "dark" : "light";
    applyTheme(theme);
    try {
      localStorage.setItem("agit.theme", theme);
    } catch (err) {
      /* ignore */
    }
  });

  // ---- mobile menu -----------------------------------------------------------
  document.addEventListener("click", (e) => {
    const b = e.target.closest("[data-menu]");
    const links = document.querySelector(".nav-links");
    if (b && links) {
      const open = links.classList.toggle("open");
      b.setAttribute("aria-expanded", String(open));
      return;
    }
    if (links && links.classList.contains("open") && !e.target.closest(".nav")) links.classList.remove("open");
  });

  // ---- current page in nav ---------------------------------------------------
  const here = location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".nav-links a").forEach((a) => {
    const href = a.getAttribute("href") || "";
    if (href === here || (here === "index.html" && href === "./")) a.setAttribute("aria-current", "page");
  });

  // ---- reveal on scroll ------------------------------------------------------
  const reveals = document.querySelectorAll(".reveal");
  if (reduceMotion || !("IntersectionObserver" in window)) {
    reveals.forEach((el) => el.classList.add("in"));
  } else {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          if (en.isIntersecting) {
            en.target.classList.add("in");
            io.unobserve(en.target);
          }
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
    );
    reveals.forEach((el) => io.observe(el));
  }

  // ---- tabs ------------------------------------------------------------------
  document.querySelectorAll(".tabs").forEach((tabs) => {
    const buttons = tabs.querySelectorAll(".tablist button");
    const panels = tabs.querySelectorAll(".tabpanel");
    function select(i) {
      buttons.forEach((b, j) => {
        b.setAttribute("aria-selected", String(i === j));
        b.tabIndex = i === j ? 0 : -1;
      });
      panels.forEach((p, j) => {
        p.hidden = i !== j;
      });
    }
    buttons.forEach((b, i) => {
      b.addEventListener("click", () => select(i));
      b.addEventListener("keydown", (e) => {
        if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
          const n = (i + (e.key === "ArrowRight" ? 1 : buttons.length - 1)) % buttons.length;
          select(n);
          buttons[n].focus();
        }
      });
    });
    select(0);
  });

  // ---- wide tables scroll inside their own box ------------------------------
  document.querySelectorAll(".prose table, .feature-group table").forEach((t) => {
    if (t.parentElement && t.parentElement.classList.contains("table-wrap")) return;
    const wrap = document.createElement("div");
    wrap.className = "table-wrap";
    t.parentNode.insertBefore(wrap, t);
    wrap.appendChild(t);
  });

  // ---- copy buttons on code blocks ------------------------------------------
  document.querySelectorAll("pre.code").forEach((pre) => {
    const btn = document.createElement("button");
    btn.className = "copy";
    btn.type = "button";
    btn.textContent = "Copy";
    btn.setAttribute("aria-label", "Copy code");
    btn.addEventListener("click", async () => {
      const text = pre.innerText.replace(/^Copy\n?/, "").replace(/\n?Copied!?$/, "");
      try {
        await navigator.clipboard.writeText(text);
        btn.textContent = "Copied";
        btn.classList.add("done");
      } catch (e) {
        btn.textContent = "Select and copy";
      }
      setTimeout(() => {
        btn.textContent = "Copy";
        btn.classList.remove("done");
      }, 1600);
    });
    pre.appendChild(btn);
  });

  // ---- hero terminal ---------------------------------------------------------
  const term = document.querySelector("[data-terminal]");
  if (term) {
    const lines = JSON.parse(term.getAttribute("data-terminal"));
    const pre = term.querySelector("pre");
    const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");
    const render = (l) => {
      if (l.cmd) return '<span class="t-prompt">$ </span><span class="t-cmd">' + esc(l.cmd) + "</span>";
      const cls = l.cls ? "t-" + l.cls : "t-out";
      return '<span class="' + cls + '">' + esc(l.out) + "</span>";
    };
    if (reduceMotion) {
      pre.innerHTML = lines.map(render).join("\n");
    } else {
      let i = 0;
      let html = "";
      const cursor = '<span class="cursor" aria-hidden="true"></span>';
      pre.innerHTML = '<span class="t-prompt">$ </span>' + cursor;
      function typeCmd(cmd, done) {
        let k = 0;
        (function tick() {
          k++;
          pre.innerHTML = html + '<span class="t-prompt">$ </span><span class="t-cmd">' + esc(cmd.slice(0, k)) + "</span>" + cursor;
          if (k < cmd.length) setTimeout(tick, 18 + Math.random() * 30);
          else setTimeout(done, 220);
        })();
      }
      function next() {
        if (i >= lines.length) {
          pre.innerHTML = html + '<span class="t-prompt">$ </span>' + cursor;
          setTimeout(() => {
            html = "";
            i = 0;
            next();
          }, 7000);
          return;
        }
        const l = lines[i++];
        if (l.cmd) {
          typeCmd(l.cmd, () => {
            html += render(l) + "\n";
            next();
          });
        } else {
          html += render(l) + "\n";
          pre.innerHTML = html + '<span class="t-prompt">$ </span>' + cursor;
          setTimeout(next, l.pause || 160);
        }
      }
      setTimeout(next, 600);
    }
  }

  // ---- table of contents: build from headings and highlight on scroll -------
  const toc = document.querySelector("[data-toc]");
  const prose = document.querySelector(".prose");
  if (toc && prose) {
    const heads = prose.querySelectorAll("h2[id], h3[id]");
    const frag = document.createDocumentFragment();
    heads.forEach((h) => {
      const a = document.createElement("a");
      a.href = "#" + h.id;
      a.textContent = h.getAttribute("data-toc") || h.textContent.replace(/\s+/g, " ").trim();
      if (h.tagName === "H3") a.className = "sub";
      frag.appendChild(a);
    });
    toc.appendChild(frag);
    const links = Array.from(toc.querySelectorAll("a"));
    const byId = new Map(links.map((a) => [a.getAttribute("href").slice(1), a]));
    let active = null;
    const setActive = (id) => {
      if (active === id) return;
      active = id;
      links.forEach((a) => a.classList.toggle("active", a.getAttribute("href") === "#" + id));
      const a = byId.get(id);
      if (a && toc.scrollHeight > toc.clientHeight) {
        // Scroll the TOC container only; never the window.
        const top = a.offsetTop - toc.offsetTop;
        if (top < toc.scrollTop || top + a.offsetHeight > toc.scrollTop + toc.clientHeight) {
          toc.scrollTop = Math.max(0, top - toc.clientHeight / 2);
        }
      }
    };
    const onScroll = () => {
      const navH = parseInt(getComputedStyle(root).getPropertyValue("--nav-h")) || 64;
      let current = heads[0] && heads[0].id;
      for (const h of heads) {
        if (h.getBoundingClientRect().top - navH - 24 <= 0) current = h.id;
        else break;
      }
      if (current) setActive(current);
    };
    document.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  // ---- feature list ----------------------------------------------------------
  const featRoot = document.querySelector("[data-features]");
  if (featRoot && window.AGIT_FEATURES) {
    const groups = window.AGIT_FEATURES;
    const statusLabel = { built: "Built", progress: "In progress", planned: "Planned" };
    const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;");
    const inline = (s) => esc(s).replace(/`([^`]+)`/g, "<code>$1</code>");
    let html = "";
    let total = 0;
    groups.forEach((g, gi) => {
      html += '<section class="feature-group" id="' + g.id + '"><h2>' + esc(g.title) + ' <span class="n">' + g.items.length + " features</span></h2>";
      html += "<p>" + inline(g.intro) + "</p>";
      g.items.forEach((f, fi) => {
        total++;
        const id = g.id + "-" + (f.id || fi);
        html +=
          '<article class="feature" id="' + id + '" data-status="' + f.status + '" data-text="' +
          esc((f.title + " " + f.what + " " + f.why + " " + f.how + " " + (f.cmds || []).join(" ")).toLowerCase()) +
          '"><header><h3><a href="#' + id + '" style="color:inherit">' + esc(f.title) + "</a></h3>" +
          '<span class="badge ' + f.status + '">' + statusLabel[f.status] + "</span>" +
          (f.since ? '<span class="badge neutral">' + esc(f.since) + "</span>" : "") +
          "</header>" +
          '<div class="wwh"><div><b>What</b><p>' + inline(f.what) + "</p></div><div><b>Why</b><p>" + inline(f.why) + "</p></div><div><b>How</b><p>" + inline(f.how) + "</p></div></div>" +
          ((f.cmds && f.cmds.length) ? '<div class="cmds">' + f.cmds.map((c) => "<code>" + esc(c) + "</code>").join("") + "</div>" : "") +
          "</article>";
      });
      html += "</section>";
    });
    featRoot.innerHTML = html;
    const count = document.querySelector("[data-count]");
    const search = document.querySelector("[data-search]");
    const chips = document.querySelectorAll("[data-status-filter]");
    let status = "all";
    function apply() {
      const q = (search ? search.value : "").trim().toLowerCase();
      let shown = 0;
      featRoot.querySelectorAll(".feature").forEach((el) => {
        const ok = (status === "all" || el.dataset.status === status) && (!q || el.dataset.text.includes(q));
        el.classList.toggle("hide", !ok);
        if (ok) shown++;
      });
      featRoot.querySelectorAll(".feature-group").forEach((g) => {
        const visible = g.querySelectorAll(".feature:not(.hide)").length;
        g.style.display = visible ? "" : "none";
        const n = g.querySelector(".n");
        if (n) n.textContent = visible + (visible === 1 ? " feature" : " features");
      });
      if (count) count.textContent = shown + " of " + total + " features";
    }
    chips.forEach((c) => {
      c.addEventListener("click", () => {
        status = c.getAttribute("data-status-filter");
        chips.forEach((x) => x.setAttribute("aria-pressed", String(x === c)));
        apply();
      });
    });
    if (search) search.addEventListener("input", apply);
    apply();
    // Rebuild the TOC now that the groups exist.
    const toc2 = document.querySelector("[data-toc]");
    if (toc2 && !toc2.children.length) {
      groups.forEach((g) => {
        const a = document.createElement("a");
        a.href = "#" + g.id;
        a.textContent = g.title;
        toc2.appendChild(a);
      });
    }
    if (location.hash) {
      const el = document.querySelector(location.hash);
      if (el) setTimeout(() => el.scrollIntoView(), 50);
    }
  }
})();
