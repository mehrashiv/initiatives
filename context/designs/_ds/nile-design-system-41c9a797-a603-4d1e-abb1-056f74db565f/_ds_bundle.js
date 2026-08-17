/* @ds-bundle: {"format":3,"namespace":"NileDesignSystem_41c9a7","components":[],"sourceHashes":{"ui_kits/_shared/icons.jsx":"4c80320d19ab","ui_kits/marketing/components.jsx":"38d706fae19e","ui_kits/portal/components.jsx":"1e6f8a4646b0"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.NileDesignSystem_41c9a7 = window.NileDesignSystem_41c9a7 || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// ui_kits/_shared/icons.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* Nile UI Kit — shared Lucide-accurate icon set (substitution: Lucide, see ICONOGRAPHY).
   Outline icons, 24x24, currentColor stroke. Exported to window.NileIcon. */
const ICON_PATHS = {
  shield: '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/>',
  zap: '<path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"/>',
  cloud: '<path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/>',
  network: '<rect x="16" y="16" width="6" height="6" rx="1"/><rect x="2" y="16" width="6" height="6" rx="1"/><rect x="9" y="2" width="6" height="6" rx="1"/><path d="M5 16v-3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3"/><path d="M12 12V8"/>',
  activity: '<path d="M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2"/>',
  lock: '<rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  'arrow-right': '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
  menu: '<line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="18" y2="18"/>',
  x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
  'chevron-down': '<path d="m6 9 6 6 6-6"/>',
  server: '<rect width="20" height="8" x="2" y="2" rx="2" ry="2"/><rect width="20" height="8" x="2" y="14" rx="2" ry="2"/><line x1="6" x2="6.01" y1="6" y2="6"/><line x1="6" x2="6.01" y1="18" y2="18"/>',
  wifi: '<path d="M12 20h.01"/><path d="M2 8.82a15 15 0 0 1 20 0"/><path d="M5 12.859a10 10 0 0 1 14 0"/><path d="M8.5 16.429a5 5 0 0 1 7 0"/>',
  gauge: '<path d="m12 14 4-4"/><path d="M3.34 19a10 10 0 1 1 17.32 0"/>',
  'circle-check': '<circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>',
  building: '<rect width="16" height="20" x="4" y="2" rx="2" ry="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01M16 6h.01M12 6h.01M12 10h.01M12 14h.01M16 10h.01M16 14h.01M8 10h.01M8 14h.01"/>',
  cpu: '<rect width="16" height="16" x="4" y="4" rx="2"/><rect width="6" height="6" x="9" y="9" rx="1"/><path d="M15 2v2M15 20v2M2 15h2M2 9h2M20 15h2M20 9h2M9 2v2M9 20v2"/>',
  sparkles: '<path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/>',
  globe: '<circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/>',
  search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
  bell: '<path d="M10.268 21a2 2 0 0 0 3.464 0"/><path d="M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326"/>',
  'layout-grid': '<rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/>',
  'map-pin': '<path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/>',
  settings: '<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>',
  'triangle-alert': '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/>',
  router: '<rect width="20" height="8" x="2" y="14" rx="2"/><path d="M6.01 18H6M10.01 18H10M15 10v4M17.84 7.17a4 4 0 0 0-5.66 0M20.66 4.34a8 8 0 0 0-11.31 0"/>'
};
function NileIcon({
  name,
  size = 22,
  stroke = 2,
  color = 'currentColor',
  style = {},
  ...rest
}) {
  return /*#__PURE__*/React.createElement("svg", _extends({
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: color,
    strokeWidth: stroke,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    style: style
  }, rest, {
    dangerouslySetInnerHTML: {
      __html: ICON_PATHS[name] || ''
    }
  }));
}
window.NileIcon = NileIcon;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/_shared/icons.jsx", error: String((e && e.message) || e) }); }

// ui_kits/marketing/components.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* Nile Marketing Site — components. Recreation of nilesecure.com surfaces.
   Depends on window.NileIcon (icons.jsx). Exports components to window. */
const {
  useState,
  useEffect
} = React;
const NileIcon = window.NileIcon;

/* ---------- Buttons ---------- */
function Btn({
  kind = 'primary',
  children,
  size,
  ...p
}) {
  return /*#__PURE__*/React.createElement("button", _extends({
    className: `mk-btn mk-btn-${kind}${size === 'sm' ? ' mk-btn-sm' : ''}`
  }, p), children);
}

/* ---------- Top Nav ---------- */
function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const root = document.querySelector('.mk-scroll');
    const onScroll = () => setScrolled((root ? root.scrollTop : window.scrollY) > 12);
    (root || window).addEventListener('scroll', onScroll);
    return () => (root || window).removeEventListener('scroll', onScroll);
  }, []);
  const links = ['Platform', 'Solutions', 'Why Nile', 'Resources', 'Company'];
  return /*#__PURE__*/React.createElement("header", {
    className: `mk-nav${scrolled ? ' is-scrolled' : ''}`
  }, /*#__PURE__*/React.createElement("div", {
    className: "mk-nav-inner"
  }, /*#__PURE__*/React.createElement("img", {
    className: "mk-logo",
    src: "../../assets/nile-logo.png",
    alt: "Nile"
  }), /*#__PURE__*/React.createElement("nav", {
    className: "mk-nav-links"
  }, links.map(l => /*#__PURE__*/React.createElement("a", {
    key: l,
    href: "#",
    className: "mk-nav-link"
  }, l, /*#__PURE__*/React.createElement(NileIcon, {
    name: "chevron-down",
    size: 15,
    stroke: 2.4
  })))), /*#__PURE__*/React.createElement("div", {
    className: "mk-nav-cta"
  }, /*#__PURE__*/React.createElement("a", {
    href: "#",
    className: "mk-nav-link mk-signin"
  }, "Sign in"), /*#__PURE__*/React.createElement(Btn, {
    kind: "accent",
    size: "sm"
  }, "Get a demo")), /*#__PURE__*/React.createElement("button", {
    className: "mk-burger",
    onClick: () => setOpen(o => !o),
    "aria-label": "Menu"
  }, /*#__PURE__*/React.createElement(NileIcon, {
    name: open ? 'x' : 'menu',
    size: 24
  }))), open && /*#__PURE__*/React.createElement("div", {
    className: "mk-mobile"
  }, links.map(l => /*#__PURE__*/React.createElement("a", {
    key: l,
    href: "#",
    className: "mk-mobile-link"
  }, l)), /*#__PURE__*/React.createElement(Btn, {
    kind: "accent"
  }, "Get a demo")));
}

/* ---------- Hero ---------- */
function Hero() {
  return /*#__PURE__*/React.createElement("section", {
    className: "mk-hero"
  }, /*#__PURE__*/React.createElement("img", {
    className: "mk-hero-particles",
    src: "../../assets/particle-swoosh.jpeg",
    alt: ""
  }), /*#__PURE__*/React.createElement("div", {
    className: "mk-hero-grid"
  }, /*#__PURE__*/React.createElement("div", {
    className: "mk-hero-copy"
  }, /*#__PURE__*/React.createElement("span", {
    className: "mk-eyebrow"
  }, /*#__PURE__*/React.createElement(NileIcon, {
    name: "sparkles",
    size: 15
  }), " Secure Network-as-a-Service"), /*#__PURE__*/React.createElement("h1", {
    className: "mk-hero-title"
  }, "The world's most secure network.", /*#__PURE__*/React.createElement("br", null), /*#__PURE__*/React.createElement("span", {
    className: "mk-grad-text"
  }, "Delivered as-a-service.")), /*#__PURE__*/React.createElement("p", {
    className: "mk-hero-sub"
  }, "Nile brings cloud principles to your wired and wireless LAN \u2014 with Zero Trust built in, autonomous operations, and a performance guarantee. No boxes to buy. No appliances to manage."), /*#__PURE__*/React.createElement("div", {
    className: "mk-hero-actions"
  }, /*#__PURE__*/React.createElement(Btn, {
    kind: "accent"
  }, "Get a demo"), /*#__PURE__*/React.createElement(Btn, {
    kind: "ghost"
  }, "See how it works ", /*#__PURE__*/React.createElement(NileIcon, {
    name: "arrow-right",
    size: 18
  }))), /*#__PURE__*/React.createElement("div", {
    className: "mk-hero-proof"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("strong", null, "60%"), /*#__PURE__*/React.createElement("span", null, "Lower TCO")), /*#__PURE__*/React.createElement("div", {
    className: "mk-divider"
  }), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("strong", null, "60+"), /*#__PURE__*/React.createElement("span", null, "Patents")), /*#__PURE__*/React.createElement("div", {
    className: "mk-divider"
  }), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("strong", null, "0"), /*#__PURE__*/React.createElement("span", null, "Breaches")))), /*#__PURE__*/React.createElement("div", {
    className: "mk-hero-art"
  }, /*#__PURE__*/React.createElement("img", {
    src: "../../assets/hero-orb-wave.jpg",
    alt: "Nile"
  }))));
}

/* ---------- Logo cloud ---------- */
function LogoCloud() {
  const names = ['Stanford', 'Pitney Bowes', 'Carta', 'Concordia', 'Maplewave', 'Wellesley'];
  return /*#__PURE__*/React.createElement("section", {
    className: "mk-cloud"
  }, /*#__PURE__*/React.createElement("p", {
    className: "mk-cloud-label"
  }, "Trusted by leading enterprises & institutions"), /*#__PURE__*/React.createElement("div", {
    className: "mk-cloud-row"
  }, names.map(n => /*#__PURE__*/React.createElement("span", {
    key: n,
    className: "mk-cloud-name"
  }, n))));
}

/* ---------- Pillars (tabbed) ---------- */
const PILLARS = [{
  id: 'zt',
  icon: 'shield',
  label: 'Zero Trust Fabric',
  head: 'Security built into the network, not bolted on.',
  body: 'Switches, access points, gateways and sensors operate as one zero-trust fabric — secure by design, with identity-based micro-segmentation that contains breaches by up to 60%.',
  points: ['Per-device isolation by default', 'Identity-based micro-segmentation', 'Encrypted between every network element']
}, {
  id: 'ao',
  icon: 'activity',
  label: 'Autonomous Operations',
  head: 'A network that runs itself.',
  body: 'Nile AI combines deep telemetry with outside-in sensor data for a continuous 360° view — detecting anomalies, predicting issues, and remediating through closed-loop automation before users feel a thing.',
  points: ['Continuous 360° visibility', 'Predict-and-remediate automation', 'Issues resolved in seconds, not weeks']
}, {
  id: 'cs',
  icon: 'cloud',
  label: 'Cloud Services',
  head: 'Consumed as a service. Backed by an SLA.',
  body: 'All hardware, software and lifecycle operations are included in one subscription. OpEx, not CapEx — with guaranteed service levels across every site and building.',
  points: ['Hardware included, nothing to buy', 'Guaranteed performance SLAs', 'One subscription, every site']
}];
function Pillars() {
  const [active, setActive] = useState('zt');
  const p = PILLARS.find(x => x.id === active);
  return /*#__PURE__*/React.createElement("section", {
    className: "mk-section"
  }, /*#__PURE__*/React.createElement("div", {
    className: "mk-section-head"
  }, /*#__PURE__*/React.createElement("span", {
    className: "mk-eyebrow"
  }, "The Nile architecture"), /*#__PURE__*/React.createElement("h2", {
    className: "mk-h2"
  }, "Three breakthroughs, one service")), /*#__PURE__*/React.createElement("div", {
    className: "mk-tabs"
  }, PILLARS.map(x => /*#__PURE__*/React.createElement("button", {
    key: x.id,
    className: `mk-tab${active === x.id ? ' is-active' : ''}`,
    onClick: () => setActive(x.id)
  }, /*#__PURE__*/React.createElement(NileIcon, {
    name: x.icon,
    size: 20
  }), " ", x.label))), /*#__PURE__*/React.createElement("div", {
    className: "mk-tab-panel"
  }, /*#__PURE__*/React.createElement("div", {
    className: "mk-tab-copy"
  }, /*#__PURE__*/React.createElement("h3", {
    className: "mk-h3"
  }, p.head), /*#__PURE__*/React.createElement("p", {
    className: "mk-body"
  }, p.body), /*#__PURE__*/React.createElement("ul", {
    className: "mk-checklist"
  }, p.points.map(pt => /*#__PURE__*/React.createElement("li", {
    key: pt
  }, /*#__PURE__*/React.createElement(NileIcon, {
    name: "circle-check",
    size: 20,
    color: "var(--nile-mint-700)"
  }), " ", pt))), /*#__PURE__*/React.createElement("a", {
    href: "#",
    className: "mk-textlink"
  }, "Explore the technology ", /*#__PURE__*/React.createElement(NileIcon, {
    name: "arrow-right",
    size: 17
  }))), /*#__PURE__*/React.createElement("div", {
    className: "mk-tab-art"
  }, /*#__PURE__*/React.createElement("div", {
    className: "mk-art-glow"
  }), /*#__PURE__*/React.createElement(NileIcon, {
    name: p.icon,
    size: 76,
    color: "#fff",
    stroke: 1.4
  }), /*#__PURE__*/React.createElement("div", {
    className: "mk-art-rings"
  }))));
}

/* ---------- Stat band ---------- */
function StatBand() {
  const stats = [['99.99%', 'Guaranteed uptime'], ['<2 min', 'Mean time to resolve'], ['25–30%', 'Annual cost saved'], ['24×7', 'AI-Ops + human support']];
  return /*#__PURE__*/React.createElement("section", {
    className: "mk-stats"
  }, /*#__PURE__*/React.createElement("div", {
    className: "mk-stats-inner"
  }, stats.map(([n, l]) => /*#__PURE__*/React.createElement("div", {
    key: l,
    className: "mk-stat"
  }, /*#__PURE__*/React.createElement("div", {
    className: "mk-stat-num"
  }, n), /*#__PURE__*/React.createElement("div", {
    className: "mk-stat-label"
  }, l)))));
}

/* ---------- Quote ---------- */
function QuoteBlock() {
  return /*#__PURE__*/React.createElement("section", {
    className: "mk-quote"
  }, /*#__PURE__*/React.createElement("img", {
    className: "mk-quote-mark",
    src: "../../assets/brand-mark.svg",
    alt: ""
  }), /*#__PURE__*/React.createElement("blockquote", {
    className: "mk-quote-text"
  }, "The future of networking isn't owning the hardware, and dealing with separate licenses and support. It's about owning the outcome."), /*#__PURE__*/React.createElement("div", {
    className: "mk-quote-by"
  }, /*#__PURE__*/React.createElement("div", {
    className: "mk-avatar"
  }, "JB"), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("strong", null, "Jonathan Breitbarth"), /*#__PURE__*/React.createElement("span", null, "Concordia University, St. Paul"))));
}

/* ---------- Recognition ---------- */
function Recognition() {
  const items = [{
    icon: 'sparkles',
    t: 'Gartner® Visionary',
    s: '2026 Magic Quadrant — Enterprise Wired & Wireless LAN'
  }, {
    icon: 'lock',
    t: 'Never breached',
    s: '3-day live hacker event — zero compromises'
  }, {
    icon: 'globe',
    t: '25+ countries',
    s: 'Deployed across campus & branch worldwide'
  }];
  return /*#__PURE__*/React.createElement("section", {
    className: "mk-section mk-recog"
  }, /*#__PURE__*/React.createElement("div", {
    className: "mk-section-head"
  }, /*#__PURE__*/React.createElement("span", {
    className: "mk-eyebrow"
  }, "Recognition"), /*#__PURE__*/React.createElement("h2", {
    className: "mk-h2"
  }, "Validated where it counts")), /*#__PURE__*/React.createElement("div", {
    className: "mk-recog-grid"
  }, items.map(i => /*#__PURE__*/React.createElement("div", {
    key: i.t,
    className: "mk-card"
  }, /*#__PURE__*/React.createElement("div", {
    className: "mk-card-icon"
  }, /*#__PURE__*/React.createElement(NileIcon, {
    name: i.icon,
    size: 24,
    color: "var(--nile-blue)"
  })), /*#__PURE__*/React.createElement("h3", null, i.t), /*#__PURE__*/React.createElement("p", null, i.s)))));
}

/* ---------- CTA ---------- */
function CTA() {
  return /*#__PURE__*/React.createElement("section", {
    className: "mk-cta"
  }, /*#__PURE__*/React.createElement("div", {
    className: "mk-cta-card"
  }, /*#__PURE__*/React.createElement("img", {
    className: "mk-cta-glow",
    src: "../../assets/glow-soft.png",
    alt: ""
  }), /*#__PURE__*/React.createElement("h2", {
    className: "mk-cta-title"
  }, "Move beyond 30 years of operational burden."), /*#__PURE__*/React.createElement("p", {
    className: "mk-cta-sub"
  }, "See how Nile delivers the most secure network as-a-service \u2014 and reduces your TCO by more than 60%."), /*#__PURE__*/React.createElement("div", {
    className: "mk-hero-actions",
    style: {
      justifyContent: 'center'
    }
  }, /*#__PURE__*/React.createElement(Btn, {
    kind: "accent"
  }, "Get a demo"), /*#__PURE__*/React.createElement(Btn, {
    kind: "dark-ghost"
  }, "Talk to sales"))));
}

/* ---------- Footer ---------- */
function Footer() {
  const cols = {
    Platform: ['Zero Trust Fabric', 'Autonomous Operations', 'Cloud Services', 'Nile Portal'],
    Solutions: ['Higher Education', 'Enterprise', 'Healthcare', 'Government'],
    Resources: ['Customer Stories', 'The Secure Edge', 'Documentation', 'NaaS Guide'],
    Company: ['About Nile', 'Careers', 'Brand & Logo', 'Contact']
  };
  return /*#__PURE__*/React.createElement("footer", {
    className: "mk-footer"
  }, /*#__PURE__*/React.createElement("div", {
    className: "mk-footer-inner"
  }, /*#__PURE__*/React.createElement("div", {
    className: "mk-footer-brand"
  }, /*#__PURE__*/React.createElement("img", {
    src: "../../assets/nile-logo-white.png",
    alt: "Nile"
  }), /*#__PURE__*/React.createElement("p", null, "The world's most secure network. Delivered as-a-service."), /*#__PURE__*/React.createElement("span", {
    className: "mk-footer-loc"
  }, /*#__PURE__*/React.createElement(NileIcon, {
    name: "map-pin",
    size: 15
  }), " San Jose, CA \xB7 Bengaluru, IN")), Object.entries(cols).map(([h, items]) => /*#__PURE__*/React.createElement("div", {
    key: h,
    className: "mk-footer-col"
  }, /*#__PURE__*/React.createElement("h4", null, h), items.map(i => /*#__PURE__*/React.createElement("a", {
    key: i,
    href: "#"
  }, i))))), /*#__PURE__*/React.createElement("div", {
    className: "mk-footer-bar"
  }, /*#__PURE__*/React.createElement("span", null, "Copyright \xA9 2026 Nile. All rights reserved."), /*#__PURE__*/React.createElement("span", null, "nilesecure.com")));
}
Object.assign(window, {
  MkNav: Nav,
  MkHero: Hero,
  MkLogoCloud: LogoCloud,
  MkPillars: Pillars,
  MkStatBand: StatBand,
  MkQuote: QuoteBlock,
  MkRecognition: Recognition,
  MkCTA: CTA,
  MkFooter: Footer
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/marketing/components.jsx", error: String((e && e.message) || e) }); }

// ui_kits/portal/components.jsx
try { (() => {
/* Nile Portal — operator dashboard. Recreation of the Nile Portal product surface.
   Define policy, network visibility, sites/buildings, device inventory, alerts.
   Depends on window.NileIcon. Exports PortalApp to window. */
const {
  useState
} = React;
const NileIcon = window.NileIcon;
const NAV = [{
  id: 'dashboard',
  icon: 'layout-grid',
  label: 'Dashboard'
}, {
  id: 'sites',
  icon: 'building',
  label: 'Sites'
}, {
  id: 'devices',
  icon: 'router',
  label: 'Devices'
}, {
  id: 'segments',
  icon: 'shield',
  label: 'Segments'
}, {
  id: 'alerts',
  icon: 'triangle-alert',
  label: 'Alerts',
  badge: 3
}];

/* ---------- Sidebar ---------- */
function Sidebar({
  active,
  setActive
}) {
  return /*#__PURE__*/React.createElement("aside", {
    className: "pt-sidebar"
  }, /*#__PURE__*/React.createElement("div", {
    className: "pt-side-logo"
  }, /*#__PURE__*/React.createElement("img", {
    src: "../../assets/nile-logo-white.png",
    alt: "Nile"
  }), /*#__PURE__*/React.createElement("span", {
    className: "pt-side-portal"
  }, "Portal")), /*#__PURE__*/React.createElement("nav", {
    className: "pt-side-nav"
  }, NAV.map(n => /*#__PURE__*/React.createElement("button", {
    key: n.id,
    className: `pt-side-item${active === n.id ? ' is-active' : ''}`,
    onClick: () => setActive(n.id)
  }, /*#__PURE__*/React.createElement(NileIcon, {
    name: n.icon,
    size: 20,
    stroke: 2
  }), /*#__PURE__*/React.createElement("span", null, n.label), n.badge && /*#__PURE__*/React.createElement("span", {
    className: "pt-side-badge"
  }, n.badge)))), /*#__PURE__*/React.createElement("div", {
    className: "pt-side-foot"
  }, /*#__PURE__*/React.createElement("button", {
    className: "pt-side-item"
  }, /*#__PURE__*/React.createElement(NileIcon, {
    name: "settings",
    size: 20
  }), /*#__PURE__*/React.createElement("span", null, "Settings")), /*#__PURE__*/React.createElement("div", {
    className: "pt-side-user"
  }, /*#__PURE__*/React.createElement("div", {
    className: "pt-avatar"
  }, "SM"), /*#__PURE__*/React.createElement("div", {
    className: "pt-user-meta"
  }, /*#__PURE__*/React.createElement("strong", null, "Shiv Mehra"), /*#__PURE__*/React.createElement("span", null, "NetOps Admin")))));
}

/* ---------- Topbar ---------- */
function Topbar({
  title,
  sub
}) {
  return /*#__PURE__*/React.createElement("header", {
    className: "pt-topbar"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h1", {
    className: "pt-title"
  }, title), sub && /*#__PURE__*/React.createElement("p", {
    className: "pt-sub"
  }, sub)), /*#__PURE__*/React.createElement("div", {
    className: "pt-top-actions"
  }, /*#__PURE__*/React.createElement("div", {
    className: "pt-search"
  }, /*#__PURE__*/React.createElement(NileIcon, {
    name: "search",
    size: 18,
    color: "var(--fg3)"
  }), /*#__PURE__*/React.createElement("input", {
    placeholder: "Search devices, sites, MACs\u2026"
  })), /*#__PURE__*/React.createElement("button", {
    className: "pt-icon-btn"
  }, /*#__PURE__*/React.createElement(NileIcon, {
    name: "bell",
    size: 20
  }), /*#__PURE__*/React.createElement("span", {
    className: "pt-dot"
  })), /*#__PURE__*/React.createElement("button", {
    className: "pt-pill-btn"
  }, /*#__PURE__*/React.createElement(NileIcon, {
    name: "sparkles",
    size: 16
  }), " Ask Nile AI")));
}

/* ---------- KPI cards ---------- */
function Kpis() {
  const k = [{
    icon: 'gauge',
    label: 'Network health',
    val: '99.99%',
    tone: 'mint',
    delta: 'SLA met'
  }, {
    icon: 'building',
    label: 'Sites online',
    val: '12 / 12',
    tone: 'blue',
    delta: 'All healthy'
  }, {
    icon: 'router',
    label: 'Active devices',
    val: '1,284',
    tone: 'blue',
    delta: '+18 this week'
  }, {
    icon: 'triangle-alert',
    label: 'Open alerts',
    val: '3',
    tone: 'orange',
    delta: '2 auto-resolving'
  }];
  return /*#__PURE__*/React.createElement("div", {
    className: "pt-kpis"
  }, k.map(x => /*#__PURE__*/React.createElement("div", {
    key: x.label,
    className: "pt-kpi"
  }, /*#__PURE__*/React.createElement("div", {
    className: `pt-kpi-icon tone-${x.tone}`
  }, /*#__PURE__*/React.createElement(NileIcon, {
    name: x.icon,
    size: 22
  })), /*#__PURE__*/React.createElement("div", {
    className: "pt-kpi-label"
  }, x.label), /*#__PURE__*/React.createElement("div", {
    className: "pt-kpi-val"
  }, x.val), /*#__PURE__*/React.createElement("div", {
    className: `pt-kpi-delta tone-${x.tone}`
  }, x.delta))));
}

/* ---------- Health chart (bars) ---------- */
function HealthPanel() {
  const bars = [62, 70, 58, 80, 74, 88, 79, 92, 85, 94, 90, 97, 93, 99];
  return /*#__PURE__*/React.createElement("div", {
    className: "pt-panel pt-health"
  }, /*#__PURE__*/React.createElement("div", {
    className: "pt-panel-head"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h3", null, "Network performance"), /*#__PURE__*/React.createElement("span", {
    className: "pt-panel-sub"
  }, "User experience score \xB7 last 14 days")), /*#__PURE__*/React.createElement("span", {
    className: "pt-tag tone-mint"
  }, /*#__PURE__*/React.createElement("span", {
    className: "pt-tag-dot"
  }), "Guaranteed")), /*#__PURE__*/React.createElement("div", {
    className: "pt-bars"
  }, bars.map((b, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    className: "pt-bar",
    style: {
      height: b + '%'
    },
    title: b
  }))), /*#__PURE__*/React.createElement("div", {
    className: "pt-bars-x"
  }, /*#__PURE__*/React.createElement("span", null, "14d ago"), /*#__PURE__*/React.createElement("span", null, "Today")));
}

/* ---------- Device mix ---------- */
function DeviceMix() {
  const d = [{
    icon: 'router',
    label: 'Access points',
    n: 642,
    c: 'var(--nile-blue)'
  }, {
    icon: 'server',
    label: 'Switches',
    n: 318,
    c: 'var(--nile-blue-bright)'
  }, {
    icon: 'globe',
    label: 'Gateways',
    n: 24,
    c: 'var(--nile-sky)'
  }, {
    icon: 'activity',
    label: 'Sensors',
    n: 300,
    c: 'var(--nile-mint)'
  }];
  const total = d.reduce((s, x) => s + x.n, 0);
  return /*#__PURE__*/React.createElement("div", {
    className: "pt-panel"
  }, /*#__PURE__*/React.createElement("div", {
    className: "pt-panel-head"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h3", null, "Zero Trust Fabric"), /*#__PURE__*/React.createElement("span", {
    className: "pt-panel-sub"
  }, total.toLocaleString(), " elements"))), /*#__PURE__*/React.createElement("div", {
    className: "pt-mixbar"
  }, d.map(x => /*#__PURE__*/React.createElement("div", {
    key: x.label,
    style: {
      flex: x.n,
      background: x.c
    }
  }))), /*#__PURE__*/React.createElement("div", {
    className: "pt-mix-list"
  }, d.map(x => /*#__PURE__*/React.createElement("div", {
    key: x.label,
    className: "pt-mix-row"
  }, /*#__PURE__*/React.createElement("span", {
    className: "pt-mix-key"
  }, /*#__PURE__*/React.createElement("span", {
    className: "pt-mix-dot",
    style: {
      background: x.c
    }
  }), /*#__PURE__*/React.createElement(NileIcon, {
    name: x.icon,
    size: 16,
    color: "var(--fg3)"
  }), x.label), /*#__PURE__*/React.createElement("strong", null, x.n)))));
}

/* ---------- Alerts list ---------- */
const ALERTS = [{
  sev: 'high',
  icon: 'triangle-alert',
  t: 'Unusual east-west traffic on Segment IoT-Cameras',
  site: 'HQ · Bldg A',
  time: '4m',
  status: 'Auto-remediating'
}, {
  sev: 'med',
  icon: 'wifi',
  t: 'AP-04F2 RF interference on channel 36',
  site: 'Campus North',
  time: '22m',
  status: 'Investigating'
}, {
  sev: 'low',
  icon: 'cpu',
  t: 'Switch firmware update available (v2.4.1)',
  site: 'Branch · Austin',
  time: '1h',
  status: 'Scheduled'
}];
function AlertsPanel({
  full
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "pt-panel"
  }, /*#__PURE__*/React.createElement("div", {
    className: "pt-panel-head"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h3", null, full ? 'All alerts' : 'Recent alerts'), /*#__PURE__*/React.createElement("span", {
    className: "pt-panel-sub"
  }, "Nile AI is handling 2 of 3")), !full && /*#__PURE__*/React.createElement("a", {
    className: "pt-link",
    href: "#"
  }, "View all")), /*#__PURE__*/React.createElement("div", {
    className: "pt-alerts"
  }, (full ? [...ALERTS, ...ALERTS] : ALERTS).map((a, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    className: "pt-alert"
  }, /*#__PURE__*/React.createElement("span", {
    className: `pt-sev sev-${a.sev}`
  }, /*#__PURE__*/React.createElement(NileIcon, {
    name: a.icon,
    size: 18
  })), /*#__PURE__*/React.createElement("div", {
    className: "pt-alert-body"
  }, /*#__PURE__*/React.createElement("strong", null, a.t), /*#__PURE__*/React.createElement("span", null, a.site, " \xB7 ", a.time, " ago")), /*#__PURE__*/React.createElement("span", {
    className: "pt-tag tone-soft"
  }, a.status)))));
}

/* ---------- Sites view ---------- */
function SitesView() {
  const sites = [['HQ — San Jose', 'Bldg A · B · C', 412, 99.99, 'Healthy', 'mint'], ['Campus North', '6 buildings', 388, 99.95, 'Healthy', 'mint'], ['Branch — Austin', '1 building', 96, 99.4, 'Degraded', 'orange'], ['Branch — Boston', '2 buildings', 142, 99.99, 'Healthy', 'mint'], ['DC — Bengaluru', 'Bldg 1', 246, 100, 'Healthy', 'mint']];
  return /*#__PURE__*/React.createElement("div", {
    className: "pt-panel"
  }, /*#__PURE__*/React.createElement("div", {
    className: "pt-panel-head"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h3", null, "Sites & buildings"), /*#__PURE__*/React.createElement("span", {
    className: "pt-panel-sub"
  }, "12 sites \xB7 all SLAs tracked")), /*#__PURE__*/React.createElement("button", {
    className: "pt-pill-btn ghost"
  }, /*#__PURE__*/React.createElement(NileIcon, {
    name: "map-pin",
    size: 16
  }), " Map view")), /*#__PURE__*/React.createElement("table", {
    className: "pt-table"
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", null, "Site"), /*#__PURE__*/React.createElement("th", null, "Buildings"), /*#__PURE__*/React.createElement("th", null, "Devices"), /*#__PURE__*/React.createElement("th", null, "Uptime"), /*#__PURE__*/React.createElement("th", null, "Status"))), /*#__PURE__*/React.createElement("tbody", null, sites.map(s => /*#__PURE__*/React.createElement("tr", {
    key: s[0]
  }, /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("strong", null, s[0])), /*#__PURE__*/React.createElement("td", {
    className: "pt-muted"
  }, s[1]), /*#__PURE__*/React.createElement("td", null, s[2]), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("span", {
    className: "pt-mono"
  }, s[3], "%")), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("span", {
    className: `pt-tag tone-${s[5]}`
  }, /*#__PURE__*/React.createElement("span", {
    className: "pt-tag-dot"
  }), s[4])))))));
}

/* ---------- Devices view ---------- */
function DevicesView() {
  const rows = [['AP-04F2', 'Access Point', 'HQ · Bldg A · Fl 3', '10.0.4.18', 'Online', 'mint'], ['SW-CORE-1', 'Switch', 'HQ · Bldg A · MDF', '10.0.0.2', 'Online', 'mint'], ['GW-SJ-01', 'Gateway', 'HQ · Bldg A', '10.0.0.1', 'Online', 'mint'], ['AP-1A77', 'Access Point', 'Austin · Fl 1', '10.2.1.31', 'Degraded', 'orange'], ['SNS-22B0', 'Sensor', 'Campus North · B4', '10.1.6.90', 'Online', 'mint'], ['AP-09C3', 'Access Point', 'Boston · Fl 2', '10.3.2.12', 'Offline', 'coral']];
  return /*#__PURE__*/React.createElement("div", {
    className: "pt-panel"
  }, /*#__PURE__*/React.createElement("div", {
    className: "pt-panel-head"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h3", null, "Device inventory"), /*#__PURE__*/React.createElement("span", {
    className: "pt-panel-sub"
  }, "1,284 elements \xB7 included in service")), /*#__PURE__*/React.createElement("div", {
    className: "pt-search sm"
  }, /*#__PURE__*/React.createElement(NileIcon, {
    name: "search",
    size: 16,
    color: "var(--fg3)"
  }), /*#__PURE__*/React.createElement("input", {
    placeholder: "Filter\u2026"
  }))), /*#__PURE__*/React.createElement("table", {
    className: "pt-table"
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", null, "Name"), /*#__PURE__*/React.createElement("th", null, "Type"), /*#__PURE__*/React.createElement("th", null, "Location"), /*#__PURE__*/React.createElement("th", null, "IP"), /*#__PURE__*/React.createElement("th", null, "Status"))), /*#__PURE__*/React.createElement("tbody", null, rows.map(r => /*#__PURE__*/React.createElement("tr", {
    key: r[0]
  }, /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("strong", null, r[0])), /*#__PURE__*/React.createElement("td", {
    className: "pt-muted"
  }, r[1]), /*#__PURE__*/React.createElement("td", {
    className: "pt-muted"
  }, r[2]), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("span", {
    className: "pt-mono"
  }, r[3])), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("span", {
    className: `pt-tag tone-${r[5]}`
  }, /*#__PURE__*/React.createElement("span", {
    className: "pt-tag-dot"
  }), r[4])))))));
}

/* ---------- Segments view ---------- */
function SegmentsView() {
  const segs = [['Corporate', 'Employees & managed laptops', 842, 'Allow → Internet, Apps'], ['IoT-Cameras', 'Building security cameras', 64, 'Isolated · no lateral'], ['Guest', 'Visitor Wi-Fi (Nile Guest)', 210, 'Internet only · fully isolated'], ['OT-Building', 'HVAC & access control', 38, 'Micro-segmented'], ['Servers', 'On-prem services', 88, 'Restricted · policy-gated']];
  return /*#__PURE__*/React.createElement("div", {
    className: "pt-panel"
  }, /*#__PURE__*/React.createElement("div", {
    className: "pt-panel-head"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h3", null, "Zero Trust segments"), /*#__PURE__*/React.createElement("span", {
    className: "pt-panel-sub"
  }, "Identity-based micro-segmentation \xB7 deny by default")), /*#__PURE__*/React.createElement("button", {
    className: "pt-pill-btn"
  }, /*#__PURE__*/React.createElement(NileIcon, {
    name: "shield",
    size: 16
  }), " New segment")), /*#__PURE__*/React.createElement("div", {
    className: "pt-seg-grid"
  }, segs.map(s => /*#__PURE__*/React.createElement("div", {
    key: s[0],
    className: "pt-seg"
  }, /*#__PURE__*/React.createElement("div", {
    className: "pt-seg-top"
  }, /*#__PURE__*/React.createElement("span", {
    className: "pt-seg-icon"
  }, /*#__PURE__*/React.createElement(NileIcon, {
    name: "shield",
    size: 18,
    color: "var(--nile-blue)"
  })), /*#__PURE__*/React.createElement("strong", null, s[0])), /*#__PURE__*/React.createElement("p", {
    className: "pt-seg-desc"
  }, s[1]), /*#__PURE__*/React.createElement("div", {
    className: "pt-seg-foot"
  }, /*#__PURE__*/React.createElement("span", {
    className: "pt-mono"
  }, s[2], " devices"), /*#__PURE__*/React.createElement("span", {
    className: "pt-seg-policy"
  }, s[3]))))));
}

/* ---------- App ---------- */
function PortalApp() {
  const [active, setActive] = useState('dashboard');
  const meta = {
    dashboard: ['Network overview', 'Real-time health across all sites'],
    sites: ['Sites', 'Buildings, uptime & service levels'],
    devices: ['Devices', 'Your Zero Trust Fabric inventory'],
    segments: ['Segments', 'Zero Trust policy & micro-segmentation'],
    alerts: ['Alerts', 'Nile AI is on it']
  }[active];
  return /*#__PURE__*/React.createElement("div", {
    className: "pt-app"
  }, /*#__PURE__*/React.createElement(Sidebar, {
    active: active,
    setActive: setActive
  }), /*#__PURE__*/React.createElement("main", {
    className: "pt-main"
  }, /*#__PURE__*/React.createElement(Topbar, {
    title: meta[0],
    sub: meta[1]
  }), /*#__PURE__*/React.createElement("div", {
    className: "pt-content"
  }, active === 'dashboard' && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Kpis, null), /*#__PURE__*/React.createElement("div", {
    className: "pt-grid-2"
  }, /*#__PURE__*/React.createElement(HealthPanel, null), /*#__PURE__*/React.createElement(DeviceMix, null)), /*#__PURE__*/React.createElement(AlertsPanel, null)), active === 'sites' && /*#__PURE__*/React.createElement(SitesView, null), active === 'devices' && /*#__PURE__*/React.createElement(DevicesView, null), active === 'segments' && /*#__PURE__*/React.createElement(SegmentsView, null), active === 'alerts' && /*#__PURE__*/React.createElement(AlertsPanel, {
    full: true
  }))));
}
window.PortalApp = PortalApp;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/portal/components.jsx", error: String((e && e.message) || e) }); }

})();
