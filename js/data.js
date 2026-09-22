/* LAVREE studio - product data */
window.LAVREE = window.LAVREE || {};

LAVREE.PALETTE = {
  cream: "#EFE9DB",
  milk: "#F7F5F0",
  vanilla: "#E9E2C9",
  blue: "#2C4066",
  indigo: "#3A4A6E",
  black: "#20201F",
  bordeaux: "#8E3B3B"
};

/* Swatch color name -> hex (kept inside brand palette) */
LAVREE.SWATCHES = {
  cream: "#EFE9DB",
  ivory: "#F7F5F0",
  vanilla: "#E9E2C9",
  navy: "#2C4066",
  indigo: "#3A4A6E",
  black: "#20201F"
};

LAVREE.PRODUCTS = [
  {
    id: "kalhoty-flow",
    photo: "photo/Product/web/kalhoty-flow.jpg",
    video: "Video/Product/web/kalhoty.mp4",
    gallery: [
      { src: "photo/Product/web/kalhoty-flow/front.jpg", label: "Front" },
      { src: "photo/Product/web/kalhoty-flow/back.jpg", label: "Back" },
      { src: "photo/Product/web/kalhoty-flow/detail.jpg", label: "Detail" },
      { src: "photo/Product/web/kalhoty-flow/on-model.jpg", label: "On model" },
      { src: "photo/Product/web/kalhoty-flow/fabric.jpg", label: "Fabric" }
    ],
    name: "Kalhoty Flow",
    category: "kalhoty",
    subs: ["wide", "navy"],
    price: 1490,
    colors: ["cream", "navy", "black"],
    sizes: { XS: true, S: true, M: true, L: true, XL: false },
    tone: "cream",
    toneAlt: "blue",
    details:
      "Wide-leg trousers with a high waist and softly flowing line. Side pockets, hidden zip. Handmade to order in Prague from a breathable viscose blend."
  },
  {
    id: "sortky-muse",
    photo: "photo/Product/web/sortky-muse.jpg",
    video: "Video/Product/web/sortky.mp4",
    gallery: [
      { src: "photo/Product/web/sortky-muse/front.jpg", label: "Front" },
      { src: "photo/Product/web/sortky-muse/back.jpg", label: "Back" },
      { src: "photo/Product/web/sortky-muse/detail.jpg", label: "Detail" },
      { src: "photo/Product/web/sortky-muse/on-model.jpg", label: "On model" },
      { src: "photo/Product/web/sortky-muse/fabric.jpg", label: "Fabric" }
    ],
    name: "Šortky Muse",
    category: "sortky",
    subs: ["wide"],
    price: 1090,
    colors: ["vanilla", "cream"],
    sizes: { XS: true, S: true, M: true, L: true, XL: true },
    tone: "vanilla",
    toneAlt: "milk",
    details:
      "Relaxed pleated shorts with deep pockets and an airy fit for warm city days. Handmade in Czechia."
  },
  {
    id: "prodlouzeny-top-aura",
    photo: "photo/Product/web/prodlouzeny-top-aura.jpg",
    video: "Video/Product/web/topy.mp4",
    gallery: [
      { src: "photo/Product/web/prodlouzeny-top-aura/front.jpg", label: "Front" },
      { src: "photo/Product/web/prodlouzeny-top-aura/back.jpg", label: "Back" },
      { src: "photo/Product/web/prodlouzeny-top-aura/detail.jpg", label: "Detail" },
      { src: "photo/Product/web/prodlouzeny-top-aura/on-model.jpg", label: "On model" },
      { src: "photo/Product/web/prodlouzeny-top-aura/fabric.jpg", label: "Fabric" }
    ],
    name: "Prodloužený top Aura",
    category: "topy",
    subs: ["longline"],
    price: 1390,
    colors: ["ivory", "navy"],
    sizes: { XS: true, S: true, M: true, L: true, XL: false },
    tone: "milk",
    toneAlt: "blue",
    details:
      "Longline sleeveless top falling below the hip, with side slits and a fluid drape. Cut from deadstock fabric in limited runs."
  },
  {
    id: "kratky-top-lueur",
    photo: "photo/Product/web/kratky-top-lueur.jpg",
    gallery: [
      { src: "photo/Product/web/kratky-top-lueur/front.jpg", label: "Front" },
      { src: "photo/Product/web/kratky-top-lueur/back.jpg", label: "Back" },
      { src: "photo/Product/web/kratky-top-lueur/detail.jpg", label: "Detail" },
      { src: "photo/Product/web/kratky-top-lueur/on-model.jpg", label: "On model" },
      { src: "photo/Product/web/kratky-top-lueur/fabric.jpg", label: "Fabric" }
    ],
    name: "Krátký top Lueur",
    category: "topy",
    subs: ["cropped"],
    price: 990,
    colors: ["cream", "vanilla"],
    sizes: { XS: true, S: true, M: false, L: true, XL: false },
    tone: "cream",
    toneAlt: "vanilla",
    details:
      "Cropped top with a straight neckline and open back detail. Pairs with high-waisted kalhoty. Handmade in Czechia."
  }
];

LAVREE.CATEGORIES = {
  highlights: { title: "Highlights", subs: [] },
  kalhoty: {
    title: "Kalhoty",
    subs: [
      { id: "wide", label: "Wide" },
      { id: "balloon", label: "Balloon" },
      { id: "navy", label: "Navy edit" }
    ]
  },
  sortky: { title: "Šortky", subs: [{ id: "wide", label: "Wide" }] },
  topy: {
    title: "Topy",
    subs: [
      { id: "cropped", label: "Cropped" },
      { id: "longline", label: "Longline" }
    ]
  },
  "saty-sukne": {
    title: "Šaty & Sukně",
    subs: [
      { id: "saty", label: "Šaty" },
      { id: "sukne", label: "Sukně" },
      { id: "navy", label: "Navy edit" }
    ]
  }
};

LAVREE.productById = function (id) {
  return LAVREE.PRODUCTS.find(function (p) { return p.id === id; }) || null;
};

/* Czech koruna: space-grouped thousands + "kč" suffix, e.g. "1 490 kč".
   Non-breaking spaces keep the amount from wrapping. */
LAVREE.formatPrice = function (n) {
  var grouped = String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return grouped + " kč";
};

/* Placeholder tones: name -> [bg, text] within palette */
LAVREE.TONES = {
  cream: ["#EFE9DB", "#2C4066"],
  milk: ["#F7F5F0", "#2C4066"],
  vanilla: ["#E9E2C9", "#2C4066"],
  blue: ["#2C4066", "#EFE9DB"],
  indigo: ["#3A4A6E", "#EFE9DB"],
  black: ["#20201F", "#EFE9DB"]
};

/* Build a placeholder <div> markup for a product "photo" */
LAVREE.placeholder = function (text, tone, extraClass) {
  var t = LAVREE.TONES[tone] || LAVREE.TONES.cream;
  return (
    '<div class="ph ' + (extraClass || "") + '" style="background:' + t[0] +
    ';color:' + t[1] + '" aria-hidden="true"><span class="ph__label">' +
    text + "</span></div>"
  );
};
