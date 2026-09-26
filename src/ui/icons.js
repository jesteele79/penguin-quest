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
  const hatSvg = hat === 'sailor' ? '<rect x="26" y="10" width="48" height="14" rx="4" fill="#fff"/><rect x="24" y="22" width="52" height="6" rx="3" fill="#22346e"/>'
    : hat === 'beanie' ? `<path d="M22 32 Q24 6 50 6 Q76 6 78 32 Z" fill="${accent}"/><circle cx="50" cy="6" r="6" fill="#fff"/>`
      : hat === 'bow' ? `<circle cx="66" cy="18" r="5" fill="${accent}"/><polygon points="66,18 54,10 54,26" fill="${accent}"/><polygon points="66,18 78,10 78,26" fill="${accent}"/>`
        : hat === 'flowers' ? '<circle cx="30" cy="20" r="5" fill="#ff7ab8"/><circle cx="42" cy="13" r="5" fill="#ffe14d"/><circle cx="58" cy="13" r="5" fill="#7affc8"/><circle cx="70" cy="20" r="5" fill="#fff"/>'
          : hat === 'helmet' ? '<path d="M20 34 Q22 6 50 6 Q78 6 80 34 Z" fill="#ffc234"/><rect x="42" y="14" width="16" height="10" rx="3" fill="#fff3b0"/>'
            : hat === 'crown' ? '<path d="M28 22 L28 6 L38 14 L50 2 L62 14 L72 6 L72 22 Z" fill="#ffcc3d" stroke="#fff3c0" stroke-width="1.5"/><circle cx="50" cy="15" r="3" fill="#4de1ff"/>'
            : hat === 'cap' ? '<path d="M20 30 Q24 8 50 8 Q76 8 80 30 Z" fill="#6b5a44"/>' : '';
  const glassesSvg = glasses ? '<circle cx="38" cy="48" r="10" fill="none" stroke="#3b2a1a" stroke-width="3"/><circle cx="62" cy="48" r="10" fill="none" stroke="#3b2a1a" stroke-width="3"/><line x1="48" y1="48" x2="52" y2="48" stroke="#3b2a1a" stroke-width="3"/>' : '';
  return `<svg viewBox="0 0 100 100" class="portrait-svg">
  <circle cx="50" cy="${kid ? 54 : 50}" r="${kid ? 36 : 40}" fill="#1e2746"/>
  <ellipse cx="50" cy="${kid ? 60 : 58}" rx="${kid ? 26 : 29}" ry="${kid ? 22 : 25}" fill="#f6f8ff"/>
  <ellipse cx="38" cy="48" rx="8" ry="9.5" fill="#fff"/><ellipse cx="62" cy="48" rx="8" ry="9.5" fill="#fff"/>
  <circle cx="39" cy="49" r="5" fill="#1c3f8a"/><circle cx="61" cy="49" r="5" fill="#1c3f8a"/>
  <circle cx="39" cy="49" r="2.6" fill="#05060c"/><circle cx="61" cy="49" r="2.6" fill="#05060c"/>
  <circle cx="41" cy="46.5" r="1.6" fill="#fff"/><circle cx="63" cy="46.5" r="1.6" fill="#fff"/>
  <path d="M44 58 L56 58 L50 67 Z" fill="#ff9d2e"/>
  <ellipse cx="29" cy="60" rx="4.5" ry="3" fill="#ff9fb4"/><ellipse cx="71" cy="60" rx="4.5" ry="3" fill="#ff9fb4"/>
  ${glassesSvg}
  <path d="M18 ${kid ? 84 : 82} Q50 ${kid ? 96 : 94} 82 ${kid ? 84 : 82}" stroke="${accent}" stroke-width="9" fill="none" stroke-linecap="round"/>
  ${hatSvg}
</svg>`;
}
