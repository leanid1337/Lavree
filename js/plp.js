/* LAVREE studio - catalog page (PLP) */
(function () {
  "use strict";

  var L = window.LAVREE;

  document.addEventListener("DOMContentLoaded", function () {
    var mount = document.querySelector("[data-plp]");
    if (!mount) return;

    var catId = mount.getAttribute("data-plp");
    var cat = L.CATEGORIES[catId];
    var products = catId === "highlights"
      ? L.PRODUCTS
      : L.PRODUCTS.filter(function (p) { return p.category === catId; });

    /* subheader subcategory links */
    var subsWrap = document.querySelector("[data-plp-subs]");
    /* a subcategory nobody has anything in is left out, read from the data */
    var subs = (cat.subs || []).filter(function (sub) {
      return L.countInSub(catId, sub.id) > 0;
    });
    var links = [{ id: "", label: "View all" }].concat(subs);
    subsWrap.innerHTML = links.map(function (s) {
      return '<a href="#' + s.id + '" data-sub="' + s.id + '">' + s.label + "</a>";
    }).join("");

    var grid = document.querySelector("[data-plp-grid]");

    function render(subId) {
      var list = subId
        ? products.filter(function (p) { return p.subs.indexOf(subId) !== -1; })
        : products;
      grid.innerHTML = list.length
        ? list.map(L.cardHTML).join("")
        : '<p class="plp-empty" style="grid-column:1/-1">Nothing here yet — new pieces are on the way.</p>';
      subsWrap.querySelectorAll("a").forEach(function (a) {
        a.classList.toggle("is-active", a.getAttribute("data-sub") === subId);
      });
    }

    function currentSub() {
      var h = location.hash.replace("#", "");
      return subs.some(function (s) { return s.id === h; }) ? h : "";
    }

    render(currentSub());
    window.addEventListener("hashchange", function () { render(currentSub()); });

    /* FILTERS / SORT BY stub panels */
    document.querySelectorAll("[data-panel-toggle]").forEach(function (btn) {
      btn.innerHTML += " " + L.ICONS.chevron;
      btn.addEventListener("click", function () {
        var id = btn.getAttribute("data-panel-toggle");
        var panel = document.querySelector('[data-panel="' + id + '"]');
        var open = panel.classList.toggle("is-open");
        btn.setAttribute("aria-expanded", open ? "true" : "false");
        /* close the other panel */
        document.querySelectorAll(".plp-panel").forEach(function (p) {
          if (p !== panel) p.classList.remove("is-open");
        });
        document.querySelectorAll("[data-panel-toggle]").forEach(function (b) {
          if (b !== btn) b.setAttribute("aria-expanded", "false");
        });
      });
    });
  });
})();
