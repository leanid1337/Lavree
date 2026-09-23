/* LAVREE studio - product page (PDP) */
(function () {
  "use strict";

  var L = window.LAVREE;

  document.addEventListener("DOMContentLoaded", function () {
    var root = document.querySelector("[data-pdp]");
    if (!root) return;

    var id = new URLSearchParams(location.search).get("id");
    var p = L.productById(id) || L.PRODUCTS[0];

    document.title = p.name + " — LAVRÉE studio";
    document.querySelector("[data-pdp-name]").textContent = p.name;
    document.querySelector("[data-pdp-price]").textContent = L.formatPrice(p.price);
    document.querySelector("[data-pdp-details]").textContent = p.details;

    /* gallery: real product photos when the product has them, else placeholders */
    var stack = document.querySelector("[data-pdp-stack]");
    var labels;
    if (p.gallery && p.gallery.length) {
      labels = p.gallery.map(function (g) { return g.label; });
      stack.innerHTML = p.gallery.map(function (g, i) {
        var lazy = i === 0 ? "" : ' loading="lazy"';
        var webp = '<source srcset="' + L.webp(g.src) + '" type="image/webp">';
        return '<figure class="pdp-shot" role="img" aria-label="' + p.name + " — " + g.label + '">' +
          /* same file, blurred and scaled up: fills the frame around the photo
             instead of leaving a bare blue field on a wide screen */
          '<picture>' + webp +
            '<img class="pdp-shot__bg" src="' + g.src + '" alt="" aria-hidden="true"' +
            lazy + ' decoding="async">' +
          '</picture>' +
          '<picture>' + webp +
            '<img class="pdp-shot__img" src="' + g.src + '" alt="' + p.name + " — " + g.label +
            '"' + lazy + ' decoding="async">' +
          '</picture>' +
          "</figure>";
      }).join("");
    } else {
      var tones = [p.tone, p.toneAlt, p.tone, "milk", p.toneAlt];
      labels = ["Front", "Back", "Detail", "On model", "Fabric"];
      stack.innerHTML = tones.map(function (t, i) {
        return '<figure class="pdp-shot" role="img" aria-label="' + p.name + " — " + labels[i] + '">' +
          L.placeholder(p.name + " · " + labels[i], t) + "</figure>";
      }).join("");
    }

    /* gallery: one photo at a time — dots, arrows, arrow keys and swipe switch
       between them, so the page no longer has to be scrolled through the stack */
    var gallery = root.querySelector(".pdp-gallery");
    var dotsWrap = document.querySelector("[data-pdp-dots]");
    var shots = Array.prototype.slice.call(stack.querySelectorAll(".pdp-shot"));
    dotsWrap.innerHTML = shots.map(function (_, i) {
      return '<button aria-label="Photo ' + (i + 1) + ", " + labels[i] + '"></button>';
    }).join("");
    var dots = Array.prototype.slice.call(dotsWrap.querySelectorAll("button"));

    var index = 0;
    function show(i) {
      index = (i + shots.length) % shots.length; /* the ends wrap around */
      shots.forEach(function (s, k) {
        s.classList.toggle("is-active", k === index);
        s.setAttribute("aria-hidden", k === index ? "false" : "true");
      });
      dots.forEach(function (d, k) { d.classList.toggle("is-active", k === index); });
    }
    show(0);

    dots.forEach(function (d, i) {
      d.addEventListener("click", function () { show(i); });
    });
    var prev = document.querySelector("[data-pdp-prev]");
    var next = document.querySelector("[data-pdp-next]");
    if (prev) prev.addEventListener("click", function () { show(index - 1); });
    if (next) next.addEventListener("click", function () { show(index + 1); });

    document.addEventListener("keydown", function (e) {
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
      var t = e.target; /* not always an element — a synthetic event targets document */
      if (t && t.closest && t.closest("input, textarea, select, [contenteditable]")) return;
      if (document.querySelector(".modal.is-open, .menu-overlay.is-open")) return;
      show(index + (e.key === "ArrowRight" ? 1 : -1));
    });

    /* swipe: horizontal only, so a vertical scroll of the page is left alone */
    if (gallery) {
      var swipe = null;
      gallery.addEventListener("touchstart", function (e) {
        swipe = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }, { passive: true });
      gallery.addEventListener("touchend", function (e) {
        if (!swipe) return;
        var dx = e.changedTouches[0].clientX - swipe.x;
        var dy = e.changedTouches[0].clientY - swipe.y;
        swipe = null;
        if (Math.abs(dx) < 40 || Math.abs(dx) < Math.abs(dy)) return;
        show(index + (dx < 0 ? 1 : -1));
      });
    }

    /* wishlist */
    var wish = document.querySelector("[data-pdp-wish]");
    wish.innerHTML = L.ICONS.heart;
    wish.classList.toggle("is-active", L.wishlist.has(p.id));
    wish.addEventListener("click", function () {
      wish.classList.toggle("is-active", L.wishlist.toggle(p.id));
    });

    /* colors */
    var swWrap = document.querySelector("[data-pdp-swatches]");
    var colorName = document.querySelector("[data-pdp-colorname]");
    swWrap.innerHTML = p.colors.map(function (c, i) {
      return '<button role="radio" aria-checked="' + (i === 0) + '" aria-label="' + c +
        '" style="background:' + (L.SWATCHES[c] || "#EFE9DB") + '"' +
        (i === 0 ? ' class="is-active"' : "") + ' data-color="' + c + '"></button>';
    }).join("");
    colorName.textContent = p.colors[0];
    swWrap.addEventListener("click", function (e) {
      var b = e.target.closest("[data-color]");
      if (!b) return;
      swWrap.querySelectorAll("button").forEach(function (x) {
        x.classList.remove("is-active");
        x.setAttribute("aria-checked", "false");
      });
      b.classList.add("is-active");
      b.setAttribute("aria-checked", "true");
      colorName.textContent = b.getAttribute("data-color");
    });

    /* sizes */
    var sizesWrap = document.querySelector("[data-pdp-sizes]");
    sizesWrap.innerHTML = Object.keys(p.sizes).map(function (s) {
      var ok = p.sizes[s];
      return '<button role="radio" aria-checked="false"' + (ok ? "" : " disabled") +
        ' data-size="' + s + '" aria-label="Size ' + s + (ok ? "" : " (sold out)") + '">' + s + "</button>";
    }).join("");
    sizesWrap.addEventListener("click", function (e) {
      var b = e.target.closest("[data-size]");
      if (!b || b.disabled) return;
      sizesWrap.querySelectorAll("button").forEach(function (x) {
        x.classList.remove("is-active");
        x.setAttribute("aria-checked", "false");
      });
      b.classList.add("is-active");
      b.setAttribute("aria-checked", "true");
    });

    /* preorder */
    document.querySelector("[data-pdp-preorder]").addEventListener("click", function () {
      L.bag.add(p.id);
      L.openPreorderModal(p.name);
    });
  });
})();
