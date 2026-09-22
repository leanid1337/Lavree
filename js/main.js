/* LAVREE studio - shared layout & behaviors (header, menu, footer, wishlist, modal) */
(function () {
  "use strict";

  var L = window.LAVREE;

  /* ---------- page entry + navigation veil ----------
     First arrival this session plays an emblem intro; in-site link clicks
     cover the screen with the destination's name, navigate, then uncover. */
  (function pageVeil() {
    var reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    var EMBLEM_SRC = "photo/logo/Logo-header.png";
    var NAMES = {
      "index.html": "LAVRÉE", "": "LAVRÉE", "product.html": "LAVRÉE",
      "kalhoty.html": "Kalhoty", "topy.html": "Topy", "sortky.html": "Šortky",
      "saty-sukne.html": "Šaty & Sukně", "highlights.html": "Highlights",
      "about.html": "About"
    };
    function file(href) {
      return (href || "").split("#")[0].split("?")[0].split("/").pop().toLowerCase();
    }
    function norm(f) { return f === "" ? "index.html" : f; }
    function destName(href, a) {
      var f = file(href);
      if (NAMES[f] != null) return NAMES[f];
      return ((a && a.textContent) || "").trim() || "LAVRÉE";
    }
    function get(k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } }
    function set(k, v) { try { sessionStorage.setItem(k, v); } catch (e) {} }
    function del(k) { try { sessionStorage.removeItem(k); } catch (e) {} }
    function lock(on) { document.documentElement.classList.toggle("veil-lock", on); }

    if (!document.body) return;

    var veil = document.createElement("div");
    veil.className = "page-veil";
    veil.setAttribute("aria-hidden", "true");
    veil.innerHTML =
      '<div class="page-veil__inner">' +
        '<img class="page-veil__emblem" src="' + EMBLEM_SRC + '" alt="">' +
        '<span class="page-veil__name"></span>' +
      "</div>";
    var nameEl = veil.querySelector(".page-veil__name");
    document.body.insertBefore(veil, document.body.firstChild);

    function reveal(hold) {
      var run = function () {
        veil.classList.add("is-revealing");
        veil.classList.remove("is-shown");
        lock(false);
        /* keep the element (hidden) so outgoing clicks can reuse it */
        setTimeout(function () {
          veil.classList.remove("is-revealing", "is-emblem", "is-name", "is-ready");
        }, 800);
      };
      if (reduce.matches) { run(); return; }
      var go = function () { setTimeout(run, hold); };
      if (document.readyState === "complete") go();
      else window.addEventListener("load", go);
    }

    /* cover with the emblem (logo), fading it in only once it has decoded so it
       never pops mid-animation. Shared by the site-entry intro and any
       navigation whose destination is the home page. */
    function readyEmblem() {
      veil.classList.add("is-emblem");
      var emblem = veil.querySelector(".page-veil__emblem");
      var go = function () { veil.classList.add("is-ready"); };
      if (emblem.complete && emblem.naturalWidth) go();
      else if (emblem.decode) emblem.decode().then(go, go);
      else { emblem.onload = go; emblem.onerror = go; }
    }
    function isHome(href) { return norm(file(href)) === "index.html"; }

    var navName = get("lavree_nav");
    var navHome = get("lavree_nav_home") === "1";
    var entered = get("lavree_entered") === "1";

    if (navName) {                       /* arrived via in-site navigation */
      del("lavree_nav"); del("lavree_nav_home");
      if (navHome) {                     /* landed on the home page -> emblem */
        veil.classList.add("is-shown");
        readyEmblem();
      } else {                           /* other pages -> destination name */
        nameEl.textContent = navName;
        veil.classList.add("is-name", "is-shown");
      }
      lock(true);
      reveal(reduce.matches ? 0 : 160);
    } else if (!entered) {               /* first visit this session -> emblem */
      set("lavree_entered", "1");
      veil.classList.add("is-shown");
      readyEmblem();
      lock(true);
      reveal(reduce.matches ? 0 : 1150);
    }
    /* else: veil stays hidden, ready to cover for the next outgoing click */

    document.addEventListener("click", function (e) {
      if (e.defaultPrevented || e.button !== 0 ||
          e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      var a = e.target.closest && e.target.closest("a[href]");
      if (!a || a.target === "_blank" || a.hasAttribute("download")) return;
      var href = a.getAttribute("href");
      if (!href || href.charAt(0) === "#" || /^(https?:|mailto:|tel:)/i.test(href)) return;
      if (norm(file(href)) === norm(file(location.pathname))) return; /* same page / hash */

      e.preventDefault();
      veil.classList.remove("is-revealing", "is-emblem", "is-name", "is-ready");
      if (isHome(href)) {                /* going home -> cover with the emblem */
        set("lavree_nav", "");     /* marker so arrival knows a nav happened */
        set("lavree_nav_home", "1");
        readyEmblem();
      } else {                           /* other pages -> destination name */
        var name = destName(href, a);
        set("lavree_nav", name);
        del("lavree_nav_home");
        nameEl.textContent = name;
        veil.classList.add("is-name");
      }
      lock(true);
      requestAnimationFrame(function () { veil.classList.add("is-shown"); });
      setTimeout(function () { location.href = href; }, reduce.matches ? 0 : 500);
    }, true);

    /* Back/forward via the browser can restore this page from the bfcache with
       the outgoing cover still on screen (no fresh load, so reveal() never
       runs). Clear it on pageshow so the page is never stuck behind the veil. */
    window.addEventListener("pageshow", function (e) {
      if (!e.persisted) return;
      if (veil.classList.contains("is-shown")) {
        veil.classList.add("is-revealing");
        veil.classList.remove("is-shown");
        setTimeout(function () {
          veil.classList.remove("is-revealing", "is-emblem", "is-name", "is-ready");
        }, 700);
      }
      lock(false);
    });
  })();

  /* ---------- storage helpers ---------- */
  function readList(key) {
    try { return JSON.parse(localStorage.getItem(key)) || []; }
    catch (e) { return []; }
  }
  function writeList(key, list) {
    localStorage.setItem(key, JSON.stringify(list));
  }
  L.wishlist = {
    key: "lavree_wishlist",
    all: function () { return readList(this.key); },
    has: function (id) { return this.all().indexOf(id) !== -1; },
    toggle: function (id) {
      var list = this.all();
      var i = list.indexOf(id);
      if (i === -1) list.push(id); else list.splice(i, 1);
      writeList(this.key, list);
      updateCounts();
      return i === -1;
    }
  };
  L.bag = {
    key: "lavree_bag",
    all: function () { return readList(this.key); },
    add: function (id) {
      var list = this.all();
      list.push(id);
      writeList(this.key, list);
      updateCounts();
    }
  };

  function updateCounts() {
    var w = document.querySelector('[data-count="wishlist"]');
    var b = document.querySelector('[data-count="bag"]');
    if (w) {
      var wc = L.wishlist.all().length;
      w.textContent = wc;
      w.classList.toggle("is-visible", wc > 0);
    }
    if (b) {
      var bc = L.bag.all().length;
      b.textContent = bc;
      b.classList.toggle("is-visible", bc > 0);
    }
  }
  L.updateCounts = updateCounts;

  /* ---------- svg icons ---------- */
  var ICONS = {
    search: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><line x1="15.5" y1="15.5" x2="21" y2="21"/></svg>',
    user: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/></svg>',
    heart: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20.5C7 16.5 3.5 13.2 3.5 9.4 3.5 6.6 5.7 4.5 8.3 4.5c1.5 0 2.9.8 3.7 2 .8-1.2 2.2-2 3.7-2 2.6 0 4.8 2.1 4.8 4.9 0 3.8-3.5 7.1-8.5 11.1z"/></svg>',
    bag: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 8h14l-1 13H6L5 8z"/><path d="M8.5 8V6.5a3.5 3.5 0 0 1 7 0V8"/></svg>',
    close: '<svg viewBox="0 0 24 24" aria-hidden="true"><line x1="5" y1="5" x2="19" y2="19"/><line x1="19" y1="5" x2="5" y2="19"/></svg>',
    chevron: '<svg viewBox="0 0 24 24" aria-hidden="true"><polyline points="6 9 12 15 18 9"/></svg>',
    plus: '<svg viewBox="0 0 24 24" aria-hidden="true"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>',
    arrowL: '<svg viewBox="0 0 24 24" aria-hidden="true"><polyline points="14 6 8 12 14 18"/></svg>',
    arrowR: '<svg viewBox="0 0 24 24" aria-hidden="true"><polyline points="10 6 16 12 10 18"/></svg>'
  };
  L.ICONS = ICONS;

  /* ---------- menu data ---------- */
  var MENU = [
    { label: "Highlights", href: "highlights.html" },
    {
      label: "Kalhoty", href: "kalhoty.html",
      subs: [
        { label: "View all", href: "kalhoty.html" },
        { label: "Wide", href: "kalhoty.html#wide" },
        { label: "Balloon", href: "kalhoty.html#balloon" },
        { label: "Navy edit", href: "kalhoty.html#navy" }
      ]
    },
    {
      label: "Šortky", href: "sortky.html",
      subs: [
        { label: "View all", href: "sortky.html" },
        { label: "Wide", href: "sortky.html#wide" }
      ]
    },
    {
      label: "Topy", href: "topy.html",
      subs: [
        { label: "View all", href: "topy.html" },
        { label: "Cropped", href: "topy.html#cropped" },
        { label: "Longline", href: "topy.html#longline" }
      ]
    },
    {
      label: "Šaty & Sukně", href: "saty-sukne.html",
      subs: [
        { label: "View all", href: "saty-sukne.html" },
        { label: "Šaty", href: "saty-sukne.html#saty" },
        { label: "Sukně", href: "saty-sukne.html#sukne" },
        { label: "Navy edit", href: "saty-sukne.html#navy" }
      ]
    },
    { label: "Kolekce ÉLAN", href: "highlights.html" },
    { label: "Lookbook", href: "about.html#lookbook" },
    { label: "About", href: "about.html" }
  ];

  /* ---------- header ---------- */
  function buildHeader() {
    var html =
      '<header class="site-header">' +
        '<div class="header-left">' +
          '<button class="menu-toggle" aria-label="Open menu" aria-expanded="false" aria-controls="menu-overlay" data-menu-open>' +
            '<span class="burger" aria-hidden="true"><span></span><span></span><span></span></span>' +
            '<span class="label">Menu</span>' +
          '</button>' +
          '<button class="icon-btn search-toggle" aria-label="Search" data-search-toggle>' + ICONS.search + '</button>' +
        '</div>' +
        '<a class="logo" href="index.html" aria-label="LAVRÉE studio home">' +
          '<img class="logo__img logo__img--blue" src="photo/logo/Logo-header.png" alt="LAVRÉE studio">' +
          '<img class="logo__img logo__img--cream" src="photo/logo/LogoCream-header.png" alt="" aria-hidden="true">' +
        '</a>' +
        '<div class="header-right">' +
          '<a class="header-contact" href="https://www.instagram.com/lavree.studio/" target="_blank" rel="noopener">Contact us</a>' +
          '<a class="icon-btn" href="about.html" aria-label="Account">' + ICONS.user + '</a>' +
          '<a class="icon-btn" href="highlights.html" aria-label="Wishlist">' + ICONS.heart +
            '<span class="count" data-count="wishlist">0</span></a>' +
          '<button class="icon-btn" aria-label="Shopping bag - preorders" data-bag>' + ICONS.bag +
            '<span class="count" data-count="bag">0</span></button>' +
        '</div>' +
      '</header>' +
      '<div class="search-bar" data-search-bar>' +
        '<form class="search-field" role="search" onsubmit="return false">' +
          '<input type="text" placeholder=" " aria-label="Search products">' +
          '<span class="search-field__label" aria-hidden="true">' +
            '<span class="search-field__layer search-field__layer--dark">Search</span>' +
            '<span class="search-field__layer search-field__layer--light">Search</span>' +
          '</span>' +
          '<span class="search-field__rule" aria-hidden="true">' +
            '<span class="search-field__rule-layer search-field__rule-layer--dark"></span>' +
            '<span class="search-field__rule-layer search-field__rule-layer--light"></span>' +
          '</span>' +
        '</form>' +
      '</div>';

    var overlay =
      '<div class="menu-overlay" id="menu-overlay" role="dialog" aria-modal="true" aria-label="Main menu">' +
        '<button class="menu-close" aria-label="Close menu" data-menu-close>' + ICONS.close + '</button>' +
        '<div class="menu-overlay__inner">' +
          '<nav aria-label="Main navigation"><ul class="menu-primary">' +
          MENU.map(function (item, i) {
            return '<li data-menu-item="' + i + '"><a href="' + item.href + '">' + item.label + '</a></li>';
          }).join("") +
          '</ul></nav>' +
          '<div class="menu-secondary" data-menu-secondary aria-live="polite"></div>' +
        '</div>' +
      '</div>';

    document.body.insertAdjacentHTML("afterbegin", html + overlay);
  }

  /* ---------- footer ---------- */
  function footerHTML() {
    return (
      '<footer class="site-footer">' +
        '<div class="footer-inner">' +
        '<p class="footer-lede">Handmade in Prague,<br><em>shipped worldwide.</em></p>' +
        '<div class="footer-grid">' +
          '<div class="footer-col"><h4>Contacts</h4><ul>' +
            '<li><a href="https://www.instagram.com/lavree.studio/" target="_blank" rel="noopener">Write us on Instagram</a></li>' +
            '<li><a href="https://www.instagram.com/lavree.studio/" target="_blank" rel="noopener">@lavree.studio</a></li>' +
            '<li><a href="https://www.instagram.com/lavree.studio/" target="_blank" rel="noopener">Chat via DM</a></li>' +
          '</ul></div>' +
          '<div class="footer-col"><h4>Support</h4><ul>' +
            '<li><a href="about.html">Preorder info</a></li>' +
            '<li><a href="about.html">FAQs</a></li>' +
            '<li><a href="about.html">Returns</a></li>' +
            '<li><a href="about.html">Size guide</a></li>' +
          '</ul></div>' +
          '<div class="footer-col"><h4>Company</h4><ul>' +
            '<li><a href="about.html">About LAVRÉE</a></li>' +
            '<li><a href="about.html">Sustainability</a></li>' +
            '<li><a href="about.html">Handmade in Czechia</a></li>' +
          '</ul></div>' +
          '<div class="footer-col"><h4>Legal</h4><ul>' +
            '<li><a href="about.html">Legal notice</a></li>' +
            '<li><a href="about.html">Privacy policy</a></li>' +
            '<li><a href="about.html">Cookie policy</a></li>' +
          '</ul></div>' +
        '</div>' +
        '<div class="footer-mid">' +
          '<div class="newsletter" data-newsletter>' +
            '<label for="nl-email">Newsletter</label>' +
            '<form novalidate>' +
              '<input id="nl-email" type="email" placeholder="Your email address" required>' +
              '<button type="submit">Subscribe</button>' +
            '</form>' +
            '<p class="newsletter__ok">Thank you. Talk soon.</p>' +
          '</div>' +
          '<button class="country-switch" aria-label="Change country and language">' +
            'Czech Republic / English ' + ICONS.chevron +
          '</button>' +
        '</div>' +
        '</div>' + /* /.footer-inner */
        '<div class="footer-wave" aria-hidden="true">' +
          '<svg class="footer-wave__svg footer-wave__svg--1" viewBox="0 0 240 40" preserveAspectRatio="none"><path d="M0,20 Q30,6 60,20 T120,20 T180,20 T240,20 L240,40 L0,40 Z"/></svg>' +
          '<svg class="footer-wave__svg footer-wave__svg--2" viewBox="0 0 240 40" preserveAspectRatio="none"><path d="M0,23 Q30,13 60,23 T120,23 T180,23 T240,23 L240,40 L0,40 Z"/></svg>' +
          '<svg class="footer-wave__svg footer-wave__svg--3" viewBox="0 0 240 40" preserveAspectRatio="none"><path d="M0,27 Q30,19 60,27 T120,27 T180,27 T240,27 L240,40 L0,40 Z"/></svg>' +
        '</div>' +
      '</footer>'
    );
  }

  function buildFooter() {
    var mount = document.querySelector("[data-footer]");
    if (mount) mount.insertAdjacentHTML("beforeend", footerHTML());
  }

  /* ---------- preorder modal ---------- */
  function buildModal() {
    var html =
      '<div class="modal" data-modal role="dialog" aria-modal="true" aria-label="Preorder">' +
        '<div class="modal__backdrop" data-modal-close></div>' +
        '<div class="modal__box">' +
          '<button class="modal__close" aria-label="Close" data-modal-close>' + ICONS.close + '</button>' +
          '<h3 class="serif">Preorder via DM</h3>' +
          '<p data-modal-text>Every LAVRÉE piece is handmade to order in Prague. ' +
            'Send us a message on Instagram with the item and size — we will confirm timing and shipping worldwide.</p>' +
          '<a class="btn-dark" href="https://www.instagram.com/lavree.studio/" target="_blank" rel="noopener">Open Instagram</a>' +
          '<span class="modal__handle">@lavree.studio</span>' +
        '</div>' +
      '</div>';
    document.body.insertAdjacentHTML("beforeend", html);
  }

  L.openPreorderModal = function (productName) {
    var modal = document.querySelector("[data-modal]");
    if (!modal) return;
    var text = modal.querySelector("[data-modal-text]");
    if (text && productName) {
      text.textContent =
        "Every LAVRÉE piece is handmade to order in Prague. " +
        "DM us “" + productName + "” with your size on Instagram — " +
        "we will confirm timing and worldwide shipping.";
    }
    modal.classList.add("is-open");
    document.body.style.overflow = "hidden";
  };

  function closeModal() {
    var modal = document.querySelector("[data-modal]");
    if (!modal) return;
    modal.classList.remove("is-open");
    document.body.style.overflow = "";
  }

  /* ---------- product card markup (shared) ---------- */
  /* opts.video: render the hover clip as well (home editorial only — the PLP
     grids pass the map index here, which has no .video, so they stay photo-only). */
  L.cardHTML = function (p, opts) {
    var swatches = p.colors.map(function (c) {
      return '<i style="background:' + (L.SWATCHES[c] || "#EFE9DB") + '" title="' + c + '"></i>';
    }).join("");
    return (
      '<article class="card">' +
        (p.badge ? '<span class="card__badge">' + p.badge + "</span>" : "") +
        '<button class="card__wish' + (L.wishlist.has(p.id) ? " is-active" : "") +
          '" aria-label="Add ' + p.name + ' to wishlist" data-wish="' + p.id + '">' +
          ICONS.heart + "</button>" +
        '<a class="card__link" href="product.html?id=' + p.id + '" aria-label="' + p.name + ", " + L.formatPrice(p.price) + '">' +
          '<div class="card__media">' +
            (p.photo
              ? '<img class="card__photo" src="' + p.photo + '" alt="' + p.name +
                  '" loading="lazy" decoding="async">'
              : L.placeholder(p.name, p.tone, "ph--main") +
                L.placeholder(p.name, p.toneAlt, "ph--alt")) +
            (opts && opts.video && p.video
              ? '<video class="card__video" muted playsinline preload="none" ' +
                  'aria-hidden="true" tabindex="-1" data-src="' + p.video + '"></video>'
              : "") +
          "</div>" +
          '<div class="card__info">' +
            '<h3 class="card__name">' + p.name + "</h3>" +
            '<p class="card__price">' + L.formatPrice(p.price) + "</p>" +
            '<div class="card__swatches" aria-hidden="true">' + swatches + "</div>" +
          "</div>" +
        "</a>" +
      "</article>"
    );
  };

  /* ---------- compact header on scroll ---------- */
  function initCompactHeader() {
    var header = document.querySelector(".site-header");
    var threshold = parseFloat(
      getComputedStyle(document.documentElement).getPropertyValue("--header-scroll-threshold")
    ) || 60;
    /* the homepage scrolls inside the slider, other pages scroll the window */
    var slider = document.querySelector("[data-home-slider]");
    var scroller = slider || window;
    var ticking = false;

    function pos() {
      return slider ? slider.scrollTop : (window.scrollY || document.documentElement.scrollTop);
    }
    function apply() {
      ticking = false;
      var compact = pos() > threshold;
      header.classList.toggle("header--compact", compact);
      document.body.classList.toggle("is-compact", compact);
    }
    scroller.addEventListener("scroll", function () {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(apply);
      }
    }, { passive: true });
    apply();
  }

  /* ---------- reveal on scroll ---------- */
  function initReveal() {
    var els = document.querySelectorAll(".reveal");
    if (!("IntersectionObserver" in window)) {
      els.forEach(function (el) { el.classList.add("is-in"); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add("is-in");
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.15 });
    els.forEach(function (el) {
      /* elements already in the first viewport appear immediately,
         even if observer callbacks are delayed */
      var r = el.getBoundingClientRect();
      if (r.top < window.innerHeight && r.bottom > 0) {
        el.classList.add("is-in");
      } else {
        io.observe(el);
      }
    });
  }
  L.initReveal = initReveal;

  /* ---------- events ---------- */
  function bindEvents() {
    var overlay = document.getElementById("menu-overlay");
    var toggle = document.querySelector("[data-menu-open]");
    var secondary = document.querySelector("[data-menu-secondary]");
    var header = document.querySelector(".site-header");

    function openMenu() {
      overlay.classList.add("is-open");
      header.classList.add("is-filled");
      toggle.setAttribute("aria-expanded", "true");
      document.body.style.overflow = "hidden";
    }
    function closeMenu() {
      overlay.classList.remove("is-open");
      header.classList.remove("is-filled");
      toggle.setAttribute("aria-expanded", "false");
      document.body.style.overflow = "";
      secondary.classList.remove("is-visible");
      secondary.innerHTML = "";
      document.querySelectorAll(".menu-primary li").forEach(function (li) {
        li.classList.remove("is-active");
      });
    }

    toggle.addEventListener("click", openMenu);

    document.addEventListener("click", function (e) {
      var t = e.target;

      if (t.closest("[data-menu-close]")) closeMenu();
      if (t.closest("[data-modal-close]")) closeModal();

      var wish = t.closest("[data-wish]");
      if (wish) {
        e.preventDefault();
        var added = L.wishlist.toggle(wish.getAttribute("data-wish"));
        wish.classList.toggle("is-active", added);
      }

      var bagBtn = t.closest("[data-bag]");
      if (bagBtn) L.openPreorderModal();

      var acc = t.closest("[data-accordion]");
      if (acc) {
        var content = acc.parentElement.querySelector(".accordion__content");
        var isOpen = acc.getAttribute("aria-expanded") === "true";
        acc.setAttribute("aria-expanded", isOpen ? "false" : "true");
        content.style.maxHeight = isOpen ? "0" : content.scrollHeight + "px";
      }

      var searchToggle = t.closest("[data-search-toggle]");
      if (searchToggle) {
        var bar = document.querySelector("[data-search-bar]");
        bar.classList.toggle("is-open");
        if (bar.classList.contains("is-open")) bar.querySelector("input").focus();
      }

      /* info tooltips (price / size): toggle the clicked one, close the rest */
      var infoBtn = t.closest("[data-info-tip]");
      var openTip = infoBtn ? infoBtn.closest(".info-tip") : null;
      document.querySelectorAll(".info-tip.is-open").forEach(function (tip) {
        if (tip !== openTip) {
          tip.classList.remove("is-open");
          var b = tip.querySelector("[data-info-tip]");
          if (b) b.setAttribute("aria-expanded", "false");
        }
      });
      if (infoBtn) {
        e.preventDefault();
        var isOpen = openTip.classList.toggle("is-open");
        infoBtn.setAttribute("aria-expanded", isOpen ? "true" : "false");
      }
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") {
        closeMenu(); closeModal();
        document.querySelectorAll(".info-tip.is-open").forEach(function (tip) {
          tip.classList.remove("is-open");
          var b = tip.querySelector("[data-info-tip]");
          if (b) b.setAttribute("aria-expanded", "false");
        });
      }
    });

    /* menu hover -> secondary column */
    document.querySelectorAll(".menu-primary li").forEach(function (li) {
      li.addEventListener("mouseenter", function () {
        var idx = parseInt(li.getAttribute("data-menu-item"), 10);
        var item = MENU[idx];
        document.querySelectorAll(".menu-primary li").forEach(function (x) {
          x.classList.remove("is-active");
        });
        li.classList.add("is-active");
        if (item.subs && item.subs.length) {
          secondary.innerHTML = "<ul>" + item.subs.map(function (s) {
            return '<li><a href="' + s.href + '">' + s.label + "</a></li>";
          }).join("") + "</ul>";
          /* restart transition */
          secondary.classList.remove("is-visible");
          void secondary.offsetWidth;
          secondary.classList.add("is-visible");
        } else {
          secondary.classList.remove("is-visible");
        }
      });
    });

    /* newsletter */
    var nl = document.querySelector("[data-newsletter]");
    if (nl) {
      nl.querySelector("form").addEventListener("submit", function (e) {
        e.preventDefault();
        var input = nl.querySelector("input");
        if (input.value && input.value.indexOf("@") > 0) {
          nl.classList.add("is-done");
        } else {
          input.focus();
        }
      });
    }
  }

  /* ---------- footer wave: only animate while on screen ---------- */
  function initFooterWave() {
    var wave = document.querySelector(".footer-wave");
    if (!wave) return;
    if (!("IntersectionObserver" in window)) { wave.classList.add("is-live"); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { wave.classList.toggle("is-live", en.isIntersecting); });
    }, { threshold: 0 });
    io.observe(wave);
  }

  /* ---------- init ---------- */
  document.addEventListener("DOMContentLoaded", function () {
    buildHeader();
    buildFooter();
    buildModal();
    bindEvents();
    initCompactHeader();
    updateCounts();
    initReveal();
    initFooterWave();
  });
})();
