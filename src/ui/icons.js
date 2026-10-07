// Small inline SVG icons (currentColor where it makes sense).
export const ICON = {
  fish: '<svg viewBox="0 0 32 20" class="ico"><ellipse cx="14" cy="10" rx="10" ry="7" fill="#ffb347"/><polygon points="22,10 31,3 31,17" fill="#ff9a2e"/><circle cx="9" cy="8" r="1.8" fill="#1b1b2e"/></svg>',
  heart: '<svg viewBox="0 0 24 22" class="ico"><path d="M12 21 C4 15 1 11 1 6.5 C1 3.4 3.5 1 6.5 1 C9 1 11 2.6 12 4.5 C13 2.6 15 1 17.5 1 C20.5 1 23 3.4 23 6.5 C23 11 20 15 12 21 Z" fill="#ff5a6e" stroke="#fff" stroke-opacity="0.35"/></svg>',
  heartEmpty: '<svg viewBox="0 0 24 22" class="ico"><path d="M12 21 C4 15 1 11 1 6.5 C1 3.4 3.5 1 6.5 1 C9 1 11 2.6 12 4.5 C13 2.6 15 1 17.5 1 C20.5 1 23 3.4 23 6.5 C23 11 20 15 12 21 Z" fill="none" stroke="#8fa0d8" stroke-width="2"/></svg>',
  flake: '<svg viewBox="0 0 24 24" class="ico"><g stroke="#ffd166" stroke-width="2.4" stroke-linecap="round"><line x1="12" y1="1.5" x2="12" y2="22.5"/><line x1="2.9" y1="6.7" x2="21.1" y2="17.3"/><line x1="2.9" y1="17.3" x2="21.1" y2="6.7"/><path d="M9 3.5 L12 6 L15 3.5 M9 20.5 L12 18 L15 20.5" fill="none"/></g></svg>',
  crystal: (color = '#4dffa0', lit = true) => `<svg viewBox="0 0 16 26" class="ico ico-crystal ${lit ? 'lit' : ''}"><polygon points="8,1 15,8 12,25 4,25 1,8" fill="${lit ? color : '#3a3e6a'}" stroke="${lit ? '#fff' : '#6a70a8'}" stroke-opacity="${lit ? 0.7 : 0.8}" stroke-width="1.2"/><polygon points="8,1 11,9 8,24 5,9" fill="#fff" opacity="${lit ? 0.35 : 0.08}"/></svg>`,
  star: '<svg viewBox="0 0 24 24" class="ico"><polygon points="12,1.5 14.9,8.6 22.5,9.2 16.7,14.2 18.5,21.6 12,17.6 5.5,21.6 7.3,14.2 1.5,9.2 9.1,8.6" fill="#ffd166"/></svg>',
  starEmpty: '<svg viewBox="0 0 24 24" class="ico"><polygon points="12,1.5 14.9,8.6 22.5,9.2 16.7,14.2 18.5,21.6 12,17.6 5.5,21.6 7.3,14.2 1.5,9.2 9.1,8.6" fill="none" stroke="#6f7fbf" stroke-width="1.6"/></svg>',
  speaker: '<svg viewBox="0 0 24 24" class="ico"><path d="M3 9 H7 L12 4 V20 L7 15 H3 Z" fill="currentColor"/><path d="M15.5 8.5 Q18 12 15.5 15.5 M18 6 Q22 12 18 18" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/></svg>',
  bulb: '<svg viewBox="0 0 24 24" class="ico"><path d="M12 2 C7.6 2 5 5.2 5 8.8 C5 11.5 6.6 13.2 8 14.6 V17 H16 V14.6 C17.4 13.2 19 11.5 19 8.8 C19 5.2 16.4 2 12 2 Z" fill="#ffd166"/><rect x="8.5" y="18.2" width="7" height="2.2" rx="1" fill="#c9b8ff"/><rect x="9.5" y="21" width="5" height="1.8" rx="0.9" fill="#c9b8ff"/></svg>',
};

// A tiny penguin face used for portraits; accent colors the scarf/hat band.
export function portraitSVG({ accent = '#ff5a4e', hat = null, glasses = false, kid = false, gloom = false } = {}) {
  if (gloom) {
    return `<svg viewBox="0 0 100 100" class="portrait-svg"><defs><radialGradient id="gg" cx="50%" cy="40%"><stop offset="0" stop-color="#5a3f9a"/><stop offset="1" stop-color="#231a44"/></radialGradient></defs>
    <path d="M20 88 Q8 60 22 38 Q30 18 50 16 Q70 18 78 38 Q92 60 80 88 Z" fill="url(#gg)"/>
    <polygon points="30,26 24,6 40,20" fill="#2c2152"/><polygon points="70,26 76,6 60,20" fill="#2c2152"/>
    <ellipse cx="38" cy="52" rx="8" ry="6" fill="#ffe27a"/><ellipse cx="62" cy="52" rx="8" ry="6" fill="#ffe27a"/>
    <path d="M28 44 L46 49 M72 44 L54 49" stroke="#1a1333" stroke-width="4" stroke-linecap="round"/>
    <path d="M40 72 Q50 66 60 72" stroke="#ffe27a" stroke-width="3" fill="none" stroke-linecap="round"/></svg>`;
  }
  // Same face as the 3D penguins: big round head, heart-shaped face, big glossy eyes, blush, tiny beak.
  // Kids are drawn a little smaller and lower so the frame reads as "little one".
  const k = kid ? 0.9 : 1;
  const tx = 50 * (1 - k), ty = 54 * (1 - k) + (kid ? 4 : 0);
  const hatSvg = hat === 'sailor' ? `<rect x="27" y="7" width="46" height="15" rx="4" fill="#fff"/><rect x="24" y="19" width="52" height="6" rx="3" fill="#22346e"/>`
    : hat === 'beanie' ? `<path d="M15 38 Q17 4 50 4 Q83 4 85 38 Z" fill="${accent}"/><rect x="13" y="32" width="74" height="10" rx="5" fill="#fff"/><circle cx="50" cy="5" r="6.5" fill="#fff"/>`
      : hat === 'bow' ? `<circle cx="68" cy="17" r="5" fill="${accent}"/><polygon points="68,17 56,9 56,25" fill="${accent}"/><polygon points="68,17 80,9 80,25" fill="${accent}"/>`
        : hat === 'flowers' ? '<circle cx="27" cy="22" r="5.5" fill="#ff7ab8"/><circle cx="39" cy="14" r="5.5" fill="#ffe14d"/><circle cx="50" cy="11" r="5.5" fill="#fff"/><circle cx="61" cy="14" r="5.5" fill="#7affc8"/><circle cx="73" cy="22" r="5.5" fill="#ff9f5a"/>'
          : hat === 'helmet' ? '<path d="M14 40 Q16 4 50 4 Q84 4 86 40 Z" fill="#ffc234"/><circle cx="50" cy="16" r="7.5" fill="#fff3b0" stroke="#555a6a" stroke-width="3"/>'
            : hat === 'crown' ? '<path d="M27 21 L27 4 L38 13 L50 0 L62 13 L73 4 L73 21 Z" fill="#ffcc3d" stroke="#fff3c0" stroke-width="1.5"/><circle cx="50" cy="14" r="3" fill="#4de1ff"/>'
            : hat === 'cap' ? '<path d="M15 36 Q19 7 50 7 Q81 7 85 36 Z" fill="#6b5a44"/>' : '';
  const glassesSvg = glasses ? `<circle cx="38.5" cy="57" r="11.5" fill="none" stroke="#3b2a1a" stroke-width="3"/><circle cx="61.5" cy="57" r="11.5" fill="none" stroke="#3b2a1a" stroke-width="3"/><line x1="49" y1="55" x2="51" y2="55" stroke="#3b2a1a" stroke-width="3"/>` : '';
  const eye = (cx, s) => `<ellipse cx="${cx}" cy="57" rx="7.6" ry="9.6" fill="#10142a"/><ellipse cx="${cx}" cy="58" rx="5.8" ry="7" fill="#2a5cc8"/><ellipse cx="${cx}" cy="58" rx="2.9" ry="3.5" fill="#05060c"/><circle cx="${cx + s * -1.6 + 2}" cy="52.6" r="2.7" fill="#fff"/><circle cx="${cx + s * 1.8 - 1.7}" cy="61.6" r="1.3" fill="#fff"/>`;
  return `<svg viewBox="0 0 100 100" class="portrait-svg">
  <g transform="translate(${tx} ${ty}) scale(${k})">
  <circle cx="50" cy="54" r="41" fill="#1e2746"/>
  <polygon points="44,14 50,4 47,15" fill="#1e2746"/><polygon points="50,13 54,3 54,14" fill="#1e2746"/><polygon points="55,14 61,6 57,16" fill="#1e2746"/>
  <ellipse cx="37" cy="56" rx="17.5" ry="23" fill="#f6f8ff"/><ellipse cx="63" cy="56" rx="17.5" ry="23" fill="#f6f8ff"/>
  <ellipse cx="50" cy="67" rx="23" ry="17" fill="#f6f8ff"/>
  ${eye(38.5, -1)}${eye(61.5, 1)}
  <ellipse cx="25.5" cy="66" rx="5.5" ry="3.4" fill="#ff8fb2" opacity="0.9"/><ellipse cx="74.5" cy="66" rx="5.5" ry="3.4" fill="#ff8fb2" opacity="0.9"/>
  <path d="M45.5 64.5 Q50 62.5 54.5 64.5 Q51.5 70.5 50 70.5 Q48.5 70.5 45.5 64.5 Z" fill="#ff9d2e"/>
  ${glassesSvg}
  <path d="M17 88 Q50 100 83 88" stroke="${accent}" stroke-width="9" fill="none" stroke-linecap="round"/>
  ${hatSvg}
  </g>
</svg>`;
}
