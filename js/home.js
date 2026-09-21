/* LAVREE studio - homepage fullscreen slider */
(function () {
  "use strict";

  var L = window.LAVREE;

  document.addEventListener("DOMContentLoaded", function () {
    var slider = document.querySelector("[data-home-slider]");
    if (!slider) return;

    /* Editorial row: first 4 products */
    var row = document.querySelector("[data-editorial-row]");
    if (row) {
      row.innerHTML = L.PRODUCTS.slice(0, 4).map(L.cardHTML).join("");
    }

    /* Hero slideshow: one photo full-screen, cross-fading through the set.
       Autoplay pauses on hover so the filtered->plain reveal isn't cut off,
       and stays off on mobile (bands) and for reduced-motion users. */
    (function initHeroSlideshow() {
      var gallery = document.querySelector("[data-hero-gallery]");
      if (!gallery) return;
      var shots = Array.prototype.slice.call(gallery.querySelectorAll(".hero-shot"));
      if (shots.length < 2) return;

      var mobile = window.matchMedia("(max-width: 768px)");
      var reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
      var idx = 0, timer = null, leaveTimer = null, INTERVAL = 5000;

      /* Keep only the active + outgoing shot composited; everything else is
         visibility:hidden (via CSS) so the GPU isn't juggling 7 full-screen
         photos at once. */
      function show(n) {
        shots.forEach(function (s, k) {
          if (k === n) {
            s.classList.add("is-active");
            s.classList.remove("is-leaving");
          } else if (s.classList.contains("is-active")) {
            s.classList.remove("is-active");
            s.classList.add("is-leaving"); /* stays visible through the fade */
          }
        });
        clearTimeout(leaveTimer);
        leaveTimer = setTimeout(function () {
          shots.forEach(function (s) {
            if (!s.classList.contains("is-active")) s.classList.remove("is-leaving");
          });
        }, 1300);
        idx = n;
      }
      function next() { show((idx + 1) % shots.length); }

      /* Autoplay only when it is worth doing: hero on screen, not hovered,
         motion allowed. Off-hero the full-screen cross-fades are pure wasted
         GPU, so we stop them the moment you scroll away. */
      var hovered = false, onScreen = true;
      function playing() {
        return !hovered && onScreen && !reduce.matches;
      }
      function sync() {
        if (playing()) { if (!timer) timer = setInterval(next, INTERVAL); }
        else if (timer) { clearInterval(timer); timer = null; }
      }

      show(0);
      gallery.addEventListener("mouseenter", function () { hovered = true; sync(); });
      gallery.addEventListener("mouseleave", function () { hovered = false; sync(); });
      mobile.addEventListener("change", sync);

      var heroSlide = document.querySelector(".slide--hero");
      if (heroSlide && "IntersectionObserver" in window) {
        new IntersectionObserver(function (es) {
          onScreen = es[0].isIntersecting;
          sync();
        }, { threshold: 0.25 }).observe(heroSlide);
      }
      sync();
    })();

    /* Chrome re-snaps mandatory snap containers after content injection —
       force the slider back to the hero slide, but never after the user
       has already started scrolling */
    var interacted = false;
    function resetScroll() {
      if (interacted) return;
      slider.style.scrollBehavior = "auto";
      slider.scrollTop = 0;
      requestAnimationFrame(function () { slider.style.scrollBehavior = ""; });
    }
    resetScroll();
    window.addEventListener("load", resetScroll);

    var slides = Array.prototype.slice.call(slider.querySelectorAll("[data-slide]"));

    /* ---------- timing: single source of truth is CSS custom properties ---------- */
    var rootStyle = getComputedStyle(document.documentElement);
    var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var DUR = parseFloat(rootStyle.getPropertyValue("--slide-dur")) || 1100;
    var DEBOUNCE = parseFloat(rootStyle.getPropertyValue("--slide-debounce")) || 200;
    var SWIPE = parseFloat(rootStyle.getPropertyValue("--slide-swipe")) || 50;

    /* easeInOutCubic = cubic-bezier(0.65, 0, 0.35, 1); linear when reduced motion */
    function ease(t) {
      if (reduced) return t;
      return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }

    var currentIndex = 0;
    var lock = false;

    function slideTop(el) {
      return el.getBoundingClientRect().top -
        slider.getBoundingClientRect().top + slider.scrollTop;
    }

    function animateTo(top) {
      if (lock) return;
      lock = true;
      slider.classList.add("is-animating");
      var start = slider.scrollTop;
      var dist = top - start;
      var t0 = performance.now();
      function frame(now) {
        var t = Math.min((now - t0) / DUR, 1);
        slider.scrollTop = start + dist * ease(t);
        if (t < 1) {
          requestAnimationFrame(frame);
        } else {
          slider.classList.remove("is-animating");
          setTimeout(function () { lock = false; }, DEBOUNCE);
        }
      }
      requestAnimationFrame(frame);
    }

    function goTo(index) {
      index = Math.max(0, Math.min(slides.length - 1, index));
      animateTo(slideTop(slides[index]));
    }

    /* One gesture = one step. A slide that is MEANINGFULLY taller than the
       viewport (e.g. the stacked mobile editorial) is walked screen by screen;
       a slide that only spills over by a little counts as one screen, so a
       single wheel tick always jumps to the next section. */
    function step(dir) {
      var vh = slider.clientHeight;
      var st = slider.scrollTop;
      var cur = slides[currentIndex];
      var curTop = slideTop(cur);
      var curBottom = curTop + cur.offsetHeight;
      var walkable = cur.offsetHeight - vh > vh * 0.5; /* only slides much taller than a screen (e.g. mobile stacked editorial) */
      if (walkable && dir > 0 && st + vh < curBottom - 4) {
        animateTo(Math.min(curBottom - vh, st + vh));
      } else if (walkable && dir < 0 && st > curTop + 4) {
        animateTo(Math.max(curTop, st - vh));
      } else {
        goTo(currentIndex + dir);
      }
    }

    slider.addEventListener("wheel", function (e) {
      e.preventDefault();
      interacted = true;
      if (lock || Math.abs(e.deltaY) < 4) return;
      step(e.deltaY > 0 ? 1 : -1);
    }, { passive: false });

    /* touch: vertical swipes drive the slider; horizontal ones are left alone */
    var touchStart = null;
    slider.addEventListener("touchstart", function (e) {
      interacted = true;
      touchStart = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }, { passive: true });
    slider.addEventListener("touchmove", function (e) {
      if (!touchStart) return;
      var dx = e.touches[0].clientX - touchStart.x;
      var dy = e.touches[0].clientY - touchStart.y;
      if (Math.abs(dx) > Math.abs(dy)) return; /* horizontal gesture */
      e.preventDefault();
    }, { passive: false });
    slider.addEventListener("touchend", function (e) {
      if (!touchStart) return;
      var dx = e.changedTouches[0].clientX - touchStart.x;
      var dy = touchStart.y - e.changedTouches[0].clientY;
      touchStart = null;
      if (lock || Math.abs(dy) < SWIPE || Math.abs(dx) > Math.abs(dy)) return;
      step(dy > 0 ? 1 : -1);
    });

    /* Dots */
    var dotsWrap = document.querySelector("[data-slide-dots]");
    var labels = ["Campaign", "New arrivals", "Navy Edit", "Info"];
    dotsWrap.innerHTML = slides.map(function (_, i) {
      return '<button aria-label="Go to section: ' + (labels[i] || i + 1) + '"></button>';
    }).join("");
    var dots = Array.prototype.slice.call(dotsWrap.querySelectorAll("button"));
    dots.forEach(function (d, i) {
      d.addEventListener("click", function () {
        interacted = true;
        goTo(i);
      });
    });

    /* Active slide tracking: dots, header ink over dark slides */
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var idx = slides.indexOf(en.target);
        currentIndex = idx;
        dots.forEach(function (d, i) { d.classList.toggle("is-active", i === idx); });
        document.body.classList.toggle("hero-dark", en.target.hasAttribute("data-dark"));

        /* search field lives on the hero (first) slide only */
        var onHero = idx === 0;
        document.body.classList.toggle("is-hero-slide", onHero);
        if (!onHero) {
          var si = document.querySelector("[data-search-bar] input");
          if (si) si.blur();
        }
      });
    }, { root: slider, threshold: 0.55 });
    slides.forEach(function (s) { io.observe(s); });
  });
})();
