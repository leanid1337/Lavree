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
        return '<figure class="pdp-shot" role="img" aria-label="' + p.name + " — " + g.label + '">' +
          '<img class="pdp-shot__img" src="' + g.src + '" alt="' + p.name + " — " + g.label +
          '"' + (i === 0 ? "" : ' loading="lazy"') + ' decoding="async">' +
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

    /* gallery dots */
    var dotsWrap = document.querySelector("[data-pdp-dots]");
    var shots = Array.prototype.slice.call(stack.querySelectorAll(".pdp-shot"));
    dotsWrap.innerHTML = shots.map(function (_, i) {
      return '<button aria-label="Photo ' + (i + 1) + ", " + labels[i] + '"></button>';
    }).join("");
    var dots = Array.prototype.slice.call(dotsWrap.querySelectorAll("button"));
    dots.forEach(function (d, i) {
      d.addEventListener("click", function () {
        shots[i].scrollIntoView({ behavior: "smooth", block: "center" });
      });
    });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var idx = shots.indexOf(en.target);
        dots.forEach(function (d, i) { d.classList.toggle("is-active", i === idx); });
      });
    }, { threshold: 0.55 });
    shots.forEach(function (s) { io.observe(s); });

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
