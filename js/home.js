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

    function goTo(index, fromBelow) {
      index = Math.max(0, Math.min(slides.length - 1, index));
      var top = slideTop(slides[index]);
      /* Coming back up into a slide that is taller than the screen: land on its
         last screen, not on its start, or a swipe up would skip its content. */
      if (fromBelow && overflows(index)) {
        top += slides[index].offsetHeight - slider.clientHeight;
      }
      animateTo(top);
    }

    /* A slide can be taller than one screen — the stacked mobile editorial runs
       ~3 of them. Those are handled specially: mandatory snap is switched off
       while one is on screen, and the finger scrolls it natively. */
    function overflows(index) {
      return slides[index].offsetHeight - slider.clientHeight > 4;
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
      var rest = vh * 0.25; /* a sliver left at either end is not worth a whole gesture */
      if (walkable && dir > 0 && st + vh < curBottom - rest) {
        animateTo(Math.min(curBottom - vh, st + vh));
      } else if (walkable && dir < 0 && st > curTop + rest) {
        animateTo(Math.max(curTop, st - vh));
      } else if (dir > 0 && currentIndex === slides.length - 1) {
        /* Last slide: show its tail (the footer runs a little past one screen),
           then stay put — stepping "past" it would only scroll back to its top. */
        var end = slider.scrollHeight - vh;
        if (st < end - 4) animateTo(end);
      } else {
        goTo(currentIndex + dir, dir < 0);
      }
    }

    slider.addEventListener("wheel", function (e) {
      e.preventDefault();
      interacted = true;
      if (lock || Math.abs(e.deltaY) < 4) return;
      step(e.deltaY > 0 ? 1 : -1);
    }, { passive: false });

    /* touch: vertical swipes drive the slider; horizontal ones are left alone.
       Inside a slide taller than the screen the finger scrolls it natively
       (with momentum) — forcing one swipe per screen there made the long
       mobile editorial feel stuck. */
    var touchStart = null, nativeScroll = false;

    /* Room left to scroll inside the current slide in this direction? */
    function canScrollInside(dir) {
      if (lock || !overflows(currentIndex)) return false;
      var cur = slides[currentIndex];
      var top = slideTop(cur);
      var st = slider.scrollTop;
      return dir > 0
        ? st + slider.clientHeight < top + cur.offsetHeight - 1
        : st > top + 1;
    }

    slider.addEventListener("touchstart", function (e) {
      interacted = true;
      nativeScroll = false;
      touchStart = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }, { passive: true });
    slider.addEventListener("touchmove", function (e) {
      if (!touchStart) return;
      var dx = e.touches[0].clientX - touchStart.x;
      var dy = e.touches[0].clientY - touchStart.y;
      if (Math.abs(dx) > Math.abs(dy)) return; /* horizontal gesture */
      if (canScrollInside(dy < 0 ? 1 : -1)) { nativeScroll = true; return; }
      e.preventDefault();
    }, { passive: false });
    slider.addEventListener("touchend", function (e) {
      if (!touchStart) return;
      var dx = e.changedTouches[0].clientX - touchStart.x;
      var dy = touchStart.y - e.changedTouches[0].clientY;
      touchStart = null;
      if (nativeScroll) { nativeScroll = false; return; } /* the finger moved it already */
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

    /* Active slide tracking: dots, header ink over dark slides.
       Driven by scroll position, not by an IntersectionObserver: a slide taller
       than the viewport (the mobile editorial is ~3 screens) can never reach a
       0.55 ratio, so the observer never reported it — currentIndex stayed on
       the hero and every further swipe jumped back to that slide's top. */
    var lastActive = -1;
    function syncActive() {
      var probe = slider.scrollTop + slider.clientHeight * 0.5;
      var idx = 0;
      for (var i = 0; i < slides.length; i++) {
        if (slideTop(slides[i]) <= probe + 1) idx = i;
      }
      currentIndex = idx;
      /* Mandatory snap would drag a screen-by-screen walk back to the slide
         start, so it is off while a taller-than-screen slide is on screen. */
      slider.classList.toggle("is-free", overflows(idx));
      if (idx === lastActive) return;
      lastActive = idx;
      dots.forEach(function (d, i) { d.classList.toggle("is-active", i === idx); });
      document.body.classList.toggle("hero-dark", slides[idx].hasAttribute("data-dark"));

      /* search field lives on the hero (first) slide only */
      var onHero = idx === 0;
      document.body.classList.toggle("is-hero-slide", onHero);
      if (!onHero) {
        var si = document.querySelector("[data-search-bar] input");
        if (si) si.blur();
      }
    }

    var ticking = false;
    slider.addEventListener("scroll", function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () { ticking = false; syncActive(); });
    }, { passive: true });
    window.addEventListener("resize", syncActive);
    syncActive();
  });
})();
