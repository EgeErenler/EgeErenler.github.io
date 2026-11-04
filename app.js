import { h, Component as PC, render } from './vendor/preact.mjs';
import htm from './vendor/htm.mjs';
const html = htm.bind(h);
const C = {};
// Same behaviour as the design runtime: state changes apply at once and the view redraws on the next tick.
class DCBase extends PC {
  setState(u) {
    const n = typeof u === 'function' ? u(this.state, this.props) : u;
    if (!this.state) this.state = {};
    Object.assign(this.state, n);
    if (!this.__queued) { this.__queued = true; Promise.resolve().then(() => { this.__queued = false; if (this.__alive) this.forceUpdate(); }); }
  }
  render() { this.__alive = true; return this.constructor.__tpl(html, this.renderVals ? this.renderVals() : {}, C); }
}
const __unmount = PC.prototype.componentWillUnmount;

C.Stamp = (() => {
  const DCLogic = DCBase;

let STAMP_N = 0;
class Component extends DCLogic {
  constructor(props) {
    super(props);
    STAMP_N += 1;
    this.pid = 'st-ring-' + STAMP_N;
  }
  renderVals() {
    return {
      ink: this.props.ink || '#121212',
      accent: this.props.accent || '#FF6A2B',
      size: this.props.size || '64px',
      pid: this.pid,
      href: '#' + this.pid
    };
  }
}

  Component.__tpl = (html, $v, C) => html`<span class="st-link" style="display: inline-flex; width: ${$v.size}; height: ${$v.size}; color: ${$v.ink}">
  <svg viewBox="0 0 100 100" width="100%" height="100%" role="img" aria-label="Ege Erenler, London">
    <defs><path id=${$v.pid} d="M50 50m-34 0a34 34 0 1 1 68 0a34 34 0 1 1 -68 0"></path></defs>
    <circle cx="50" cy="50" r="46" fill="none" stroke=${$v.ink} stroke-width="3"></circle>
    <g class="st-ring">
      <text font-family="'IBM Plex Mono', Menlo, monospace" font-size="10" font-weight="700" fill=${$v.ink}><textPath href=${$v.href} textLength="212" lengthAdjust="spacing">EGE ERENLER · LONDON ·</textPath></text>
    </g>
    <text x="50" y="58" text-anchor="middle" font-family="'Inter Tight', Helvetica, Arial, sans-serif" font-weight="900" font-size="26" letter-spacing="-2" fill=${$v.ink}>ee</text>
    <circle cx="65" cy="55" r="3.5" fill=${$v.accent}></circle>
  </svg>
</span>`;
  Component.defaultProps = {"ink":"#121212","accent":"#FF6A2B","size":"64px"};
  const off = Component.prototype.componentWillUnmount;
  Component.prototype.componentWillUnmount = function () { this.__alive = false; if (off) off.call(this); };
  return Component;
})();

C.Face = (() => {
  const DCLogic = DCBase;

class Component extends DCLogic {
  constructor(props) {
    super(props);
    this.state = { x: 0, y: 0, blink: false };
    this.setRoot = (el) => { this.root = el; };
    this.target = { x: 0, y: 0 };
    this.cur = { x: 0, y: 0 };
    this.lastInput = 0;
  }
  componentDidMount() {
    const clamp = (v) => Math.max(-1, Math.min(1, v));
    this.onMove = (e) => {
      // Look at the visitor's cursor from where the face sits on the page, not from the window centre.
      const r = this.root && this.root.getBoundingClientRect();
      if (r && r.width) {
        const cx = r.left + r.width / 2, cy = r.top + r.height * 0.45;
        const reach = Math.max(260, r.width * 1.2);
        this.target = { x: clamp((e.clientX - cx) / reach), y: clamp((e.clientY - cy) / reach) };
      } else {
        const w = window.innerWidth || 1, h = window.innerHeight || 1;
        this.target = { x: clamp((e.clientX / w) * 2 - 1), y: clamp((e.clientY / h) * 2 - 1) };
      }
      this.lastInput = performance.now();
    };
    this.onTilt = (e) => {
      if (e.gamma == null || e.beta == null) return;
      this.target = { x: clamp(e.gamma / 30), y: clamp((e.beta - 45) / 30) };
      this.lastInput = performance.now();
    };
    window.addEventListener('pointermove', this.onMove, { passive: true });
    window.addEventListener('deviceorientation', this.onTilt);
    // Phones: the face follows the finger, and tilting the phone turns it.
    this.onTouch = (e) => { const t = e.touches && e.touches[0]; if (t) this.onMove({ clientX: t.clientX, clientY: t.clientY }); };
    window.addEventListener('touchstart', this.onTouch, { passive: true });
    window.addEventListener('touchmove', this.onTouch, { passive: true });
    // iPhone asks once for motion access, on the visitor's first tap.
    this.askTilt = () => {
      const D = window.DeviceOrientationEvent;
      if (D && typeof D.requestPermission === 'function') D.requestPermission().catch(() => {});
      window.removeEventListener('pointerdown', this.askTilt);
    };
    window.addEventListener('pointerdown', this.askTilt);
    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const tick = (now) => {
      if (!reduce && now - this.lastInput > 2500) {
        this.target = { x: Math.sin(now / 1700) * 0.55, y: Math.sin(now / 2600) * 0.25 };
      }
      const k = reduce ? 1 : 0.1;
      this.cur.x += (this.target.x - this.cur.x) * k;
      this.cur.y += (this.target.y - this.cur.y) * k;
      if (Math.abs(this.cur.x - this.state.x) > 0.002 || Math.abs(this.cur.y - this.state.y) > 0.002) {
        this.setState({ x: this.cur.x, y: this.cur.y });
      }
      this.raf = requestAnimationFrame(tick);
    };
    this.raf = requestAnimationFrame(tick);
    if (!reduce) {
      const blink = () => {
        this.setState({ blink: true });
        this.blinkOff = setTimeout(() => this.setState({ blink: false }), 130);
        this.blinkNext = setTimeout(blink, 2800 + Math.random() * 3200);
      };
      this.blinkNext = setTimeout(blink, 2200);
    }
  }
  componentWillUnmount() {
    cancelAnimationFrame(this.raf);
    clearTimeout(this.blinkOff);
    clearTimeout(this.blinkNext);
    window.removeEventListener('pointermove', this.onMove);
    window.removeEventListener('deviceorientation', this.onTilt);
    window.removeEventListener('touchstart', this.onTouch);
    window.removeEventListener('touchmove', this.onTouch);
    window.removeEventListener('pointerdown', this.askTilt);
  }
  renderVals() {
    const x = this.state.x, y = this.state.y;
    const f = (v) => v.toFixed(2);
    const tr = (dx, dy) => `translate(${f(x * dx)}px, ${f(y * dy)}px)`;
    return {
      ink: this.props.ink ?? '#121212',
      paper: this.props.paper ?? '#ECEBE7',
      accent: this.props.accent ?? '#121212',
      // On dark grounds the outline turns light, but skin and hair keep natural tones.
      skin: this.props.natural ? '#EFE6DA' : (this.props.paper ?? '#ECEBE7'),
      hair: this.props.natural ? '#1B1A1E' : (this.props.ink ?? '#121212'),
      feat: this.props.natural ? '#1B1A1E' : (this.props.ink ?? '#121212'),
      eyeRy: this.state.blink ? 1.2 : 7,
      body: tr(-5, 2),
      head: `translate(${f(x * 6)}px, ${f(y * 4)}px) rotate(${f(x * 3)}deg)`,
      hair: `translate(${f(x * 11)}px, ${f(y * 6)}px) rotate(${f(x * 3)}deg)`,
      earL: `translate(${f(x * -9)}px, ${f(y * 3)}px) scaleX(${(1 + x * 0.45).toFixed(3)})`,
      earR: `translate(${f(x * -9)}px, ${f(y * 3)}px) scaleX(${(1 - x * 0.45).toFixed(3)})`,
      brows: tr(24, 13),
      eyes: tr(27, 15),
      nose: tr(34, 17),
      mouth: tr(24, 15)
    };
  }
}

  Component.__tpl = (html, $v, C) => html`<div ref=${$v.setRoot} style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background: transparent; color: ${$v.ink}">
  <svg viewBox="0 0 400 440" role="img" aria-label="Line drawing of Ege that turns to follow the cursor" style="width: 100%; height: 100%; overflow: visible">
    <g style="transform: ${$v.body}; transform-box: fill-box; transform-origin: center">
      <path d="M62 440 C72 362 136 330 200 330 C264 330 328 362 338 440" fill=${$v.paper} stroke=${$v.ink} stroke-width="5" stroke-linecap="round"></path>
      <path d="M168 334 L200 372 L232 334" fill="none" stroke=${$v.ink} stroke-width="5" stroke-linecap="round" stroke-linejoin="round"></path>
      <path d="M176 290 L176 336 L224 336 L224 290 Z" fill=${$v.skin} stroke=${$v.ink} stroke-width="5" stroke-linejoin="round"></path>
    </g>
    <g style="transform: ${$v.earL}; transform-box: fill-box; transform-origin: right center">
      <ellipse cx="110" cy="214" rx="15" ry="25" fill=${$v.skin} stroke=${$v.ink} stroke-width="5"></ellipse>
    </g>
    <g style="transform: ${$v.earR}; transform-box: fill-box; transform-origin: left center">
      <ellipse cx="290" cy="214" rx="15" ry="25" fill=${$v.skin} stroke=${$v.ink} stroke-width="5"></ellipse>
    </g>
    <g style="transform: ${$v.head}; transform-box: fill-box; transform-origin: center">
      <ellipse cx="200" cy="200" rx="92" ry="112" fill=${$v.skin} stroke=${$v.ink} stroke-width="5"></ellipse>
    </g>
    <g style="transform: ${$v.hair}; transform-box: fill-box; transform-origin: center">
      <path d="M110 176 C104 106 154 72 206 76 C262 80 300 112 292 176 C278 146 246 128 206 132 C168 136 136 152 110 176 Z" fill=${$v.hair} stroke=${$v.ink} stroke-width="4" stroke-linejoin="round"></path>
    </g>
    <g style="transform: ${$v.brows}; transform-box: fill-box; transform-origin: center">
      <path d="M148 180 q20 -10 40 0 M212 180 q20 -10 40 0" fill="none" stroke=${$v.feat} stroke-width="6" stroke-linecap="round"></path>
    </g>
    <g style="transform: ${$v.eyes}; transform-box: fill-box; transform-origin: center">
      <ellipse cx="168" cy="208" rx="7" ry=${$v.eyeRy} fill=${$v.feat}></ellipse>
      <ellipse cx="232" cy="208" rx="7" ry=${$v.eyeRy} fill=${$v.feat}></ellipse>
    </g>
    <g style="transform: ${$v.nose}; transform-box: fill-box; transform-origin: center">
      <path d="M201 214 q-10 26 5 31" fill="none" stroke=${$v.feat} stroke-width="5" stroke-linecap="round"></path>
    </g>
    <g style="transform: ${$v.mouth}; transform-box: fill-box; transform-origin: center">
      <path d="M176 264 q24 18 48 0" fill="none" stroke=${$v.accent} stroke-width="6" stroke-linecap="round"></path>
    </g>
  </svg>
</div>`;
  Component.defaultProps = {"natural":false,"ink":"#121212","paper":"#ECEBE7","accent":"#121212"};
  const off = Component.prototype.componentWillUnmount;
  Component.prototype.componentWillUnmount = function () { this.__alive = false; if (off) off.call(this); };
  return Component;
})();

C.Shader = (() => {
  const DCLogic = DCBase;

class Component extends DCLogic {
  constructor(props) {
    super(props);
    this.mouse = [0.5, 0.5];
    this.smooth = [0.5, 0.5];
    this.click = [0.5, 0.5, -10];
    this.setCanvas = (el) => { this.canvas = el; if (el && !this.gl) this.start(); };
  }
  palettes() {
    // base (deep), glow, second glow
    return {
      ember: [[0.05, 0.02, 0.03], [1.0, 0.45, 0.16], [0.62, 0.10, 0.42]],
      electric: [[0.02, 0.03, 0.09], [0.22, 0.86, 0.96], [0.50, 0.30, 1.0]],
      sunset: [[0.05, 0.02, 0.09], [1.0, 0.80, 0.18], [1.0, 0.24, 0.58]]
    };
  }
  componentDidMount() { if (this.canvas && !this.gl) this.start(); }
  componentWillUnmount() {
    cancelAnimationFrame(this.raf);
    clearTimeout(this.wait);
    window.removeEventListener('resize', this.onResize);
    window.removeEventListener('pointermove', this.onMove);
    window.removeEventListener('pointerdown', this.onDown);
  }
  start() {
    const cv = this.canvas;
    const gl = cv.getContext('webgl', { antialias: false, alpha: false });
    if (!gl) return;
    this.gl = gl;
    const vs = 'attribute vec2 p;void main(){gl_Position=vec4(p,0.0,1.0);}';
    const fs = [
      'precision highp float;',
      'uniform vec2 r;uniform float t;uniform vec2 m;uniform vec3 k;uniform vec3 a;uniform vec3 b;uniform vec3 c;',
      'float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}',
      'float n(vec2 p){vec2 i=floor(p),f=fract(p);vec2 u=f*f*(3.0-2.0*f);',
      ' return mix(mix(h(i),h(i+vec2(1.0,0.0)),u.x),mix(h(i+vec2(0.0,1.0)),h(i+vec2(1.0,1.0)),u.x),u.y);}',
      'float fbm(vec2 p){float v=0.0,s=0.5;for(int i=0;i<5;i++){v+=s*n(p);p=p*2.03+vec2(1.7,9.2);s*=0.5;}return v;}',
      'void main(){',
      ' float sc=min(r.x,r.y);',
      ' vec2 p=(gl_FragCoord.xy-0.5*r)/sc;',
      ' vec2 mp=(m-0.5)*r/sc;',
      ' float md=length(p-mp);',
      ' p+=(p-mp)*0.35*exp(-md*2.6);',
      ' float tt=t*0.09;',
      ' vec2 q=vec2(fbm(p*1.4+tt),fbm(p*1.4+vec2(5.2,1.3)-tt));',
      ' vec2 w=vec2(fbm(p*1.4+3.2*q+vec2(1.7,9.2)+tt*1.4),fbm(p*1.4+3.2*q+vec2(8.3,2.8)-tt*1.1));',
      ' float f=fbm(p*1.4+3.0*w);',
      ' vec3 col=mix(a,b,smoothstep(0.35,0.95,f));',
      ' col=mix(col,c,smoothstep(0.2,0.9,length(w)*0.75));',
      ' col=mix(a,col,smoothstep(0.25,0.8,f+0.15));',
      ' vec2 kp=(k.xy-0.5)*r/sc;float age=t-k.z;',
      ' float rd=length(p-kp);',
      ' float ring=exp(-pow((rd-age*0.85)*12.0,2.0))*exp(-age*1.2)*step(0.0,age);',
      ' col+=ring*mix(b,vec3(1.0),0.5)*0.9;',
      ' col+=exp(-md*5.0)*0.18*b;',
      ' vec2 uv=gl_FragCoord.xy/r;',
      ' col*=0.35+0.65*smoothstep(1.1,0.15,length(uv-0.5));',
      ' col+=(h(gl_FragCoord.xy+fract(t))-0.5)*0.035;',
      ' gl_FragColor=vec4(col,1.0);',
      '}'
    ].join('\n');
    const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return s; };
    const prog = gl.createProgram();
    gl.attachShader(prog, sh(gl.VERTEX_SHADER, vs));
    gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, fs));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { this.gl = null; return; }
    gl.useProgram(prog);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, 'p');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const u = (name) => gl.getUniformLocation(prog, name);
    const uR = u('r'), uT = u('t'), uM = u('m'), uK = u('k'), uA = u('a'), uB = u('b'), uC = u('c');
    const t0 = performance.now();
    const now = () => (performance.now() - t0) / 1000 * (this.props.speed ?? 1);
    const toLocal = (e) => {
      const rc = cv.getBoundingClientRect();
      return [(e.clientX - rc.left) / (rc.width || 1), 1 - (e.clientY - rc.top) / (rc.height || 1)];
    };
    this.onMove = (e) => { this.mouse = toLocal(e); };
    this.onDown = (e) => { const p = toLocal(e); this.click = [p[0], p[1], now()]; };
    window.addEventListener('pointermove', this.onMove, { passive: true });
    window.addEventListener('pointerdown', this.onDown, { passive: true });
    this.onResize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.25);
      const w = Math.max(1, Math.round(cv.clientWidth * dpr)), h = Math.max(1, Math.round(cv.clientHeight * dpr));
      if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; }
      gl.viewport(0, 0, cv.width, cv.height);
    };
    window.addEventListener('resize', this.onResize);
    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const frame = () => {
      this.onResize();
      const pal = this.palettes()[this.props.palette || 'sunset'] || this.palettes().sunset;
      this.smooth[0] += (this.mouse[0] - this.smooth[0]) * 0.08;
      this.smooth[1] += (this.mouse[1] - this.smooth[1]) * 0.08;
      gl.uniform2f(uR, cv.width, cv.height);
      gl.uniform1f(uT, reduce ? 6.0 : now() + (window.scrollY || 0) * 0.004);
      gl.uniform2f(uM, this.smooth[0], this.smooth[1]);
      gl.uniform3f(uK, this.click[0], this.click[1], this.click[2]);
      gl.uniform3fv(uA, pal[0]); gl.uniform3fv(uB, pal[1]); gl.uniform3fv(uC, pal[2]);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      if (reduce) return;
      if (document.hidden) this.wait = setTimeout(() => { this.raf = requestAnimationFrame(frame); }, 500);
      else this.raf = requestAnimationFrame(frame);
    };
    this.raf = requestAnimationFrame(frame);
  }
  renderVals() {
    const fb = {
      ember: 'radial-gradient(120% 90% at 30% 20%, #ff7329 0%, #5a1440 40%, #0d0508 80%)',
      electric: 'radial-gradient(120% 90% at 30% 20%, #38dbf5 0%, #3a1a7a 42%, #05060c 80%)',
      sunset: 'radial-gradient(120% 90% at 30% 20%, #ffcc2e 0%, #ff3d94 38%, #0d0517 80%)'
    };
    return { setCanvas: this.setCanvas, fallback: fb[this.props.palette || 'sunset'] || fb.sunset };
  }
}

  Component.__tpl = (html, $v, C) => html`<div aria-hidden="true" style="position: relative; width: 100%; height: 100%; min-height: 240px; overflow: hidden; background: ${$v.fallback}">
  <canvas ref=${$v.setCanvas} style="position: absolute; inset: 0; width: 100%; height: 100%; display: block"></canvas>
</div>`;
  Component.defaultProps = {"palette":"sunset","speed":1};
  const off = Component.prototype.componentWillUnmount;
  Component.prototype.componentWillUnmount = function () { this.__alive = false; if (off) off.call(this); };
  return Component;
})();

C.Editor = (() => {
  const DCLogic = DCBase;

class Component extends DCLogic {
  constructor(props) {
    super(props);
    this.state = { tab: null, ran: false, run: 0 };
  }
  componentWillUnmount() { clearTimeout(this.t); }
  renderVals() {
    const tab = this.state.tab || this.props.startTab || 'py';
    const C = { kw: '#C792EA', str: '#C3E88D', fn: '#82AAFF', cm: '#6B7394', cls: '#FFCB6B', p: '#E4E8F5', prompt: '#3DDC97', key: '#F78C6C' };
    const L = (...parts) => parts.map(([c, t]) => ({ c: C[c], t }));
    const files = {
      py: [
        L(['kw', 'class '], ['cls', 'Engineer'], ['p', ':']),
        L(['p', '    name     = '], ['str', '"Ege Erenler"']),
        L(['p', '    based_in = '], ['str', '"London, UK"']),
        L(['p', '    stack    = ['], ['str', '"Python"'], ['p', ', '], ['str', '"SQL"'], ['p', ', '], ['str', '"FastAPI"'], ['p', ',']),
        L(['p', '                '], ['str', '"dbt"'], ['p', ', '], ['str', '"Azure"'], ['p', ', '], ['str', '"AWS"'], ['p', ']']),
        [],
        L(['p', '    '], ['kw', 'def '], ['fn', 'open_to'], ['p', '(self):']),
        L(['cm', '        # roles I am looking for']),
        L(['p', '        '], ['kw', 'return '], ['p', '['], ['str', '"Data Engineer"'], ['p', ',']),
        L(['p', '                '], ['str', '"Software Engineer"'], ['p', ',']),
        L(['p', '                '], ['str', '"Analytics Engineer"'], ['p', ']'])
      ],
      sql: [
        L(['kw', 'SELECT '], ['p', 'name, stack, status']),
        L(['kw', 'FROM   '], ['p', 'projects']),
        L(['kw', 'WHERE  '], ['p', 'author = '], ['str', "'Ege Erenler'"]),
        L(['kw', 'ORDER  BY '], ['p', 'updated '], ['kw', 'DESC'], ['p', ';'])
      ],
      sh: [
        L(['prompt', '$ '], ['p', 'curl -s egeerenler.com/contact']),
        L(['p', '{']),
        L(['p', '  '], ['key', '"email"'], ['p', ':    '], ['str', '"salih2000ege@gmail.com"'], ['p', ',']),
        L(['p', '  '], ['key', '"linkedin"'], ['p', ': '], ['str', '"linkedin.com/in/ege-erenler"'], ['p', ',']),
        L(['p', '  '], ['key', '"github"'], ['p', ':   '], ['str', '"github.com/EgeErenler"'], ['p', ',']),
        L(['p', '  '], ['key', '"based_in"'], ['p', ': '], ['str', '"London, UK"']),
        L(['p', '}']),
        L(['prompt', '$ '])
      ]
    };
    const lines = files[tab].map((tokens, i, arr) => ({ no: i + 1, tokens, caret: i === arr.length - 1 }));
    const tabs = [['py', 'profile.py'], ['sql', 'projects.sql'], ['sh', 'contact.sh']].map(([id, label]) => ({
      label, on: id === tab ? 'true' : 'false',
      fg: id === tab ? '#E4E8F5' : '#8A93B0',
      line: id === tab ? (this.props.accent || '#82AAFF') : 'transparent',
      pick: () => this.setState({ tab: id, ran: false })
    }));
    const list = [
      ['London Property Finder', 'Python, DuckDB', 'live', 'https://egeerenler.com/london-property-finder/'],
      ['UK Energy Demand Forecast', 'LightGBM, FastAPI', 'live', 'https://egeerenler.com/uk-energy-forecast/'],
      ['London Pulse', 'dbt, DuckDB', 'live', 'https://egeerenler.com/london-pulse/'],
      ['UK Housing Market Analytics', 'SQL, DuckDB', 'live', 'https://egeerenler.com/uk-housing-analytics/'],
      ['Scoretime', 'React Native, FastAPI', 'in_dev', 'https://scoretime.app/'],
      ['MediPulse AI', 'Streamlit, Groq', 'live', 'https://medipulse-ai.streamlit.app']
    ];
    return {
      tabs, lines, accent: this.props.accent || '#82AAFF',
      isSql: tab === 'sql', isSh: tab === 'sh', ran: this.state.ran,
      rows: list.map(([name, stack, status, url], i) => ({ name, stack, status, url, delay: (i * 0.08) + 's', col: status === 'live' ? '#3DDC97' : '#FFCB6B' })),
      run: () => {
        this.setState({ ran: false });
        clearTimeout(this.t);
        this.t = setTimeout(() => this.setState({ ran: true }), 60);
      }
    };
  }
}

  Component.__tpl = (html, $v, C) => html`<div style="width: 100%; box-sizing: border-box; border-radius: 16px; overflow: hidden; background: #0B0E17; color: #E4E8F5; border: 1px solid rgba(228,232,245,.12); font-family: 'JetBrains Mono', ui-monospace, monospace; font-size: 14px; box-shadow: 0 40px 80px -40px rgba(0,0,0,.8)">
  <div style="display: flex; align-items: center; gap: 14px; padding: 0 14px; background: #111522; border-bottom: 1px solid rgba(228,232,245,.10); overflow-x: auto">
    <div aria-hidden="true" style="display: flex; gap: 7px; padding: 14px 4px 14px 0">
      <span style="width: 11px; height: 11px; border-radius: 50%; background: #FF5F57"></span>
      <span style="width: 11px; height: 11px; border-radius: 50%; background: #FEBC2E"></span>
      <span style="width: 11px; height: 11px; border-radius: 50%; background: #28C840"></span>
    </div>
    <div role="tablist" aria-label="Files" style="display: flex">
      ${($v.tabs || []).map((tb) => html`
        <button type="button" role="tab" aria-selected=${tb?.on} onClick=${tb?.pick} style="min-height: 44px; padding: 0 16px; border: 0; border-bottom: 2px solid ${tb?.line}; background: transparent; color: ${tb?.fg}; font: 500 13px 'JetBrains Mono', monospace; cursor: pointer; white-space: nowrap">${tb?.label}</button>
      `)}
    </div>
  </div>

  <div style="padding: 18px 0; overflow-x: auto; min-height: 300px">
    ${($v.lines || []).map((ln) => html`
      <div style="display: flex; white-space: pre; line-height: 1.75">
        <span aria-hidden="true" style="flex: none; width: 46px; padding-right: 16px; text-align: right; color: #4A5270">${ln?.no}</span>
        <span>${(ln?.tokens || []).map((tk) => html`<span style="color: ${tk?.c}">${tk?.t}</span>`)}${(ln?.caret) ? html`<span class="ee-anim" aria-hidden="true" style="display: inline-block; width: 8px; height: 17px; margin-left: 2px; vertical-align: -3px; background: #82AAFF; animation: ee-caret 1s steps(1) infinite"></span>` : null}</span>
      </div>
    `)}
  </div>

  ${($v.isSql) ? html`
    <div style="border-top: 1px solid rgba(228,232,245,.10)">
      <div style="display: flex; justify-content: space-between; align-items: center; gap: 12px; padding: 10px 14px; background: #111522; font-size: 12px; color: #8A93B0">
        <span>projects.db</span>
        <button type="button" onClick=${$v.run} style="display: inline-flex; align-items: center; gap: 8px; min-height: 36px; padding: 0 14px; border: 0; border-radius: 8px; background: ${$v.accent}; color: #0B0E17; font: 700 12px 'JetBrains Mono', monospace; cursor: pointer"><svg viewBox="0 0 12 12" width="10" height="10" fill="currentColor" aria-hidden="true"><path d="M2 1l9 5-9 5z"></path></svg>Run query</button>
      </div>
      ${($v.ran) ? html`
        <div style="overflow-x: auto">
          <div style="min-width: 560px">
            <div style="display: grid; grid-template-columns: 2.2fr 2fr 1fr; gap: 12px; padding: 10px 16px; font-size: 12px; color: #8A93B0; border-bottom: 1px solid rgba(228,232,245,.10)"><span>name</span><span>stack</span><span>status</span></div>
            ${($v.rows || []).map((rw) => html`
              <a href=${rw?.url} target="_blank" rel="noopener" class="ee-anim" style="display: grid; grid-template-columns: 2.2fr 2fr 1fr; gap: 12px; padding: 11px 16px; color: #E4E8F5; text-decoration: none; border-bottom: 1px solid rgba(228,232,245,.06); animation: ee-row .45s both; animation-delay: ${rw?.delay}">
                <span>${rw?.name} ↗</span><span style="color: #8A93B0">${rw?.stack}</span><span style="color: ${rw?.col}">${rw?.status}</span>
              </a>
            `)}
            <div style="padding: 10px 16px; font-size: 12px; color: #8A93B0">6 rows returned</div>
          </div>
        </div>
      ` : null}
    </div>
  ` : null}

  ${($v.isSh) ? html`
    <div style="display: flex; flex-wrap: wrap; gap: 8px; padding: 0 16px 18px 62px">
      <a href="mailto:salih2000ege@gmail.com" style="display: inline-flex; align-items: center; min-height: 40px; padding: 0 14px; border-radius: 8px; background: ${$v.accent}; color: #0B0E17; text-decoration: none; font-weight: 700; font-size: 13px">email</a>
      <a href="https://www.linkedin.com/in/ege-erenler" target="_blank" rel="noopener" style="display: inline-flex; align-items: center; min-height: 40px; padding: 0 14px; border-radius: 8px; border: 1px solid rgba(228,232,245,.2); color: #E4E8F5; text-decoration: none; font-size: 13px">linkedin ↗</a>
      <a href="https://github.com/EgeErenler" target="_blank" rel="noopener" style="display: inline-flex; align-items: center; min-height: 40px; padding: 0 14px; border-radius: 8px; border: 1px solid rgba(228,232,245,.2); color: #E4E8F5; text-decoration: none; font-size: 13px">github ↗</a>
    </div>
  ` : null}
</div>`;
  Component.defaultProps = {"accent":"#82AAFF","startTab":"py"};
  const off = Component.prototype.componentWillUnmount;
  Component.prototype.componentWillUnmount = function () { this.__alive = false; if (off) off.call(this); };
  return Component;
})();

C.GitLog = (() => {
  const DCLogic = DCBase;

class Component extends DCLogic {
  renderVals() {
    const list = [
      ['MSc Data Science in Business', 'Regent’s University London', 'Sep 2025 – Oct 2026', 'HEAD -> main, london', 'Consultancy project for a real client: 67,500 sales records analysed in Python, customer segments tested, a costed plan delivered.'],
      ['Freelance Software and Data Developer', 'Sokian Ltd · London (remote)', 'Sep 2024 – Aug 2025', '', 'A sales incentive app for a multinational FMCG client, used by about 300 people. Python ETL into MySQL, FastAPI on Azure, React Native app, daily rankings.'],
      ['Junior Software Engineer', 'Orion Innovation · Istanbul', 'Sep 2023 – Aug 2024', '', 'SQL and reporting up to 20% faster after redesigning MySQL databases. Apps deployed on AWS and Azure.'],
      ['Software Engineer Intern', 'Mikrogrup · Istanbul', 'Feb 2023 – Aug 2023', '', 'Backend logic in Python and SQL for financial and accounting reports.'],
      ['BSc Software Engineering', 'Bahçeşehir University · Istanbul', '2019 – 2024', 'origin', 'Where it started.']
    ];
    const hashes = ['a3f9c21', '7be4d08', '52c1e9a', 'e08b4f3', '1d6a7c0'];
    return {
      commits: list.map(([title, org, when, ref, body], i) => ({
        title, org, when, body, ref, hasRef: !!ref, hash: hashes[i],
        dot: i === 0 ? '#3DDC97' : '#82AAFF', fill: i === 0 ? '#3DDC97' : '#0B0E17'
      }))
    };
  }
}

  Component.__tpl = (html, $v, C) => html`<div style="width: 100%; box-sizing: border-box; border-radius: 16px; overflow: hidden; background: #0B0E17; color: #E4E8F5; border: 1px solid rgba(228,232,245,.12); font-family: 'JetBrains Mono', ui-monospace, monospace; font-size: 14px">
  <div style="padding: 14px 18px; background: #111522; border-bottom: 1px solid rgba(228,232,245,.10); color: #8A93B0; font-size: 13px"><span style="color: #3DDC97">ege@london</span>:<span style="color: #82AAFF">~/career</span>$ git log --graph --date=short</div>
  <div style="padding: 18px; overflow-x: auto">
    <div style="min-width: 0; overflow-wrap: anywhere">
      ${($v.commits || []).map((cm) => html`
        <div style="display: grid; grid-template-columns: 28px 1fr; gap: 6px">
          <div aria-hidden="true" style="display: flex; flex-direction: column; align-items: center">
            <span style="width: 12px; height: 12px; margin-top: 5px; border-radius: 50%; border: 2px solid ${cm?.dot}; background: ${cm?.fill}"></span>
            <span style="flex: 1; width: 2px; background: rgba(228,232,245,.16)"></span>
          </div>
          <div style="padding-bottom: 22px">
            <div style="display: flex; flex-wrap: wrap; align-items: baseline; gap: 6px 10px">
              <span style="color: #FFCB6B">${cm?.hash}</span>
              ${(cm?.hasRef) ? html`<span style="color: #3DDC97">(${cm?.ref})</span>` : null}
              <span style="color: #E4E8F5; font-weight: 700">${cm?.title}</span>
            </div>
            <div style="margin-top: 4px; color: #8A93B0">${cm?.org} · ${cm?.when}</div>
            <div style="margin-top: 6px; color: #B9C0D8; line-height: 1.6; white-space: normal">${cm?.body}</div>
          </div>
        </div>
      `)}
    </div>
  </div>
</div>`;
  Component.defaultProps = {};
  const off = Component.prototype.componentWillUnmount;
  Component.prototype.componentWillUnmount = function () { this.__alive = false; if (off) off.call(this); };
  return Component;
})();

C.CvWheel = (() => {
  const DCLogic = DCBase;

const CV = {
  name: 'Ege Erenler',
  title: 'Software Engineer and Data Scientist',
  contact: ['London, UK', 'salih2000ege@gmail.com', 'egeerenler.com', 'github.com/EgeErenler', 'linkedin.com/in/ege-erenler'],
  summary: 'I turn data into products people can use. Python, SQL, cloud and AI, from first query to live app. Open to Data Engineer, Software Engineer, Analytics Engineer and Data Analyst roles in London.',
  experience: [
    { role: 'Freelance Software and Data Developer', org: 'Sokian Ltd, London (remote)', when: 'Sep 2024 to Aug 2025', text: 'Built a sales incentive app end to end for a multinational FMCG client, used by 11 managers, 42 sales supervisors and around 250 sales reps. Python ETL pipelines into MySQL, FastAPI APIs on Azure and a React Native app with daily regional and national rankings. Supported it for a year with quarterly releases.' },
    { role: 'Junior Software Engineer', org: 'Orion Innovation, Istanbul', when: 'Sep 2023 to Aug 2024', text: 'Improved SQL query and reporting performance by up to 20% by redesigning MySQL databases. Automated internal reporting and deployed data-driven apps on AWS and Azure in Agile teams.' },
    { role: 'Software Engineer Intern', org: 'Mikrogrup, Istanbul', when: 'Feb 2023 to Aug 2023', text: 'Built backend logic in Python and SQL for financial and accounting reports at a financial software company, and improved database reliability.' }
  ],
  education: [
    { role: 'MSc Data Science in Business', org: "Regent's University London", when: 'Sep 2025 to Oct 2026', text: 'Consultancy project for a real client: analysed 67,500 point-of-sale transactions in Python, tested customer segments and delivered a costed plan.' },
    { role: 'BSc Software Engineering', org: 'Bahçeşehir University, Istanbul', when: '2019 to 2024', text: '' }
  ],
  projects: [
    { role: 'London Property Finder', org: 'Python, DuckDB, Leaflet', when: 'live', text: 'Ranks about 38,000 London streets on value, rental yield, growth, crime, schools and stations. Rebuilt every day from seven open data sources.' },
    { role: 'UK Energy Demand Forecast', org: 'Python, LightGBM, FastAPI', when: 'live', text: 'Forecasts GB electricity demand for every half hour of the next day. 3.17% error, against 2.93% for the official NESO forecast.' },
    { role: 'London Pulse', org: 'Python, dbt, DuckDB', when: 'live', text: 'A pipeline that snapshots Tube status, bikes, weather and air quality every 15 minutes into a tested data warehouse.' },
    { role: 'UK Housing Market Analytics', org: 'SQL, DuckDB', when: 'live', text: 'SQL analysis of every home sold in England and Wales since 2018.' },
    { role: 'Scoretime', org: 'React Native, Expo, FastAPI', when: 'in development', text: 'Live scores app for UK sports fans on my own database of more than 500,000 matches since 1872.' },
    { role: 'MediPulse AI', org: 'Python, Streamlit, Groq', when: 'live', text: 'A triage assistant that rates how urgent symptoms are with a large language model.' }
  ],
  skills: [
    ['Data', 'Python, SQL, MySQL, PostgreSQL'],
    ['Backend', 'FastAPI, REST APIs, ETL, Docker'],
    ['Analysis', 'pandas, scikit-learn, Power BI, Tableau'],
    ['AI apps', 'LLM APIs (Groq), Streamlit'],
    ['Mobile', 'React Native, Expo, TypeScript'],
    ['Cloud', 'Azure, AWS, GitHub Actions'],
    ['Tools', 'Git, Jira, Agile'],
    ['Languages', 'English, Turkish (native)']
  ]
};
const GROUPS = ['actions', 'convert', 'tools', 'projects'];
const META = {
  actions: { name: 'Actions', key: '', tag: 'ACTIONS' },
  convert: { name: 'Convert', key: '⇧', tag: 'CONVERT · ⇧' },
  tools: { name: 'Crop & tools', key: '⌘', tag: 'TOOLS · ⌘' },
  projects: { name: 'Projects', key: 'ctrl', tag: 'PROJECTS · CTRL' }
};

class Component extends DCLogic {
  constructor(props) {
    super(props);
    this.state = { used: !!window.__eeWheelUsed, open: false, cx: 0, cy: 0, px: 0, py: 0, sel: -1, group: 'actions', g: 'actions', toast: '', dragging: false, demo: false };
    this.setRoot = (el) => { this.root = el; };
    this.start = null;
  }

  // ---------- what each wedge does ----------
  items(g) {
    const S = {
      actions: [
        { icon: 'download', label: 'Download PDF', sub: 'one click', run: () => this.downloadPdf() },
        { icon: 'copy', label: 'Copy email', sub: 'to clipboard', run: () => this.copy('salih2000ege@gmail.com', 'Email copied') },
        { icon: 'share', label: 'Share link', sub: 'egeerenler.com', run: () => this.share() },
        { icon: 'open', label: 'Open LinkedIn', sub: 'new tab', run: () => this.go('https://www.linkedin.com/in/ege-erenler') },
        { icon: 'open', label: 'Open GitHub', sub: 'new tab', run: () => this.go('https://github.com/EgeErenler') },
        { icon: 'mail', label: 'Send email', sub: 'mail app', run: () => { window.location.href = 'mailto:salih2000ege@gmail.com'; } }
      ],
      convert: [
        { icon: 'file', label: 'Convert to PDF', sub: 'document', run: () => this.downloadPdf() },
        { icon: 'image', label: 'Convert to PNG', sub: 'image', run: () => this.image('png') },
        { icon: 'image', label: 'Convert to JPG', sub: 'image', run: () => this.image('jpeg') },
        { icon: 'text', label: 'Convert to Markdown', sub: '.md', run: () => this.text('md') },
        { icon: 'text', label: 'Convert to TXT', sub: '.txt', run: () => this.text('txt') },
        { icon: 'contact', label: 'Save as vCard', sub: 'add to contacts', run: () => this.text('vcf') }
      ],
      tools: [
        { icon: 'crop', label: 'Crop to Experience', sub: 'PNG', run: () => this.crop('experience') },
        { icon: 'crop', label: 'Crop to Projects', sub: 'PNG', run: () => this.crop('projects') },
        { icon: 'crop', label: 'Crop to Skills', sub: 'PNG', run: () => this.crop('skills') },
        { icon: 'compress', label: 'Compress', sub: 'small JPG', run: () => this.compress() },
        { icon: 'card', label: 'Make one-pager', sub: 'summary card', run: () => this.card() },
        { icon: 'copy', label: 'Copy as text', sub: 'plain CV', run: () => this.copy(this.plain(), 'CV text copied') }
      ],
      projects: [
        { icon: 'open', label: 'Open Property Finder', sub: 'live app', run: () => this.go('https://egeerenler.com/london-property-finder/') },
        { icon: 'open', label: 'Open Energy Forecast', sub: 'ML model', run: () => this.go('https://egeerenler.com/uk-energy-forecast/') },
        { icon: 'open', label: 'Open London Pulse', sub: 'pipeline', run: () => this.go('https://egeerenler.com/london-pulse/') },
        { icon: 'open', label: 'Open Housing Analytics', sub: 'SQL', run: () => this.go('https://egeerenler.com/uk-housing-analytics/') },
        { icon: 'open', label: 'Open Scoretime', sub: 'scores app', run: () => this.go('https://scoretime.app/') },
        { icon: 'open', label: 'Open MediPulse', sub: 'AI app', run: () => this.go('https://medipulse-ai.streamlit.app') }
      ]
    };
    return S[g];
  }

  // ---------- small helpers ----------
  // Each petal shows an icon and its action, like Tangerine.
  icon(name, color) {
    const P = {
      download: 'M12 4v11M7 10l5 5 5-5M5 20h14',
      copy: 'M9 9h11v11H9zM5 15V4h11',
      share: 'M12 15V4M8 8l4-4 4 4M5 13v7h14v-7',
      open: 'M14 4h6v6M20 4l-9 9M18 14v6H4V6h6',
      mail: 'M3 6h18v12H3zM3 7l9 7 9-7',
      file: 'M6 3h9l4 4v14H6zM14 3v5h5M9 13h6M9 17h6',
      image: 'M4 5h16v14H4zM4 16l5-5 4 4 3-3 4 4M15 9h.01',
      text: 'M5 6h14M5 11h14M5 16h9',
      contact: 'M4 5h16v14H4zM6.5 16c.8-2.4 5.2-2.4 6 0M9.5 11.5a.01.01 0 1 0 0 .01M14 10h4M14 14h4',
      crop: 'M6 2v16h16M2 6h16v16',
      compress: 'M4 14h6v6M20 10h-6V4M14 10l7-7M3 21l7-7',
      card: 'M3 6h18v12H3zM7 10h6M7 14h10'
    };
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="${P[name] || P.open}"/></svg>`;
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  }
  go(url) { window.open(url, '_blank', 'noopener'); }
  say(msg) {
    clearTimeout(this.toastTimer);
    this.setState({ toast: msg });
    this.toastTimer = setTimeout(() => this.setState({ toast: '' }), 2400);
  }
  copy(text, msg) {
    const done = () => this.say(msg);
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, () => this.say('Copy is blocked here'));
    else this.say('Copy is blocked here');
  }
  share() {
    const url = 'https://egeerenler.com';
    if (navigator.share) navigator.share({ title: 'Ege Erenler', text: CV.title, url }).catch(() => {});
    else this.copy(url, 'Link copied');
  }
  kb(n) { return n < 1024 ? n + ' B' : Math.round(n / 1024) + ' KB'; }
  save(blob, name, extra) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = name; a.rel = 'noopener';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
    this.say('Saved ' + name + ' · ' + this.kb(blob.size) + (extra || ''));
  }
  accent() { const a = this.props.accent || '#FF6A2B'; return /^#[0-9a-f]{6}$/i.test(a) ? a : '#FF6A2B'; }

  // ---------- the CV as blocks, shared by every format ----------
  blocks(only) {
    const B = [];
    const head = () => {
      B.push({ t: 'h1', s: CV.name });
      B.push({ t: 'meta', s: CV.title });
      B.push({ t: 'meta', s: CV.contact.join('  ·  ') });
      B.push({ t: 'gap' });
    };
    const list = (title, rows) => {
      B.push({ t: 'h2', s: title });
      rows.forEach((r) => {
        B.push({ t: 'item', s: r.role, right: r.when });
        B.push({ t: 'meta', s: r.org });
        if (r.text) B.push({ t: 'p', s: r.text });
        B.push({ t: 'gap', h: 0.5 });
      });
    };
    const skills = () => {
      B.push({ t: 'h2', s: 'Skills' });
      CV.skills.forEach((s) => B.push({ t: 'p', s: s[0] + ': ' + s[1] }));
    };
    head();
    if (!only) { B.push({ t: 'h2', s: 'Profile' }); B.push({ t: 'p', s: CV.summary }); B.push({ t: 'gap' }); }
    if (!only || only === 'experience') { list('Experience', CV.experience); if (!only) list('Education', CV.education); }
    if (!only || only === 'projects') list('Selected projects', CV.projects);
    if (!only || only === 'skills') skills();
    return B;
  }
  plain() {
    return this.blocks().map((b) => b.t === 'gap' ? '' : b.t === 'h2' ? '\n' + b.s.toUpperCase() : b.t === 'item' ? b.s + ' (' + b.right + ')' : b.s).join('\n').replace(/\n{3,}/g, '\n\n') + '\n';
  }
  text(kind) {
    let body, type = 'text/plain';
    if (kind === 'md') {
      type = 'text/markdown';
      body = this.blocks().map((b) => b.t === 'h1' ? '# ' + b.s : b.t === 'h2' ? '\n## ' + b.s : b.t === 'item' ? '\n**' + b.s + '** · ' + b.right : b.t === 'meta' ? '_' + b.s + '_' : b.t === 'gap' ? '' : b.s).join('\n').replace(/\n{3,}/g, '\n\n') + '\n';
    } else if (kind === 'vcf') {
      type = 'text/vcard';
      body = ['BEGIN:VCARD', 'VERSION:3.0', 'N:Erenler;Ege;;;', 'FN:Ege Erenler', 'TITLE:' + CV.title, 'EMAIL;TYPE=INTERNET:salih2000ege@gmail.com', 'URL:https://egeerenler.com', 'URL:https://github.com/EgeErenler', 'URL:https://www.linkedin.com/in/ege-erenler', 'ADR;TYPE=WORK:;;;London;;;United Kingdom', 'END:VCARD', ''].join('\r\n');
    } else body = this.plain();
    const ext = kind === 'md' ? 'md' : kind === 'vcf' ? 'vcf' : 'txt';
    this.save(new Blob([body], { type: type + ';charset=utf-8' }), (kind === 'vcf' ? 'Ege_Erenler' : 'Ege_Erenler_CV') + '.' + ext);
  }

  // ---------- images: draw the CV on a canvas ----------
  paint(only) {
    const W = 1240, M = 96, maxW = W - M * 2;
    const c = document.createElement('canvas'); c.width = W; c.height = 4200;
    const x = c.getContext('2d');
    const F = 'Helvetica, Arial, sans-serif', acc = this.accent();
    x.fillStyle = '#FFFFFF'; x.fillRect(0, 0, W, c.height);
    x.fillStyle = acc; x.fillRect(0, 0, W, 14);
    let y = M;
    const wrap = (s, font) => {
      x.font = font; const out = []; let line = '';
      s.split(' ').forEach((w) => { const t = line ? line + ' ' + w : w; if (x.measureText(t).width > maxW && line) { out.push(line); line = w; } else line = t; });
      if (line) out.push(line); return out;
    };
    this.blocks(only).forEach((b) => {
      if (b.t === 'h1') { x.font = '700 64px ' + F; x.fillStyle = '#121212'; y += 52; x.fillText(b.s, M, y); y += 26; }
      else if (b.t === 'h2') { y += 34; x.font = '700 22px ' + F; x.fillStyle = acc; x.fillText(b.s.toUpperCase(), M, y); y += 14; x.fillStyle = '#E4E2DD'; x.fillRect(M, y, maxW, 2); y += 38; }
      else if (b.t === 'item') { x.font = '700 27px ' + F; x.fillStyle = '#121212'; x.fillText(b.s, M, y); x.font = '600 21px ' + F; x.fillStyle = '#6B6964'; const w = x.measureText(b.right).width; x.fillText(b.right, M + maxW - w, y); y += 34; }
      else if (b.t === 'meta') { wrap(b.s, '400 21px ' + F).forEach((l) => { x.fillStyle = '#6B6964'; x.fillText(l, M, y); y += 30; }); }
      else if (b.t === 'p') { wrap(b.s, '400 23px ' + F).forEach((l) => { x.fillStyle = '#2A2A2A'; x.fillText(l, M, y); y += 34; }); }
      else if (b.t === 'gap') { y += 22 * (b.h || 1); }
    });
    const h = Math.max(only ? 0 : 1754, y + M - 20);
    const out = document.createElement('canvas'); out.width = W; out.height = h;
    out.getContext('2d').drawImage(c, 0, 0);
    return out;
  }
  blob(canvas, type, q) { return new Promise((res) => canvas.toBlob(res, 'image/' + type, q)); }
  async image(type) {
    const b = await this.blob(this.paint(), type, 0.92);
    if (b) this.save(b, 'Ege_Erenler_CV.' + (type === 'jpeg' ? 'jpg' : 'png'));
  }
  async crop(part) {
    const b = await this.blob(this.paint(part), 'png');
    if (b) this.save(b, 'Ege_Erenler_' + part + '.png', ' · cropped');
  }
  async compress() {
    const c = this.paint();
    const big = await this.blob(c, 'png'), small = await this.blob(c, 'jpeg', 0.5);
    if (small) this.save(small, 'Ege_Erenler_CV_small.jpg', big ? ' · ' + Math.round((1 - small.size / big.size) * 100) + '% smaller' : '');
  }
  async card() {
    const W = 1200, H = 630, c = document.createElement('canvas'); c.width = W; c.height = H;
    const x = c.getContext('2d'), F = 'Helvetica, Arial, sans-serif', acc = this.accent();
    x.fillStyle = '#121212'; x.fillRect(0, 0, W, H);
    x.fillStyle = acc; x.fillRect(0, H - 18, W, 18);
    x.fillStyle = '#FFFFFF'; x.font = '700 92px ' + F; x.fillText('Ege Erenler', 80, 170);
    x.font = '400 34px ' + F; x.fillStyle = '#CFCDC7'; x.fillText(CV.title + ' · London', 80, 228);
    [['3.17%', 'forecast error'], ['38,000', 'streets ranked'], ['500k+', 'matches in my DB']].forEach((f, i) => {
      const fx = 80 + i * 360; x.fillStyle = acc; x.font = '700 64px ' + F; x.fillText(f[0], fx, 380); x.fillStyle = '#CFCDC7'; x.font = '400 26px ' + F; x.fillText(f[1], fx, 420);
    });
    x.fillStyle = '#FFFFFF'; x.font = '700 28px ' + F; x.fillText('egeerenler.com  ·  salih2000ege@gmail.com', 80, 540);
    const b = await this.blob(c, 'png');
    if (b) this.save(b, 'Ege_Erenler_one_pager.png');
  }

  // ---------- PDF: the real file on the live site, or one built right here ----------
  async downloadPdf() {
    try {
      const r = await fetch('/cv/Ege_Erenler_CV.pdf', { method: 'HEAD' });
      if (r.ok && /pdf/.test(r.headers.get('content-type') || '')) {
        const a = document.createElement('a'); a.href = '/cv/Ege_Erenler_CV.pdf'; a.download = 'Ege_Erenler_CV.pdf';
        document.body.appendChild(a); a.click(); a.remove(); this.say('Downloading Ege_Erenler_CV.pdf'); return;
      }
    } catch (e) { /* no file next to the page, so build one */ }
    this.save(this.buildPdf(), 'Ege_Erenler_CV.pdf');
  }
  buildPdf() {
    const fix = (s) => s.replace(/ş/g, 's').replace(/Ş/g, 'S').replace(/ğ/g, 'g').replace(/Ğ/g, 'G').replace(/ı/g, 'i').replace(/İ/g, 'I').replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/[–—]/g, '-').replace(/[^\x00-\xff]/g, '?');
    const esc = (s) => fix(s).replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
    const m = document.createElement('canvas').getContext('2d');
    const width = (s, size, bold) => { m.font = (bold ? '700 ' : '400 ') + size + 'px Helvetica, Arial'; return m.measureText(s).width; };
    const [ar, ag, ab] = [1, 3, 5].map((i) => (parseInt(this.accent().substr(i, 2), 16) / 255).toFixed(3));
    const L = 56, R = 539, maxW = R - L, pages = [];
    let cur = [], y = 790;
    const put = (s, size, bold, col, xx) => cur.push(`${col} rg BT /${bold ? 'F2' : 'F1'} ${size} Tf ${xx.toFixed(1)} ${y.toFixed(1)} Td (${esc(s)}) Tj ET`);
    const need = (h) => { if (y - h < 56) { pages.push(cur); cur = []; y = 790; } };
    const wrap = (s, size) => { const out = []; let line = ''; s.split(' ').forEach((w) => { const t = line ? line + ' ' + w : w; if (width(t, size) > maxW && line) { out.push(line); line = w; } else line = t; }); if (line) out.push(line); return out; };
    const ink = '0.07 0.07 0.07', grey = '0.42 0.41 0.39', acc = `${ar} ${ag} ${ab}`;
    cur.push(`${acc} rg 0 836 595 6 re f`);
    this.blocks().forEach((b) => {
      if (b.t === 'h1') { y -= 10; put(b.s, 26, true, ink, L); y -= 18; }
      else if (b.t === 'h2') { need(40); y -= 14; put(b.s.toUpperCase(), 10, true, acc, L); y -= 6; cur.push(`0.89 0.89 0.87 rg ${L} ${y.toFixed(1)} ${maxW} 0.8 re f`); y -= 16; }
      else if (b.t === 'item') { need(30); put(b.s, 11, true, ink, L); put(b.right, 9, false, grey, R - width(b.right, 9, false)); y -= 13; }
      else if (b.t === 'meta') { wrap(b.s, 9).forEach((l) => { need(12); put(l, 9, false, grey, L); y -= 12; }); }
      else if (b.t === 'p') { wrap(b.s, 9.5).forEach((l) => { need(13); put(l, 9.5, false, '0.16 0.16 0.16', L); y -= 13; }); }
      else if (b.t === 'gap') { y -= 8 * (b.h || 1); }
    });
    pages.push(cur);
    const objs = [];
    const add = (s) => { objs.push(s); return objs.length; };
    add('<< /Type /Catalog /Pages 2 0 R >>');
    add('PAGES');
    add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>');
    add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>');
    add('<< /Producer (egeerenler.com) /Title (Ege Erenler CV) /Author (Ege Erenler) >>');
    const kids = [];
    pages.forEach((ops) => {
      const stream = ops.join('\n');
      const c = add(`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`);
      kids.push(add(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${c} 0 R >>`));
    });
    objs[1] = `<< /Type /Pages /Kids [${kids.map((k) => k + ' 0 R').join(' ')}] /Count ${kids.length} >>`;
    let out = '%PDF-1.4\n%\xe2\xe3\xcf\xd3\n';
    const offs = [];
    objs.forEach((o, i) => { offs.push(out.length); out += `${i + 1} 0 obj\n${o}\nendobj\n`; });
    const xref = out.length;
    out += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n` + offs.map((o) => String(o).padStart(10, '0') + ' 00000 n \n').join('');
    out += `trailer\n<< /Size ${objs.length + 1} /Root 1 0 R /Info 5 0 R >>\nstartxref\n${xref}\n%%EOF`;
    const bytes = new Uint8Array(out.length);
    for (let i = 0; i < out.length; i++) bytes[i] = out.charCodeAt(i) & 255;
    return new Blob([bytes], { type: 'application/pdf' });
  }

  // ---------- the wheel ----------
  groupFor(e) {
    if (e.shiftKey) return 'convert';
    if (e.metaKey || e.altKey) return 'tools';
    if (e.ctrlKey) return 'projects';
    return this.state.group;
  }
  sectorAt(x, y) {
    const dx = x - this.state.cx, dy = y - this.state.cy;
    if (Math.hypot(dx, dy) < 56 * Math.min(1, ((window.innerWidth || 1000) - 16) / 380)) return -1;
    let deg = Math.atan2(dy, dx) * 180 / Math.PI + 90;
    deg = (deg + 360) % 360;
    return Math.floor(deg / 60) % 6;
  }
  openAt(x, y, g) {
    const w = window.innerWidth || 1000, h = window.innerHeight || 800, pad = 190 * Math.min(1, (w - 16) / 380) + 4;
    const cx = Math.max(pad, Math.min(w - pad, x)), cy = Math.max(pad, Math.min(h - pad, y));
    this.setState({ open: true, cx, cy, px: x, py: y, sel: -1, g: g || this.state.group });
  }
  close(run) {
    const { sel, g } = this.state;
    this.setState({ open: false, dragging: false, sel: -1 });
    if (run && sel >= 0) this.items(g)[sel].run();
  }
  stopDemo() {
    clearTimeout(this.demoTimer);
    if (this.state.demo) this.setState({ demo: false, open: false, sel: -1 });
    if (!this.state.used) this.setState({ used: true });
    window.__eeWheelUsed = true;
  }
  // Plays once a few seconds after load so visitors see what the file can do.
  playDemo() {
    if (this.state.used || this.state.open || !this.root || window.__eeWheelUsed) return;
    const r = this.root.getBoundingClientRect();
    if (r.bottom < 0 || r.top > (window.innerHeight || 800)) { this.demoTimer = setTimeout(() => this.playDemo(), 4000); return; }
    const x = r.left + 30, y = r.top + 28;
    this.openAt(x, y, 'actions');
    this.setState({ demo: true, dragging: true, px: x, py: y });
    const C = { x: this.state.cx, y: this.state.cy };
    const steps = [['actions', 0], ['actions', 1], ['actions', 2], ['convert', 0], ['convert', 1], ['convert', 3], ['tools', 0], ['tools', 3], ['tools', 4]];
    let i = 0;
    const step = () => {
      if (this.state.used || !this.state.demo) return;
      if (i >= steps.length) {
        this.setState({ open: false, demo: false, dragging: false, sel: -1, g: this.state.group });
        window.__eeWheelSeen = (window.__eeWheelSeen || 0) + 1;
        this.demoRuns = (this.demoRuns || 0) + 1;
        if (this.demoRuns < 2 && window.__eeWheelSeen < 2) this.demoTimer = setTimeout(() => this.playDemo(), 15000);
        return;
      }
      const [g, s] = steps[i];
      const t = ((s * 60 + 30) - 90) * Math.PI / 180;
      this.setState({ g, sel: s, px: C.x + 130 * Math.min(1, ((window.innerWidth || 1000) - 16) / 380) * Math.cos(t), py: C.y + 130 * Math.min(1, ((window.innerWidth || 1000) - 16) / 380) * Math.sin(t) });
      i += 1;
      this.demoTimer = setTimeout(step, 420);
    };
    this.demoTimer = setTimeout(step, 400);
  }
  componentDidMount() {
    this.onMove = (e) => {
      if (!this.start) return;
      const moved = Math.hypot(e.clientX - this.start.x, e.clientY - this.start.y);
      if (!this.state.open && moved > 6) this.openAt(this.start.x, this.start.y, this.groupFor(e));
      if (this.state.open) this.setState({ px: e.clientX, py: e.clientY, dragging: true, g: this.groupFor(e), sel: this.sectorAt(e.clientX, e.clientY) });
    };
    this.onUp = () => {
      clearTimeout(this.hold);
      if (!this.start) return;
      this.start = null;
      if (this.state.open) this.close(true);
    };
    window.addEventListener('pointermove', this.onMove);
    window.addEventListener('pointerup', this.onUp);
    window.addEventListener('pointercancel', this.onUp);
    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!reduce) this.demoTimer = setTimeout(() => this.playDemo(), 2800);
  }
  componentWillUnmount() {
    clearTimeout(this.demoTimer); clearTimeout(this.hold); clearTimeout(this.toastTimer);
    window.removeEventListener('pointermove', this.onMove);
    window.removeEventListener('pointerup', this.onUp);
    window.removeEventListener('pointercancel', this.onUp);
  }
  renderVals() {
    const p = this.props;
    const ink = p.ink || '#121212', paper = p.paper || '#FFFFFF', card = p.card || '#FFFFFF';
    const line = p.line || '#BDBBB5', accent = p.accent || '#FF6A2B', onAccent = p.onAccent || '#121212';
    const g = this.state.open ? this.state.g : this.state.group;
    const set = this.items(g);
    const C = 190, r1 = 56, r2 = 186;
    const pt = (r, a) => { const t = (a - 90) * Math.PI / 180; return [(C + r * Math.cos(t)).toFixed(2), (C + r * Math.sin(t)).toFixed(2)]; };
    const wedges = set.map((it, i) => {
      const a0 = i * 60 + 2, a1 = a0 + 56, mid = (a0 + a1) / 2;
      const [x0, y0] = pt(r2, a0), [x1, y1] = pt(r2, a1), [x2, y2] = pt(r1, a1), [x3, y3] = pt(r1, a0);
      const [lx, ly] = pt((r1 + r2) / 2 + 4, mid);
      const on = this.state.sel === i;
      return {
        label: it.label, sub: it.sub, lx, ly, cur: on ? 'true' : 'false', icon: this.icon(it.icon, on ? onAccent : ink),
        d: `M${x0} ${y0} A${r2} ${r2} 0 0 1 ${x1} ${y1} L${x2} ${y2} A${r1} ${r1} 0 0 0 ${x3} ${y3} Z`,
        fill: on ? accent : card, stroke: on ? accent : line, text: on ? onAccent : ink
      };
    });
    const chips = GROUPS.map((k) => {
      const on = this.state.group === k;
      return {
        label: META[k].name, key: META[k].key, pressed: on ? 'true' : 'false',
        bg: on ? ink : 'transparent', fg: on ? paper : ink, bd: on ? ink : line,
        pick: () => { this.stopDemo(); this.setState({ group: k }); }
      };
    });
    const sel = this.state.sel;
    const subs = { actions: 'drag me · ⇧ convert · ⌘ crop', convert: 'drag me to convert', tools: 'drag me to crop or compress', projects: 'drag me to open a project' };
    return {
      ink, paper, card, line, accent, onAccent, font: p.font || 'inherit',
      setRoot: this.setRoot,
      open: this.state.open, openStr: this.state.open ? 'true' : 'false',
      wx: this.state.cx - 190, wy: this.state.cy - 190, wscale: Math.min(1, ((window.innerWidth || 1000) - 16) / 380).toFixed(3),
      ghost: this.state.open && this.state.dragging && !this.state.demo, gx: this.state.px, gy: this.state.py,
      fileOpacity: this.state.open ? 0.35 : 1,
      fileSub: subs[this.state.group],
      pulse: this.state.used ? 'none' : 'ee-pulse 2.2s ease-out infinite',
      wiggle: this.state.used ? 'none' : 'ee-wiggle 4s ease-in-out infinite',
      ring: /^#[0-9a-f]{6}$/i.test(accent) ? accent + '88' : 'rgba(255,106,43,.5)',
      showHint: !this.state.used,
      demo: this.state.demo,
      chips, wedges,
      groupName: META[g].name, groupTag: META[g].tag,
      centerTop: sel >= 0 ? 'Release to ' + set[sel].label.charAt(0).toLowerCase() + set[sel].label.slice(1) : 'Drop on an action',
      centerSub: sel >= 0 ? set[sel].sub : 'centre to cancel',
      hasToast: !!this.state.toast, toast: this.state.toast,
      down: (e) => {
        this.stopDemo();
        this.start = { x: e.clientX, y: e.clientY };
        if (e.pointerType === 'touch') {
          clearTimeout(this.hold);
          this.hold = setTimeout(() => { if (this.start) this.openAt(this.start.x, this.start.y); }, 320);
        }
      },
      key: (e) => {
        const k = e.key;
        this.stopDemo();
        if (!this.state.open) {
          if (k === 'Enter' || k === ' ') {
            e.preventDefault();
            const r = this.root ? this.root.getBoundingClientRect() : { left: 200, top: 200 };
            this.openAt(r.left + 30, r.top + 28);
          }
          return;
        }
        const i = GROUPS.indexOf(this.state.g);
        if (k === 'Escape') { e.preventDefault(); this.close(false); }
        else if (k === 'Tab') { e.preventDefault(); this.setState({ g: GROUPS[(i + (e.shiftKey ? 3 : 1)) % 4], sel: -1 }); }
        else if (k >= '1' && k <= '4') { this.setState({ g: GROUPS[+k - 1], sel: -1 }); }
        else if (k === 'ArrowRight' || k === 'ArrowDown') { e.preventDefault(); this.setState({ sel: (this.state.sel + 1 + 6) % 6 }); }
        else if (k === 'ArrowLeft' || k === 'ArrowUp') { e.preventDefault(); this.setState({ sel: (this.state.sel - 1 + 6) % 6 }); }
        else if (k === 'Enter' || k === ' ') { e.preventDefault(); this.close(true); }
      }
    };
  }
}

  Component.__tpl = (html, $v, C) => html`<div ref=${$v.setRoot} style="display: inline-flex; flex-direction: column; align-items: flex-start; gap: 10px; font-family: ${$v.font}; color: ${$v.ink}">
  <div style="display: inline-flex; align-items: center; gap: 14px; touch-action: none; user-select: none; -webkit-user-select: none">
    <button type="button" aria-label="Ege Erenler CV. Drag it, or press Enter, to download, convert or crop it" aria-haspopup="menu" aria-expanded=${$v.openStr} onPointerDown=${$v.down} onKeyDown=${$v.key} class="ee-anim" style="display: inline-flex; align-items: center; gap: 12px; min-height: 56px; padding: 8px 16px 8px 10px; border: 1px dashed ${$v.line}; border-radius: 14px; background: ${$v.card}; color: ${$v.ink}; cursor: grab; font: inherit; opacity: ${$v.fileOpacity}; --ring: ${$v.ring}; animation: ${$v.pulse}">
      <svg viewBox="0 0 32 40" width="30" height="38" aria-hidden="true" class="ee-anim" style="animation: ${$v.wiggle}; transform-origin: 50% 90%">
        <path d="M3 2h18l8 8v28H3z" fill=${$v.paper} stroke=${$v.ink} stroke-width="2" stroke-linejoin="round"></path>
        <path d="M21 2v8h8" fill="none" stroke=${$v.ink} stroke-width="2" stroke-linejoin="round"></path>
        <rect x="7" y="22" width="18" height="9" rx="2" fill=${$v.accent}></rect>
        <text x="16" y="29" text-anchor="middle" font-size="6.5" font-weight="700" fill=${$v.onAccent} font-family="Arial, sans-serif">CV</text>
      </svg>
      <span style="display: flex; flex-direction: column; align-items: flex-start; text-align: left">
        <span style="font-weight: 700; font-size: 14px">Ege_Erenler_CV.pdf</span>
        <span style="font-size: 12px; opacity: .75">${$v.fileSub}</span>
      </span>
    </button>
    ${($v.showHint) ? html`
      <span aria-hidden="true" class="ee-anim" style="display: inline-flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 700; white-space: nowrap; animation: ee-nudge 1.6s ease-in-out infinite">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M11 6l-6 6 6 6"></path></svg>
        drag it
      </span>
    ` : null}
  </div>
  <div role="group" aria-label="Choose what the wheel does" style="display: flex; flex-wrap: wrap; gap: 6px">
    ${($v.chips || []).map((c) => html`
      <button type="button" class="ee-chip" aria-pressed=${c?.pressed} onClick=${c?.pick} style="background: ${c?.bg}; color: ${c?.fg}; border-color: ${c?.bd}">${c?.label} <span style="opacity: .6; font-weight: 600">${c?.key}</span></button>
    `)}
  </div>

  ${($v.open) ? html`
    <div role="menu" aria-label=${$v.groupName} style="position: fixed; left: ${$v.wx}px; top: ${$v.wy}px; width: 380px; height: 380px; z-index: 50; pointer-events: none; font-family: ${$v.font}">
      <div style="transform: scale(${$v.wscale}); transform-origin: 50% 50%"><div class="ee-anim" style="position: relative; width: 380px; height: 380px; animation: ee-pop .18s cubic-bezier(.2,.9,.3,1.2) both">
        <svg viewBox="0 0 380 380" width="380" height="380" aria-hidden="true" style="position: absolute; inset: 0; overflow: visible; filter: drop-shadow(0 20px 40px rgba(0,0,0,.35))">
          ${($v.wedges || []).map((w) => html`
            <path d=${w?.d} fill=${w?.fill} stroke=${w?.stroke} stroke-width="1.5"></path>
          `)}
          <circle cx="190" cy="190" r="50" fill=${$v.card} stroke=${$v.line} stroke-width="1.5"></circle>
        </svg>
        ${($v.wedges || []).map((w) => html`
          <div role="menuitem" aria-current=${w?.cur} style="position: absolute; left: ${w?.lx}px; top: ${w?.ly}px; width: 104px; transform: translate(-50%, -50%); display: flex; flex-direction: column; align-items: center; gap: 3px; text-align: center; color: ${w?.text}">
            <img src=${w?.icon} alt="" width="22" height="22" style="display: block" />
            <span style="font-size: 12px; font-weight: 700; line-height: 1.15">${w?.label}</span>
            <span style="font-size: 10px; line-height: 1.1; opacity: .7">${w?.sub}</span>
          </div>
        `)}
        <div style="position: absolute; left: 190px; top: 190px; width: 92px; transform: translate(-50%, -50%); display: flex; flex-direction: column; align-items: center; gap: 2px; text-align: center; color: ${$v.ink}">
          <span style="font-size: 8.5px; font-weight: 700; letter-spacing: .1em; color: ${$v.accent}">${$v.groupTag}</span>
          <span style="font-size: 11px; font-weight: 700; line-height: 1.15">${$v.centerTop}</span>
        </div>
      </div>
    </div>
    </div>
  ` : null}

  ${($v.demo) ? html`
    <div aria-hidden="true" style="position: fixed; left: ${$v.gx}px; top: ${$v.gy}px; z-index: 52; pointer-events: none; transition: left .25s ease, top .25s ease">
      <svg viewBox="0 0 24 24" width="26" height="26"><path d="M4 2l16 9-7 2-3 7z" fill=${$v.ink} stroke=${$v.paper} stroke-width="1.5" stroke-linejoin="round"></path></svg>
    </div>
  ` : null}
  ${($v.ghost) ? html`
    <div aria-hidden="true" style="position: fixed; left: ${$v.gx}px; top: ${$v.gy}px; z-index: 51; pointer-events: none; transform: translate(-50%, -50%) rotate(-6deg)">
      <svg viewBox="0 0 32 40" width="34" height="42">
        <path d="M3 2h18l8 8v28H3z" fill=${$v.paper} stroke=${$v.ink} stroke-width="2" stroke-linejoin="round"></path>
        <rect x="7" y="22" width="18" height="9" rx="2" fill=${$v.accent}></rect>
      </svg>
    </div>
  ` : null}

  ${($v.hasToast) ? html`
    <div role="status" class="ee-anim" style="position: fixed; left: 50%; bottom: 28px; z-index: 60; padding: 12px 18px; border-radius: 12px; background: ${$v.ink}; color: ${$v.paper}; font-size: 14px; font-weight: 600; animation: ee-toast .2s both; transform: translateX(-50%); max-width: calc(100vw - 32px)">${$v.toast}</div>
  ` : null}
</div>`;
  Component.defaultProps = {"ink":"#121212","paper":"#FFFFFF","card":"#FFFFFF","line":"#BDBBB5","accent":"#FF6A2B","onAccent":"#121212","font":"inherit"};
  const off = Component.prototype.componentWillUnmount;
  Component.prototype.componentWillUnmount = function () { this.__alive = false; if (off) off.call(this); };
  return Component;
})();

C.WorldMap = (() => {
  const DCLogic = DCBase;

// Coastlines from Natural Earth (public domain), simplified, with extra detail around the UK.
const LAND = [[7159,-598,29,-119,36,5,40,-35,7,-73,25,-26,23,-103,119,-65,47,-108,19,14,30,-13,8,-52,50,-33,66,-92,23,-136,-34,-138,-82,-107,-55,-113,-13,-84,-23,-13,-80,-8,-83,-39,9,-21,-50,30,4,15,-38,-5,20,12,-11,10,-68,-46,-106,23,-82,56,-3,43,-37,40,15,10,-55,-12,16,30,-21,43,-19,-49,-41,-5,25,16,28,67,-8,50,-27,-52,-80,-66,-26,18,16,0,-11,31,-46,40,-3,31,-155,52,-261,-40,-84,-36,-52,-48,-167,0,-86,-50,-81,0,-76,36,0,37,18,-6,16,22,1,75,-42,128,-78,145,27,-13,-20,45,39,-34,-40,92,27,125,9,-27,128,91,215,53,67,74,0,53,32,31,29,-54,16,30,-14,35,59,-9,-19,5,2,40,31,3,-11,14,26,2,-9,20,22,23,20,-12,2,26,25,-9,17,21,28,-15,36,-34,-6,-31,26,28,53,-18,10,16,-23,21,62,98,34,19,71,-3,-2,24,-36,23,153,-51,45,19,-11,-20,19,-10,23,23,20,-19,-24,-44,-27,-4,-23,-81,237,-139,32,14,29,68,3,113,34,143,22,10,29,-61],[8914,-869,19,-35,-51,-5,-19,11,7,16,44,13],[8210,-1012,137,-93,-21,-7,-80,48,-36,52],[6387,42,48,34,-22,-39,32,-26,-51,4,27,-60,-36,33,-14,69,31,53,-15,-68],[3459,-2455,65,1,-5,-18,-32,0,24,-9,-70,-4,1,43,11,9,6,-22],[-1272,3546,-39,-23,-89,0,19,23,109,0],[5866,422,111,133,7,-30,-118,-103],[6125,581,31,-17,-53,-38,-7,67,29,-12],[6157,453,-36,32,27,57,30,-3,-21,-86],[6262,626,25,-72,-15,2,-57,72,47,-2],[6035,674,42,-20,-19,-42,-41,59,18,3],[6927,-414,-45,-5,33,47,33,-7,-21,-35],[6488,-143,41,-14,11,-36,-48,27,-55,1,-30,7,-12,-17,15,32,78,0],[6139,-431,-144,-12,-1,22,37,9,85,-19,30,26,-7,-26],[6001,-469,41,-33,-20,-13,-22,13,-52,26,53,7],[5912,-416,34,1,9,-21,-86,-16,-30,2,3,23,56,-9,14,6,-24,23,24,-9],[5302,-83,16,-40,23,-6,-8,-25,-33,13,-10,26,-33,16,22,23,23,-7],[1080,3930,165,-42,-122,-21,-77,6,37,23,-72,28,69,6],[2514,4046,71,-12,-180,-28,-73,9,182,31],[2513,3459,-67,-22,-30,10,26,28,71,-16],[3023,3497,-32,-12,-57,18,-10,10,26,10,73,-26],[1193,1777,121,-12,-6,-14,-68,-4,-60,16,13,14],[1723,1780,-26,-15,6,-16,-68,-17,-20,22,108,26],[628,2789,-35,-50,-39,42,57,25,17,-17],[532,2781,9,-15,-2,-3,1,-3,-1,-3,-8,-4,-9,-1,-23,6,-1,2,-5,8,0,8,21,5,11,-3,7,3],[-6028,-3688,14,-11,-39,-18,-91,10,13,9,-36,6,11,8,128,-4],[-6317,-3664,54,-19,-27,-7,63,3,35,-21,-169,22,-2,21,46,1],[-4905,-3596,38,-13,61,14,-34,-18,60,10,1,-17,-72,-9,-262,22,208,11],[-3718,-3655,-11,-26,-72,27,37,1,-23,9,18,3,51,-14],[-9000,3577,82,-1,43,-15,-28,-9,17843,-11,-6,14,60,21,-17994,1],[-2943,-2564,47,-6,-15,-21,-66,-21,34,48],[-3689,-2167,-30,5,16,71,16,-3,15,-53,-17,-20],[-3724,-2457,-4,-43,-8,29,-17,-22,-24,3,4,22,33,33,16,-22],[-3055,2297,18,-9,22,28,23,-9,-18,-20,-54,-8,-11,18,55,53,-5,-36,-30,-17],[-8573,3182,137,-16,-43,-16,-103,18,-5,17,14,-3],[-3863,923,52,-27,-47,-4,-59,22,54,9],[-3307,922,25,-3,-10,-16,-47,-4,-21,1,2,25,51,-3],[-7645,2891,28,-17,-30,1,13,-8,-65,-28,9,11,-29,5,-8,23,43,-13,-8,28,47,-2],[-6678,2817,69,-43,-23,0,33,-14,0,-20,-24,7,-61,42,22,7,-25,2,9,19],[-6787,2912,39,-11,-19,-13,20,-14,-14,5,-35,-7,-32,27,41,13],[-6633,2706,25,-8,-19,-15,44,24,-11,-21,-7,-23,-33,0,13,4,-34,33,22,6],[7596,-215,24,-2,-16,-56,-80,-40,-107,30,75,7,13,25,4,-25,28,0,47,32,-4,34,16,-5],[6365,-421,-144,-86,-39,-1,3,27,74,49,106,11],[7252,-2039,64,-19,95,15,6,-68,-9,10,-9,-57,-14,2,-20,16,-21,-41,-42,4,8,11,-36,20,-14,34,16,-6,-38,48,-2,36,16,-5],[4826,4054,67,-16,-37,-7,15,-15,-12,-4,-277,1,81,27,-33,-1,23,10,173,5],[4884,4008,17,-7,-18,-13,47,15,73,-14,-51,-24,44,-17,-55,-7,-288,34,96,30,135,3],[5144,3963,-23,-21,69,15,76,-32,-302,-23,116,65,64,-4],[7003,3791,38,-9,33,25,189,-28,-62,-27,-60,11,6,23,-43,-3,52,-35,-17,-5,-239,-2,-52,23,33,35,65,11,57,-19],[7109,3695,64,-33,-153,10,89,23],[7340,3769,201,-11,-12,-12,-114,-6,-108,20,15,18,18,-9],[8663,-1747,53,-15,20,-80,41,-18,-4,36,32,-58,59,-18,36,22,27,-7,-32,-77,-44,-1,-9,-45,-58,-63,-52,5,31,52,-74,45,41,30,16,49,-17,35,17,1,-75,77,10,11,-25,6,-21,37,28,-24],[8656,-2064,62,9,-7,-38,-85,-80,27,-21,-51,9,-40,-28,-23,-81,-55,-34,-72,9,-87,21,25,12,-13,9,21,6,-7,15,67,52,133,60,72,113,24,5,-12,-7,21,-31],[6300,466,29,-104,-19,-47,-26,48,-11,-80,-11,20,-51,9,-1,58,-36,18,-5,-18,-38,18,-30,-42,16,55,55,34,21,-13,-5,-19,20,7,35,39,32,2,-1,37,26,-22],[6055,931,58,-8,-5,-40,18,-27,-56,-90,18,-58,23,-11,20,19,24,-29,11,16,25,-11,-14,-10,30,-42,-20,5,-60,51,3,-36,-41,37,-57,-7,15,42,-18,12,-7,-21,-18,20,-15,70,29,-8,12,120,25,6],[6674,-36,32,-6,4,-73,42,-52,22,0,45,53,77,40,371,-145,20,-51,103,-46,1,-19,-44,-9,82,-109,31,1,3,-23,38,-9,-7,-17,49,-11,-27,-21,-128,30,-86,99,-119,31,6,-28,-79,-9,59,-28,-37,-28,-75,5,-57,51,6,14,-61,-16,9,33,-17,16,22,4,-29,12,13,4,-26,59,-53,37,-165,56,-7,38,-46,-50,-8,38,-39,26,86,8,11,26,-81,-7,-19,34,-46,9,13,26,57,25,54,-18],[6245,50,-57,-35,-173,5,-13,-42,31,-47,46,28,93,2,-104,-55,47,-51,-2,-36,31,-39,-62,-19,-1,34,-35,27,4,44,-37,-13,9,-133,-36,-5,-18,19,7,88,-34,20,72,207,41,17,138,-24,57,43,13,-10,-17,-25],[5369,-300,48,-14,17,-26,87,-7,21,26,85,-25,24,-37,70,-7,9,-46,-16,5,-391,63,3,15,-62,17,40,40,65,-4],[4825,261,52,-1,149,-151,18,-12,8,16,95,-80,-20,-22,47,13,15,-22,-17,-31,47,-25,23,-51,-9,-25,37,11,25,-25,-8,-147,-55,15,-2,-19,-103,87,-169,226,-28,75,-45,25,-37,61,-73,59,-11,42,61,-19],[5840,335,21,12,24,-30,-10,-23,25,9,-1,-18,64,-17,-50,-19,14,-30,-52,-12,14,-23,-36,-3,50,-65,-14,-15,60,-52,-53,6,-18,-94,-41,-13,-23,-37,14,-26,-15,-41,-50,-39,-30,-13,-16,46,-32,-11,-33,26,-57,-31,-10,34,-72,-4,-14,84,-36,24,-17,86,36,55,79,-31,15,67,73,21,52,71,70,19,0,23,69,64],[3388,3812,-320,-46,-141,-41,4,-14,-99,-46,-117,3,-27,20,83,34,36,3,-28,6,46,17,-29,10,264,56,163,5,160,32,64,-16,-59,-23],[2766,3665,55,-5,-51,-33,-5,-30,116,-61,-200,12,27,8,-37,21,-80,-2,-19,22,59,18,15,18,-18,5,40,8,0,15,98,4],[7138,2720,28,-72,-7,-51,76,-156,-44,24,-40,-10,-23,-68,46,-49,-2,-37,-8,27,-35,7,-25,-39,-13,27,19,238,-27,53,8,53,35,5,9,23,-18,19,21,6],[7191,2206,45,-10,33,20,-12,-33,10,-18,25,4,-93,-25,-37,-44,-69,29,-69,-1,-8,-13,38,-27,-50,-16,-13,50,29,43,49,-1,14,106,108,-64],[7061,2069,38,-98,-51,-64,-19,-95,15,-26,-26,-27,-28,-11,15,31,-13,4,-47,-52,-9,25,-27,-26,-56,-1,11,10,-24,14,-13,-19,16,-18,-58,-42,-29,26,15,31,-73,-5,-82,-10,-9,-24,-61,7,2,18,98,59,144,1,52,92,24,7,-21,-20,17,-18,54,23,74,83,8,90,21,27,37,-17,6,16,-22,3,21,6],[6718,1713,19,-22,-28,-29,-27,14,-42,-38,-14,25,-24,4,45,38,71,8],[6559,1680,26,0,-8,-16,23,-18,-33,-76,-33,-19,6,33,-11,-25,-19,6,0,33,22,33,-20,28,5,-24,-29,-6,-4,24,16,-10,-19,24,55,29,23,-16],[6050,1131,-13,-33,-33,60,38,78,34,28,20,-15,-46,-118],[5545,1000,6,-17,-50,-62,-25,-10,-42,26,-1,28,30,29,82,6],[3999,491,37,-23,58,-104,-12,-43,-46,-22,-31,9,-12,34,-7,67,18,70,17,-5,-22,17],[2477,-622,47,-147,-14,-29,-27,22,9,-48,-24,-93,-109,-322,-84,-39,-73,28,-39,136,33,71,27,65,-26,99,25,67,98,16,4,20,31,4,13,34,6,-12,24,16,-1,51,43,20,0,41,20,18,17,-18],[-7953,-3990,-258,24,5,16,75,13,178,-53],[-3517,-3984,-67,6,11,22,199,38,35,-3,-178,-63],[-2261,-3941,80,-1,33,-32,-15,-25,-423,0,69,25,-20,10,18,25,65,37,113,13,111,-13,37,-24,-68,-15],[-2987,-4000,-319,0,277,13,42,-13],[-3503,-3459,87,-87,4,-45,-48,-36,-158,-7,-25,19,133,4,-85,3,54,13,-76,13,-91,-26,-60,14,13,16,144,11,-25,13,142,-2,-65,23,78,13,-105,17,-1,32,-20,12,86,20,18,-20],[-3458,-2633,27,0,19,-21,-12,-9,59,-39,102,-37,-262,-2,-70,11,49,12,30,-8,-27,20,16,25,15,-36,60,-4,-56,27,38,25,-53,9,16,13,-12,9,61,5],[-4092,1158,101,-14,128,-70,77,-18,0,-20,78,-21,-48,-20,-89,1,-41,-3,31,32,-51,13,-30,42,-155,30,-13,9,12,15,-152,-41,42,40,110,25],[1045,4012,69,-10,36,22,16,-3,-10,-12,201,-6,-75,-33,-137,-8,-229,31,27,9,-47,5,71,-1,-8,11,29,-6,-7,12,64,-11],[839,3995,53,-5,-9,-21,37,11,14,-17,135,-26,-111,-18,-123,-90,-135,46,146,20,-162,6,166,17,-15,13,-101,5,-2,-15,-75,-9,-89,36,52,0,-21,17,-39,-9,-26,32,151,5,-57,-14,70,-12,32,23,87,-41,-26,36,48,10],[482,2044,-4,-86,-46,-12,-5,46,-16,54,50,17,21,-19],[474,2140,-15,-71,-24,33,1,26,38,12],[779,1911,-23,-77,-118,44,-16,13,15,18,142,2],[-2637,3497,35,-7,-4,-16,-82,-11,-21,7,18,7,-52,6,27,14,-19,16,98,-16],[-6360,2532,86,-16,105,-83,-10,-17,-27,6,-50,16,15,23,-33,-14,-34,24,-20,6,21,7,-86,22,20,23,-45,6,58,-3],[-3598,986,100,-2,36,-20,-19,-8,64,-25,-17,-20,-55,11,-66,-18,-17,-22,-31,29,-91,-9,-29,18,104,9,-16,43,-37,14,74,0],[-2481,-11,62,-7,-23,-51,-28,-9,-55,-11,-13,27,6,48,51,3],[-155,2926,-1,-6,-5,-4,-39,-18,-2,-5,9,-2,-11,-7,-3,-5,14,1,23,5,18,-1,48,1,6,-1,5,-3,4,-7,-12,-11,-3,-8,-9,-12,-17,-15,-9,-4,-13,-2,-14,-4,22,2,11,-4,-1,-3,-4,-3,-11,0,-10,-6,-9,-3,-21,4,9,-4,28,-3,10,3,12,0,23,-6,24,-16,12,-28,9,-16,28,-10,16,-11,14,-8,-6,-5,16,-21,-10,2,-10,5,-19,-1,18,-1,21,-12,8,-6,4,-9,-3,-4,-13,-9,12,-5,5,1,9,7,25,0,11,-2,19,-8,3,-4,1,-11,-7,-17,-9,-6,-5,-2,-4,1,2,-7,-9,-3,-7,1,-10,-3,7,-2,1,-3,-1,-3,-24,-6,5,1,4,-1,4,-4,11,-1,26,0,-1,-9,-18,-7,-4,-6,-9,1,-24,-8,-25,2,-29,-3,-32,7,4,-4,-9,-4,-26,-1,4,-5,-4,-1,-15,2,-5,-2,-17,5,-11,1,-20,-4,-4,-5,-5,-11,-5,-4,-6,-1,-20,9,-26,-5,-14,-7,-6,-6,-5,-1,-5,3,-6,1,-9,-2,-2,4,4,3,12,2,17,13,5,2,16,12,3,10,11,2,6,8,17,3,35,-2,5,2,8,8,22,17,-15,-8,-12,-2,-16,-8,-13,2,-16,9,-18,-2,7,5,-9,1,-5,3,-8,0,-18,-6,-11,4,-2,2,-2,6,-3,1,9,6,35,10,12,6,8,11,-3,1,-2,2,2,5,-4,6,1,5,-13,-1,-16,-5,2,5,12,6,7,6,22,8,9,0,11,2,5,0,11,-4,-3,7,5,1,7,-6,9,0,-9,2,-7,9,0,3,7,8,-6,2,1,6,6,3,3,9,-1,2,-15,-3,-8,5,-12,12,-2,5,7,11,10,6,11,3,-26,-1,-20,-8,-9,0,-6,3,-13,-4,-15,4,-4,-3,-1,-5,-11,9,-2,6,3,2,3,-2,5,8,14,18,-2,5,-9,5,1,9,4,3,11,0,-13,6,2,5,-6,-7,-9,-2,-1,-2,-4,-1,-1,-2,-1,6,1,3,11,9,-4,-2,-16,-10,1,-9,-9,-22,-3,-2,-5,0,-2,3,4,11,9,9,-6,1,0,12,11,23,4,2,0,3,7,7,-24,-11,-10,1,-4,2,-2,4,-8,2,5,2,8,1,8,4,-7,2,6,3,7,7,2,7,-5,5,-7,2,-1,3,3,3,9,2,-5,2,-3,4,7,11,13,0,2,1,7,-1,-13,9,3,4,1,5,17,1,-4,6,1,7,2,2,11,1,4,-4,11,3,3,-2,59,6,10,0,-2,-6],[-359,2753,4,-1,4,2,4,5,23,3,18,-1,4,-4,3,-5,6,-6,7,-5,0,-3,-8,-4,0,-2,7,2,8,-1,5,-8,0,-3,-4,4,-6,1,1,-8,5,0,-2,-5,-11,-2,-6,-8,-4,-1,-10,1,3,-3,-9,-2,1,-5,3,-2,6,-13,1,-9,-2,-2,6,-13,1,-9,-7,-9,-3,-10,-6,-7,-6,-3,7,-5,-12,-3,-11,2,-5,-3,-4,4,-2,-4,-26,-3,-5,-5,-11,-3,-11,-6,-4,0,-7,4,-6,-1,3,-2,-1,-5,-11,-4,-8,-1,-4,-3,-24,-4,-8,1,-14,-2,-5,0,6,6,10,4,-30,-4,2,3,16,8,8,3,-24,-5,-8,2,-5,-1,-2,3,7,6,15,5,2,2,-25,1,2,3,7,4,8,0,6,-2,8,1,-3,2,-1,4,-2,1,13,7,43,7,-11,4,-9,-6,-11,-1,-8,2,-10,-4,-8,0,20,10,6,6,-3,2,8,8,14,3,5,2,-11,3,-19,-1,-5,5,-10,-1,-3,1,4,3,-15,1,2,3,-3,3,20,3,-9,3,0,3,16,4,0,4,-8,1,-9,-2,3,7,0,5,-4,-1,-2,5,-6,-1,2,5,25,2,12,0,9,-5,7,4,23,-2,-4,5,7,5,12,3,5,7,-16,-1,-15,3,2,3,9,2,8,5,-2,4,1,3,4,2,2,4,14,3,13,-1,-1,3,5,1,5,-4,0,-3,-4,-3,2,-2,-3,-2,9,3,-3,8,1,2,11,3,-3,3,3,0,17,-6,-11,-5,-2,-2,2,-2],[-9000,3449,20,-4,6,1,10,-5,20,-3,17,-9,-11,4,3,-6,30,-6,4,-5,-2,-3,13,4,-24,9,-5,2,6,-1,37,-12,-6,-3,3,-1,9,1,5,-1,98,-27,5,-8,0,-4,-7,-4,11,0,8,4,8,-5,-1,-4,-4,-3,0,-5,3,-5,5,-4,0,-7,-4,-3,-3,-5,12,-1,9,-3,5,-10,10,6,6,1,3,-5,-2,-8,8,5,6,6,-7,4,-9,1,-5,2,-2,3,9,2,3,5,-4,8,-13,5,-9,0,-1,3,33,0,10,2,26,-4,-8,-5,-1,-3,0,-2,4,-1,4,1,-2,5,1,2,12,-3,16,-1,6,2,-24,4,0,1,60,-6,22,-13,22,-8,20,-9,2,-1,-6,-4,15,3,5,-5,-2,-1,23,-2,3,-4,-5,-3,-9,2,-8,-2,-19,-7,-1,-2,0,-8,-5,-2,-23,4,-15,6,-1,-1,2,-2,13,-7,4,-3,-2,-2,-18,1,-22,-2,-3,2,-16,2,-8,5,-17,0,11,-3,10,-6,-3,-3,9,1,1,-2,-5,-7,-17,-2,19,-2,3,-4,0,-4,-19,-7,-20,-1,-3,-2,-1,-1,4,1,10,-2,-6,-5,1,-4,21,-4,5,-5,-18,-1,-3,4,-5,1,-2,-1,1,-7,-4,-3,-8,-1,-6,1,-5,3,0,2,4,2,-1,5,-14,-9,-6,0,-14,4,-16,10,-13,4,-23,5,-11,-1,-9,1,-21,10,1,4,-1,7,-3,6,-9,6,-48,7,-21,-6,-47,0,-4,2,-1,3,1,7,-15,6,-4,4,-3,5,10,-1,2,5,6,4,3,10,-17,-11,-12,3,0,5,-2,2,-3,-3,-7,-2,1,-6,-15,-2,-3,3,-5,-8,-1,-6,4,-5,18,-8,0,-6,-17,-17,-15,-6,17991,-1,-19,-11,-14,-2,-23,-7,-9,-2,-12,4,-27,2,-8,3,-20,12,-15,3,-13,-2,-10,2,-4,-2,35,-2,9,-7,-8,-4,-11,3,-21,1,-18,5,-14,-6,-19,-3,-15,0,-28,-5,57,5,19,6,9,-3,5,-7,-10,-6,18,5,12,-3,5,1,11,4,16,3,4,-2,-2,-8,1,-7,12,-7,18,-4,5,1,4,6,8,-5,5,-7,-1,-5,9,-3,3,-6,2,-9,-15,-3,1,-1,10,-1,2,-2,-1,-6,3,0,2,2,1,5,6,-7,0,-3,5,-3,16,-5,2,-2,1,-3,-7,-4,6,-6,7,-1,3,-4,0,-5,-5,-3,-15,-8,-3,-7,-55,11,-36,3,3,7,-1,2,-4,-1,-8,2,-4,-1,-3,-6,11,-3,-1,-2,-23,-3,-19,-8,-53,-12,-3,-3,-20,-5,-4,0,-10,-6,-19,-1,-16,-6,-10,2,-24,-16,-14,3,-3,-1,5,-6,-8,0,-3,-1,1,-3,-6,-2,-9,-2,-2,-2,2,-3,-24,-10,-9,-1,-40,-16,-17,-4,-1,-5,-11,-19,-10,1,-9,4,-4,4,-1,4,-13,11,-20,8,-27,-2,-11,2,-16,-1,-46,-9,-13,-5,-25,-18,-9,-4,-5,-1,-2,7,11,25,-9,0,-12,-6,-26,-8,-7,-3,-10,-2,0,-8,-3,-4,-3,-1,-5,0,-4,2,-5,6,-12,4,-16,-9,1,4,-18,3,-14,-8,-4,-2,-5,-7,-2,-9,0,-11,-10,-8,-3,0,-4,-1,3,-5,-2,-2,-25,-14,-16,-13,-9,-18,4,-8,8,-5,11,-2,-1,-3,3,2,3,7,7,2,24,-5,4,-2,-2,-8,-20,-14,-1,-6,2,-7,0,-14,6,-5,6,1,11,-3,-1,-6,3,-6,2,-10,-15,-10,-10,1,-11,9,5,5,13,5,3,4,-8,-2,-10,1,-10,-5,2,-7,-22,-9,-15,-21,-3,-8,0,-7,3,-8,15,-16,1,-6,-19,-11,-5,-1,-16,0,-9,4,-17,-3,-35,-18,-8,-9,-4,-11,2,-5,4,-6,-3,-6,0,-3,5,-5,1,-8,-4,0,-8,5,-10,1,-31,-10,-11,-7,-9,7,-4,0,-2,-4,6,-2,2,-2,-6,-13,1,-12,-8,-14,-12,-15,-14,-10,-14,-6,-3,-4,-14,-9,-23,-13,-3,13,-7,5,-1,3,-2,27,-6,29,-7,6,-5,12,-8,44,-13,39,-7,34,0,7,8,37,13,31,4,4,33,19,6,7,7,8,-2,8,-7,6,4,3,5,2,12,-3,11,1,11,11,16,-2,11,2,4,-1,2,4,7,4,37,18,20,14,12,16,26,14,9,7,16,4,18,11,11,9,16,7,15,15,33,10,13,6,19,1,17,6,-7,5,3,5,14,6,5,5,-1,4,-9,2,4,9,7,4,2,8,1,8,6,13,20,9,26,-3,4,-2,1,3,10,0,-1,3,-18,1,-12,3,-12,5,-7,1,-54,-7,-5,-5,3,-4,-7,-6,-2,-5,1,-5,-6,-8,-1,-5,13,-5,-9,-7,-4,-1,-4,3,-3,5,-5,1,-3,-3,-15,0,-68,-35,-14,-10,-14,-1,-15,-5,2,10,8,9,-10,1,-9,-2,-6,-3,-5,1,8,8,-3,9,14,12,4,5,4,8,-1,5,-6,0,-31,-9,-13,10,-6,0,-32,-5,-10,0,-14,-3,-13,2,-16,0,-20,-6,-20,-10,-3,-10,-28,-14,-10,-11,-7,-5,-37,-15,-20,-14,-7,-11,-7,-2,-1,-9,-7,-7,7,-2,15,3,20,-4,9,-5,0,-9,-17,0,-6,-2,-12,4,-11,-6,-11,-1,-16,7,-17,0,-4,-6,-10,-1,-10,-7,-3,-1,-12,2,-9,3,-4,0,-8,-1,-4,-4,-19,-3,-19,1,-10,10,19,4,25,0,13,3,-5,3,-11,0,-7,2,-16,10,-7,2,-15,1,-11,-6,-10,2,-7,0,9,3,-51,11,-11,-1,-18,-6,7,-8,-14,0,-6,3,-5,-5,2,-3,7,1,4,-2,-2,-4,-10,-1,-11,0,-12,8,-19,-2,-10,-4,-8,-2,-24,5,-12,1,-13,4,-5,-1,-8,-11,-12,-2,-5,1,-9,9,-10,2,-54,-2,-30,2,-18,-4,-16,2,-31,-7,-13,-4,-15,-8,-13,-13,-8,-5,-13,-6,-18,-5,-9,-6,-6,-4,-12,-20,-22,-7,-10,-8,-9,-3,-9,-6,-13,-4,-11,-9,-15,-6,-22,-17,-7,-9,-19,-15,-6,-1,-10,-7,-29,-14,-17,-6,-14,-11,-21,-10,-11,-2,-14,-9,-2,-5,2,-5,30,-8,47,2,1,-8,-2,-5,-5,-21,2,-7,4,-1,4,3,7,0,7,-1,5,10,-8,5,2,3,12,5,14,0,-7,-6,-9,-3,14,-6,11,-2,-3,-2,-7,-2,-6,-8,-15,-6,2,-2,24,1,11,2,15,6,6,9,7,3,2,-1,1,-6,-14,-11,-2,-4,10,1,10,10,2,7,1,17,-3,4,2,1,31,-6,19,4,5,-1,19,-10,3,-3,5,-9,17,-11,16,-5,1,-2,10,-6,8,-2,1,-6,-4,-4,-7,-4,-17,3,12,-9,9,-3,-1,-15,-5,-5,2,-4,15,-9,-5,-6,-1,-7,-5,-3,-6,-7,-10,-5,-5,-10,-8,-9,-1,-9,-7,-13,-2,-13,3,-20,4,-3,-8,-8,0,-5,3,-3,0,-8,-4,-13,-6,-11,-1,-3,4,-5,-8,-9,-3,-13,-2,-5,-37,-27,-19,-25,-21,-16,-9,-16,-3,-10,-6,-4,-6,-10,-21,-22,-13,-9,-14,-12,-17,-11,-17,-18,-10,-8,-6,-9,-13,-5,-17,-20,-3,-7,-11,-8,-6,-8,-57,-29,-14,-6,-7,0,-21,-6,-5,1,-3,4,-7,0,-8,4,-6,0,-5,1,-9,-1,2,18,-1,4,-15,-10,-4,-1,-4,0,2,4,6,5,-4,1,-7,-2,-14,-13,-6,-9,-5,-2,-7,-8,-20,3,-3,-1,7,-7,-6,-10,-4,-2,-9,1,-11,-6,-3,-4,-9,-5,-6,-10,-6,-4,-4,-6,0,-5,4,-5,0,-5,-2,-9,1,-9,-2,-4,-18,-7,-5,-3,-7,-8,-20,-9,-9,-9,-11,-5,-17,-2,-5,-5,-15,-6,-2,-4,1,-12,-1,-4,-3,1,-2,-1,-2,-4,1,-5,19,-6,10,-9,17,-11,15,-25,22,-25,14,-20,4,-11,3,-16,-2,-5,0,-8,-2,-8,0,-13,3,-3,6,3,-1,-6,-7,-22,-10,-16,-12,-4,-23,0,-5,-4,1,-8,-17,4,-3,4,-8,-3,-8,0,-4,-4,5,-5,-1,-3,-4,-2,-6,8,-6,-1,-1,-4,5,-6,-8,-8,-7,4,4,6,-1,5,-11,-8,-6,-8,-4,1,-3,3,-7,-6,-2,-4,-2,0,-3,9,-7,5,-4,4,2,2,11,-1,-2,3,6,3,-9,0,-6,17,3,3,7,14,6,4,-7,1,0,2,12,6,2,6,-6,2,3,5,-8,7,0,16,-3,11,-5,-2,-10,2,-1,4,3,5,13,6,5,1,5,-3,5,-1,5,-6,0,2,5,4,-5,2,-7,11,3,5,-7,7,0,6,-5,8,4,3,-13,5,-9,-3,-4,-4,-4,6,-5,1,-9,5,-3,-1,-6,-7,-7,-4,-4,-1,-2,6,-17,5,13,6,-2,1,-10,0,-5,2,-6,-1,-4,1,9,6,0,5,5,7,4,4,12,5,13,1,-7,3,-6,0,-7,3,0,4,12,20,-2,12,-13,4,-16,8,-2,-1,0,-4,-5,-2,-4,8,-11,6,2,5,-1,1,-5,-5,-8,-4,-17,-1,-5,3,-4,-5,-12,-1,-6,-4,-9,0,-4,-3,-6,-1,-25,-12,-18,-15,-6,-3,-9,0,-2,-2,1,-3,0,-2,-17,-3,-8,-3,-3,9,29,9,-3,6,10,8,-27,0,1,4,-2,4,7,4,6,1,-2,6,2,4,14,6,20,20,3,7,1,2,-5,3,-2,4,-14,8,-1,7,-6,-7,-27,3,-20,-16,-15,-17,-44,-17,-11,-7,-6,-10,-2,-8,-12,-11,-18,0,-16,-6,-8,7,-5,1,-9,-1,-4,-3,-8,-14,-3,-8,5,-14,5,-5,13,-7,26,-4,13,1,7,-4,4,-7,1,-6,2,-4,-4,-3,-2,-15,8,-7,8,-3,9,-1,15,2,6,5,0,5,14,7,8,6,-3,3,25,8,14,-6,9,-6,8,-1,13,-6,16,-1,5,4,2,0,3,-3,9,-3,13,1,3,-1,-4,-4,0,-7,-7,-6,4,-3,0,-3,-9,-5,-5,0,-4,6,-11,0,-44,-17,-12,1,-1,-2,4,-3,1,-5,-3,-1,-3,2,-3,-2,-2,-4,0,-9,-2,-1,-12,-4,-4,2,0,6,-7,-1,-4,-4,4,-5,5,-2,-11,-6,-4,-6,-6,-5,-7,-3,-10,-11,-5,-3,-3,-9,-7,-5,-3,-9,2,-5,8,1,11,-9,19,-7,15,-8,12,-28,0,-4,6,-8,12,-23,2,-9,-2,-4,0,-5,6,-5,18,-7,3,-2,0,-9,5,-4,13,-6,4,-5,1,-4,0,-6,-9,1,-16,7,-11,-1,-8,2,-9,8,-14,3,-17,-7,-4,1,-3,-2,8,-2,15,6,11,-2,3,-8,14,-5,7,-5,8,-7,15,-8,6,-8,5,-12,-23,-6,-6,-5,-15,-7,-5,-8,-4,-2,-19,1,-12,-7,8,0,7,3,7,-8,13,1,13,7,5,0,9,-4,12,-12,20,-5,-9,-5,-11,-10,-9,-5,10,2,9,5,3,-1,1,-5,-2,-18,-3,-1,-3,5,-4,2,-9,-1,-5,-5,4,-1,7,-5,1,-3,-2,-2,-5,1,6,-4,-2,-5,-5,-2,-2,-4,6,-14,1,-3,-5,1,-8,-5,-4,0,-3,6,-4,-1,-9,-14,-3,-2,-8,0,5,-3,0,-2,-8,-8,-1,-5,-4,-3,2,-5,-1,-3,-11,-13,-5,-3,-7,-11,-3,-10,-6,-5,-4,2,0,3,-3,3,0,5,-5,-6,-7,3,3,-8,4,0,3,-4,5,-10,-9,-5,-12,-9,-7,0,-9,3,6,-7,4,-2,4,1,4,2,6,0,1,-4,-4,-11,-1,-5,4,-10,-1,-2,-9,5,-12,0,-2,-2,2,-3,5,-6,-2,-2,-13,0,-3,-4,2,-6,-3,-4,-13,-4,4,-5,-3,-6,-5,-2,-7,1,-6,-1,-5,2,-6,0,-3,-3,-1,-4,-8,0,2,-4,7,-1,2,-7,-11,-11,-5,0,-4,-4,-2,-5,-8,0,-1,-2,1,-3,-2,-6,-3,-2,-1,6,-2,1,-4,-4,-7,-3,-2,2,-7,1,-2,-9,-7,-5,-5,0,3,-2,1,-2,-2,-3,-6,-2,-1,-9,-2,-3,-7,0,-4,2,-5,-5,-15,-4,-11,3,-4,-2,-3,-5,-6,0,-9,5,-14,-7,-3,-3,-6,0,-2,6,-2,1,-6,-7,1,-5,-11,4,-4,-3,4,-7,-2,-1,-2,-4,-11,4,-5,-1,-2,2,0,1,6,5,-4,1,-6,3,-3,7,-7,6,-2,8,2,5,-5,-1,-4,-2,0,-6,-5,-1,11,-16,0,-10,2,-3,-3,-6,-9,-3,-5,-4,-6,0,-3,6,-4,-4,-1,-9,-1,-2,-3,-1,-5,3,-11,-8,-8,5,1,4,-4,1,2,-9,-5,-3,-18,5,-3,-6,-5,0,-9,-8,-10,-1,-4,-3,-15,2,-1,-5,-11,-2,-11,-8,-5,1,-2,5,-2,-8,-9,-7,-2,-5,1,-4,9,-1,1,-2,-3,-6,10,-8,0,-3,-3,-5,-6,-3,-11,-2,-9,2,-3,3,0,3,5,-1,-1,2,-5,4,-3,5,0,5,-7,10,2,7,-1,4,4,4,1,6,7,2,1,5,-6,0,-3,4,-1,-2,-3,0,-4,8,-4,1,1,-8,-10,-4,-13,-1,3,5,-2,3,-4,1,-12,1,-8,7,-1,6,-6,0,2,-11,-1,-2,-3,-2,-3,4,-3,1,-4,-7,-5,0,-4,-2,-13,-1,-5,-5,-15,-6,-2,-11,-10,-6,-4,3,-10,-2,-10,2,4,-13,-10,-11,1,-6,-3,-6,-18,-14,-5,-1,-4,-2,-8,-18,-1,-14,-4,-9,-4,-3,-1,-5,13,-23,9,-9,9,-5,13,-14,-2,-3,1,-8,-6,2,8,-5,11,-15,19,-15,3,-8,9,-5,9,-8,0,-2,3,-2,6,-4,6,-8,9,1,9,-12,3,-1,1,-5,15,-20,12,-10,6,-19,7,-14,0,-8,11,-35,-1,-5,-2,5,1,-13,1,-7,0,-9,7,-16,1,-18,-5,8,-6,-6,4,-12,-5,1,1,-17,2,-6,-1,-3,-1,6,-1,-1,-2,-8,2,-6,-3,-6,-5,0,-3,-13,-8,-1,-6,-6,-7,-2,-14,-11,-9,-2,-5,-9,-8,-1,-29,-15,-3,4,-6,1,-2,3,-2,5,-3,-13,-2,-1,-4,3,-5,5,-6,-4,7,-1,2,-3,-1,-4,-15,0,13,-5,3,-2,0,-2,-6,-6,0,-5,-3,-2,-8,4,-15,14,18,-20,4,-9,-5,-4,-5,0,-9,6,-14,14,-4,2,16,-20,2,-5,-2,-5,-33,-15,-9,-15,-10,-9,-11,-2,-6,1,6,7,-4,3,1,40,3,11,10,4,-1,5,-3,3,-7,3,-4,4,-7,-1,-3,4,-17,14,-16,2,-3,4,-2,-4,-9,-4,-4,3,-2,2,0,3,7,5,2,7,-3,8,-6,4,-9,-11,-10,0,-3,15,1,12,-6,6,0,6,-3,4,-1,-4,-6,9,-2,7,-8,9,-3,-5,-10,8,-4,7,-2,-3,-9,10,-16,7,-14,-3,-17,3,-7,-3,-3,2,-2,3,5,36,-15,4,-3,2,-3,-2,-15,-2,-11,-6,-2,-6,4,-3,2,-7,-7,-17,2,-17,-1,-9,-7,-12,-2,-10,-9,-14,-5,-18,-2,-11,-10,-16,-2,-9,-4,-3,2,-7,-2,-22,6,-16,-1,-8,7,-2,16,5,6,-2,3,-8,4,-27,7,-8,2,4,4,-4,2,-8,9,-41,4,-11,-5,3,-3,13,-5,1,2,4,0,4,-3,3,-5,-3,0,-6,13,-21,3,-1,5,1,11,-9,11,-7,14,2,10,-2,6,-5,9,-14,15,-12,12,-3,10,-16,22,-17,11,-13,11,-20,2,-10,1,-13,-3,-21,-3,-11,1,-4,4,-8,-1,-29,5,-8,14,-10,7,-16,13,-27,3,-12,0,-3,-5,-3,-3,3,-2,6,-5,4,1,-8,-9,1,-6,-1,-8,-6,-3,-1,-6,11,-32,16,-9,9,-20,10,-12,11,-6,6,-13,5,-6,7,-5,3,3,7,-3,12,-14,18,-9,8,-6,9,4,3,-7,10,-2,8,0,14,-7,19,-6,27,1,10,-2,10,-11,23,-12,16,-9,6,1,11,-3,3,-3,0,-2,3,2,7,-8,-1,-4,2,-5,12,-4,5,-5,0,-2,2,0,6,-3,4,-9,5,-5,10,-6,4,-4,-1,-4,-7,-6,2,-4,16,1,11,4,10,3,16,16,46,-2,-1,-5,-7,-2,3,-1,4,1,9,-3,16,11,15,0,8,3,5,0,18,7,6,-4,3,-5,-3,-3,1,0,8,2,3,-1,8,2,5,-5,1,4,5,-3,5,2,5,0,6,-4,25,-5,7,-3,9,-9,13,0,10,-2,2,-3,-17,-2,4,-1,13,1,9,-5,9,-5,16,1,2,5,-2,-4,5,-4,-1,-2,6,-1,16,-3,6,2,7,-3,22,-7,7,3,12,0,10,4,5,-17,-2,-2,8,-4,3,-3,8,-1,8,1,2,-18,15,4,-5,-4,-5,3,-8,-7,-17,-7,-7,-9,-3,-4,1,-4,4,-2,8,-3,0,3,-10,4,-6,-9,-5,-5,0,-1,-4,-13,-5,-4,-9,-6,-7,-9,-6,-4,2,0,6,3,5,-1,6,0,-3,-8,-11,-12,0,-2,8,0,10,-3,-7,-2,-3,-7,-4,0,8,3,17,-1,6,-2,-9,-4,-3,-7,-9,-7,-5,-4,1,0,5,3,20,4,6,2,11,3,5,1,9,4,8,1,13,-4,13,-3,19,-13,27,3,0,-8,8,-2,19,-2,-5,-3,-2,1,-7,-1,-5,-12,6,-10,17,4,2,7,-7,5,-1,7,4,2,6,-8,5,-4,3,-1,5,-7,4,5,7,-6,-1,-9,7,-8,2,-4,-2,2,-7,0,-2,-3,0,-7,11,5,5,-4,0,2,10,-1,1,-2,-6,-6,-6,-3,1,-1,2,4,6,-7,11,-2,0,1,-13,-6,8,-15,17,-12,19,-3,25,-4,10,-5,17,2,6,-3,-2,-5,10,-9,10,-2,5,0,4,-13,-12,-14,-2,-6,6,-9,19,1,9,-3,16,-2,-3,0,-6,-15,2,7,-5,6,-1,3,-4,1,-6,-7,-4,1,-4,4,-4,-5,-1,-1,-6,9,-20,-2,-5,-11,-11,-7,-11,-3,0,-4,3,0,7,6,7,-12,-7,-2,5,-1,9,4,8,-5,-4,-1,-5,0,-5,-2,-10,-13,-11,-4,26,1,-18,-7,-10,-6,0,-4,3,-3,5,-2,11,-2,-8,-4,0,4,-5,2,-9,-8,0,-2,4,-1,-4,-5,-4,-2,4,0,4,2,13,-2,3,-2,0,-1,3,-4,-14,2,-6,-1,-3,-7,-2,-8,7,-1,-7,-7,1,-3,3,7,22,-10,6,-3,6,1,-6,10,-7,-11,-15,-13,-8,-29,-8,-12,-13,-1,-7,5,-18,2,-2,-11,-14,0,-5,-13,-7,-6,-9,-7,3,4,-4,-2,-3,-3,-1,-32,-10,-4,0,3,3,0,5,-3,1,-2,1,-11,-7,-4,-7,1,-1,9,4,4,-1,0,-2,-11,-6,-22,-19,-5,-8,-29,-33,-22,-11,-23,-24,-11,-7,-19,-9,-12,-9,-4,-8,4,-8,-5,-11,-25,-12,-18,2,-6,-1,-7,-19,-5,-4,-3,-6,-8,0,-2,5,-7,2,-13,-5,-4,-4,-10,-20,-2,-12,6,-30,0,-7,-3,-6,9,-37,-7,12,-5,-6,3,-4,8,-4,3,-4,-6,-33,-4,-12,-8,-11,-6,-13,-5,-20,2,-7,-5,-6,5,1,2,-4,0,-47,-9,-1,-6,1,-8,-1,-3,-2,-3,-4,0,-7,-16,-24,-1,-5,5,-6,13,-3,7,-4,-10,3,-12,0,-28,-8,-11,-10,-4,-19,-3,-7,-15,-10,-9,-2,-3,-3,-11,3,-12,9,-25,29,-4,13,-4,4,-4,11,-4,23,5,-5,2,-14,4,0,-6,19,-6,5,-1,9,-14,29,-10,29,-10,17,-10,13,-6,5,-13,25,-8,26,-5,29,-4,10,-5,9,-6,23,-21,29,-4,11,-4,5,7,0,-8,9,3,4,-5,0,-3,2,-4,9,-6,9,-7,20,-5,37,-5,16,1,5,-8,24,-4,24,-2,3,1,7,5,12,-1,7,-4,-7,-3,-2,-2,5,1,11,8,-1,-10,4,-1,5,2,3,-4,3,-3,13,2,12,10,30,-4,22,-6,3,-4,10,6,5,-6,-1,9,8,16,7,-14,-4,-15,1,3,9,5,5,-9,0,2,9,12,4,-11,2,-6,-2,-14,2,6,-5,-1,-5,-2,-3,-7,-5,-3,-5,7,-2,2,-3,2,-3,0,-6,-12,-19,-31,-15,-19,-6,-7,-1,-8,1,-12,5,-22,17,-15,16,-27,25,-10,10,-1,5,0,4,4,3,3,-1,8,-7,14,6,5,0,3,3,5,0,9,4,9,2,13,19,4,2,-1,4,-3,0,-5,-7,-4,2,-7,-2,-23,-9,-21,4,-21,11,-9,7,-11,19,2,2,16,12,-14,-6,-8,-6,-5,-1,-4,13,-2,-5,-4,4,-4,-1,-5,4,-2,-4,-8,0,-1,5,-4,-2,-3,3,-1,4,-6,4,-3,4,0,9,-6,20,-24,5,-1,3,1,15,-6,8,-2,5,-6,5,-10,0,-4,-4,11,0,5,-3,-11,1,-18,-2,-10,-3,-14,1,-17,-3,-14,-1,-6,-6,-25,8,-5,3,-6,-3,-11,2,-8,-1,-3,-3,0,-4,-16,2,-8,-2,-18,2,-4,0,-13,-6,-6,4,-6,-3,-9,-1,-8,0,-10,3,-6,-5,-38,9,-4,7,-3,1,-6,-6,-19,3,-6,-1,-4,2,-10,0,-8,4,-21,-3,-12,7,-13,2,-17,0,-13,5,-7,-2,-3,3,-20,4,-7,12,0,6,-5,11,-3,21,-6,10,-10,6,-18,4,-12,-3,-9,-5,-14,-3,-12,-11,-6,1,-20,-11,-7,-3,-6,0,-20,10,-8,2,-13,-2,-6,1,-10,7,-2,4,-24,10,-14,9,-5,9,-6,6,-14,5,-9,5,-21,2,-16,14,0,4,-9,15,-2,10,-2,3,-8,5,-1,2,2,7,-10,4,-2,4,1,10,-25,25,-4,14,-5,0,-21,-9,-6,6,-21,10,-1,2,2,1,7,-1,3,2,-1,3,-4,1,-7,0,2,-2,-6,-3,-1,-4,1,-10,-4,-4,-8,-1,-4,-2,-7,-2,-16,5,-8,-1,1,-9,7,-13,-9,2,-12,-11,6,-2,8,1,3,-1,6,-19,8,-11,14,-31,9,-12,2,-5,-2,-4,5,-5,17,-6,-3,-3,11,-13,7,-1,9,-10,13,-7,9,-8,-7,2,-1,-1,1,-8,8,-6,2,-5,-3,-10,-6,1,10,-25,11,-10,5,-17,8,-11,4,-4,2,5,-4,26,6,11,6,18,5,5,8,4,6,-7,8,-6,2,-6,-5,-13,6,-23,-9,-20,-8,-3,4,-2,4,1,0,-2,-6,-10,12,-3,3,3,3,-4,5,0,2,-9,2,-3,14,-2,26,9,58,-4,17,5,13,5,7,13,10,13,18,12,21,23,21,15,11,20,7,2,4,6,2,0,0,-13,-2,-15,-4,-7,3,-4,1,-28,5,-15,8,-13,14,-15,15,-12,19,-6,26,-4,10,-5,13,1,10,-6,13,-19,8,-8,12,-16,5,-4,14,-4,0,-10,-8,-17,-7,-9,-8,-14,-15,-11,-8,-8,-21,-36,-7,-1,-6,2,1,9,-3,-1,-4,0,-12,-17,-7,-28,5,-33,-7,-3,-25,-3,-18,-7,-8,-9,-5,-21,-9,-9,-5,-1,-33,-4,-7,-2,-11,-13,-1,-4,3,-6,-1,-3,-11,-14,-14,-4,-11,4,-25,-2,-5,-4,-18,-8,-15,-2,-36,-12,-13,-9,-4,-6,-3,-11,2,-15,-24,-11,-7,-5,-14,-6,-40,-9,-18,-9,-13,-2,-27,-9,-16,-9,-6,-10,-13,-10,-19,-3,-14,2,-18,-9,-12,-10,-21,-6,-10,-4,-14,-2,-29,-1,-13,-3,-13,-14,-12,-3,-6,-9,-14,-3,-7,3,-13,-8,-22,-2,-14,6,-8,-2,0,7,-12,21,2,22,-2,8,-7,8,0,9,-5,14,1,4,-5,13,1,6,-4,10,-10,5,2,4,4,-3,1,3,-4,17,6,19,-3,21,-4,14,-7,6,-1,5,-8,8,-4,16,-12,11,-15,11,-5,6,-8,13,-3,10,-11,11,-5,20,-10,21,-6,7,-2,6,-7,3,-7,9,-20,13,-10,2,-8,4,-5,7,-6,11,-11,12,-9,17,3,6,-1,4,-8,18,3,16,3,10,-2,10,-3,5,0,4,-6,5,3,0,-7,8,-5,13,-12,21,-9,10,-18,13,-5,0,-5,5,-9,1,-18,26,4,7,-5,17,-12,17,-8,6,-4,14,-8,3,-13,25,-20,24,-5,9,-9,9,-8,15,-12,15,-5,2,-18,3,-5,-4,0,4,8,18,1,11,9,38,0,4,-12,-14,-6,-26,-9,-20,-2,-17,-9,-13,-9,3,-14,11,-8,11,-18,15,-6,21,-12,15,-8,12,-4,14,-4,9,-4,-3,0,-3,-6,-11,2,-5,10,-11,3,-20,6,-7,6,-11,15,-18,15,-11,2,-4,1,-15,7,-13,5,-4,2,-4,6,-27,5,-4,13,-27,12,-16,32,-61,14,-16,15,-11,-7,1,-5,-2,-2,-7,1,-17,9,-25,11,-10,15,-6,10,-11,21,-15,1,-4,3,-22,8,-13,9,-11,0,-3,-5,3,-1,-6,4,-21,-2,-8,1,-14,3,-16,-1,-11,6,-24,6,-14,3,-3,10,-3,9,-7,14,-16,4,2,3,-3,12,-7,17,-33,11,-35,4,-26,4,-14,6,-7,4,-12,4,-1,3,-3,4,-12,3,-5,2,4,-2,6,4,8,9,-7,2,-9,6,-7,17,-4,13,-10,19,-6,24,-32,29,-20,5,-9,3,-9,6,0,11,-10,3,-8,8,-3,2,5,4,-4,3,-8,11,-15,3,-9,-4,-8,-15,-10,-12,-4,-8,-9,-6,1,1,-4,19,4,12,-1,14,-11,10,-15,11,-13,21,-15,5,-2,28,0,20,10,24,10,32,-5,5,0,21,9,13,9,8,4,16,-3,15,1,28,9,5,0,11,-3,8,1,16,3,13,6,24,3,17,10,9,11,8,2,23,-7,-2,-9,-7,-16,3,-34,-2,-9,-3,-2,7,2,1,4,9,-4,0,-5,-9,3,-13,-5,-5,-31,-1,-15,-7,-9,-2,-7,-10,-13,-8,-17,-9,-15,-12,-12,-9,-25,-22,-34,-7,-19,-3,-11,-20,-34,-20,-27,-13,-23,-55,-61,-42,-40,-11,-9,-45,-25,-29,-20,-31,-27,-58,-59,-17,-21,-12,-12,-12,-22,-18,-22,-6,-4,-8,-2,-5,1,-2,-5,-3,2,1,-9,-1,-4,-4,-3,0,-3,-9,-7,-12,-1,-9,-6,-2,-7,1,-10,-4,-12,-6,-4,-7,-12,-2,-10,-16,-35,-6,-7,-5,1,-3,-3,-12,-43,-8,-18,-1,-10,4,-13,5,-6,7,-5,8,-13,10,-3,3,-7,-1,-5,-8,-11,-4,-9,0,-13,3,2,4,-4,1,-10,-5,-11,-2,-10,4,-14,5,-7,-1,-4,9,-13,-1,-11,8,-21,0,-4,-3,-4,7,-1,6,-7,5,0,15,-10,7,-10,5,-5,-7,-5,6,-4,-4,-4,-1,-4,2,-3,-7,-14,3,-6,-1,-10,5,-17,-2,-6,1,-14,-2,-5,3,-1,2,-6,-1,-9,-6,-6,0,-2,6,0,0,-16,1,-4,-2,-4,3,-33,0,-2,6,-3,0,-4,-4,-5,0,-7,4,6,3,0,2,-2,1,-13,0,-4,-7,-6,0,-7,-4,-3,1,-7,-4,-11,-23,-25,0,-4,-6,-8,-10,-4,3,-7,-30,-18,-8,-9,-10,-3,-11,-1,-26,-9,-5,-4,-10,-4,-16,-9,-14,-8,-15,-13,-2,-6,-18,-20,-6,-9,-1,-3,-4,-2,-3,4,-1,-7,-6,1,-13,-8,-10,-8,-15,-17,-21,-16,-4,0,-7,6,-4,0,6,-6,-3,-33,14,-16,7,-20,0,-10,7,-13,3,-19,0,-18,3,-3,2,14,2,3,2,0,2,-9,-2,-18,4,-15,-10,-37,1,-7,3,-1,1,4,2,0,1,-2,-2,-12,-3,-6,-14,-18,-8,-6,-20,-8,-38,-12,-25,-10,-19,-12,-8,-7,-4,-9,-7,-9,6,-8,7,-5,4,9,2,0,-4,-38,-2,-12,-9,-26,-6,-30,-13,-21,-13,-11,-12,-5,-22,-22,-8,-11,-8,-15,-7,-9,-20,-32,-10,-12,-15,-18,-25,-18,-31,-31,-50,-38,-39,-23,-23,-9,-10,-3,-21,2,-10,-1,-7,-5,-1,-9,-3,-1,-21,4,-8,-1,-9,-9,-11,-1,-21,6,-24,3,-6,1,-16,-5,-35,4,-16,-3,-23,-16,-21,-1,-18,2,-11,-4,-13,-1,-25,-16,-19,1,-12,8,-5,-1,2,6,-5,4,-4,0,-3,4,-14,-1,-1,13,-2,1,-8,0,-5,-2,-2,-2,0,-9,-5,8,-1,5,1,7,5,3,-1,8,-9,15,-5,3,-4,8,-4,2,-2,6,-4,4,-1,7,2,3,3,3,4,-4,4,2,7,4,3,8,0,19,-5,19,-27,36,-17,29,-8,17,-11,35,-11,20,-13,18,-29,24,-9,10,-22,34,-7,25,-1,6,2,3,-1,5,-2,4,-7,5,-1,18,-5,12,1,9,-2,15,1,10,-4,13,-7,12,-6,17,-1,46,-4,16,2,4,3,-2,1,6,-3,18,-7,12,-17,22,-7,14,-19,28,-15,37,-6,8,-29,55,-7,8,-14,14,-13,24,-3,27,5,38,0,10,-1,26,-2,7,7,6,6,10,3,14,10,30,5,30,6,14,3,16,17,21,4,12,22,13,9,12,4,8,5,15,0,17,3,21,0,7,-5,8,-1,6,-9,11,-2,8,-8,13,-3,9,-3,6,-3,16,-8,17,0,2,2,4,3,1,-2,-5,15,16,1,15,-26,57,-2,14,-15,18,-12,24,1,1,24,5,14,7,-3,1,-7,-1,-9,-5,-11,-2,-11,10,-4,8,2,9,-1,7,-7,14,-11,14,-2,4,0,6,-37,37,-5,8,-15,13,-3,6,-12,13,-29,25,-2,3,14,-6,3,2,-10,5,-9,1,-3,3,-4,10,-12,13,2,0,7,-3,0,3,-7,4,-4,0,0,5,-10,17,-1,4,14,-17,10,2,-1,2,-3,3,-6,-2,-1,1,-1,2,3,8,-7,-3,-7,4,-11,19,-7,16,3,-1,3,-4,6,1,3,2,4,1,3,2,8,11,2,15,-2,17,3,3,3,-7,2,-2,6,-1,11,-5,1,4,9,4,-3,1,-8,-1,-12,5,-11,13,0,3,9,2,2,0,1,-3,3,-1,0,10,-2,11,1,3,-5,3,-6,1,6,15,7,6,4,11,4,7,-1,7,2,24,3,19,3,8,-3,11,-10,12,4,4,-6,0,-4,9,3,4,6,-1,-5,5,2,5,-1,1,-3,-3,-3,0,-3,2,1,-3,-4,-4,-5,1,-3,3,-13,5,-1,7,-3,6,0,10,-8,1,-5,5,1,-6,-1,-2,-4,0,-2,4,1,8,-2,-2,-4,1,-2,4,-3,0,-4,5,-1,-1,4,-12,-1,-5,-33,-2,-4,2,-2,5,-3,-5,-9,-1,-10,9,4,-5,0,-5,-7,-6,-5,0,-3,2,-2,10,-3,4,2,-13,3,-4,-11,-2,-3,7,-1,-7,-15,-2,0,7,-2,-3,-1,-4,-6,0,-14,8,-11,9,-4,10,-6,14,5,2,-6,2,0,7,7,2,2,5,-8,-4,-7,4,-2,3,1,2,9,0,3,2,-5,0,-2,4,-2,-3,-5,-2,-3,2,-1,6,-12,13,-22,16,-15,4,-33,0,15,8,-2,1,-15,-4,-4,-6,-53,-4,-48,-9,-11,-4,-8,-12,-9,-3,-25,0,-19,-10,-11,-3,-23,-14,-13,-2,-22,-7,-25,-14,-4,0,-16,8,-42,10,1,1,10,0,-7,3,0,7,-4,0,-5,-10,-27,4,-5,4,-19,0,-10,-1,-2,-2,24,1,4,-2,-43,-4,-3,0,-3,3,-13,1,-4,-3,13,0,2,-1,-25,-3,-18,-3,-46,-17,-29,-15,-12,-1,-30,12,-44,23,-12,9,-45,42,-7,4,-9,3,-9,5,-3,7,-23,11,-12,13,-10,7,-37,15,2,8,-4,6,2,5,-4,-3,-7,1,-8,5,-5,16,-3,3,-6,1,-7,10,1,3,9,-3,9,11,0,1,-3,-2,-6,0,-5,-2,-2,6,1,7,7,1,0,1,-5,1,-6,4,-1,5,2,5,-7,7,-2,5,-6,6,-7,0,2,5,-1,14,-4,-3,-3,1,-7,4,-3,4,-1,5,-7,-1,-12,6,-10,16,1,10,-4,-4,-5,13,-5,1,-2,-1,-3,-7,-2,0,-1,2,0,5,-3,4,2,6,-2,0,-4,-5,-2,0,0,6,-5,0,-4,3,0,6,3,2,-7,1,3,5,8,4,9,1,-2,3,-5,1,-10,-3,-4,5,0,3,4,5,10,0,6,2,1,2,-5,-2,-13,1,-11,-6,-8,-3,-6,1,2,7,-1,1,-2,1,-9,-2,-7,3,-2,4,0,4,4,5,-10,-2,-14,8,-1,2,-2,4,1,2,10,4,5,-1,1,1,-8,6,-5,-6,-2,-1,-1,2,0,18,-3,18,4,4,4,3,2,-2,3,-7,7,-2,12,1,1,5,37,4,-7,2,-29,-3,-11,-5,-4,1,-4,5,-3,11,-8,8,-1,3,1,3,6,4,-9,-2,0,5,-9,15,-5,4,-4,8,-9,4,-4,0,-1,-3,-5,5,20,8,15,19,14,22,1,5,0,22,4,16,19,47,3,17,-3,32,-7,24,-4,8,-9,6,-2,4,7,3,4,5,-7,-2,8,15,4,22,-7,10,-4,12,-5,2,-2,-5,-3,2,-13,22,-2,2,-4,-4,-2,-12,-3,3,9,52,6,13,6,6,8,3,8,13,3,12,5,5,2,5,-2,3,21,35,-1,2,-9,-8,4,8,16,12,19,20,8,3,7,9,2,8,1,17,2,9,14,26,2,12,3,5,5,2,8,6,10,3,19,13,4,7,5,13,11,26,7,5,5,8,7,3,17,1,24,6,27,13,18,17,30,17,31,37,10,15,2,13,-2,4,-6,8,-4,2,-1,4,2,6,2,29,6,15,17,18,3,8,2,17,20,17,16,17,11,6,37,13,33,16,7,9,20,32,22,50,15,2,11,6,6,-2,-3,-2,0,-6,4,-6,8,-8,13,-9,11,-4,15,-2,31,6,5,-3,10,0,10,1,11,8,1,-4,6,-10,46,-1,12,4,17,9,13,11,8,4,25,10,12,-2,7,1,4,3,6,8,8,5,33,14,14,4,54,4,13,0,19,9,27,1,13,5,49,0,27,-13,21,8,17,3,9,4,4,5,8,2,5,-4,17,-4,16,2,-2,7,12,-2,8,-3,10,-6,6,-1,10,2,23,2,12,3,16,10,27,7,8,-2,-3,-4,2,-4,4,2,-1,4,10,0,6,-3,-1,-8,8,-9,-2,-4,6,-2,5,3,3,4,9,3,10,6,5,1,3,-10,-8,-7,-8,-12,-8,-4,-6,-5,-2,-3,1,-11,4,-8,6,-4,4,-1,11,-7,2,-15,4,-5,-21,-28,-8,-7,-17,-10,-7,-6,-1,-8,6,-11,7,-6,8,-3,13,1,0,-8,9,1,3,4,6,-3,4,-9,5,-4,0,-1,-3,-2,7,-2,3,1,13,-5,8,-1,23,-12,24,-3,26,6,13,-5,15,-1,16,-4,18,-10,33,-6,4,-4,5,-8,0,-9,7,-16,10,-12,21,-8,33,-2,29,-7,23,-8,6,-3,12,-4,25,-18,13,-6,9,-2,9,1,14,7,7,3,15,16,7,14,-3,11,-7,13,-2,13,3,9,7,11,13,11,12,7,22,10,18,1,11,7,10,-2,17,1,45,-15,2,-9,-1,-5,9,-6,26,-3,16,-8,28,1,10,-2,7,-5,10,-17,8,-1,26,5,43,-7,24,-5,15,-8,15,-1,6,-5,28,-2,28,-11,17,4,25,15,6,2,9,0,9,10,26,5,-2,-2,-16,-5,7,-1,15,3,3,7,1,0,22,-7,4,0,14,4,13,-10,-3,0,-9,7,-1,-3,-5,-6,11,-4,5,-6,5,1,4,4,-3,5,2,0,17,-12,26,5,4,-4,9,3,14,0,12,2,14,6,15,15,10,15,21,59,7,16,5,5,14,27,1,10,8,10,9,5,-5,20,3,14,-2,10,-7,8,4,13,6,8,-7,15,3,5,15,13,0,7,-7,5,-19,-9,-2,-3,-4,-3,-7,-1,-35,12,-20,-11,-17,-15,-13,-6,-39,-4,-6,-3,-13,3,-8,4,-18,18,-39,14,-30,2,-3,-3,-1,-14,-6,-13,-3,-1,-7,3,-28,-7,-23,8,-4,4,-5,15,-3,1,-4,-2,-4,0,-17,6,-9,1,-5,-7,-4,-2,-5,0,0,2,3,4,-14,-1,-7,-3,-6,0,-4,2,0,1,27,5,12,9,-45,0,-4,-2,0,5,2,2,12,2,-1,4,-7,5,-8,2,-4,11,-4,3,1,1,7,2,2,8,-1,5,-15,4,-3,0,-4,4,-6,3,-5,-3,-15,7,3,4,4,0,0,4,-2,6,0,3,3,1,4,0,3,-4,1,-7,4,-4,1,3,1,1,7,-2,12,2,2,2,-9,-1,-3,2,-3,4,-4,8,7,3,6,5,-10,4,2,8,-9,9,12,11,-1,2,-39,-5,-1,3,3,7,-1,11,2,5,7,2,8,9,13,10,14,0,5,3,8,0,3,-4,7,-3,12,0,6,3,-5,5,1,2,6,0,5,-2,-3,-5,2,-1,16,2,17,-1,19,1,3,1,-14,6,9,5,44,5,0,1,-24,2,-12,7,-4,3,3,9,2,2,9,0,30,-3,21,2,24,-6,22,1,4,3,6,8,31,14,11,6,54,15,68,-3,13,5,8,-2,-2,-3,0,-3,9,-9,13,-4,18,4,7,-2,6,-13,11,-7,5,-1,7,5,7,0,11,-4,3,-5,35,-5,8,-4,23,-4,52,9,19,-6,16,-2,7,1,21,7,7,5,7,1,23,10,14,14,3,9,0,5,-5,8,-9,26,-3,4,-15,4,-3,6,-11,6,-19,4,-29,17,-28,21,-30,19,-27,7,-16,14,-8,-2,-10,2,-7,4,-4,6,-4,4,-29,9,0,1,16,5,-11,5,7,2,18,-7,2,2,19,3,2,5,-3,1,0,3,2,5,9,7,5,10,4,2,3,-1,0,-4,5,8,16,-1,-21,16,-8,0,-8,12,10,-1,14,4,13,-2,-3,8,42,11,1,3,-5,8,-9,1,-5,-5,-13,-2,-5,1,10,5,-9,-1,-5,-3,-15,-5,-32,0,-10,-8,-15,-2,-12,-8,-6,2,-6,0,-14,-5,-13,0,-10,-2,-21,-12,-7,-9,-10,-5,-2,0,13,9,1,5,-3,3,-9,-9,-10,-3,0,-11,8,-14,12,-13,10,-6,5,0,14,4,9,-1,8,4,6,0,14,-3,-6,-8,-3,-9,-9,-2,-18,-1,-9,5,-10,0,-6,-6,-10,-4,-4,-5,-18,0,-13,-4,-9,-9,-10,-6,-8,-2,-13,3,-11,6,9,17,-3,10,-8,4,-11,1,-13,7,-7,1,-8,-2,-6,4,32,17,7,1,19,9,-3,8,-9,-2,-11,6,-36,-5,-22,9,-11,1,-2,2,11,2,0,4,-14,2,-8,4,40,-4,11,7,-11,-3,-12,2,-4,2,-5,7,0,10,-5,9,-4,3,8,-15,-2,-13,-5,-1,-12,1,1,6,-8,-8,-13,0,-17,-3,-7,-15,-7,-8,-15,-12,-20,-6,-7,1,-2,-2,-2,-6,3,-3,3,-10,-4,-18,-4,-7,-26,-4,2,2,-2,6,3,3,-6,1,-2,-2,-2,-2,1,-5,-4,-5,-2,-8,4,1,-12,-14,1,-16,-4,-9,-1,-15,-5,-6,-7,2,-9,-1,-11,-11,-2,-22,-6,-2,-14,-12,11,-5,14,-16,2,-4,-2,-5,3,-7,8,-8,7,-5,36,-12,-5,-11,-9,-1,-30,5,-13,-4,-9,1,-12,-2,-3,-7,-9,-8,-24,-9,-23,-19,-6,-2,3,6,0,6,9,6,14,5,4,4,-35,0,-4,7,-8,4,-18,2,-9,3,-4,0,-7,3,-15,-7,-16,4,-5,-1,-7,-7,-8,-3,-16,1,-1,-3,7,-7,-2,-3,1,-3,9,-1,9,-4,6,-9,-9,7,-12,4,-5,0,-5,-2,0,-2,12,-8,2,-5,-3,-3,-5,3,-9,10,-12,2,-2,-2,4,-7,11,-6,-3,-2,-11,3,-4,6,0,6,-21,9,-2,5,3,5,-5,-1,-10,-4,1,-7,-3,-12,1,-4,12,-12,7,-12,6,-3,7,-7,4,-9,-5,-4,-3,0,-2,2,2,4,0,2,-8,4,-4,-2,-4,-2,2,-4,4,-7,5,0,-13,-7,-11,-2,22,-6,6,-4,6,0,5,-7,11,-2,5,-6,14,-4,3,-7,2,-18,-2,-5,-2,0,-20,17,-4,1,-4,-2,-11,-2,-8,-4,5,-4,0,-4,3,-5,10,-2,4,-7,-16,-5,-3,1,0,4,-8,4,-8,3,-3,-2,2,-7,5,-6,10,-21,1,-4,-2,-7,6,-10,-9,4,-10,13,-3,1,-5,-1,-7,-11,1,-6,-4,2,-2,2,0,9,-7,9,-4,1,-4,6,-6,-2,-1,-9,-2,-3,-8,6,-8,11,0,6,6,5,-1,4,-6,8,-12,7,-2,5,-7,4,-1,2,9,6,5,9,13,-1,8,7,7,0,14,-7,16,-3,12,-7,6,-1,-1,5,11,1,3,3,-1,2,-16,3,-21,10,-2,-3,-3,-1,-18,3,-24,-5,-7,8,-2,-5,-6,-2,-3,2,-6,14,-6,6,-5,1,-1,4,1,2,6,1,11,-2,2,1,-2,5,-17,-1,-3,2,-13,11,-8,3,-5,11,-10,8,0,5,-7,12,-19,8,-4,4,-4,6,6,-1,1,1,-6,13,6,14,1,15,-2,9,3,7,4,4,0,7,-6,4,-6,0,-8,4,-3,6,-11,9,-13,7,0,3,-6,0,-35,18,-12,2,-16,6,-11,3,9,0,25,-8,-29,18,-12,9,-25,7,-14,-2,-7,1,-2,2,0,5,-22,12,-16,14,-3,4,8,1,10,0,-11,5,-14,11,-4,5,0,14,-2,5,-16,11,-11,2,-4,-9,-14,-16,-5,0,-12,13,-5,19,13,7,-8,8,-3,0,-5,-4,-13,4,-8,-7,-27,-9,-3,0,5,4,-2,0,-11,-5,-3,-10,3,-2,6,-8,6,-4,-3,-6,-4,-2,-5,2,-2,-6,3,-14,5,-11,15,-11,10,-4,20,-12,13,-5,12,-20,10,-25,9,-9,18,-13,16,-9,15,-6,12,-1,28,1,10,-2,1,-4,-1,-3,-12,-7,-1,-5,6,-4,27,-10,27,-9,19,-11,24,-9,4,-5,14,-9,7,-8,1,-6,-7,-14,-6,2,-7,4,-11,17,-19,2,-11,4,-4,5,-8,1,-5,-3,-13,-16,-7,-14,0,-6,4,-5,11,-3,15,-10,0,-12,3,-7,-4,-4,-7,1,-10,-3,-7,-4,-3,-4,1,-11,-2,-5,-13,-8,-11,-15,-17,0,-4,5,0,7,3,4,6,2,4,9,-1,7,5,5,11,2,0,9,-5,4,-4,17,-8,13,-8,18,-6,4,-14,0,-18,9,-1,3,3,4,-2,4,-5,9,-4,1,-21,-3,6,6,-8,5,-13,0,0,2,-9,14,-6,5,-3,1,-6,-1,-16,2,-8,-2,-2,1,-9,7,-11,4,-28,23,-14,7,-8,10,-17,7,-8,-1,-2,1,4,2,-1,4,-11,10,-7,3,-5,7,-9,1,0,12,-4,9,-6,7,-4,17,-3,4,-7,4,-16,4,-22,11,-26,5,-10,-4,-28,-23,-37,-9,-27,-16,-3,-6,-4,-3,-23,-6,-4,1,-12,0,-6,4,-14,2,-4,6,-12,1,-1,4,-17,-3,-25,5,-8,6,-7,-2,-7,-5,-26,-13,-10,-14,-1,-4,3,-12,10,-16,-7,-1,0,-5,4,-4,0,-7,-12,-9,-35,-15,-11,-9,-52,-11,-16,-12,4,-1,5,-4,-9,-4,-6,-1,-12,-15,-16,-15,-18,-25,0,-5,6,-18,8,-8,10,-4,2,-3,-13,-9,-16,-7,-7,-6,-1,-6,-5,-2,-2,-8,-7,-12,0,-2,5,-4,-5,-3,-25,-1,-16,-9,-8,-7,-7,-15,-9,-8,-3,-2,-6,4,-8,1,-7,-2,-3,-3,-6,-1,-18,2,-15,-3,-19,3,-27,-2,-4,-1,-12,-10,-13,0,-12,-4,-7,-9,-2,-5,-4,1,-1,-4,-8,-3,-9,3,-8,5,-4,0,-9,12,-2,9,-6,2,-2,4,5,6,5,4,-5,-1,-4,-3,-5,6,-19,12,1,4,-6,-4,-10,0,-16,-2,-17,-8,-5,0,-10,4,-23,2,-7,-2,-5,0,-5,-3,-3,1,9,20,1,15,-1,7,-3,4,4,11,-1,6,-3,7,11,-1,-7,5,-21,-4,1,5,-3,6,8,2,4,2,2,3,-1,5,3,5,7,4,-8,-3,-9,-14,-11,-2,-6,2,3,19,3,6,-1,5,6,4,6,6,15,29,-2,3,0,4,5,17,5,8,1,13,-7,27,-1,5,3,2,-4,0,-2,3,0,4,5,5,-5,0,0,8,9,9,-6,0,0,3,5,4,-5,3,0,8,-11,-2,0,3,6,7,-6,1,-10,8,3,10,15,8,17,0,15,5,-2,5,1,2,13,6,7,0,8,3,5,-2,5,1,12,-7,10,-2,8,1,41,1,12,2,9,-3,17,-1,40,-7,10,0,22,4,5,-1,9,2,28,-7,8,4,14,-2,13,-5,17,1,18,5,8,6,7,23,5,27,3,5,5,2,-4,3,-4,-5,3,25,5,19,13,-8,3,-3,4,-11,7,-5,-5,4,-5,15,-3,4,-20,13,-1,3,9,-2,-3,9,-2,20,-13,2,-19,8,-16,17,4,9,-3,4,-6,2,5,5,9,0,9,-2,-12,5,-19,-2,-7,2,-1,3,5,5,-7,2,-11,0,-1,1,3,3,-2,1,-9,-1,-5,1,-5,4,-14,1,-3,2,-20,4,-21,-1,-5,7,-13,4,3,2,12,2,3,2,-10,4,-3,2,17,1,-8,3,-16,0,-2,5,2,4,9,4,24,4,17,1,12,5,12,1,12,-2,15,-13,13,5,18,0,4,-3,5,6,4,-3,22,1,-5,2,-4,5,-1,20,-12,15,-3,5,1,4,14,-1,11,2,5,-1,1,-9,5,-6,31,-1,18,-3,15,5,14,2,1,2,-8,-1,-8,2,-1,3,4,7,22,8,31,7,8,4,10,9,-3,2,2,22,5,7,4,3,8,3,26,3,26,10,23,7,9,0,14,-2,7,2,5,-2,5,1,-11,3,-9,-2,-12,3,-6,4,4,2,10,1,7,-1,13,-6,7,1,-14,6,9,1,-12,9,4,6,23,19,4,7,6,18,4,7,6,-2,9,3,15,7,4,6,5,2,26,7,38,2,7,-6,12,-2,-7,5,2,9,5,5,22,2,18,0,8,-8,-3,-4,5,-1,2,0,5,8,8,-4,0,-6,2,8,-2,6,1,5,5,5,14,-2,15,1,6,-2,13,-11,10,-2,-7,2,-16,13,-17,3,-4,4,0,13,-6,3,-7,-1,-1,3,1,2,16,3,0,4,-14,13,-1,9,-4,8,5,1,-1,8,-2,5,-24,9,3,19,-4,8,2,23,6,1,14,-3,6,-3,2,2,1,4,7,6,9,3,7,-5,3,16,-8,1,-5,-1,-11,-15,-16,-3,-10,5,1,5,17,13,41,3,6,3,20,17,15,2,14,6,4,0,-8,-6,-1,-3,5,-6,-1,-10,-11,-12,-1,-19,10,-5,18,0,4,-4,-3,-7,-5,-3,-11,-2,-6,4,-2,-1,-3,-2,-7,-18,-8,1,-6,-2,6,-4,-6,-3,-15,-10,4,-12,-2,-3,-7,-4,-2,-4,6,0,5,-2,3,-2,-2,-2,2,-6,8,-1,6,-5,0,-5,-8,-5,14,0,4,-4,7,2,18,-6,15,3,2,-5,-3,-5,-10,-5,3,-4,12,0,15,-3,20,10,16,1,23,15,23,-2,5,-7,15,-7,14,1,5,-7,2,-8,5,-3,31,-8,-1,9,-32,3,-1,3,1,3,-5,3,0,3,22,-9,6,-1,45,11,45,8,19,13,16,2,19,6,41,6,12,0,22,-8,2,-2,-18,5,11,-15,9,-4,7,-1,21,2,8,3,15,10,4,6,2,8,6,2,15,0,6,2,8,5,17,15,5,11,-1,-7,-3,-7,-22,-18,14,-4,15,2,3,17,-2,3,2,6,-9,18,-2,22,1,19,2,9,14,10,5,15,13,13,42,7,4,-6,25,-14,7,-12,18,-5,15,1,17,9,5,4,1,3,-2,16,-3,7,2,7,6,9,1,8,4,2,-2,3,-9,1,-5,-4,-6,-2,-18,5,-3,4,0,3,-7,4,-2,4,1,3,7,3,-9,1,-3,6,4,4,-3,2,3,3,-1,5,14,4,15,1,-1,4,6,0,10,5,10,-1,15,3,28,0,4,2,-1,4,56,-4,18,-5,46,-2,5,2,3,5,-2,8,2,3,4,0,4,-3,6,-1,4,2,2,4,3,1,11,-2,10,1,10,9,26,-2,23,-4,3,4,-10,3,-5,5,-8,4,-33,0,-12,7,-9,2,-7,8,6,-2,2,6,-7,3,-17,-5,-21,-2,-15,-4,-13,4,-12,-3,-21,-3,-1,3,4,6,0,1,-1,0,-6,-8,-4,-2,-9,-1,-8,4,-4,0,4,-7,-5,0,-9,-4,-2,0,-3,4,-10,-4,-10,-1,-5,-2,-28,-4,-8,-5,-5,1,-31,-4,-13,1,-14,-7,-8,-1,-3,0,11,8,1,2,-10,4,-4,6,-3,0,-2,-6,-3,-2,-15,-2,-1,4,1,2,-1,1,1,2,6,1,0,2,-3,1,3,5,-16,1,-20,5,-3,5,-9,-3,-9,3,-4,18,1,5,5,6,2,5,-1,10,3,0,-3,4,5,2,-11,16,-6,3,5,12,-1,3,-1,3,-8,4,-3,10,2,6,16,10,1,5,9,0,-5,4,-1,4,13,2,5,-1,21,5,-4,6,5,0,-1,3,4,0,6,4,1,3,11,2,37,18,5,0,3,5,13,7,5,5,13,7,12,11,2,3,19,4,17,-1,0,3,-3,2,8,2,-2,5,-4,2,4,17,-5,3,-20,6,-8,1,-5,4,2,5,-11,-4,-8,2,-17,-2,-10,2,-24,-2,-6,-2,-18,7,-10,-4,-7,3,-6,-5,-1,-8,-9,1,3,-3,-11,-1,-1,-2,3,-1,-4,-3,-16,-1,-2,-2,5,-3,-1,-2,-9,3,6,-6,2,-4,-19,-12,-3,-4,7,-4,6,-9,6,-4,-3,-4,-22,-10,-13,-16,-28,-10,-14,-2,-7,-4,-3,-4,-11,2,0,-4,-7,3,-6,-7,-10,-5,-11,1,-1,-1,3,-2,-13,-1,-3,-6,-10,-1,-1,-2,9,-1,-2,-4,-11,-3,-3,-2,-5,0,1,2,-7,0,-3,2,-1,0,5,-8,-4,-3,7,-3,-20,-7,-11,2,-2,-4,2,-4,11,-5,-7,-4,-6,-15,4,-9,-13,2,1,-3,-4,-4,1,-6,-1,-4,3,-3,-2,-2,2,-16,4,-7,-2,-6,6,-3,10,0,5,-5,15,3,3,-4,7,-6,5,-2,7,-1,8,-4,-1,-5,12,-4,8,-7,3,-6,-1,-3,-35,-16,-6,0,-10,-4,1,-2,8,0,7,2,14,2,3,-4,-10,-1,-2,-6,-5,-4,-23,-7,-3,0,-39,-15,-33,0,-5,-1,28,-3,7,-4,-13,-3,6,-11,-4,-3,0,-12,-5,0,-2,-5,1,-3,1,-10,3,-3,-1,-4,-8,-8,2,-10,-9,-18,-9,-10,-8,-14,-9,-5,-10,3,-15,-1,-27,0,-3,-1,2,-5,-5,-1,-5,1,-8,-3,-9,-7,-1,-6,7,-10,-8,-6,-19,1,-24,-4,-22,4,3,3,2,13,-25,28,11,-3,5,1,-7,9,10,1,3,3,-2,5,-8,2,-7,8,-8,4,-13,16,-5,11,-5,-1,-4,13,-7,2,-2,13,-7,1,-6,6,0,11,-5,2,-5,-1,1,6,-3,19,-3,6,3,5,5,0,4,-2,0,1,-1,2,-26,4,-10,10,-2,19,-3,-3,1,-6,-8,-3,3,-7,-1,-5,-13,-14,-5,1,-6,-3,-6,0,-2,3,-8,5,-4,0,7,-6,-2,-1,-17,-6,4,-3,-4,-3,-4,0,-3,-3,-13,-6,-20,-13,-18,-8,-6,0,-8,-3,-21,-3,-13,1,-10,-1,-5,2,1,4,-2,1,-4,0,-3,-5,-8,2,-1,1,7,5,-2,2,-14,0,-16,6,-4,3,-14,4,-6,5,-3,5,2,13,3,2,24,-7,13,6,-2,1,-11,-3,-11,5,0,2,3,2,1,2,-1,3,1,3,22,13,-28,-10,-14,-3,-5,-5,-5,-2,-9,0,-2,3,2,12,6,9,5,1,4,3,15,-3,4,4,18,4,-19,-1,-4,0,-2,3,18,11,3,8,10,6,9,2,3,-2,-3,-10,10,13,14,5,-33,-5,-9,-4,-13,-9,-1,-5,-9,-2,-10,-10,-18,-9,-1,1,0,9,5,7,-2,3,1,2,15,-1,9,3,-1,2,-12,0,-7,2,-5,5,-2,7,1,2,24,10,-3,1,-7,-4,-10,-3,-6,4,-4,3,-2,8,0,9,5,2,20,-1,24,3,22,-2,10,3,8,0,10,-4,0,-3,3,-2,2,0,-2,7,28,6,-10,0,-3,4,5,7,-5,-3,-3,-5,1,-3,-1,-2,-5,-1,-12,0,-14,2,-2,1,0,3,-1,1,-5,-7,-6,-1,-15,1,-38,-3,-11,4,-4,4,-1,9,17,2,-9,3,-3,4,-5,1,-4,4,-1,4,2,4,2,1,24,0,28,-6,22,1,14,4,-30,-1,-33,4,-11,0,-5,1,-3,3,2,7,5,1,6,-1,9,8,18,5,9,-4,25,3,6,3,-28,-3,-1,2,6,4,2,3,4,2,30,0,16,-1,11,-3,10,2,-9,1,1,4,13,2,15,1,-3,2,-32,-3,-8,2,-23,-3,-2,1,10,11,22,4,10,4,26,0,5,-5,21,-8,-1,2,-18,10,-4,4,1,4,5,2,15,2,3,1,0,3,-2,1,-11,1,-1,3,2,2,14,4,8,1,15,-2,1,-2,-4,-3,0,-2,4,0,8,5,19,3,12,-7,2,-4,2,0,8,3,29,0,-4,5,2,3,33,9,-4,4,-6,1,14,5,-2,1,-6,1,-11,-3,-8,-3,6,-4,-5,-3,-30,-10,-14,-3,-7,0,-8,9,-8,-1,-2,1,3,5,4,3,8,3,7,8,12,5,16,12,14,4,5,4,14,5,15,3,6,4,-4,0,-13,-3,2,7,7,4,34,10,7,-5,10,1,12,6,9,6,-25,-8,-3,1,-1,2,-7,0,-3,2,-1,4,8,10,17,12,3,5,7,3,11,0,-3,3,-9,2,-1,2,30,4,15,0,18,6,-3,1,-43,-4,-3,10,2,5,5,0,1,5,5,3,7,1,8,4,17,0,-13,3,-2,2,11,3,12,8,33,4,32,0,1,2,-7,1,-43,1,16,11,10,4,22,-5,10,-7,-1,5,6,4,-2,1,-9,-1,-12,4,-1,3,6,4,-2,1,-13,-4,-9,-1,-4,1,2,3,-1,3,12,8,5,1,13,-3,11,1,-1,2,-12,1,-3,2,1,1,34,8,3,-1,3,-9,7,-7,3,0,-3,6,7,5,-7,2,-4,7,1,2,9,3,12,1,17,-2,30,3,0,1,-7,2,-42,-1,-3,2,0,2,7,4,11,3,13,1,12,5,6,4,2,6,8,5,20,3,-1,8,9,8,6,-2,5,-4,19,-2,3,1,-15,5,0,3,19,3,2,5,8,4,24,3,2,-1,-4,-18,5,4,6,11,5,5,5,3,13,3,3,-4,-2,-12,-15,-13,3,-1,19,10,13,-1,-9,6,-1,3,0,8,4,3,27,-2,5,6,9,1,25,-10,2,1,-4,8,-5,3,-20,6,-3,1,1,2,9,1,12,-1,11,3,3,-1,8,1,5,-2,3,1,2,3,13,2,13,-4,5,-10,11,-5,5,-1,2,2,-6,4,3,5,2,2,14,8,12,4,7,0,12,9,7,2,-1,2,-7,2,0,2,20,9,5,0,25,-8,9,4,16,-3,1,-2,-16,-7,-13,-10,-3,-8,-7,-5,-1,-4,3,-2,9,2,10,5,3,5,51,29,8,1,4,-4,-3,-6,-6,-4,4,-1,-3,-12,20,6,10,11,6,3,12,0,1,1,-15,4,-1,2,5,3,13,5,27,-3,13,-3,-1,-6,-5,-3,-19,-6,5,-1,11,2,3,-2,-4,-4,-2,-11,2,-6,5,10,7,3,2,6,6,7,12,5,13,0,15,-6,12,-2,5,-3,16,3,9,-4,-1,-4,19,-1,16,-6,2,-3,-1,-3,-24,-4,-10,-4,-17,-1,-57,2,1,-2,40,-6,2,-2,-1,-6,4,-4,19,-1,4,1,1,5,3,1,6,-1,2,-5,1,-1,3,4,12,0,16,-2,21,-4,10,2,7,5,10,0,2,1,-3,4,0,2,51,-12,0,-5,-4,-1,-37,4,-4,-2,12,-4,2,-4,31,0,1,-2,-4,-3,2,-1,20,4,4,-1,0,-2,-2,-6,-5,-5,-9,-5,15,4,12,9,28,0,38,-5,9,1,5,2,29,-4,94,-25,31,-14,3,-3,21,-2,36,-12,13,-1,-4,5,4,0,28,-16,29,-6,5,-14,4,-3,0,-6,11,-2,0,-5,-4,-10,-5,-5,-33,-19,-21,-7,-41,-8,-31,-4,-38,2,-46,9,-30,1,-43,5,-35,11,-17,-3,-4,3,3,2,-16,2,-12,0,-15,4,-6,-1,-16,4,-16,9,5,3,-27,4,-25,0,15,-2,15,-6,-2,-4,20,-10,16,-2,2,-4,-2,-1,2,-2,22,-5,-3,-3,-12,-3,38,-5,14,-5,15,-8,4,-5,0,-5,-8,-12,-11,-6,14,-12,6,-9,2,-9,6,-2,-5,-3,0,-7,9,-6,20,-5,10,2,25,-10,11,-9,54,-9,10,4,16,2,6,4,-1,4,-4,5,-1,6,-11,4,-15,-1,-13,1,-30,20,-3,2,1,5,6,0,6,2,5,10,13,1,19,-5,25,-11,20,-1,6,-3,26,-4,25,-7,10,0,4,6,11,4,7,0,10,-1,2,1,-8,11,-7,3,-17,14,-3,5,4,8,25,8,19,10,19,3,20,5,15,7,15,10,7,3,11,-2,8,-3,32,0,16,-5,5,-3,-5,-4,-1,-3,10,2,5,-1,13,-7,2,6,-2,6,6,8,13,14,-2,6,-1,7,-1,3,-5,5,-11,3,-11,1,-4,4,4,9,9,12,9,16,-1,13,-1,3,-39,14,-3,4,7,0,28,-7,52,2,22,-2,19,-3,39,-25,1,-7,-59,-4,-29,-14,-2,-3,2,-3,31,-9,16,-14,5,-2,16,-1,10,-2,50,7,8,2,2,3,3,12,7,9,-1,6,39,6,9,-1,2,3,-9,7,3,1,10,-2,10,0,39,10,45,15,25,2,33,7,7,0,7,-4,-5,-4,7,-2,4,1,14,3,2,3,-4,1,-4,5,-11,0,17,7,56,13,35,0,-35,-5,0,-1,8,-2,-3,-2,-7,-8,8,-5,1,-5,-6,-3,-7,1,-17,-3,-4,-4,35,-2,26,4,12,-6,7,1,3,9,25,9,13,1,18,3,29,-1,25,-3,53,17,3,-3,6,4,35,4,3,-5,12,-8,-7,-2,-5,-4,-1,-9,31,-4,7,2,3,4,1,2,-4,4,2,5,29,1,8,3,15,10,-4,8,-10,-1,-16,17,-9,7,6,3,14,2,18,7,43,-4,43,-1,36,-3,42,-7,36,-11,-1,-4,7,2,35,-7,4,-3,30,-7,29,-3,7,-6,25,-9,4,-3,22,-6,11,-4,6,1,17,11,15,20,-11,0,-8,-2,-11,2,-21,14,-2,9,-4,3,-19,5,-28,6,-5,-2,-3,-5,-5,5,0,4,6,14,8,-1,8,5,-5,6,5,14,2,12,-7,5,-16,-2,-6,1,-2,4,9,8,-7,-1,-3,2,6,3,8,7,31,7,36,13,17,17,12,19,10,13,18,15,15,1,0,-1,-3,-3,5,-1,88,2,22,-5,8,0,17,-2,19,-4,-3,-18,-9,-16,-15,-16,-8,-5,-10,-3,-3,-4,11,-8,25,-7,6,-10,2,-7,-2,-18,-11,-9,2,-5,4,-19,1,-16,-3,-5,-2,-11,3,-10,5,-4,7,-3,36,-12,3,-5,-7,-2,-16,-13,-1,-4,3,-6,-1,-6,-5,-5,-6,-3,-17,-6,-38,-29,-9,-3,-15,1,10,-10,-1,-4,-10,0,-20,-7,-11,-1,-17,4,3,3,13,4,-6,1,-7,-3,-8,-1,-20,8,-7,-1,-26,0,-10,-2,9,-10,39,-9,18,-3,51,1,28,-6,7,1,13,4,5,11,55,15,14,7,4,4,5,12,5,5,30,14,5,3,0,7,-2,9,-5,7,-12,10,4,12,5,5,27,5,49,6,18,0,7,-4,7,-6,19,-9,6,-6,1,-8,-1,-19,-3,-8,30,-10,57,0,-4,3,-63,6,-3,7,1,5,6,10,17,3,-5,11,-6,8,-6,13,-10,0,-41,11,-32,6,-29,0,-18,-6,-12,-1,-23,2,-19,-1,-7,1,-3,3,6,11,-3,4,-14,10,1,5,13,19,25,20,-1,4,-29,20,-8,8,-21,8,-4,3,30,20,41,8,25,7,5,6,0,8,-5,10,-11,10,8,2,11,0,10,-3,12,-11,0,-6,7,-8,-10,-6,-7,-10,-6,-1,-2,-7,13,-8,-2,-6,-9,-5,3,-5,20,-4,19,-2,31,-1,9,-4,4,3,29,-1,24,-9,13,-2,10,-1,25,1,3,3,-18,-1,-12,2,-5,3,-8,9,-15,3,-22,0,-52,12,-6,2,-14,16,19,4,22,2,10,-2,25,-8,11,0,20,3,3,3,-5,4,-6,3,-12,1,-14,-2,-5,1,2,3,2,2,13,1,11,5,26,4,47,-1,27,-8,40,-7,3,-1,2,-4,40,-13,21,-1,34,3,17,-2,7,-3,-13,-10,-33,-10,-4,-13,5,-10,-9,-10,3,-10,2,7,10,8,7,10,13,3,8,-3,2,-4,0,-6,-2,-6,-5,-9,-12,-9,9,-6,11,0,3,3,-3,6,21,3,8,4,4,6,-8,11,-12,11,-9,6,5,9,15,13,1,3,-2,4,-10,7,-7,3,-28,2,-16,8,-7,8,-4,1,-15,3,-35,4,-14,4,-8,12,9,11,-4,4,-13,3,-4,8,-1,6,10,6,-2,2,1,2,62,5,86,0,60,5,17,-2,18,1,9,4,48,4,16,-1,6,-3,-33,-10,-13,-2,-14,-4,-1,-3,1,-6,43,-11,2,1,-37,11,-4,3,2,3,8,3,14,2,37,3,13,7,10,3,-19,3,-25,16,-6,2,-29,4,9,5,11,2,13,-2,12,-5,17,2,-41,11,-31,3,4,5,9,-1,7,5,23,-7,19,5,19,8,2,4,-16,3,-10,-1,-1,3,4,2,8,2,25,-4,42,9,12,3,29,5,14,0,29,7,65,3,18,3,28,1,84,9,4,2,-24,-2,-5,2,-9,-3,-11,3,-6,-2,-9,-1,-1,4,6,5,6,-3,8,4,19,-2,23,3,20,-1,4,3,23,-2,27,1,25,-3,-5,-4,-16,-5,4,-1,10,2,28,4,5,0,-5,-5,19,2,24,5,7,-3,7,2,2,3,12,0,5,3,32,5,45,-7,10,-4,-8,-8,-8,-3,5,0,16,6,-2,11,-10,5,-41,12,3,1,36,-1,37,0,26,2,11,-2,27,-2,4,2,-38,4,9,7,-9,6,-1,4,5,5,9,1,17,9,55,15,26,6,21,1,23,5,8,0,32,-4,7,-3,37,-4,10,-2,8,-5,-16,-1,-18,-6,-59,-7,72,0,4,-5,5,0,16,2,28,-1,12,1,17,-2,8,-4,-40,-17,-13,0,2,-3,13,0,7,-2,17,2,28,0,9,3,2,4,4,3,8,1,23,-1,37,1,30,-1,25,2,32,-2,14,-2,27,-6,8,-4,-8,-5,18,3,16,-3,3,-8,6,-5,-7,-3,8,0,14,4,3,2,-9,3,15,1,7,-7,7,-11,15,1,1,-3,-13,-13,-7,-2,2,3,-6,3,-14,1,-25,7,-8,0,13,-5,12,-8,14,2,6,-4,18,-4,-5,-8,-35,-14,-36,-8,-17,-6,-28,-4,-20,-6,-26,-4,-8,-4,-19,-3,4,-3,-5,-5,-15,-4,-22,-2,-44,-17,-22,-4,-24,0,-30,-14,-25,-2,-25,-17,-27,-9,28,3,18,5,13,8,8,2,32,2,32,0,26,4,4,3,37,3,12,5,15,-1,11,1,28,7,18,3,4,3,-7,2,-31,-4,-20,2,-2,3,10,7,20,4,40,-4,4,6,20,-2,-16,-3,9,-7,37,-6,33,2,7,5,-5,6,10,-2,7,-4,12,-10,-3,-3,-10,-6,6,-3,10,-3,0,-15,-5,-5,-13,-5,2,-4,8,-5,17,-1,3,1,-21,4,-4,3,10,7,6,6,2,4,-1,5,16,5,-17,5,-1,3,17,2,10,2,38,1,26,5,58,-1,40,-4,58,-1,21,-2,3,-3,-24,-1,-4,-5,2,-6,27,-6,23,-3,16,-4,43,0,20,-2,37,2,7,-1,7,-3,26,-1,11,1,-13,4,1,2,32,-3,7,2,8,7,8,3,-12,7,-3,5,-1,5,6,5,4,1,15,-2,11,5,26,2,54,-12,-1,-4,33,5,4,-2,-4,-4,2,-1,13,-3,14,5,6,4,4,1,35,-3,11,-2,3,-2,13,-3,-1,-4,16,0,16,-3,-1,-3,2,-1,9,0,-2,-4,-23,-7,21,-1,10,-5,2,-4,-22,-6,-20,-2,6,-2,29,-1,8,-2,7,-6,0,-8,-7,-3,-17,-1,-23,8,-34,10,-4,-1,6,-6,26,-11,28,-16,10,3,2,3,-2,4,5,-2,12,-9,-11,0,-15,-2,-5,-2,4,-3,11,0,31,-24,13,-3,13,-6,13,-2,6,-1,5,4,4,-1,3,-7,6,-3,7,0,14,4,6,4,17,15,7,2,-3,3,1,3,11,14,17,13,5,1,7,-8,17,-8,14,-5,13,-3,21,-3,30,0,6,4,10,3,17,1,10,4,27,0,51,-10,26,-11,15,-3,3,0,-1,1,-7,3,9,2,4,2,11,1,-20,3,0,3,6,4,10,4,14,-2,8,4,5,-1,11,-3,10,-6,39,3,-2,3,-12,7,1,9,-18,4,14,2,10,7,17,3,-28,1,-9,-3,-13,0,-2,8,23,9,43,0,31,4,-5,2,0,5,-16,6,2,3,5,0,26,-2,10,-4,27,-3,73,-1,84,-6,53,-7,-1,-4,-73,1,-10,-4,-21,-2,7,-3,9,-1,28,4,90,2,-2,-3,-10,-6,-24,-9,-6,0,12,10,-9,0,-15,4,-3,-1,-2,-7,5,-2,0,-4,-18,-2,-17,1,1,-4,-5,-4,10,-3,31,2,14,3,14,6,27,14,18,6,57,0,55,-8,13,-3,10,-5,3,-5,-7,-3,-41,-2,-7,-4,2,-1,27,-2,18,-3,10,-4,27,0,3,-3,-28,-12,43,8,31,-5,9,-3,17,-10,-17,-2,38,-7,64,2,31,5,31,3,28,0,15,3,77,-1,30,-2,33,-5,33,-7,18,-8,10,-7,4,-9,-1,-5,-7,-7,0,-5,-6,-6,6,-4,45,-6,8,-3,7,-25,13,-6,2,-4,-11,-12,-13,-6,12,1,6,5,7,8,7,2,3,2,0,8,-4,7,0,5,3,4,31,12,52,5,15,-1,22,2,11,-1,18,-6,62,-1,11,-2,45,-2,37,12,12,-1,14,-7,8,-15,51,-10,5,-8,10,-7,46,2,23,11,0,5,-6,6,-8,6,-7,10,-21,2,2,3,8,4,7,5,1,4,-2,8,104,-7,36,-7,4,5,4,1,25,-3,42,-1,57,2,50,-13,24,-1,27,-6,45,-6,6,-4,16,-2,29,-12,-17993,-2],[-777,3311,47,8,-26,-14,32,-26,43,-3,1,-24,-51,-31,-184,-48,-218,18,-2,13,62,15,-30,-3,23,15,-121,12,81,15,20,17,-124,1,60,12,-28,4,19,17,51,-14,-23,27,75,-21,-13,-15,26,-23,47,42,36,-17,32,21,35,-22,-8,21,37,-10,66,28,35,-15],[297,2673,-10,-1,-4,1,2,1,12,-1],[266,2669,-7,1,12,2,8,0,-13,-3],[-126,2475,-1,-4,-5,2,6,2],[-101,2462,0,-3,-7,0,-4,0,1,4,10,-1],[8354,-3866,114,-10,-141,-9,-16,9,10,13,33,-3],[-3485,-2746,62,-2,21,-34,-45,15,-44,5,6,16],[2891,4077,37,-6,-32,-11,-70,-1,-53,7,118,11],[2736,4056,149,-16,-108,-5,-74,6,33,15],[-7779,951,-23,36,10,27,52,-38,-39,-25],[-221,2709,-10,-6,-8,1,4,7,4,2,6,6,5,1,3,-7,-4,-4],[-330,2829,-3,1,8,4,1,-1,-2,-2,-4,-2],[-255,2772,-11,2,-4,7,4,4,3,1,5,-3,3,-4,0,-7],[-289,2817,-27,-2,0,1,1,1,6,1,2,7,-8,3,0,2,10,2,8,-5,9,-2,-1,-8],[-306,2797,3,-11,-1,-3,-11,-3,2,4,-2,2,1,3,-3,0,-8,-4,3,7,16,5],[-299,2791,-3,-1,-2,2,2,4,6,3,-3,1,2,2,11,4,-13,-15],[-52,3026,-1,-1,-5,5,3,6,5,0,0,-3,-2,-1,0,-6],[-65,3027,1,-4,2,1,4,-3,5,1,0,-3,-7,-19,-5,-6,-3,2,4,10,-2,3,-4,0,-4,0,-1,2,-7,1,-1,2,8,1,6,2,-3,6,-7,2,11,5,3,0,0,-3],[-39,3041,-2,-7,-5,1,0,5,5,2,2,-1],[-158,2940,-6,-1,-4,3,-2,2,2,2,4,-1,3,-4,3,-1],[-210,2666,8,-1,-2,-2,-15,-6,-2,2,-3,0,-4,4,0,6,12,2,6,-5],[-128,2962,-5,-1,3,3,3,1,7,0,-8,-3],[-146,2937,-6,4,5,1,2,-1,-1,-4],[-153,2951,0,-1,15,-2,-3,-3,-9,2,-10,-1,-2,4,-3,-2,-2,1,1,8,8,0,5,-2,2,-2,-2,-2],[-331,3090,-2,-2,-9,4,-2,3,11,-2,2,-3],[-335,3072,1,-1,-1,0,-9,6,-3,5,2,0,8,-4,2,-6],[-331,3111,-2,-6,-5,2,-4,-1,6,-7,0,-1,-4,1,-11,6,-8,9,11,2,17,-5],[-137,2959,-4,-1,-2,1,0,3,-8,3,-1,2,3,0,8,-5,5,-1,-1,-2],[-310,2918,-6,-9,-12,-4,8,-1,-1,-3,-13,-5,-6,-5,-3,0,-5,-3,-6,3,11,5,-10,5,4,2,-6,2,1,4,3,2,7,-2,8,0,-3,6,27,10,2,-3,0,-4],[-314,2848,-3,0,-5,3,6,2,3,-3,-1,-2],[-307,2875,-1,-5,1,-4,13,-3,9,0,2,-2,-13,-8,-3,-1,-2,1,-1,7,-14,0,-6,6,-12,2,-4,4,3,3,6,0,-2,3,12,2,1,3,6,0,4,-4,1,-4],[-360,2884,5,-3,-4,-4,-7,0,-10,3,1,2,15,2],[-362,2856,-7,1,-2,4,1,4,-1,4,8,0,1,-13],[-497,2696,-1,-2,-5,4,-10,1,4,2,9,-1,2,-1,1,-3],[-371,2848,-6,0,1,2,3,1,3,-1,-1,-2],[503,2744,-5,0,-8,1,-1,8,11,-4,3,-5],[415,2739,-1,-1,1,7,5,8,3,0,-4,-4,0,-4,13,0,-2,-2,-13,-1,-2,-3],[-53,2535,-10,-6,-13,4,-2,0,2,2,10,4,13,-4],[244,2654,-5,-4,-3,2,1,3,7,4,0,-5],[197,2587,7,-5,-6,-1,-7,4,-4,-1,-2,3,12,0],[429,2736,-6,-1,-3,1,1,1,4,1,4,-1,0,-1],[-4329,3551,88,0,6,31,-61,17,82,3,-69,34,70,4,-60,15,140,32,53,-2,50,-29,16,-19,-47,-21,30,7,-15,-28,54,27,63,-28,-6,24,59,-9,-45,20,58,8,104,-15,-37,-36,83,16,-47,-17,25,-1,-15,-23,57,28,-17,-19,51,-6,14,20,63,-8,21,-14,-71,-20,98,11,-61,-31,31,3,-8,-19,44,31,70,1,40,-14,-85,-22,64,8,-11,-11,13,-2,34,19,44,-26,-104,-14,129,-12,-118,-9,60,-2,-2,-14,-72,4,129,-20,-9,-20,35,11,-11,-22,25,12,27,-20,24,18,-5,-13,59,-11,-43,-10,83,-6,-33,-21,79,11,41,-20,-63,-12,28,-18,-30,0,-3,-20,-40,11,-7,-47,-90,42,48,28,-69,-16,8,10,-66,21,-12,-15,-33,7,26,-26,-69,13,28,-16,53,-22,21,-31,63,-5,18,-14,-25,-7,58,-30,-12,-23,-27,26,26,-42,-24,1,3,-16,-140,56,7,-16,-58,14,147,-75,-14,-17,-254,60,-33,18,31,8,-56,12,-48,29,10,9,-40,-8,-31,20,-11,-18,-145,-5,-20,20,44,35,93,-31,-17,23,112,9,-43,34,110,55,-53,55,-57,11,-19,24,-89,-18,41,30,-165,65,-17,-10,29,-19,-137,5,32,-19,-396,39,-31,27,116,-2,-135,24,-1,46,32,34,75,31,130,4,-77,-52,22,-43,60,-27,-78,-17],[-3474,4151,153,-5,-103,-13,242,8,20,-18,98,-9,-370,-49,192,7,-236,-53,-58,8,23,-15,-90,-6,75,-1,-41,-17,-276,-12,118,-23,-202,1,207,-18,-99,-10,61,-10,-141,-19,-24,-29,-158,8,19,-8,-28,-7,178,-12,15,-11,-15,-9,-126,-20,-86,27,14,-13,-99,11,-3,-16,-43,-3,-163,5,-5,19,-2,-18,-52,4,4,16,47,13,87,5,-60,30,164,-21,107,32,-66,-24,-69,12,54,21,-34,3,6,14,-40,-20,-99,3,38,30,252,10,-133,1,42,3,-142,39,-4,21,139,-2,162,-31,-125,36,306,27,-93,5,92,23,-206,-38,-207,-7,-65,10,158,21,-222,-24,-72,14,211,17,-234,-12,-16,7,37,4,-24,3,104,10,-202,8,330,15,-79,12,86,11,272,-29,-149,27,72,19,113,-5,-71,12,208,-19,-56,23,223,-14,-39,9,31,9,167,-3],[-4715,3588,63,-21,3,-24,71,-34,-38,3,17,-10,-45,-19,123,-10,-41,-9,38,-20,12,-31,48,50,62,-22,11,-24,-26,-3,1,-17,48,-38,40,15,44,60,41,5,-32,53,156,-10,-19,-7,69,-16,-29,-15,35,-7,-65,-15,63,-47,-8,-22,-97,-34,-86,26,63,-34,-142,15,37,-20,-75,-39,-198,31,220,-38,-54,-51,-97,-2,-6,-23,-33,-5,-144,28,149,-42,-3,-16,-79,-8,21,-11,-31,-3,2,-19,-34,10,15,-7,-34,-14,13,-9,-72,-63,-10,-72,34,-17,-3,-21,11,22,47,-1,37,-70,-18,-20,110,15,246,-81,23,-13,-7,-13,148,-1,5,-101,35,-30,-11,-11,58,-23,11,-19,-21,-13,38,8,38,-26,-17,29,19,14,20,-21,-4,29,27,24,-28,88,-36,33,97,31,62,53,-18,70,-81,46,40,50,19,-5,2,22,-14,3,-1,37,-29,0,33,37,-31,36,38,15,137,-23,47,18,103,-43,-11,-9,22,-14,97,-7,-10,-47,-49,-3,46,-5,3,-29,17,-2,-10,-22,-31,-5,89,-1,1,-29,-34,-13,51,29,17,-24,66,40,18,-18,-2,19,33,12,-16,8,11,13,22,-5,-20,20,47,24,-14,-12,25,2,43,-43,-28,-7,37,0,18,-19,-33,-17,47,8,-33,-24,65,-5,-27,-22,58,-23,-2,-17,-56,6,54,-22,-15,-6,13,-12,56,-11,-14,-36,43,12,16,-6,-20,-18,29,19,93,-30,-150,-47,15,-9,-12,-11,120,42,-19,5,45,-2,4,-35,41,15,28,-14,8,-42,-26,-5,32,-17,-65,-37,-76,-8,-79,-52,-321,-2,-44,-44,-45,-7,-70,-50,-67,13,58,-14,-7,-22,-63,-47,-153,-63,17,-10,-36,-17,57,21,20,29,132,52,114,79,136,32,63,-17,-4,-25,-118,-20,100,-15,-31,-31,24,-2,15,-41,89,-30,40,11,46,-28,-162,-38,-60,-51,-32,15,1,34,83,42,15,-16,39,17,-76,0,28,24,-16,5,-62,-36,-62,-3,7,-17,-54,-22,-35,10,-23,-30,-48,-11,-43,-71,31,-29,21,3,-5,13,8,-20,-61,-10,-12,16,-6,-21,-70,-5,-53,-26,1,24,-6,-73,-42,-42,-30,27,22,25,-19,-10,21,-68,-45,-63,14,40,-34,38,23,40,-35,-13,12,-59,-45,16,10,24,-14,-24,53,-25,-12,-11,-31,24,41,-29,-8,-15,-15,11,24,-22,-49,13,63,-20,23,-55,-20,42,6,-27,-46,5,33,-26,16,7,-21,-24,-43,8,26,-12,-23,-13,27,-9,-49,-5,-25,-40,-144,-75,-32,-62,70,-220,-22,-79,-32,-4,-35,77,-45,41,16,17,-22,0,9,52,-69,61,-64,-21,-14,30,-80,3,10,11,-50,-16,-1,23,-6,-17,-110,-4,47,-12,-16,-21,28,-30,-50,26,1,-20,-31,0,-57,35,-18,-14,-79,21,-46,-30,12,8,-25,8,7,-16,-49,-37,-39,3,11,-12,-37,-16,-14,-41,-16,7,31,-71,-36,-171,27,-53,-4,-14,-18,37,6,-21,86,-139,73,-33,101,26,45,-11,40,45,19,82,166,30,11,-30,-43,-68,13,-3,-22,-66,-9,29,-16,-24,14,-7,-12,-79,-29,-37,196,4,81,-37,9,-45,-34,-152,89,-118,51,-6,97,36,64,-24,53,-56,-7,32,64,43,10,59,30,24,22,-17,13,28,41,-1,86,57,23,-20,-41,-24,18,-45,-26,-42,25,-39,28,33,-20,63,83,26,-24,20,14,15,18,-35,62,-16,13,-33,95,7,55,-29,70,22,-28,7,121,5,-52,-10,9,-24,97,-35,-22,-38,-19,0,16,-10,57,11,67,-44,17,-21,-10,-46,13,23,22,-4,38,-30,2,-33,11,24,53,-15,4,13,73,-3,10,-27,16,21,47,-18,45,-53,9,14,8,-29,22,2,25,-98,38,-24,3,-25,-69,-62,-35,-64,-34,-10,36,-1,52,32,25,-54,54,14,-16,-46,21,37,43,22,12,37,42,5,131,-55,-5,-26,19,-5,-17,-42,25,36,1,-16,41,21,95,-27,76,3,139,-103,85,-12,25,-62,7,-79,-16,-48,-110,-116,-44,-79,-31,2,-15,-245,-24,-28,-7,-66,-59,-83,-2,-38,-52,-47,-56,11,-74,-17,-178,-118,-27,3,17,-12,-17,-33,-3,-116,-162,-177,73,84,-36,20,1,-36,-35,-31,-34,-88,-75,-77,-102,-11,-81,21,-31,38,12,62,-16,-91,67,-53,-10,-27,33,-24,0,-29,-73,-74,-147,-28,-61,10,14,-29,-17,-76,-61,-13,-72,18,4,-65,20,-16,48,7,-4,-26,-64,7,33,-15,-47,-31,-19,-71,-65,-13,-33,-40,41,-47,46,-8,4,-20,-22,-13,20,-6,-82,-51,-23,-51,-53,-1,28,-8,-47,-43,15,-26,-20,-2,51,-39,-40,8,-72,-26,-16,-53,-35,-1,-36,22,31,-6,32,32,-69,-31,-23,8,14,27,60,8,-60,3,-31,-26,-15,11,28,15,-42,-7,-19,28,75,9,6,-22,10,31,-32,16,26,-18,-46,-12,-34,18,13,21,-58,29,23,16,40,-29,11,14,-18,-8,-33,31,34,10,-17,20,23,0,-5,29,-21,-19,1,40,17,6,-24,1,-5,23,59,-7,-16,24,-25,-15,-22,13,26,5,-17,8,16,13,-8,20,-69,4,39,27,-7,14,45,6,10,18,-3,-33,-19,-8,33,20,-5,-37,5,54,40,1,-23,18,36,25,-29,22,24,95,18,-6,-20,24,25,20,-60,-15,-22,34,37,95,-22,94,22,9,50,103,38,122,-12,102,62,268,-7,100,26,88,-3,85,-11,70,-54,52,-225,136,-22,39,8,24,-71,105,-56,133,-62,93,-59,41,15,15,-20,66,78,87,-6,26,-22,-32,-33,22,2,59,31,23,10,70,59,21,15,58,39,18,37,60,-22,15,7,118,-52,74,14,16,19,-12,-17,18,-67,25,-51,-39,22,-36,-41,-14,-11,34,-10,-14,-23,26,-58,-3,-20,29,-16,-9,-7,34,-76,55,9,-33,-27,15,-6,59,-96,91,16,2,-7,21,-52,-9,-143,40,-150,115,19,-13,-45,20,-81,-38,-346,133,-102,83,-10,20,21,10,-13,11,16,35,-30,56,-112,122,-49,21,7,13,-21,-5,1,45,-120,97,-53,75,-15,60,-36,19,-59,17,15,-87,153,-173,46,-118,62,-43,-29,-29,-18,35,-86,62,-15,69,-131,76,47,-3,1,37,-82,67,-89,177,-52,36,-107,28,0,25,-93,123,3,13,18,-16,-12,26,40,3,-74,-4,-35,46,-33,74,14,54,-23,68,27,170,39,-3,-43,6,12,34,-15,0,-29,71,97,-12,-18,-39,30,28,-2,-31,-22,-8,20,0,19,44,-15,37,-33,19,16,13,-53,7,18,7,-15,25,-13,-19,-28,8,-18,23,10,23,-10,-18,-52,-1,-17,4,27,6,-31,-1,0,19,-59,5,14,22,36,5,-57,-1,20,34,36,-15,-24,20,10,19,-55,-53,-13,19,15,38,-56,31,63,-13,-38,14,7,15,-51,-30,-39,23,36,25,-41,10,44,52,-24,-20,1,41,-26,-57,-25,21,15,8,-15,38,-54,-25,28,31,-95,49,-9,23,26,-4,-21,14,17,2,-42,10,8,22,-39,-7,-35,52,14,-59,-41,8,-13,32,-3,-14,-39,13,47,-28,-27,-11,-159,64,13,22,12,-17,15,11,-23,9,-49,-15,-49,20,-137,-5,-38,16,10,16,-60,-9,-34,12,15,20,-81,-12,7,17,-40,-20,15,-7,-19,-10,34,0,-24,-25,-48,6,-117,-46,35,30,-41,0,25,47,114,8,-49,15,22,15,-170,-59,18,-15,-76,-42,37,-20,-249,-116,-3,-18,-135,-35,-17,12,-91,-39,82,53,70,-5,0,26,142,59,-8,28,21,7,-16,11,36,36,-70,-26,-15,12,21,6,-37,0,-7,-29,-70,33,-89,-21,25,23,-17,2,8,22,-30,35,24,20,-37,-21,5,-14,-66,-9,-73,37,28,18,53,-15,16,8,-24,5,16,2,-77,2,13,9,-35,-1,-30,28,70,42,18,36,56,-9,118,31,-3,30,-26,9,31,18,-92,-21,-171,10,-39,29,38,6,-96,19,181,46,41,0,-20,-18,17,-7,133,5,-66,38,39,-24,67,-2,-81,14,7,16,-91,4,-29,25,-133,38,29,26,117,8,99,65,88,13,13,-16,24,12,-35,6,20,7,88,4,72,27,45,-14,-20,-14,41,13,143,-13,-9,-9,27,-10,436,-17,398,-72,-33,22,76,28,26,-9,-15,-12,232,42,-157,-42,-37,-21,14,-5,68,35,40,-12,43,26,63,2,59,25,-16,16,124,-61,48,40,22,-23,-11,-17,113,23,354,-48,52,-23,-58,-13,-16,-12,15,-4,253,9,105,-37,-26,-8,62,-35,-24,28,29,-4,-40,47,111,39,-126,-23,-23,8,20,16,108,15,84,-43,108,-16,170,-1,25,4,-11,14,59,-23,13,12,-50,3,-22,22,41,9,69,-11,-14,-14,37,10,-19,-36,47,-25,-50,1,32,-21,-13,16,39,16,-20,24,10,14,101,30,-21,19,-37,-10,17,26,42,3,-132,23,-24,24,33,19,-24,-1,-8,22,48,11,-16,12,34,16,45,-7],[-4100,3148,-51,-37,-35,2,-9,11,26,21,69,3],[-4774,3890,109,-3,-12,-14,-122,1,-11,11,36,5],[-4677,3751,-2,-18,-48,-1,-92,18,75,31,67,-30],[-5491,3933,22,-16,-107,-3,-82,6,167,13],[-5264,3646,-83,29,71,13,48,-11,-36,-31],[-5000,3697,141,-6,-22,-16,17,-6,-57,-22,99,-19,-18,-12,9,-24,-85,1,6,-21,-51,-3,-175,70,26,15,46,-18,58,9,-21,15,36,1,-85,13,50,-2,-22,18,48,7],[-4246,3263,21,10,122,-41,19,-21,-10,-10,81,-11,-39,-17,-127,30,-83,-46,-26,28,-71,-5,46,27,22,85,29,-2,16,-27],[-3784,3416,30,-7,-6,-36,-83,-11,-22,22,9,13,72,19],[-3977,3683,117,-8,56,-31,-171,-6,-68,46,66,-1],[-4885,3823,8,-18,-18,-17,28,-17,-27,0,11,-13,-17,-6,-112,-2,-24,20,76,15,-169,-9,32,18,48,-4,-58,24,18,9,96,-27,-13,10,29,1,-64,19,156,-3],[-5171,3966,42,-22,44,10,104,-25,-11,-7,34,-29,-107,17,-179,10,75,17,-76,3,8,11,-41,2,6,12,101,1],[-4594,4057,151,-49,59,11,-12,-14,47,-10,-16,-16,113,-15,-129,-30,-21,16,-11,-16,14,-7,-38,2,-4,-20,-61,21,27,-21,-56,-1,-177,41,143,20,-190,-5,-28,12,63,11,-73,-3,-46,23,126,3,-107,6,42,2,-30,10,12,8,100,-8,-80,14,112,13,-45,12,115,-10],[-4715,3846,54,-7,-16,-17,112,12,101,-19,-106,-4,124,-38,148,-3,101,21,181,-10,41,-18,-44,-11,49,-6,-47,-1,4,-16,-140,2,-23,14,-1,-16,-44,-4,-357,8,-41,30,10,29,-46,26,-109,-5,-80,24,52,16,77,-7],[-4810,3927,64,-8,-21,-8,13,-11,-96,-10,-33,15,36,3,-55,8,-15,23,107,-12],[-5523,3905,42,-1,-62,-12,33,-16,-99,-9,-49,10,-3,18,138,10],[-5778,3868,-38,-11,25,-10,-22,-2,9,-12,-71,-19,-26,8,12,17,-21,-1,-40,-31,-29,9,2,-17,-150,-1,-18,9,24,12,166,46,177,3],[-5415,3803,69,-19,20,19,46,-7,-13,-36,-55,-13,-94,6,-209,-33,-65,16,161,27,-131,-10,13,18,-28,1,-73,-17,-106,9,123,20,-101,-2,108,13,-83,1,94,13,-40,13,325,-47,-40,21,22,9,-44,15,74,21,27,-38],[-4659,3708,141,-15,-88,-55,-105,0,34,-13,-25,-24,-58,0,-22,83,123,24],[-4872,3482,107,-42,-65,-17,-115,24,-33,6,76,20,-10,16,40,-7],[-5726,3630,88,19,75,-13,-21,-21,74,18,-23,17,33,-1,62,-21,47,-47,26,14,-47,63,88,2,53,-21,52,-60,-7,-26,174,-47,3,-22,-63,8,-60,-9,20,-11,63,-13,-56,-18,-110,5,-78,26,-141,-38,-182,-9,-29,35,-141,11,-34,32,278,12,-106,20,-191,-4,-35,21,149,23,-132,-5,-14,3,24,10,-62,5,38,25,-8,14,90,26,114,14,12,-19,-23,-18],[-5987,3706,111,6,104,-40,-176,-38,-61,-23,-22,-36,-124,-20,-45,29,-92,15,102,89,-45,29,160,10,88,-21],[-2773,2577,-29,-11,12,-14,-51,-71,32,25,34,-7,-32,-18,46,-6,-7,-21,43,22,44,-10,-25,-46,54,13,-41,-44,49,18,-15,-24,24,4,-9,-35,-12,-19,-23,-1,-1,25,-27,-15,14,30,-17,21,-79,-50,50,40,-227,4,50,39,-42,2,58,21,-11,20,22,6,37,76,79,26],[248,3054,-8,0,1,5,2,1,3,0,3,-3,-1,-3],[254,3015,0,-6,-4,1,-3,4,1,3,-1,4,3,2,4,-8],[-1498,4178,208,-15,-312,-14,346,9,171,-24,-409,-31,279,-18,148,18,5,-23,-94,-41,175,43,108,-12,161,21,140,-18,-266,-44,41,-8,-27,-8,-184,-12,58,-42,-107,-26,-29,-48,112,1,-49,-14,101,-9,5,-17,-214,-11,126,-24,29,-23,0,-29,-136,-3,63,-2,6,-22,44,17,35,-22,-69,-20,-65,5,1,16,-19,-13,9,-15,89,-8,-8,-17,-91,-12,-159,30,36,-17,-124,-4,37,-10,-51,-5,171,13,105,-24,-13,-40,-88,19,-28,27,-102,-16,92,9,8,-16,-23,-12,158,-30,-26,-18,36,5,12,-48,-43,-3,-3,20,-12,-21,-32,1,-62,38,-122,20,63,-22,-133,-9,16,-15,-50,-13,123,1,-38,-23,93,18,162,-16,-210,-68,-225,-31,-67,19,8,-22,-124,-78,-61,0,11,-15,-106,-27,-12,6,36,29,-44,4,20,-6,-38,-12,16,-15,-99,-8,26,-14,-71,-12,45,-28,-70,-9,48,-8,4,-21,-42,-33,-40,7,27,-11,-13,-12,-52,-1,39,-8,2,-35,-23,-7,12,-5,-35,-55,-45,2,39,-11,-8,-21,-103,14,32,23,-65,-2,9,30,-98,-25,-21,4,23,10,-32,9,-43,21,-5,15,28,9,-40,-4,-35,24,26,28,-30,-11,-57,47,64,23,-66,-6,9,18,70,-1,-6,13,-42,25,9,-23,-64,-20,-24,49,72,23,-105,-9,-8,24,107,40,-120,-36,10,24,52,12,-65,5,-6,22,64,17,95,-12,-86,16,-70,-15,29,33,78,-7,22,16,-111,-4,17,16,95,-1,17,10,-22,-3,8,19,39,2,-39,2,38,41,-97,2,-114,32,193,-15,-55,31,38,-1,-99,9,61,25,-83,-5,15,11,-26,28,-13,-2,22,-23,-24,-20,-82,5,38,41,-37,-10,14,9,-15,5,43,21,-46,6,19,16,-41,12,13,10,-19,18,-51,0,49,20,-115,42,15,7,-13,9,-239,34,-251,-13,-58,15,68,13,-152,21,238,10,5,14,-153,-5,-168,45,345,41,82,46,-133,-1,-18,7,10,10,124,29,75,-6,1,16,78,-3,12,30,38,9,191,-28,-132,32,236,18,43,-10,6,-25,26,11,1,22,174,-20,-70,23,45,5,266,-35,20,35,-62,13,210,1,-240,15,290,14,110,-17,11,8,-40,11,51,6,388,3],[-9000,-4000,1599,0,-128,0,120,11,-397,52,91,24,-177,9,-33,15,14,31,170,2,255,-34,78,17,-34,9,13,9,145,-19,-3,37,-196,19,67,13,144,-15,-47,15,20,11,183,19,72,-12,-17,10,76,16,153,3,64,23,691,-2,316,13,30,29,56,-9,-13,-14,21,-5,-39,-26,121,9,-5,27,31,4,47,-18,-56,-34,412,6,104,-16,124,12,-96,15,18,18,-57,2,-77,42,195,1,-200,17,-24,23,13,5,610,-30,107,32,29,-5,-11,-22,131,1,181,-33,44,6,6,25,42,-9,-5,24,83,-28,96,2,-9,-19,388,33,81,17,42,37,-94,133,86,14,-21,15,36,65,-43,1,2,21,50,-8,0,30,99,36,-6,11,41,10,-13,13,16,12,35,-5,110,53,174,43,27,-21,-71,-6,-39,-24,13,-14,-59,4,-106,-42,16,-14,-27,-18,84,-1,-20,-20,-83,5,3,-23,-57,21,-16,-19,16,-11,-46,4,-7,-25,-34,-4,-7,-38,40,1,-31,-11,23,-3,-8,-11,111,9,-40,-13,89,-71,-21,-12,44,-6,-23,-21,50,-17,-50,-21,46,-8,-61,-10,77,-3,-1,-17,-27,-9,66,-22,-102,-5,60,-29,-52,-16,40,-4,-40,-8,53,2,-12,-12,-61,2,19,-17,-26,-9,-40,14,-37,-16,34,-8,-52,-7,46,-8,-342,-61,-350,2,73,-38,143,-15,-97,-24,-338,17,207,-30,-22,-15,-121,-4,-174,42,28,-21,-19,-11,135,-44,234,6,9,-12,-26,-14,-155,-5,942,0,1862,2,-319,18,-34,24,-178,0,-102,17,3,16,105,52,257,53,532,46,-23,10,66,43,88,-1,55,23,-82,1,14,8,-25,17,247,50,24,33,-66,19,76,-9,39,21,-11,10,81,-37,46,7,-2,35,91,6,18,-7,-27,-23,253,3,26,-23,122,36,362,41,128,-29,68,35,253,-24,44,16,20,-35,83,4,32,29,64,-28,52,20,37,-24,87,-6,306,51,18,19,-17,38,41,9,37,-1,-19,-20,39,0,38,-29,121,-2,55,-23,67,69,309,59,8,18,91,-36,42,38,-38,9,105,-8,-11,38,167,29,166,-31,-43,-7,17,-12,-34,-17,18,-3,73,12,82,-23,515,-14,21,-35,-22,-14,5,-25,-37,-7,9,-24,-91,-21,99,-8,-137,-134,41,-9,55,39,143,45,25,41,77,48,116,0,109,39,61,44,213,29,59,24,380,31,364,-7,166,39,339,-52,72,41,110,14,127,-49,-81,-33,308,24,-52,-21,336,51,84,-35,72,-2,57,40,166,11,43,-20,53,18,418,-38,45,-13,-32,-36,100,12,56,-37,192,0,17,-23,103,0,28,25,81,-35,213,-25,121,-76,-9,30,33,7,388,-56,21,-22,-41,-13,8,-22,-89,9,70,-17,-14,-17,-154,6,62,-23,-118,-24,-26,24,-2,-31,31,-27,-100,9,-49,-43,-76,-5,96,-25,-19,-16,19,-15,-19,-25,99,-46,-22,-17,72,9,82,-32,-221,-11,-49,18,15,-24,-54,-2,-45,-26,18,-6,-22,-8,33,-7,-100,0,1053,0,-17981,0]];
const D = Math.PI / 180;
const LONDON = [-0.1276 * D, 51.5072 * D];
const parse = (c) => {
  if (!c) return [0, 0, 0];
  if (c[0] === '#') { const h = c.length === 4 ? c.slice(1).split('').map((x) => x + x).join('') : c.slice(1, 7); return [0, 2, 4].map((i) => parseInt(h.substr(i, 2), 16)); }
  const m = c.match(/[\d.]+/g); return m ? m.slice(0, 3).map(Number) : [0, 0, 0];
};
const rgba = (c, a) => `rgba(${parse(c)},${a})`;
const mix = (a, b, t) => { const A = parse(a), B = parse(b); return `rgb(${A.map((x, i) => Math.round(x + (B[i] - x) * t))})`; };
const lum = (c) => { const [r, g, b] = parse(c); return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255; };
const ease = (t) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const WMO = { 0: 'Clear', 1: 'Mostly clear', 2: 'Partly cloudy', 3: 'Cloudy', 45: 'Fog', 48: 'Fog', 51: 'Drizzle', 53: 'Drizzle', 55: 'Drizzle', 61: 'Light rain', 63: 'Rain', 65: 'Heavy rain', 71: 'Light snow', 73: 'Snow', 75: 'Heavy snow', 80: 'Showers', 81: 'Showers', 82: 'Heavy showers', 95: 'Thunderstorm' };

class Component extends DCLogic {
  constructor(props) {
    super(props);
    this.state = { hm: '--:--', ss: '--', date: '', zone: 'GMT', p: 0, scrolly: false, wx: null, day: true };
    this.setRoot = (el) => { this.root = el; };
    this.setCanvas = (el) => { this.cv = el; };
    this.p = 0; this.spin = 0; this.drag = null; this.dx = 0; this.dy = 0;
  }
  prep() {
    // Every coastline point as lon/lat in radians, rings kept separate.
    this.rings = LAND.map((ring) => {
      const pts = []; let x = 0, y = 0;
      for (let i = 0; i < ring.length; i += 2) { x += ring[i]; y += ring[i + 1]; pts.push([x / 50 * D, y / 50 * D]); }
      return pts;
    });
    // A web of links between nearby land points, like the reference.
    const nodes = [];
    this.rings.forEach((r) => { for (let i = 0; i < r.length; i += 7) nodes.push(r[i]); });
    const v = nodes.map(([l, f]) => [Math.cos(f) * Math.cos(l), Math.cos(f) * Math.sin(l), Math.sin(f)]);
    const links = []; const lim = Math.cos(7 * D);
    for (let i = 0; i < v.length; i++) {
      let c = 0;
      for (let j = i + 1; j < v.length && c < 3; j++) {
        const d = v[i][0] * v[j][0] + v[i][1] * v[j][1] + v[i][2] * v[j][2];
        if (d > lim && d < 0.99995) { links.push([nodes[i], nodes[j]]); c += 1; }
      }
    }
    this.nodes = nodes; this.links = links;
    const grid = [];
    for (let lat = -80; lat <= 80; lat += 20) { const r = []; for (let lon = -180; lon <= 180; lon += 4) r.push([lon * D, lat * D]); grid.push(r); }
    for (let lon = -180; lon < 180; lon += 20) { const r = []; for (let lat = -88; lat <= 88; lat += 4) r.push([lon * D, lat * D]); grid.push(r); }
    this.grid = grid;
  }
  sun() {
    // Where the sun is overhead right now, to shade the night side.
    const now = new Date(), start = Date.UTC(now.getUTCFullYear(), 0, 0);
    const day = (now - start) / 864e5;
    const decl = -23.44 * Math.cos(2 * Math.PI / 365 * (day + 10)) * D;
    const utc = now.getUTCHours() + now.getUTCMinutes() / 60;
    return [(180 - utc * 15) * D, decl];
  }
  componentDidMount() {
    this.prep();
    const art = !!this.props.art;
    this.setState({ scrolly: art && (window.innerHeight || 0) < 1300 });
    this.reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const clock = () => {
      const d = new Date();
      try {
        const f = (o) => new Intl.DateTimeFormat('en-GB', Object.assign({ timeZone: 'Europe/London' }, o)).format(d);
        const hms = f({ hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).split(':');
        const zone = (new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/London', timeZoneName: 'short' }).formatToParts(d).find((x) => x.type === 'timeZoneName') || {}).value || 'GMT';
        this.setState({ hm: hms[0] + ':' + hms[1], ss: hms[2], date: f({ weekday: 'long', day: 'numeric', month: 'long' }), zone });
      } catch (e) {}
    };
    clock(); this.clockTimer = setInterval(clock, 1000);
    // Live London weather from Open-Meteo (free, no key).
    const weather = () => fetch('https://api.open-meteo.com/v1/forecast?latitude=51.5072&longitude=-0.1276&current=temperature_2m,apparent_temperature,weather_code,wind_speed_10m,is_day&daily=sunrise,sunset&timezone=Europe%2FLondon&forecast_days=1')
      .then((r) => r.json()).then((j) => {
        const c = j.current || {}, dl = j.daily || {};
        const hm = (s) => (s && s[0] ? s[0].slice(11, 16) : '');
        this.setState({ wx: { t: Math.round(c.temperature_2m), feels: Math.round(c.apparent_temperature), sky: WMO[c.weather_code] || 'Mixed', wind: Math.round(c.wind_speed_10m), rise: hm(dl.sunrise), set: hm(dl.sunset) }, day: c.is_day === 1 });
      }).catch(() => {});
    if (this.props.weather) weather();
    if (this.props.weather) this.wxTimer = setInterval(weather, 10 * 60 * 1000);
    // Drag the globe to spin it.
    this.onDown = (e) => { if (e.target !== this.cv) return; this.drag = { x: e.clientX, y: e.clientY, dx: this.dx, dy: this.dy }; this.last = performance.now(); };
    this.onMove = (e) => {
      if (!this.drag) return;
      this.dx = this.drag.dx + (e.clientX - this.drag.x) * 0.4;
      this.dy = clamp(this.drag.dy + (e.clientY - this.drag.y) * 0.3, -50, 50);
      this.last = performance.now();
    };
    this.onUp = () => { this.drag = null; };
    window.addEventListener('pointerdown', this.onDown);
    window.addEventListener('pointermove', this.onMove, { passive: true });
    window.addEventListener('pointerup', this.onUp);
    let seen = 0, prev = performance.now();
    const loop = (now) => {
      this.raf = requestAnimationFrame(loop);
      const dt = Math.min(64, now - prev); prev = now;
      const r = this.root && this.root.getBoundingClientRect();
      const vh = window.innerHeight || 800;
      if (!r || r.bottom < 0 || r.top > vh) return;
      let target = 0;
      if (this.props.art) {
        // Zoom follows the section through the screen: world as it enters, London once it is centred.
        if (this.state.scrolly) target = clamp((vh - r.top) / ((vh + r.height) / 2), 0, 1);
        else { if (!seen) seen = now; const t = ((now - seen) / 1000) % 12; target = t < 2 ? 0 : t < 7.5 ? (t - 2) / 5.5 : t < 10.5 ? 1 : 1 - (t - 10.5) / 1.5; }
      }
      this.p += (target - this.p) * (this.reduce ? 1 : 0.07);
      if (!this.reduce && !this.drag) {
        this.spin += dt * 0.006 * (1 - ease(clamp(this.p * 2.2, 0, 1)));
        if (now - (this.last || 0) > 2500) { this.dx *= 0.97; this.dy *= 0.97; }
      }
      this.draw(now);
      const pct = Math.round(this.p * 100);
      if (pct !== this.state.p) this.setState({ p: pct });
    };
    this.raf = requestAnimationFrame(loop);
  }
  componentWillUnmount() {
    cancelAnimationFrame(this.raf); clearInterval(this.clockTimer); clearInterval(this.wxTimer);
    window.removeEventListener('pointerdown', this.onDown);
    window.removeEventListener('pointermove', this.onMove);
    window.removeEventListener('pointerup', this.onUp);
  }
  draw(now) {
    const cv = this.cv; if (!cv || !this.rings) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const W = cv.clientWidth, H = cv.clientHeight; if (!W || !H) return;
    if (cv.width !== Math.round(W * dpr) || cv.height !== Math.round(H * dpr)) { cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); }
    const x = cv.getContext('2d'); x.setTransform(dpr, 0, 0, dpr, 0, 0);
    const bg = this.props.bg || '#000000', ink = this.props.ink || '#FFFFFF', acc = this.props.accent || '#FFC83A';
    const dark = lum(bg) < 0.45, art = !!this.props.art;
    // Camera: spin freely, then turn to London and dive in.
    const e = ease(this.p), turn = ease(clamp(this.p / 0.4, 0, 1)), zoom = ease(clamp((this.p - 0.3) / 0.7, 0, 1));
    const freeLon = -this.spin * D + 0.6, freeLat = 22 * D;
    const l0 = freeLon + (LONDON[0] - freeLon) * turn - this.dx * D;
    const f0 = freeLat + (LONDON[1] - freeLat) * turn + this.dy * D;
    const narrow = W < 640;
    const base = narrow ? Math.min(W * 0.4, H * 0.3) : Math.min(W, H) * (art ? 0.36 : 0.34);
    const R = base * Math.exp(Math.log(16) * zoom);
    const cx = narrow ? W / 2 : W * (art ? 0.5 : 0.62), cy = narrow ? H * 0.64 : H * 0.54;
    const sf0 = Math.sin(f0), cf0 = Math.cos(f0);
    const proj = (l, f) => {
      const cf = Math.cos(f), sf = Math.sin(f), cl = Math.cos(l - l0);
      return [cx + R * cf * Math.sin(l - l0), cy - R * (cf0 * sf - sf0 * cf * cl), sf0 * sf + cf0 * cf * cl];
    };
    x.fillStyle = bg; x.fillRect(0, 0, W, H);
    // Halo and sphere body.
    if (dark) {
      const g = x.createRadialGradient(cx, cy, R * 0.85, cx, cy, R * 1.35);
      g.addColorStop(0, rgba(ink, 0.16)); g.addColorStop(1, rgba(ink, 0));
      x.fillStyle = g; x.beginPath(); x.arc(cx, cy, R * 1.35, 0, 7); x.fill();
    }
    const body = x.createRadialGradient(cx - R * 0.35, cy - R * 0.35, R * 0.1, cx, cy, R);
    body.addColorStop(0, mix(bg, ink, dark ? 0.12 : 0.06)); body.addColorStop(1, mix(bg, ink, dark ? 0.02 : 0.02));
    x.fillStyle = body; x.beginPath(); x.arc(cx, cy, R, 0, 7); x.fill();
    x.strokeStyle = rgba(ink, dark ? 0.35 : 0.25); x.lineWidth = 1; x.stroke();
    const off = (p) => p[0] < -W || p[0] > 2 * W || p[1] < -H || p[1] > 2 * H;
    const trace = (rings, path) => {
      rings.forEach((ring) => {
        let pen = false;
        for (let i = 0; i < ring.length; i++) {
          const p = proj(ring[i][0], ring[i][1]);
          if (p[2] <= 0 || off(p)) { pen = false; continue; }
          if (pen) path.lineTo(p[0], p[1]); else { path.moveTo(p[0], p[1]); pen = true; }
        }
      });
    };
    // Graticule.
    const gp = new Path2D(); trace(this.grid, gp);
    x.strokeStyle = rgba(ink, dark ? 0.08 : 0.1); x.lineWidth = 1; x.stroke(gp);
    // Plexus web on land.
    const web = new Path2D();
    this.links.forEach(([a, b]) => { const p = proj(a[0], a[1]), q = proj(b[0], b[1]); if (p[2] > 0 && q[2] > 0 && !off(p)) { web.moveTo(p[0], p[1]); web.lineTo(q[0], q[1]); } });
    x.strokeStyle = rgba(ink, dark ? 0.16 : 0.14); x.lineWidth = 0.7; x.stroke(web);
    const dots = new Path2D();
    this.nodes.forEach(([l, f]) => { const p = proj(l, f); if (p[2] > 0 && !off(p)) { dots.moveTo(p[0] + 1.3, p[1]); dots.arc(p[0], p[1], 1.3, 0, 7); } });
    x.fillStyle = rgba(ink, dark ? 0.75 : 0.6); x.fill(dots);
    // Glowing coastlines.
    const coast = new Path2D(); trace(this.rings, coast);
    x.lineJoin = 'round'; x.lineCap = 'round';
    if (dark) { x.shadowColor = rgba(ink, 0.9); x.shadowBlur = 10; }
    x.strokeStyle = rgba(ink, dark ? 0.95 : 0.85); x.lineWidth = 1.3 + zoom * 0.6; x.stroke(coast);
    x.shadowBlur = 0;
    // Night side, from the real position of the sun.
    const [sl, sf] = this.sun();
    const sp = proj(sl, sf);
    const ang = Math.atan2(sp[1] - cy, sp[0] - cx);
    const ng = x.createLinearGradient(cx + Math.cos(ang) * R, cy + Math.sin(ang) * R, cx - Math.cos(ang) * R, cy - Math.sin(ang) * R);
    const k = clamp(0.5 - sp[2] * 0.5, 0.05, 0.95);
    ng.addColorStop(0, rgba(bg, 0)); ng.addColorStop(clamp(1 - k - 0.08, 0, 1), rgba(bg, 0)); ng.addColorStop(clamp(1 - k + 0.12, 0, 1), rgba(bg, dark ? 0.55 : 0.35)); ng.addColorStop(1, rgba(bg, dark ? 0.7 : 0.45));
    x.save(); x.beginPath(); x.arc(cx, cy, R, 0, 7); x.clip(); x.fillStyle = ng; x.fillRect(cx - R, cy - R, 2 * R, 2 * R); x.restore();
    // London.
    const L = proj(LONDON[0], LONDON[1]);
    if (L[2] > 0) {
      const pulse = this.reduce ? 0.5 : (now / 1600) % 1;
      const g = x.createRadialGradient(L[0], L[1], 0, L[0], L[1], 60 + zoom * 60);
      g.addColorStop(0, rgba(acc, 0.5)); g.addColorStop(1, rgba(acc, 0));
      x.fillStyle = g; x.beginPath(); x.arc(L[0], L[1], 60 + zoom * 60, 0, 7); x.fill();
      x.strokeStyle = acc; x.lineWidth = 2; x.globalAlpha = 1 - pulse;
      x.beginPath(); x.arc(L[0], L[1], 6 + pulse * (24 + zoom * 40), 0, 7); x.stroke(); x.globalAlpha = 1;
      x.fillStyle = acc; x.beginPath(); x.arc(L[0], L[1], 5.5, 0, 7); x.fill();
      x.strokeStyle = bg; x.lineWidth = 2; x.stroke();
      x.font = '700 12px ' + (this.props.mono || 'ui-monospace, Menlo, monospace'); x.fillStyle = ink;
      x.fillText('LONDON', L[0] + 13, L[1] - 9);
    }
  }
  renderVals() {
    const p = this.props, art = !!p.art, scrolly = this.state.scrolly;
    const bg = p.bg || '#000000', ink = p.ink || '#FFFFFF';
    const w = this.state.wx;
    const chips = w ? [
      { k: 'Weather', v: `${w.t}°C · ${w.sky}` },
      { k: 'Feels like', v: `${w.feels}°C` },
      { k: 'Wind', v: `${w.wind} km/h` },
      { k: this.state.day ? 'Sunset' : 'Sunrise', v: this.state.day ? w.set : w.rise }
    ] : [];
    return {
      setRoot: this.setRoot, setCanvas: this.setCanvas, art,
      bg, ink, muted: p.muted || '#9A9A9A', accent: p.accent || '#FFC83A',
      font: p.font || 'inherit', mono: p.mono || 'ui-monospace, Menlo, monospace',
      track: rgba(ink, 0.18), chipBg: rgba(bg, 0.55), chipLine: rgba(ink, 0.14),
      outerH: art && scrolly ? 'min(780px, 92vh)' : (art ? '680px' : '560px'), 
      innerH: art && scrolly ? '100vh' : '100%',
      radius: '24px',
      wxBottom: art ? '56px' : '28px',
      hm: this.state.hm, ss: this.state.ss, date: this.state.date, zone: this.state.zone,
      chips, pct: this.state.p
    };
  }
}

  Component.__tpl = (html, $v, C) => html`<div ref=${$v.setRoot} style="position: relative; height: ${$v.outerH}; font-family: ${$v.font}; color: ${$v.ink}">
  <div style="position: sticky; top: 0; height: ${$v.innerH}; overflow: hidden; border-radius: ${$v.radius}; background: ${$v.bg}">
    <canvas ref=${$v.setCanvas} aria-label="A globe that turns to London. Drag to spin it." role="img" style="position: absolute; inset: 0; width: 100%; height: 100%; display: block; cursor: grab; touch-action: pan-y"></canvas>
    <div style="position: absolute; left: 0; top: 0; right: 0; padding: 28px 32px; display: flex; flex-wrap: wrap; justify-content: space-between; gap: 18px; pointer-events: none">
      <div style="display: flex; flex-direction: column; gap: 6px">
        <span style="font: 500 12px ${$v.mono}; letter-spacing: .1em; text-transform: uppercase; color: ${$v.muted}">Based in</span>
        <span style="font-size: clamp(30px, 4.2vw, 56px); font-weight: 800; letter-spacing: -.03em; line-height: 1">London, UK</span>
        <span style="font: 500 13px ${$v.mono}; color: ${$v.muted}">51.5072° N · 0.1276° W</span>
      </div>
      <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 6px; text-align: right">
        <span style="font: 500 12px ${$v.mono}; letter-spacing: .1em; text-transform: uppercase; color: ${$v.muted}">Local time · ${$v.zone}</span>
        <span style="font: 700 clamp(26px, 3.2vw, 42px) ${$v.mono}; font-variant-numeric: tabular-nums; letter-spacing: -.02em">${$v.hm}<span class="gl-anim" style="color: ${$v.accent}; animation: gl-blink 1s steps(1) infinite">:</span>${$v.ss}</span>
        <span style="font: 500 13px ${$v.mono}; color: ${$v.muted}">${$v.date}</span>
      </div>
    </div>
    <div style="position: absolute; left: 32px; bottom: ${$v.wxBottom}; display: flex; flex-wrap: wrap; gap: 10px; pointer-events: none">
      ${($v.chips || []).map((w) => html`
        <span style="display: inline-flex; flex-direction: column; gap: 3px; padding: 10px 14px; border-radius: 14px; background: ${$v.chipBg}; border: 1px solid ${$v.chipLine}; backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px)">
          <span style="font: 500 10.5px ${$v.mono}; letter-spacing: .08em; text-transform: uppercase; color: ${$v.muted}">${w?.k}</span>
          <span style="font-size: 15px; font-weight: 700; white-space: nowrap">${w?.v}</span>
        </span>
      `)}
    </div>
    ${($v.art) ? html`
      <div style="position: absolute; left: 32px; right: 32px; bottom: 24px; display: flex; align-items: center; gap: 14px; font: 500 12px ${$v.mono}; color: ${$v.muted}; pointer-events: none">
        <span>globe</span>
        <span style="position: relative; flex: 1; height: 2px; background: ${$v.track}"><span style="position: absolute; left: 0; top: 0; bottom: 0; width: ${$v.pct}%; background: ${$v.accent}"></span></span>
        <span>London</span>
      </div>
    ` : null}
  </div>
</div>`;
  Component.defaultProps = {"art":true,"weather":false,"bg":"#000000","ink":"#FFFFFF","muted":"#9A9A9A","accent":"#FFC83A","font":"inherit","mono":"ui-monospace, Menlo, monospace"};
  const off = Component.prototype.componentWillUnmount;
  Component.prototype.componentWillUnmount = function () { this.__alive = false; if (off) off.call(this); };
  return Component;
})();

C.Services = (() => {
  const DCLogic = DCBase;

const parse = (c) => {
  if (!c) return [0, 0, 0, 1];
  if (c[0] === '#') { const h = c.length === 4 ? c.slice(1).split('').map((x) => x + x).join('') : c.slice(1, 7); return [0, 2, 4].map((i) => parseInt(h.substr(i, 2), 16)).concat(1); }
  const m = c.match(/[\d.]+/g) || []; return [+m[0] || 0, +m[1] || 0, +m[2] || 0, m[3] == null ? 1 : +m[3]];
};
const rgba = (c, a) => { const v = parse(c); return `rgba(${v[0]},${v[1]},${v[2]},${a})`; };
const icon = (d, color) => 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="${d}"/></svg>`);
class Component extends DCLogic {
  renderVals() {
    const p = this.props;
    const ink = p.ink || '#121212', cardInk = p.cardInk || ink, card = p.card || '#FFFFFF', on = p.onAccent || '#FFFFFF';
    const solid = parse(card)[3] > 0.6 && card !== 'transparent';
    const cardMuted = solid ? rgba(cardInk, 0.68) : (p.muted || '#5C5B57');
    const items = [
      { no: '01', title: 'Data analysis and BI', icon: icon('M4 20V10M10 20V4M16 20v-7M22 20H2', on), text: 'I clean, query and model data, then present it so a business can act on it.', tools: ['SQL', 'Python', 'dbt', 'Power BI'], lead: 'SELECT ', code: 'day, SUM(sales)\nFROM orders\nGROUP BY day;' },
      { no: '02', title: 'Software engineering', icon: icon('M8 7l-5 5 5 5M16 7l5 5-5 5M14 4l-4 16', on), text: 'I build APIs, data pipelines and databases, test them and deploy them to the cloud.', tools: ['Python', 'FastAPI', 'Docker', 'Azure'], lead: 'def ', code: 'save(record):\n    db.insert("payments", record)' },
      { no: '03', title: 'AI and app products', icon: icon('M12 3l2.5 5.5L20 11l-5.5 2.5L12 19l-2.5-5.5L4 11l5.5-2.5z', on), text: 'I take ideas to working apps, including LLM tools and mobile apps.', tools: ['LLM APIs', 'Streamlit', 'React Native', 'Expo'], lead: 'reply = ', code: 'client.chat.create(\n    messages=history)' }
    ];
    return {
      items, ink, muted: p.muted || '#5C5B57', card, cardInk, cardMuted,
      line: p.line || 'rgba(18,18,18,.12)', chipLine: rgba(cardInk, 0.2),
      accent: p.accent || '#121212', onAccent: on,
      codeBg: rgba(cardInk, 0.06), codeInk: cardInk, codeAccent: solid ? (p.accent || '#121212') : (p.accent || '#121212'),
      font: p.font || 'inherit', mono: p.mono || 'ui-monospace, monospace',
      headFont: p.headFont || 'inherit', headWeight: p.headWeight || '900', headCase: p.headCase || 'uppercase',
      headSize: p.headSize || 'clamp(48px, 7vw, 112px)', headTrack: p.headCase === 'none' ? '-.03em' : '-.04em',
      radius: p.radius || '20px', gap: '20px', kicker: p.kicker || '( what I do )',
      blur: p.blur || 'none', shadow: solid ? '0 30px 60px -40px rgba(0,0,0,.35)' : 'none'
    };
  }
}

  Component.__tpl = (html, $v, C) => html`<div style="color: ${$v.ink}; font-family: ${$v.font}">
  <div style="display: flex; flex-wrap: wrap; justify-content: space-between; align-items: end; gap: 16px 40px; margin-bottom: 36px">
    <div>
      <p style="margin: 0 0 14px; font: 500 13px ${$v.mono}; color: ${$v.muted}">${$v.kicker}</p>
      <h2 style="margin: 0; font-family: ${$v.headFont}; font-weight: ${$v.headWeight}; font-size: ${$v.headSize}; line-height: .92; letter-spacing: ${$v.headTrack}; text-transform: ${$v.headCase}">What I do</h2>
    </div>
    <p style="max-width: 460px; margin: 0; font-size: 17px; line-height: 1.55; color: ${$v.muted}">I work across the full path from raw data to a finished product. These are the three areas I bring to a team.</p>
  </div>
  <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 330px), 1fr)); gap: ${$v.gap}">
    ${($v.items || []).map((s) => html`
      <article class="sv-card" style="display: flex; flex-direction: column; gap: 22px; padding: 30px; border-radius: ${$v.radius}; background: ${$v.card}; color: ${$v.cardInk}; border: 1px solid ${$v.line}; box-shadow: ${$v.shadow}; backdrop-filter: ${$v.blur}; -webkit-backdrop-filter: ${$v.blur}">
        <div style="display: flex; justify-content: space-between; align-items: center">
          <span style="font: 500 13px ${$v.mono}; color: ${$v.cardMuted}">${s?.no}</span>
          <span aria-hidden="true" style="width: 40px; height: 40px; border-radius: 12px; display: grid; place-items: center; background: ${$v.accent}; color: ${$v.onAccent}"><img src=${s?.icon} alt="" width="22" height="22" /></span>
        </div>
        <div>
          <h3 style="margin: 0 0 10px; font-size: 26px; font-weight: 800; letter-spacing: -.02em; line-height: 1.1">${s?.title}</h3>
          <p style="margin: 0; font-size: 16px; line-height: 1.55; color: ${$v.cardMuted}">${s?.text}</p>
        </div>
        <ul style="list-style: none; margin: 0; padding: 0; display: flex; flex-wrap: wrap; gap: 8px">
          ${(s?.tools || []).map((t) => html`
            <li style="padding: 6px 11px; border-radius: 999px; border: 1px solid ${$v.chipLine}; font: 500 12px ${$v.mono}">${t}</li>
          `)}
        </ul>
        <pre style="margin: auto 0 0; padding: 16px 18px; border-radius: 12px; background: ${$v.codeBg}; color: ${$v.codeInk}; font: 500 13px/1.6 ${$v.mono}; overflow-x: auto; white-space: pre"><span style="color: ${$v.codeAccent}">${s?.lead}</span>${s?.code}</pre>
      </article>
    `)}
  </div>
</div>`;
  Component.defaultProps = {"ink":"#121212","muted":"#5C5B57","card":"#FFFFFF","cardInk":"#121212","line":"rgba(18,18,18,.12)","accent":"#121212","onAccent":"#FFFFFF","font":"inherit","mono":"ui-monospace, monospace","headFont":"inherit","headWeight":"900","headCase":"uppercase","headSize":"clamp(48px, 7vw, 112px)","radius":"20px","kicker":"( what I do )","blur":"none"};
  const off = Component.prototype.componentWillUnmount;
  Component.prototype.componentWillUnmount = function () { this.__alive = false; if (off) off.call(this); };
  return Component;
})();

C.Projects = (() => {
  const DCLogic = DCBase;

const parse = (c) => {
  if (!c) return [0, 0, 0, 1];
  if (c[0] === '#') { const h = c.length === 4 ? c.slice(1).split('').map((x) => x + x).join('') : c.slice(1, 7); return [0, 2, 4].map((i) => parseInt(h.substr(i, 2), 16)).concat(1); }
  const m = c.match(/[\d.]+/g) || []; return [+m[0] || 0, +m[1] || 0, +m[2] || 0, m[3] == null ? 1 : +m[3]];
};
const rgba = (c, a) => { const v = parse(c); return `rgba(${v[0]},${v[1]},${v[2]},${a})`; };
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
const uri = (body) => 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 560 360" font-family="Helvetica, Arial, sans-serif">${body}</svg>`);

// Small illustrations of each product, drawn in the page colours.
function art(kind, C) {
  const T = (x, y, s, size, w, fill, anchor) => `<text x="${x}" y="${y}" font-size="${size}" font-weight="${w || 400}" fill="${fill || C.ink}" text-anchor="${anchor || 'start'}">${esc(s)}</text>`;
  const bar = (x, y, w, h, fill, r) => `<rect x="${x}" y="${y}" width="${Math.max(0, w)}" height="${h}" rx="${r == null ? 4 : r}" fill="${fill}"/>`;
  const top = (s) => `${bar(24, 22, 512, 30, C.soft, 15)}<circle cx="44" cy="37" r="5" fill="${C.hot}"/>${T(58, 42, s, 13, 500, C.muted)}`;
  if (kind === 'property') {
    const rows = [['Elm Grove', 'SE15 · Southwark · Terraced', '£845k', 'Value pick · 12% below area', 86], ['Albion Road', 'N16 · Hackney · Flats', '£520k', '4 min to station', 81], ['Cedar Avenue', 'TW1 · Richmond · Semis', '£1.05m', 'Low crime', 77]];
    return uri(top('egeerenler.com/london-property-finder') + rows.map((r, i) => {
      const y = 72 + i * 92;
      return bar(24, y, 512, 80, C.card, 14) + `<circle cx="70" cy="${y + 40}" r="25" fill="none" stroke="${C.hot}" stroke-width="4"/>` + T(70, y + 46, r[4], 18, 800, C.ink, 'middle') +
        T(112, y + 32, r[0], 19, 800) + T(112, y + 54, r[1], 13, 400, C.muted) + T(516, y + 34, r[2], 19, 800, C.ink, 'end') + T(516, y + 56, r[3], 12, 600, C.hot, 'end');
    }).join(''));
  }
  if (kind === 'energy') {
    const pts = []; for (let i = 0; i <= 48; i++) { const h = i / 2; const v = 0.42 + 0.22 * Math.exp(-Math.pow((h - 8.5) / 2.2, 2)) + 0.32 * Math.exp(-Math.pow((h - 18) / 2.6, 2)) - 0.12 * Math.exp(-Math.pow((h - 4) / 2, 2)); pts.push([40 + i * 10, 230 - v * 160]); }
    const line = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join('');
    const band = pts.map((p, i) => (i ? 'L' : 'M') + p[0] + ' ' + (p[1] - 14)).join('') + pts.slice().reverse().map((p) => 'L' + p[0] + ' ' + (p[1] + 14)).join('') + 'Z';
    const stat = (x, n, l, hi) => bar(x, 262, 160, 76, hi ? C.hot : C.card, 12) + T(x + 16, 298, n, 26, 800, hi ? C.onHot : C.ink) + T(x + 16, 322, l, 12, 500, hi ? C.onHot : C.muted);
    return uri(T(28, 40, "Tomorrow's demand, Great Britain", 16, 800) + T(28, 60, 'Half-hourly forecast with an 80% range', 12, 400, C.muted) +
      [90, 130, 170, 210].map((y) => `<path d="M40 ${y}H520" stroke="${C.soft}"/>`).join('') + `<path d="${band}" fill="${C.hot}" opacity=".18"/><path d="${line}" fill="none" stroke="${C.hot}" stroke-width="3"/>` +
      stat(24, '3.17%', 'model error', true) + stat(200, '2.93%', 'NESO error') + stat(376, '8.52%', 'naive baseline'));
  }
  if (kind === 'pulse') {
    const lines = [['Victoria', 97], ['Central', 88], ['Northern', 84], ['Elizabeth line', 79]];
    const tile = (x, n, l) => bar(x, 70, 160, 74, C.card, 12) + T(x + 16, 104, n, 24, 800) + T(x + 16, 128, l, 12, 500, C.muted);
    return uri(top('egeerenler.com/london-pulse') + tile(24, '11 / 11', 'Tube lines good') + tile(200, '8,412', 'Bikes free now') + tile(376, 'Good', 'Air quality') +
      T(28, 180, 'Good service, last 7 days', 13, 700) + lines.map((r, i) => { const y = 196 + i * 38; return T(28, y + 18, r[0], 13, 500, C.muted) + bar(150, y + 6, 330, 14, C.soft, 7) + bar(150, y + 6, 330 * r[1] / 100, 14, C.hot, 7) + T(532, y + 18, r[1] + '%', 13, 700, C.ink, 'end'); }).join(''));
  }
  if (kind === 'housing') {
    const rows = [['Hillingdon', 18.6], ['Barking & Dagenham', 18.5], ['Havering', 16.8], ['Camden', -3.7], ['Westminster', -5.6], ['Kensington & Chelsea', -7.3], ['Hammersmith & Fulham', -9.0]];
    const zero = 330, k = 9;
    return uri(T(28, 40, 'London boroughs: change in median price', 16, 800) + T(28, 60, '2020 to 2025, real sales data', 12, 400, C.muted) + `<path d="M${zero} 76V330" stroke="${C.soft}" stroke-width="2"/>` +
      rows.map((r, i) => { const y = 82 + i * 34, w = Math.abs(r[1]) * k, pos = r[1] > 0; return T(zero - (pos ? 10 : w + 10), y + 17, r[0], 13, 500, C.muted, 'end') + bar(pos ? zero : zero - w, y + 4, w, 18, pos ? C.hot : C.ink, 4) + T(pos ? zero + w + 8 : zero + 8, y + 18, (pos ? '+' : '−') + Math.abs(r[1]).toFixed(1) + '%', 12, 700); }).join('') +
      T(28, 346, 'More flats sold, weaker prices: correlation −0.88', 12, 500, C.muted));
  }
  if (kind === 'medi') {
    return uri(top('medipulse-ai.streamlit.app') + bar(196, 76, 340, 58, C.hot, 16) + T(214, 101, "I've had a sore throat and a mild", 14, 500, C.onHot) + T(214, 121, 'fever for two days.', 14, 500, C.onHot) +
      bar(24, 150, 400, 128, C.card, 16) + bar(42, 166, 92, 24, C.soft, 12) + T(88, 183, 'Moderate', 12, 800, C.ink, 'middle') +
      T(42, 214, 'Rest, drink fluids and track your', 14, 400) + T(42, 236, 'temperature. Book a GP if the fever', 14, 400) + T(42, 258, 'lasts more than three days.', 14, 400) +
      bar(24, 298, 512, 40, C.card, 20) + T(46, 323, 'Describe your symptoms…', 13, 400, C.muted));
  }
  if (kind === 'pub') {
    const d = [['Mon', 8], ['Tue', 9], ['Wed', 11], ['Thu', 14], ['Fri', 21], ['Sat', 23], ['Sun', 14]];
    return uri(T(28, 40, 'Sales by weekday', 16, 800) + T(28, 60, 'Share of weekly revenue', 12, 400, C.muted) +
      d.map((r, i) => { const x = 44 + i * 70, h = r[1] * 9; return bar(x, 300 - h, 44, h, i < 3 ? C.hot : C.soft, 6) + T(x + 22, 324, r[0], 12, 600, C.muted, 'middle'); }).join('') +
      T(28, 96, 'Opportunity: grow early-week trade with events', 13, 700, C.hot));
  }
  const cats = [['Rent and bills', 34], ['Groceries', 22], ['Transport', 16], ['Eating out', 12], ['Other', 16]];
  return uri(T(28, 40, 'October spending', 16, 800) + T(28, 60, 'Sample data', 12, 400, C.muted) + T(28, 112, '£1,284', 40, 800) + T(28, 134, 'this month', 13, 500, C.muted) +
    cats.map((r, i) => { const y = 160 + i * 36; return T(28, y + 16, r[0], 13, 500, C.muted) + bar(170, y + 4, 300, 14, C.soft, 7) + bar(170, y + 4, 300 * r[1] / 34, 14, i ? C.ink : C.hot, 7) + T(532, y + 16, r[1] + '%', 13, 700, C.ink, 'end'); }).join(''));
}

const P = [
  { name: 'London Property Finder', kind: 'Live product', status: 'Live', vis: 'property', desc: 'A property search tool for London. You set a budget, the homes you want and what matters to you. It ranks about 38,000 streets on value, rental yield, growth, crime, schools, stations and shops, and links to the homes for sale.', stack: ['Python', 'DuckDB', 'Geospatial', 'JavaScript', 'Leaflet', 'GitHub Actions'], fact: ['Data', 'Seven open data sources, rebuilt every day'], live: ['Open the app', 'https://egeerenler.com/london-property-finder/'], code: 'https://github.com/EgeErenler/london-property-finder', caption: 'Design preview with sample streets. The live app uses real data.' },
  { name: 'UK Energy Demand Forecast', kind: 'Live ML model', status: 'Live', vis: 'energy', desc: "A machine learning model that forecasts Great Britain's electricity demand for every half hour of the next day, and races the official forecast from NESO. It retrains every morning, and its forecasts are saved before each day starts and scored afterwards.", stack: ['Python', 'LightGBM', 'FastAPI', 'Docker', 'MLflow', 'GitHub Actions'], fact: ['Result', '3.17% error, against 2.93% for the official forecast'], live: ['See the forecast', 'https://egeerenler.com/uk-energy-forecast/'], code: 'https://github.com/EgeErenler/uk-energy-forecast', caption: 'Illustration of the live page. Errors are from a 21-month backtest.' },
  { name: 'London Pulse', kind: 'Live pipeline', status: 'Live', vis: 'pulse', desc: "An automated data pipeline that takes London's pulse every 15 minutes: Tube and rail status, Santander Cycles, weather and air quality. dbt models turn the snapshots into a tested data warehouse and a public dashboard.", stack: ['Python', 'dbt', 'DuckDB', 'Parquet', 'GitHub Actions'], fact: ['Data', 'TfL Unified API and Open-Meteo'], live: ['Open the dashboard', 'https://egeerenler.com/london-pulse/'], code: 'https://github.com/EgeErenler/london-pulse', caption: 'Illustration with sample values. The dashboard shows live data.' },
  { name: 'UK Housing Market Analytics', kind: 'Live analysis', status: 'Live', vis: 'housing', desc: "A SQL analysis of every home sold in England and Wales since 2018, about a million sales a year. It shows London's prices stalling while the rest of the country climbed, and how the share of flats explains which boroughs fell.", stack: ['SQL', 'DuckDB', 'Python', 'Tested SQL', 'GitHub Actions'], fact: ['Data', 'HM Land Registry Price Paid Data'], live: ['Open the dashboard', 'https://egeerenler.com/uk-housing-analytics/'], code: 'https://github.com/EgeErenler/uk-housing-analytics', caption: 'Real sales data. The more flats a borough sells, the weaker its prices.' },
  { name: 'Scoretime', kind: 'In development', status: 'In development', vis: 'app', desc: 'A live scores app for UK sports fans on iPhone, Android and the web. Live match stats, line-ups with player ratings, live league tables and a season predictor, on top of my own database of more than 500,000 matches since 1872.', stack: ['React Native', 'Expo', 'Python', 'FastAPI', 'DuckDB'], fact: ['Role', 'Founder, product and engineering'], live: ['Visit the site', 'https://scoretime.app/'], code: 'https://github.com/EgeErenler', codeLabel: 'Follow on GitHub', caption: 'Screens from the current build.' },
  { name: 'MediPulse AI', kind: 'Live app', status: 'Live', vis: 'medi', desc: 'A health triage assistant. People describe their symptoms in plain language, and a large language model rates how urgent they are and suggests the next step.', stack: ['Python', 'Streamlit', 'Groq API'], fact: ['Role', 'Solo build, design to deployment'], live: ['Open the app', 'https://medipulse-ai.streamlit.app'], code: 'https://github.com/EgeErenler/Medipulse-AI-Chatbot', caption: 'Illustration of the app with a sample question.' }
];
const S = [
  { name: 'Pub growth plan', kind: 'MSc consultancy project', vis: 'pub', desc: "A data-driven marketing plan for a pub in Southwark, London. I combined the pub's own sales data with a customer survey and UK market research to find where it could grow.", stack: ['Python', 'Survey analysis', 'Euromonitor Passport'], fact: ['Client', 'Independent pub, Southwark'], code: 'https://github.com/EgeErenler/pub-marketing-analysis' },
  { name: 'Expense Tracker', kind: 'Personal project', vis: 'expense', desc: 'A personal finance tool. It stores every payment in a local database and turns spending into clear charts by category and month.', stack: ['Python', 'SQLite', 'Charts'], fact: ['Stack', 'Python and SQLite'], code: 'https://github.com/EgeErenler/expense-tracker' }
];

class Component extends DCLogic {
  renderVals() {
    const p = this.props;
    const ink = p.ink || '#121212', cardInk = p.cardInk || ink, card = p.card || '#FFFFFF';
    const cv = parse(card), solid = cv[3] > 0.6 && card !== 'transparent';
    const cardMuted = solid ? rgba(cardInk, 0.68) : (p.muted || '#5C5B57');
    const hot = p.hot || '#FF6A2B';
    const C = { ink: cardInk, muted: rgba(cardInk, 0.6), soft: rgba(cardInk, 0.1), card: rgba(cardInk, 0.05), hot, onHot: parse(hot).slice(0, 3).reduce((a, v, i) => a + v * [0.2126, 0.7152, 0.0722][i], 0) > 150 ? '#111111' : '#FFFFFF' };
    const featured = P.map((x, i) => ({
      no: String(i + 1).padStart(2, '0'), name: x.name, kind: x.kind, status: x.status, desc: x.desc, stack: x.stack,
      factK: x.fact[0], factV: x.fact[1], hasLive: !!x.live, live: x.live ? x.live[1] : '', liveLabel: x.live ? x.live[0] : '',
      code: x.code, codeLabel: x.codeLabel || 'View code', caption: x.caption,
      dot: x.status === 'Live' ? '#2BD27A' : '#FFB020',
      isApp: x.vis === 'app', isChart: x.vis !== 'app', pic: x.vis === 'app' ? '' : art(x.vis, C), picAlt: 'Illustration of ' + x.name,
      textOrder: i % 2 ? 2 : 1, picOrder: i % 2 ? 1 : 2
    }));
    const small = S.map((x, i) => ({ no: String(i + 7).padStart(2, '0'), name: x.name, kind: x.kind, desc: x.desc, stack: x.stack, factK: x.fact[0], factV: x.fact[1], code: x.code, pic: art(x.vis, C), picAlt: 'Illustration of ' + x.name }));
    return {
      featured, small, ink, muted: p.muted || '#5C5B57', card, cardInk, cardMuted,
      line: p.line || 'rgba(18,18,18,.12)', chipLine: rgba(cardInk, 0.18), panel: rgba(cardInk, 0.04),
      accent: p.accent || '#121212', onAccent: p.onAccent || '#FFFFFF',
      font: p.font || 'inherit', mono: p.mono || 'ui-monospace, monospace',
      headFont: p.headFont || 'inherit', headWeight: p.headWeight || '900', headCase: p.headCase || 'uppercase',
      headSize: p.headSize || 'clamp(48px, 7vw, 112px)', headTrack: p.headCase === 'none' ? '-.03em' : '-.04em',
      titleFont: p.titleFont || 'inherit', titleWeight: p.titleWeight || '800', titleCase: p.titleCase || 'none',
      radius: p.radius || '24px', innerRadius: 'calc(' + (p.radius || '24px') + ' * .6)', btnRadius: p.btnRadius || '999px',
      pad: 'clamp(22px, 3vw, 40px)', gap: '24px', kicker: p.kicker || '( selected projects )',
      blur: p.blur || 'none', shadow: solid ? '0 40px 80px -50px rgba(0,0,0,.4)' : 'none'
    };
  }
}

  Component.__tpl = (html, $v, C) => html`<div style="color: ${$v.ink}; font-family: ${$v.font}">
  <div style="display: flex; flex-wrap: wrap; justify-content: space-between; align-items: end; gap: 16px 40px; margin-bottom: 40px">
    <div>
      <p style="margin: 0 0 14px; font: 500 13px ${$v.mono}; color: ${$v.muted}">${$v.kicker}</p>
      <h2 style="margin: 0; font-family: ${$v.headFont}; font-weight: ${$v.headWeight}; font-size: ${$v.headSize}; line-height: .92; letter-spacing: ${$v.headTrack}; text-transform: ${$v.headCase}">Selected projects</h2>
    </div>
    <p style="max-width: 480px; margin: 0; font-size: 17px; line-height: 1.55; color: ${$v.muted}">Products I designed and built myself: a property search tool, a live machine learning forecast, data pipelines, an AI app and a live scores app.</p>
  </div>

  <div style="display: flex; flex-direction: column; gap: ${$v.gap}">
    ${($v.featured || []).map((p) => html`
      <article class="pj-card" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 440px), 1fr)); gap: 36px; align-items: center; padding: ${$v.pad}; border-radius: ${$v.radius}; background: ${$v.card}; color: ${$v.cardInk}; border: 1px solid ${$v.line}; box-shadow: ${$v.shadow}; backdrop-filter: ${$v.blur}; -webkit-backdrop-filter: ${$v.blur}">
        <div style="display: flex; flex-direction: column; gap: 18px; order: ${p?.textOrder}">
          <div style="display: flex; flex-wrap: wrap; align-items: center; gap: 10px; font: 500 12px ${$v.mono}; color: ${$v.cardMuted}">
            <span>${p?.no}</span><span aria-hidden="true">/</span><span>${p?.kind}</span>
            <span style="margin-left: auto; display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px; border-radius: 999px; border: 1px solid ${$v.chipLine}; color: ${$v.cardInk}"><span aria-hidden="true" style="width: 7px; height: 7px; border-radius: 50%; background: ${p?.dot}"></span>${p?.status}</span>
          </div>
          <h3 style="margin: 0; font-family: ${$v.titleFont}; font-weight: ${$v.titleWeight}; font-size: clamp(30px, 3.4vw, 48px); line-height: 1; letter-spacing: -.025em; text-transform: ${$v.titleCase}">${p?.name}</h3>
          <p style="margin: 0; font-size: 16.5px; line-height: 1.6; color: ${$v.cardMuted}">${p?.desc}</p>
          <ul style="list-style: none; margin: 0; padding: 0; display: flex; flex-wrap: wrap; gap: 8px">
            ${(p?.stack || []).map((t) => html`
              <li style="padding: 6px 11px; border-radius: 999px; border: 1px solid ${$v.chipLine}; font: 500 12px ${$v.mono}">${t}</li>
            `)}
          </ul>
          <div style="display: flex; gap: 14px; align-items: baseline; padding: 14px 0; border-top: 1px solid ${$v.chipLine}; border-bottom: 1px solid ${$v.chipLine}">
            <span style="flex: none; font: 500 12px ${$v.mono}; text-transform: uppercase; letter-spacing: .06em; color: ${$v.cardMuted}">${p?.factK}</span>
            <span style="font-size: 15px; font-weight: 600; line-height: 1.4">${p?.factV}</span>
          </div>
          <div style="display: flex; flex-wrap: wrap; gap: 10px">
            ${(p?.hasLive) ? html`
              <a class="pj-btn" href=${p?.live} target="_blank" rel="noopener" style="display: inline-flex; align-items: center; gap: 8px; min-height: 46px; padding: 0 20px; border-radius: ${$v.btnRadius}; text-decoration: none; font-weight: 700; font-size: 15px; background: ${$v.accent}; color: ${$v.onAccent}">${p?.liveLabel} <span aria-hidden="true">↗</span></a>
            ` : null}
            <a class="pj-btn" href=${p?.code} target="_blank" rel="noopener" style="display: inline-flex; align-items: center; gap: 8px; min-height: 46px; padding: 0 20px; border-radius: ${$v.btnRadius}; text-decoration: none; font-weight: 700; font-size: 15px; border: 1px solid ${$v.chipLine}; color: ${$v.cardInk}">${p?.codeLabel}</a>
          </div>
        </div>
        <figure style="margin: 0; order: ${p?.picOrder}; display: flex; flex-direction: column; gap: 10px">
          <div style="border-radius: ${$v.innerRadius}; overflow: hidden; background: ${$v.panel}; border: 1px solid ${$v.chipLine}">
            ${(p?.isApp) ? html`
              <div class="pj-shot" style="display: flex; justify-content: center; align-items: center; gap: 18px; padding: 28px 20px; aspect-ratio: 14 / 9; box-sizing: border-box">
                <img src="./img/scoretime-home.webp" alt="Scoretime home screen with live matches" style="height: 100%; max-width: 46%; object-fit: contain; border-radius: 18px; box-shadow: 0 20px 40px -20px rgba(0,0,0,.5)" />
                <img src="./img/scoretime-stats.webp" alt="Scoretime match screen with live stats" style="height: 100%; max-width: 46%; object-fit: contain; border-radius: 18px; box-shadow: 0 20px 40px -20px rgba(0,0,0,.5); transform: translateY(14px)" />
              </div>
            ` : null}
            ${(p?.isChart) ? html`
              <img class="pj-shot" src=${p?.pic} alt=${p?.picAlt} style="display: block; width: 100%; aspect-ratio: 14 / 9" />
            ` : null}
          </div>
          <figcaption style="font: 500 12px ${$v.mono}; color: ${$v.cardMuted}">${p?.caption}</figcaption>
        </figure>
      </article>
    `)}
  </div>

  <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 420px), 1fr)); gap: ${$v.gap}; margin-top: ${$v.gap}">
    ${($v.small || []).map((p) => html`
      <article class="pj-card" style="display: flex; flex-direction: column; gap: 16px; padding: ${$v.pad}; border-radius: ${$v.radius}; background: ${$v.card}; color: ${$v.cardInk}; border: 1px solid ${$v.line}; box-shadow: ${$v.shadow}; backdrop-filter: ${$v.blur}; -webkit-backdrop-filter: ${$v.blur}">
        <div style="border-radius: ${$v.innerRadius}; overflow: hidden; background: ${$v.panel}; border: 1px solid ${$v.chipLine}">
          <img class="pj-shot" src=${p?.pic} alt=${p?.picAlt} style="display: block; width: 100%; aspect-ratio: 14 / 9" />
        </div>
        <div style="display: flex; flex-wrap: wrap; gap: 10px; font: 500 12px ${$v.mono}; color: ${$v.cardMuted}"><span>${p?.no}</span><span aria-hidden="true">/</span><span>${p?.kind}</span></div>
        <h3 style="margin: 0; font-family: ${$v.titleFont}; font-weight: ${$v.titleWeight}; font-size: clamp(26px, 2.6vw, 34px); line-height: 1; letter-spacing: -.02em; text-transform: ${$v.titleCase}">${p?.name}</h3>
        <p style="margin: 0; font-size: 16px; line-height: 1.55; color: ${$v.cardMuted}">${p?.desc}</p>
        <ul style="list-style: none; margin: 0; padding: 0; display: flex; flex-wrap: wrap; gap: 8px">
          ${(p?.stack || []).map((t) => html`
            <li style="padding: 6px 11px; border-radius: 999px; border: 1px solid ${$v.chipLine}; font: 500 12px ${$v.mono}">${t}</li>
          `)}
        </ul>
        <div style="display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 12px; margin-top: auto">
          <span style="font: 500 12px ${$v.mono}; color: ${$v.cardMuted}">${p?.factK} · ${p?.factV}</span>
          <a class="pj-btn" href=${p?.code} target="_blank" rel="noopener" style="display: inline-flex; align-items: center; min-height: 42px; padding: 0 18px; border-radius: ${$v.btnRadius}; text-decoration: none; font-weight: 700; font-size: 14px; border: 1px solid ${$v.chipLine}; color: ${$v.cardInk}">View code</a>
        </div>
      </article>
    `)}
  </div>
</div>`;
  Component.defaultProps = {"ink":"#121212","muted":"#5C5B57","card":"#FFFFFF","cardInk":"#121212","line":"rgba(18,18,18,.12)","accent":"#121212","onAccent":"#FFFFFF","hot":"#FF6A2B","font":"inherit","mono":"ui-monospace, monospace","headFont":"inherit","headWeight":"900","headCase":"uppercase","headSize":"clamp(48px, 7vw, 112px)","titleFont":"inherit","titleWeight":"800","titleCase":"none","radius":"24px","btnRadius":"999px","kicker":"( selected projects )","blur":"none"};
  const off = Component.prototype.componentWillUnmount;
  Component.prototype.componentWillUnmount = function () { this.__alive = false; if (off) off.call(this); };
  return Component;
})();

C.Main = (() => {
  const DCLogic = DCBase;

class Component extends DCLogic {
  constructor(props) {
    super(props);
    this.state = { mode: null, hover: -1 };
  }
  renderVals() {
    const mode = this.state.mode || this.props.startMode || 'simple';
    const themes = {
      simple: { bg: '#ECEBE7', ink: '#121212', muted: '#5C5B57', line: 'rgba(18,18,18,.14)', accent: '#121212', onAccent: '#ECEBE7', accentText: '#5C5B57', pattern: 'none', faceBg: '#ECEBE7', mapBlur: 'none', natural: false, rowBg: 'transparent' },
      dark: { bg: '#0B0E17', ink: '#E4E8F5', muted: '#98A0B8', line: 'rgba(228,232,245,.12)', accent: '#82AAFF', onAccent: '#0B0E17', accentText: '#82AAFF', pattern: 'radial-gradient(rgba(228,232,245,.07) 1px, transparent 1px)', faceBg: '#0B0E17', mapBlur: 'none', natural: true, rowBg: 'transparent' },
      art: { bg: '#08070A', ink: '#FFF8EE', muted: '#E4DACB', line: 'rgba(255,248,238,.22)', accent: '#FF7A35', onAccent: '#08070A', accentText: '#FFB37A', pattern: 'none', faceBg: '#1A0E10', mapBlur: 'none', natural: true, rowBg: 'rgba(8,7,10,.42)' }
    };
    const c = themes[mode];
    const modes = [['simple', 'Simple'], ['dark', 'Dark'], ['art', 'Art']].map(([id, label]) => ({
      label, on: id === mode ? 'true' : 'false',
      bg: id === mode ? c.ink : 'transparent', fg: id === mode ? c.bg : c.ink,
      pick: () => { if (this.props.linked) window.dispatchEvent(new CustomEvent('ee-mode', { detail: id })); else this.setState({ mode: id }); }
    }));
    const list = [
      ['London Property Finder', 'Ranks about 38,000 London streets on value, yield, crime, schools and transport. Rebuilt every day.', 'Live', 'https://egeerenler.com/london-property-finder/'],
      ['UK Energy Demand Forecast', 'Forecasts tomorrow’s electricity demand for every half hour and races the official NESO forecast.', 'Live', 'https://egeerenler.com/uk-energy-forecast/'],
      ['London Pulse', 'Tube, bikes, weather and air quality every 15 minutes, modelled with dbt and tested.', 'Live', 'https://egeerenler.com/london-pulse/'],
      ['UK Housing Market Analytics', 'Every home sale in England and Wales since 2018, analysed in tested SQL.', 'Live', 'https://egeerenler.com/uk-housing-analytics/'],
      ['Scoretime', 'Live scores, match stats and line-ups on my own database of 535,540 matches.', 'In development', 'https://scoretime.app/'],
      ['MediPulse AI', 'A health triage assistant built on a large language model.', 'Live', 'https://medipulse-ai.streamlit.app']
    ];
    const projects = list.map(([name, desc, status, url], i) => ({
      no: String(i + 1).padStart(2, '0'), name, desc, status, url,
      bg: this.state.hover === i ? c.ink : c.rowBg,
      fg: this.state.hover === i ? c.bg : c.ink,
      enter: () => this.setState({ hover: i }),
      leave: () => this.setState({ hover: -1 })
    }));
    return {
      c, modes, fxClass: mode === 'art' ? 'fx-art' : '', art: mode === 'art', dark: mode === 'dark', notDark: mode !== 'dark', projects,
      facts: [
        { n: '3.17%', t: 'day-ahead forecast error. NESO’s own forecast: 2.93%.' },
        { n: '38,000', t: 'London streets scored every day.' },
        { n: '15 min', t: 'between London Pulse snapshots.' },
        { n: '535,540', t: 'matches behind Scoretime.' }
      ],
      career: [
        { when: 'Sep 2025 – Oct 2026', org: 'Regent’s University London', role: 'MSc Data Science in Business', stack: 'Python · ML · Power BI' },
        { when: 'Sep 2024 – Aug 2025', org: 'Sokian Ltd', role: 'Freelance Software and Data Developer', stack: 'FastAPI · Azure · React Native' },
        { when: 'Sep 2023 – Aug 2024', org: 'Orion Innovation', role: 'Junior Software Engineer', stack: 'Python · MySQL · AWS · Azure' },
        { when: 'Feb 2023 – Aug 2023', org: 'Mikrogrup', role: 'Software Engineer Intern', stack: 'Python · SQL' },
        { when: '2019 – 2024', org: 'Bahçeşehir University', role: 'BSc Software Engineering', stack: 'Istanbul' }
      ]
    };
  }
}

  Component.__tpl = (html, $v, C) => html`<div class=${$v.fxClass} style="position: relative; min-height: 100vh; background: ${$v.c?.bg}; background-image: ${$v.c?.pattern}; background-size: 22px 22px; color: ${$v.c?.ink}; font-family: 'Inter Tight', 'Helvetica Neue', Arial, sans-serif; transition: background-color .4s, color .4s">
  <div class="fx-bar" aria-hidden="true" style="background: ${$v.c?.accent}"></div>
  ${($v.art) ? html`
    <div aria-hidden="true" style="position: fixed; left: 0; right: 0; top: 0; height: clamp(300px, 46vh, 540px); z-index: 0; overflow: hidden">
      <${C.Shader} palette="ember" />
      <div style="position: absolute; inset: 0; background: rgba(8,7,10,.28); pointer-events: none"></div>
    </div>
  ` : null}
  <div style="position: relative; z-index: 1">

  <header style="position: relative; overflow: hidden; border-bottom: 1px solid ${$v.c?.line}">
    <div style="position: relative; z-index: 1; max-width: 1280px; margin: 0 auto; padding: 24px 40px 0; box-sizing: border-box">
      <nav aria-label="Main" style="display: flex; flex-wrap: wrap; gap: 16px 32px; align-items: center; justify-content: space-between; font-family: 'IBM Plex Mono', monospace; font-size: 13px">
        <a href="#top" aria-label="Ege Erenler, back to top" style="display: inline-flex; text-decoration: none"><${C.Stamp} ink=${$v.c?.ink} accent="#FF6A2B" size="72px" /></a>
        <div style="display: flex; flex-wrap: wrap; gap: 24px; align-items: center">
          <a href="#work" style="text-decoration: none">work ↗</a>
          <a href="#career" style="text-decoration: none">career ↗</a>
          <a href="#contact" style="text-decoration: none">contact ↗</a>
          <div role="group" aria-label="Display mode" style="display: flex; gap: 2px; padding: 3px; border: 1px solid ${$v.c?.line}; border-radius: 999px">
            ${($v.modes || []).map((m) => html`
              <button type="button" onClick=${m?.pick} aria-pressed=${m?.on} style="min-height: 34px; padding: 0 14px; border: 0; border-radius: 999px; cursor: pointer; font: 500 12px 'IBM Plex Mono', monospace; background: ${m?.bg}; color: ${m?.fg}">${m?.label}</button>
            `)}
          </div>
        </div>
      </nav>

      <div id="top" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 420px), 1fr)); gap: 24px 40px; align-items: end; padding: 72px 0 48px">
        <div>
          <p style="margin: 0 0 20px; font-family: 'IBM Plex Mono', monospace; font-size: 13px; color: ${$v.c?.muted}">( London, UK )  ( available now )</p>
          <h1 style="margin: 0; font-size: clamp(56px, 9.6vw, 156px); line-height: .86; letter-spacing: -.045em; font-weight: 900; text-transform: uppercase">Software<br />& data<br /><span style="color: ${$v.c?.muted}">engineer</span></h1>
          <div style="margin-top: 36px"><${C.CvWheel} ink=${$v.c?.ink} paper=${$v.c?.bg} card=${$v.c?.bg} line=${$v.c?.line} accent=${$v.c?.accent} onAccent=${$v.c?.onAccent} /></div>
        </div>
        <div style="display: flex; flex-direction: column; align-items: center; gap: 12px">
          <div style="width: min(100%, 420px); aspect-ratio: 400 / 440">
            <${C.Face} ink=${$v.c?.ink} paper=${$v.c?.faceBg} accent=${$v.c?.accent} natural=${$v.c?.natural} />
          </div>
        </div>
      </div>
    </div>
  </header>

  <section class="fx-rise" aria-label="Numbers from my live projects" style="border-bottom: 1px solid ${$v.c?.line}">
    <div style="max-width: 1280px; margin: 0 auto; padding: 0 40px; box-sizing: border-box; display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr))">
      ${($v.facts || []).map((f) => html`
        <div style="padding: 28px 24px 28px 0; border-right: 1px solid ${$v.c?.line}">
          <div style="font-size: 44px; font-weight: 800; letter-spacing: -.03em">${f?.n}</div>
          <div style="margin-top: 6px; font-size: 15px; line-height: 1.45; color: ${$v.c?.muted}">${f?.t}</div>
        </div>
      `)}
    </div>
  </section>

  <section class="fx-rise" style="max-width: 1280px; margin: 0 auto; padding: 96px 40px; box-sizing: border-box; display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 380px), 1fr)); gap: 32px 64px">
    <div>
      <p style="margin: 0; font-family: 'IBM Plex Mono', monospace; font-size: 13px; color: ${$v.c?.muted}">( 01 · about )</p>
      <p style="margin: 24px 0 0; font-size: clamp(24px, 2.6vw, 36px); line-height: 1.25; letter-spacing: -.02em; font-weight: 500">I build data systems that keep running on their own. A pipeline that refreshes every 15 minutes. A forecast that retrains every morning. An app that serves half a million matches. Before London I wrote backend code in Istanbul. Now I want to do it with a data or software team here.</p>
    </div>
    ${($v.dark) ? html`
      <${C.Editor} accent="#82AAFF" />
    ` : null}
  </section>

  <section id="services" style="max-width: 1280px; margin: 0 auto; padding: 0 40px 96px; box-sizing: border-box"><${C.Services} ink=${$v.c?.ink} muted=${$v.c?.muted} card=${$v.c?.rowBg} cardInk=${$v.c?.ink} line=${$v.c?.line} accent=${$v.c?.accent} onAccent=${$v.c?.onAccent} font="'Inter Tight', Arial, sans-serif" mono="'IBM Plex Mono', monospace" headFont="'Inter Tight', Arial, sans-serif" headWeight="900" headCase="uppercase" headSize="clamp(48px, 7vw, 112px)" radius="6px" blur=${$v.c?.mapBlur} kicker="( what I do )" /></section>

  <section id="work" style="max-width: 1280px; margin: 0 auto; padding: 0 40px 96px; box-sizing: border-box"><${C.Projects} ink=${$v.c?.ink} muted=${$v.c?.muted} card=${$v.c?.rowBg} cardInk=${$v.c?.ink} line=${$v.c?.line} accent=${$v.c?.accent} onAccent=${$v.c?.onAccent} font="'Inter Tight', Arial, sans-serif" mono="'IBM Plex Mono', monospace" headFont="'Inter Tight', Arial, sans-serif" headWeight="900" headCase="uppercase" headSize="clamp(48px, 7vw, 112px)" radius="6px" blur=${$v.c?.mapBlur} kicker="( selected projects )" hot=${$v.c?.accent} titleFont="'Inter Tight', Arial, sans-serif" titleWeight="900" titleCase="uppercase" btnRadius="999px" /></section>

  <section class="fx-rise" id="career" style="max-width: 1280px; margin: 0 auto; padding: 0 40px 96px; box-sizing: border-box">
    <div style="display: flex; flex-wrap: wrap; justify-content: space-between; align-items: baseline; gap: 12px; margin-bottom: 24px">
      <h2 style="margin: 0; font-size: clamp(48px, 7vw, 112px); line-height: .9; letter-spacing: -.04em; font-weight: 900; text-transform: uppercase">Career</h2>
      <p style="margin: 0; font-family: 'IBM Plex Mono', monospace; font-size: 13px; color: ${$v.c?.muted}">( 03 · experience and study )</p>
    </div>
    ${($v.dark) ? html`
      <${C.GitLog} />
    ` : null}
    ${($v.notDark) ? html`
    <div style="border-top: 1px solid ${$v.c?.ink}">
      ${($v.career || []).map((r) => html`
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 190px), 1fr)); gap: 6px 16px; padding: 18px 0; border-bottom: 1px solid ${$v.c?.line}">
          <span style="font-family: 'IBM Plex Mono', monospace; font-size: 13px; color: ${$v.c?.muted}">${r?.when}</span>
          <span style="font-size: 18px; font-weight: 700">${r?.org}</span>
          <span style="font-size: 16px">${r?.role}</span>
          <span style="font-family: 'IBM Plex Mono', monospace; font-size: 13px; color: ${$v.c?.muted}">${r?.stack}</span>
        </div>
      `)}
    </div>
    ` : null}
  </section>

  <section class="fx-rise" aria-label="Where I am" style="max-width: 1280px; margin: 0 auto; padding: 0 40px 96px; box-sizing: border-box"><${C.WorldMap} art=${$v.art} bg=${$v.c?.bg} ink=${$v.c?.ink} muted=${$v.c?.muted} accent=${$v.c?.accent} mono="'IBM Plex Mono', monospace" /></section>

  <section class="fx-rise" id="contact" style="border-top: 1px solid ${$v.c?.line}">
    <div style="max-width: 1280px; margin: 0 auto; padding: 96px 40px 48px; box-sizing: border-box">
      <p style="margin: 0 0 20px; font-family: 'IBM Plex Mono', monospace; font-size: 13px; color: ${$v.c?.muted}">( 04 · contact )</p>
      <h2 style="margin: 0; font-size: clamp(56px, 10vw, 168px); line-height: .86; letter-spacing: -.05em; font-weight: 900; text-transform: uppercase">Have a role<br /><span style="color: ${$v.c?.accentText}">in mind?</span></h2>
      <div style="display: flex; flex-wrap: wrap; gap: 12px; margin-top: 40px">
        <a href="mailto:salih2000ege@gmail.com" style="display: inline-flex; align-items: center; min-height: 48px; padding: 0 24px; border-radius: 999px; text-decoration: none; font-weight: 600; background: ${$v.c?.accent}; color: ${$v.c?.onAccent}">salih2000ege@gmail.com</a>
        <a href="https://www.linkedin.com/in/ege-erenler" target="_blank" rel="noopener" style="display: inline-flex; align-items: center; min-height: 48px; padding: 0 24px; border-radius: 999px; text-decoration: none; font-weight: 600; border: 1px solid ${$v.c?.ink}">LinkedIn ↗</a>
        <a href="https://github.com/EgeErenler" target="_blank" rel="noopener" style="display: inline-flex; align-items: center; min-height: 48px; padding: 0 24px; border-radius: 999px; text-decoration: none; font-weight: 600; border: 1px solid ${$v.c?.ink}">GitHub ↗</a>
      </div>
      <div style="display: flex; flex-wrap: wrap; justify-content: space-between; gap: 12px; margin-top: 96px; padding-top: 20px; border-top: 1px solid ${$v.c?.line}; font-family: 'IBM Plex Mono', monospace; font-size: 12px; color: ${$v.c?.muted}">
        <span>© 2026 Ege Erenler</span>
        <span>( London, UK )</span>
      </div>
    </div>
  </section>
  </div>
</div>`;
  Component.defaultProps = {"linked":false,"startMode":"simple"};
  const off = Component.prototype.componentWillUnmount;
  Component.prototype.componentWillUnmount = function () { this.__alive = false; if (off) off.call(this); };
  return Component;
})();

C.Night = (() => {
  const DCLogic = DCBase;

class Component extends DCLogic {
  constructor(props) {
    super(props);
    this.state = { mode: null, hover: -1, link: -1 };
  }
  renderVals() {
    const mode = this.state.mode || this.props.startMode || 'dark';
    const themes = {
      simple: { bg: '#F2F3F6', card: '#FFFFFF', cardSolid: '#FFFFFF', ink: '#0B0D12', muted: '#545B6B', line: 'rgba(11,13,18,.10)', accent: '#3048F0', onAccent: '#FFFFFF', glow: 'none', hot: '#3048F0', pattern: 'none', blur: 'none', natural: false },
      dark: { bg: '#07080C', card: '#0F1118', cardSolid: '#0F1118', ink: '#EEF0F6', muted: '#9AA1B2', line: 'rgba(238,240,246,.10)', accent: '#EEF0F6', onAccent: '#07080C', glow: 'none', hot: '#8C9BFF', pattern: 'radial-gradient(rgba(238,240,246,.07) 1px, transparent 1px)', blur: 'none', natural: true },
      art: { bg: '#05060A', card: 'rgba(10,12,20,.55)', cardSolid: '#0E1018', ink: '#F7F8FC', muted: '#C9CEDC', line: 'rgba(243,244,250,.22)', accent: '#9B7BFF', onAccent: '#05060A', glow: '0 0 60px rgba(120,95,255,.35)', hot: '#5EE0F5', pattern: 'none', blur: 'blur(18px) saturate(140%)', natural: true }
    };
    const c = themes[mode];
    const modes = [['simple', 'Simple'], ['dark', 'Dark'], ['art', 'Art mode']].map(([id, label]) => ({
      label, on: id === mode ? 'true' : 'false',
      bg: id === mode ? (id === 'art' ? 'linear-gradient(90deg,#ffcf3a,#ff4fa8,#7b5cff)' : c.ink) : 'transparent',
      fg: id === mode ? (id === 'art' ? '#0B0612' : c.bg) : c.ink,
      glow: id === mode && id === 'art' ? '0 0 22px rgba(255,79,168,.55)' : 'none',
      pick: () => { if (this.props.linked) window.dispatchEvent(new CustomEvent('ee-mode', { detail: id })); else this.setState({ mode: id }); }
    }));
    const list = [
      ['Property search', 'London Property Finder', '38,000', 'streets scored every day', 'Value, yield, crime, schools and transport for every London street, from seven open data sources.', 'Live', 'https://egeerenler.com/london-property-finder/'],
      ['Machine learning', 'UK Energy Demand Forecast', '3.17%', 'error · NESO 2.93%', 'A model that forecasts tomorrow’s electricity demand every half hour and retrains each morning.', 'Live', 'https://egeerenler.com/uk-energy-forecast/'],
      ['Data pipeline', 'London Pulse', '15 min', 'between snapshots', 'Tube, bikes, weather and air quality, modelled with dbt on DuckDB and tested.', 'Live', 'https://egeerenler.com/london-pulse/'],
      ['SQL analysis', 'UK Housing Market Analytics', '−0.88', 'flats share vs price change', 'Every home sale in England and Wales since 2018, analysed in tested SQL.', 'Live', 'https://egeerenler.com/uk-housing-analytics/'],
      ['Mobile app', 'Scoretime', '535,540', 'matches in its database', 'Live scores, match stats and line-ups for UK sports fans.', 'In development', 'https://scoretime.app/'],
      ['AI app', 'MediPulse AI', 'LLM', 'triage assistant', 'Describe symptoms in plain words and get an urgency level and a next step.', 'Live', 'https://medipulse-ai.streamlit.app']
    ];
    const projects = list.map(([kind, name, big, bigLabel, desc, status, url], i) => {
      const on = this.state.hover === i;
      return {
        kind, name, big, bigLabel, desc, status, url,
        border: on ? c.hot : c.line,
        glow: on ? (mode === 'simple' ? '0 18px 40px -20px rgba(48,72,240,.45)' : '0 0 40px -6px ' + c.hot) : 'none',
        lift: on ? 'translateY(-4px)' : 'none',
        numColor: on ? c.hot : c.ink,
        enter: () => this.setState({ hover: i }),
        leave: () => this.setState({ hover: -1 })
      };
    });
    const linkList = [
      ['in', 'LinkedIn', 'https://www.linkedin.com/in/ege-erenler', '_blank'],
      ['gh', 'GitHub', 'https://github.com/EgeErenler', '_blank'],
      ['@', 'Email', 'mailto:salih2000ege@gmail.com', '_self']
    ];
    const links = linkList.map(([short, label, href, target], i) => ({
      short, label, href, target,
      bg: this.state.link === i ? c.hot : c.bg,
      fg: this.state.link === i ? '#05060A' : c.ink,
      enter: () => this.setState({ link: i }),
      leave: () => this.setState({ link: -1 })
    }));
    return {
      c, modes, projects, links, fxClass: mode === 'art' ? 'fx-art' : '', art: mode === 'art', dark: mode === 'dark', notDark: mode !== 'dark', speed: this.props.speed ?? 0.8,
      career: [
        { when: 'Sep 2025 – Oct 2026', role: 'MSc Data Science in Business', org: 'Regent’s University London' },
        { when: 'Sep 2024 – Aug 2025', role: 'Freelance Software and Data Developer', org: 'Sokian Ltd · London' },
        { when: 'Sep 2023 – Aug 2024', role: 'Junior Software Engineer', org: 'Orion Innovation · Istanbul' },
        { when: 'Feb 2023 – Aug 2023', role: 'Software Engineer Intern', org: 'Mikrogrup · Istanbul' },
        { when: '2019 – 2024', role: 'BSc Software Engineering', org: 'Bahçeşehir University' }
      ]
    };
  }
}

  Component.__tpl = (html, $v, C) => html`<div class=${$v.fxClass} style="position: relative; min-height: 100vh; background: ${$v.c?.bg}; background-image: ${$v.c?.pattern}; background-size: 24px 24px; color: ${$v.c?.ink}; font-family: 'Geist', 'Helvetica Neue', Arial, sans-serif; transition: background-color .4s, color .4s">
  <div class="fx-bar" aria-hidden="true" style="background: ${$v.c?.hot}"></div>
  ${($v.art) ? html`
    <div style="position: fixed; inset: 0; z-index: 0">
      <${C.Shader} palette="electric" speed=${$v.speed} />
    </div>
  ` : null}
  <div style="position: relative; z-index: 1">

  <header style="position: relative; overflow: hidden">
    <div style="position: relative; z-index: 1; max-width: 1240px; margin: 0 auto; padding: 20px 32px 0; box-sizing: border-box">
      <nav aria-label="Main" style="display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 16px; padding: 10px 10px 10px 16px; border: 1px solid ${$v.c?.line}; border-radius: 20px; background: ${$v.c?.card}; backdrop-filter: ${$v.c?.blur}; -webkit-backdrop-filter: ${$v.c?.blur}">
        <a href="#top" style="display: inline-flex; align-items: center; gap: 10px; text-decoration: none; font-family: 'Unbounded', sans-serif; font-weight: 800; font-size: 15px">
          <${C.Stamp} ink=${$v.c?.ink} accent=${$v.c?.hot} size="56px" />
        </a>
        <div style="display: flex; flex-wrap: wrap; align-items: center; gap: 6px 22px; font-size: 14px">
          <a href="#work" style="text-decoration: none">Work</a>
          <a href="#career" style="text-decoration: none">Career</a>
          <a href="#contact" style="text-decoration: none">Contact</a>
          <div role="group" aria-label="Display mode" style="display: flex; gap: 4px; padding: 4px; border-radius: 999px; background: ${$v.c?.bg}; border: 1px solid ${$v.c?.line}">
            ${($v.modes || []).map((m) => html`
              <button type="button" onClick=${m?.pick} aria-pressed=${m?.on} style="min-height: 36px; padding: 0 14px; border: 0; border-radius: 999px; cursor: pointer; font: 500 13px 'Geist', sans-serif; background: ${m?.bg}; color: ${m?.fg}; box-shadow: ${m?.glow}; transition: all .3s">${m?.label}</button>
            `)}
          </div>
        </div>
      </nav>

      <div id="top" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 440px), 1fr)); gap: 32px; align-items: center; padding: 80px 0 72px">
        <div>
          <p style="display: inline-flex; align-items: center; gap: 8px; margin: 0 0 28px; padding: 8px 14px; border-radius: 999px; border: 1px solid ${$v.c?.line}; font: 500 13px 'Geist Mono', monospace; color: ${$v.c?.muted}"><span style="width: 8px; height: 8px; border-radius: 50%; background: #3DDC97"></span>Available for data and software roles in London</p>
          <h1 style="margin: 0; font-family: 'Unbounded', sans-serif; font-weight: 800; font-size: clamp(40px, 5.6vw, 84px); line-height: 1; letter-spacing: -.03em">I build data products that run on their own.</h1>
          <p style="max-width: 560px; margin: 28px 0 0; font-size: 19px; line-height: 1.55; color: ${$v.c?.muted}">Software and data engineer in London. Pipelines, forecasts and apps that refresh themselves, are tested, and stay live.</p>
          <div style="display: flex; flex-wrap: wrap; gap: 12px; margin-top: 32px">
            <a href="#work" style="display: inline-flex; align-items: center; min-height: 50px; padding: 0 26px; border-radius: 14px; text-decoration: none; font-weight: 600; background: ${$v.c?.accent}; color: ${$v.c?.onAccent}; box-shadow: ${$v.c?.glow}">See my work</a>
            <a href="mailto:salih2000ege@gmail.com" style="display: inline-flex; align-items: center; min-height: 50px; padding: 0 26px; border-radius: 14px; text-decoration: none; font-weight: 600; border: 1px solid ${$v.c?.line}; background: ${$v.c?.card}">Email me</a>
          </div>
          <div style="margin-top: 28px"><${C.CvWheel} ink=${$v.c?.ink} paper=${$v.c?.bg} card=${$v.c?.cardSolid} line=${$v.c?.line} accent=${$v.c?.accent} onAccent=${$v.c?.onAccent} /></div>
        </div>
        <div style="position: relative; justify-self: center; width: min(100%, 440px); aspect-ratio: 1; border-radius: 40px; border: 1px solid ${$v.c?.line}; background: ${$v.c?.card}; box-shadow: ${$v.c?.glow}; display: flex; align-items: center; justify-content: center; padding: 28px; box-sizing: border-box">
          <div style="width: 86%; aspect-ratio: 400 / 440">
            <${C.Face} ink=${$v.c?.ink} paper=${$v.c?.cardSolid} accent=${$v.c?.accent} natural=${$v.c?.natural} />
          </div>
        </div>
      </div>
    </div>
  </header>

  ${($v.dark) ? html`
    <section class="fx-rise" aria-label="Profile as code" style="max-width: 1240px; margin: 0 auto; padding: 0 32px 72px; box-sizing: border-box; display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 380px), 1fr)); gap: 32px; align-items: center">
      <div>
        <p style="margin: 0 0 12px; font: 500 13px 'Geist Mono', monospace; color: #3DDC97">~/ege $ cat README.md</p>
        <h2 style="margin: 0; font-family: 'Unbounded', sans-serif; font-weight: 800; font-size: clamp(30px, 3.6vw, 48px); letter-spacing: -.03em; line-height: 1.05">Read me like code.</h2>
        <p style="margin: 16px 0 0; font-size: 17px; line-height: 1.6; color: ${$v.c?.muted}">Open projects.sql and press Run to list everything I have built. contact.sh has the ways to reach me.</p>
      </div>
      <${C.Editor} accent="#8C9BFF" />
    </section>
  ` : null}

  <section id="services" style="max-width: 1280px; margin: 0 auto; padding: 24px 32px 96px; box-sizing: border-box"><${C.Services} ink=${$v.c?.ink} muted=${$v.c?.muted} card=${$v.c?.card} cardInk=${$v.c?.ink} line=${$v.c?.line} accent=${$v.c?.accent} onAccent=${$v.c?.onAccent} font="inherit" mono="'Geist Mono', monospace" headFont="'Unbounded', sans-serif" headWeight="800" headCase="none" headSize="clamp(32px, 4vw, 56px)" radius="22px" blur=${$v.c?.blur} kicker="services" /></section>

  <section id="work" style="max-width: 1280px; margin: 0 auto; padding: 24px 32px 96px; box-sizing: border-box"><${C.Projects} ink=${$v.c?.ink} muted=${$v.c?.muted} card=${$v.c?.card} cardInk=${$v.c?.ink} line=${$v.c?.line} accent=${$v.c?.accent} onAccent=${$v.c?.onAccent} font="inherit" mono="'Geist Mono', monospace" headFont="'Unbounded', sans-serif" headWeight="800" headCase="none" headSize="clamp(32px, 4vw, 56px)" radius="22px" blur=${$v.c?.blur} kicker="projects · 8 · 5 live" hot=${$v.c?.hot} titleFont="'Unbounded', sans-serif" titleWeight="700" btnRadius="14px" /></section>

  <section class="fx-rise" id="career" style="max-width: 1240px; margin: 0 auto; padding: 0 32px 96px; box-sizing: border-box">
    <h2 style="margin: 0 0 28px; font-family: 'Unbounded', sans-serif; font-weight: 800; font-size: clamp(32px, 4vw, 56px); letter-spacing: -.03em">Career</h2>
    ${($v.dark) ? html`
      <${C.GitLog} />
    ` : null}
    ${($v.notDark) ? html`
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 220px), 1fr)); gap: 16px">
      ${($v.career || []).map((r) => html`
        <div style="padding: 22px; border-radius: 20px; background: ${$v.c?.card}; border: 1px solid ${$v.c?.line}">
          <div style="font: 500 12px 'Geist Mono', monospace; color: ${$v.c?.muted}">${r?.when}</div>
          <div style="margin-top: 14px; font-size: 18px; font-weight: 600">${r?.role}</div>
          <div style="margin-top: 4px; font-size: 15px; color: ${$v.c?.muted}">${r?.org}</div>
        </div>
      `)}
    </div>
    ` : null}
  </section>

  <section class="fx-rise" aria-label="Where I am" style="max-width: 1240px; margin: 0 auto; padding: 0 32px 96px; box-sizing: border-box"><${C.WorldMap} art=${$v.art} bg=${$v.c?.cardSolid} ink=${$v.c?.ink} muted=${$v.c?.muted} accent=${$v.c?.hot} mono="'Geist Mono', monospace" /></section>

  <section class="fx-rise" id="contact" style="max-width: 1240px; margin: 0 auto; padding: 0 32px 64px; box-sizing: border-box">
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 420px), 1fr)); gap: 32px; align-items: center; padding: clamp(24px, 5vw, 48px); border-radius: 32px; background: ${$v.c?.card}; backdrop-filter: ${$v.c?.blur}; -webkit-backdrop-filter: ${$v.c?.blur}; border: 1px solid ${$v.c?.line}; box-shadow: ${$v.c?.glow}">
      <div>
        <h2 style="margin: 0; font-family: 'Unbounded', sans-serif; font-weight: 800; font-size: clamp(32px, 4vw, 56px); letter-spacing: -.03em; line-height: 1.05">Let’s talk about your team.</h2>
        <p style="margin: 16px 0 0; font-size: 17px; line-height: 1.55; color: ${$v.c?.muted}">Based in London, with the right to work in the UK.</p>
      </div>
      <div style="display: flex; flex-wrap: wrap; gap: 10px; justify-content: center">
        ${($v.links || []).map((l) => html`
          <a href=${l?.href} target=${l?.target} rel="noopener" aria-label=${l?.label} onMouseEnter=${l?.enter} onMouseLeave=${l?.leave} style="display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px; width: clamp(88px, 25vw, 132px); height: clamp(99px, 28vw, 148px); clip-path: polygon(50% 0, 100% 25%, 100% 75%, 50% 100%, 0 75%, 0 25%); text-decoration: none; background: ${l?.bg}; color: ${l?.fg}; transition: all .25s">
            <span style="font-family: 'Unbounded', sans-serif; font-weight: 700; font-size: 16px">${l?.short}</span>
            <span style="font: 500 11px 'Geist Mono', monospace">${l?.label}</span>
          </a>
        `)}
      </div>
    </div>
    <div style="display: flex; flex-wrap: wrap; justify-content: space-between; gap: 12px; margin-top: 40px; font: 500 12px 'Geist Mono', monospace; color: ${$v.c?.muted}">
      <span>© 2026 Ege Erenler</span><span>London, UK</span>
    </div>
  </section>
  </div>
</div>`;
  Component.defaultProps = {"linked":false,"startMode":"dark","speed":0.8};
  const off = Component.prototype.componentWillUnmount;
  Component.prototype.componentWillUnmount = function () { this.__alive = false; if (off) off.call(this); };
  return Component;
})();

C.Poster = (() => {
  const DCLogic = DCBase;

class Component extends DCLogic {
  constructor(props) {
    super(props);
    this.state = { mode: null, hover: -1 };
  }
  renderVals() {
    const mode = this.state.mode || this.props.startMode || 'simple';
    const themes = {
      simple: { bg: '#F1EFE8', grid: 'rgba(17,17,17,.07)', ink: '#111111', muted: '#55524A', card: '#FFFFFF', cardInk: '#111111', red: '#E2321A', blue: '#2034E8', tape: 'rgba(226,50,26,.75)', faceInk: '#111111', facePaper: '#F1EFE8', natural: false, mapBg: '#FFFFFF', mapInk: '#111111' },
      dark: { bg: '#0B0E17', grid: 'rgba(130,170,255,.08)', ink: '#E4E8F5', muted: '#A9B0C6', card: '#111522', cardInk: '#E4E8F5', red: '#FF4A2E', blue: '#2034E8', tape: 'rgba(255,74,46,.8)', faceInk: '#E4E8F5', facePaper: '#0B0E17', natural: true, mapBg: '#111522', mapInk: '#E4E8F5' },
      art: { bg: '#1A1AD9', grid: 'rgba(255,255,255,.10)', ink: '#FFFFFF', muted: '#D9DBFF', card: '#FFF6DA', cardInk: '#111111', red: '#FF3D8B', blue: '#111111', tape: 'rgba(255,214,58,.9)', faceInk: '#FFFFFF', facePaper: '#1A1AD9', natural: true, mapBg: '#1A1AD9', mapInk: '#FFFFFF' }
    };
    const c = themes[mode];
    const tilts = [-2, 1.5, -1];
    const modes = [['simple', 'Simple'], ['dark', 'Dark'], ['art', 'Art']].map(([id, label], i) => ({
      label, on: id === mode ? 'true' : 'false', tilt: tilts[i],
      bg: id === mode ? c.ink : 'transparent', fg: id === mode ? c.bg : c.ink,
      pick: () => { if (this.props.linked) window.dispatchEvent(new CustomEvent('ee-mode', { detail: id })); else this.setState({ mode: id }); }
    }));
    const list = [
      ['Property', 'London Property Finder', '38,000', 'London streets scored every day', 'find the right street before the right home.', 'Live', 'https://egeerenler.com/london-property-finder/'],
      ['ML', 'UK Energy Forecast', '3.17%', 'forecast error. NESO: 2.93%', 'racing the national grid’s own forecast.', 'Live', 'https://egeerenler.com/uk-energy-forecast/'],
      ['Pipeline', 'London Pulse', '15 MIN', 'between snapshots', 'the city’s pulse, every quarter of an hour.', 'Live', 'https://egeerenler.com/london-pulse/'],
      ['SQL', 'UK Housing Analytics', '−0.88', 'flats share vs price change', 'why the expensive centre of London fell.', 'Live', 'https://egeerenler.com/uk-housing-analytics/'],
      ['App', 'Scoretime', '535,540', 'matches in its database', 'live scores for UK sports fans.', 'In dev', 'https://scoretime.app/'],
      ['AI', 'MediPulse AI', 'LLM', 'triage assistant', 'how urgent are your symptoms?', 'Live', 'https://medipulse-ai.streamlit.app']
    ];
    const tilt = [-1.2, 0.8, -0.6, 1.1, -0.9, 0.7];
    const projects = list.map(([kind, name, big, bigLabel, desc, status, url], i) => {
      const on = this.state.hover === i;
      return {
        no: String(i + 1).padStart(2, '0'), kind, name, big, bigLabel, desc, status, url,
        tilt: on ? 0 : tilt[i],
        shadow: on ? c.red : c.ink,
        numColor: on ? c.red : c.cardInk,
        enter: () => this.setState({ hover: i }),
        leave: () => this.setState({ hover: -1 })
      };
    });
    return {
      c, modes, projects, fxClass: mode === 'art' ? 'fx-art' : '', art: mode === 'art', dark: mode === 'dark',
      skills: ['Python', 'SQL', 'FastAPI', 'dbt', 'DuckDB', 'MySQL', 'React Native', 'Azure', 'AWS', 'Docker', 'GitHub Actions', 'Power BI'],
      jobs: [
        { org: 'Sokian Ltd', role: 'Freelance Software and Data Developer', when: 'Sep 2024 – Aug 2025 · London' },
        { org: 'Orion Innovation', role: 'Junior Software Engineer', when: 'Sep 2023 – Aug 2024 · Istanbul' },
        { org: 'Mikrogrup', role: 'Software Engineer Intern', when: 'Feb 2023 – Aug 2023 · Istanbul' }
      ],
      edu: [
        { title: 'MSc Data Science in Business', org: 'Regent’s University London', when: 'Sep 2025 – Oct 2026' },
        { title: 'BSc Software Engineering', org: 'Bahçeşehir University', when: '2019 – 2024' }
      ]
    };
  }
}

  Component.__tpl = (html, $v, C) => html`<div class=${$v.fxClass} style="min-height: 100vh; background-color: ${$v.c?.bg}; background-image: linear-gradient(${$v.c?.grid} 1px, transparent 1px), linear-gradient(90deg, ${$v.c?.grid} 1px, transparent 1px); background-size: 28px 28px; color: ${$v.c?.ink}; font-family: 'Archivo', 'Helvetica Neue', Arial, sans-serif; transition: background-color .4s, color .4s; overflow: hidden; position: relative">
  <div class="fx-bar" aria-hidden="true" style="background: ${$v.c?.red}"></div>
  ${($v.art) ? html`
    <div style="position: fixed; inset: 0; z-index: 0">
      <${C.Shader} palette="sunset" />
    </div>
  ` : null}
  <div style="position: relative; z-index: 1">

  <header style="position: relative">
    <div style="position: relative; z-index: 1; max-width: 1280px; margin: 0 auto; padding: 22px 32px 0; box-sizing: border-box">
      <nav aria-label="Main" style="display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 14px; font: 700 13px 'Space Mono', monospace; text-transform: uppercase">
        <span>Data / Software Engineer</span>
        <div style="display: flex; flex-wrap: wrap; align-items: center; gap: 8px 20px">
          <a href="#work" style="text-decoration: none">Work</a>
          <a href="#hello" style="text-decoration: none">About</a>
          <a href="#contact" style="text-decoration: none">Contact</a>
          <div role="group" aria-label="Display mode" style="display: flex; gap: 6px">
            ${($v.modes || []).map((m) => html`
              <button type="button" onClick=${m?.pick} aria-pressed=${m?.on} style="min-height: 38px; padding: 0 14px; border: 2px solid ${$v.c?.ink}; border-radius: 999px; cursor: pointer; font: 700 12px 'Space Mono', monospace; text-transform: uppercase; background: ${m?.bg}; color: ${m?.fg}; transform: rotate(${m?.tilt}deg)">${m?.label}</button>
            `)}
          </div>
        </div>
      </nav>

      <div id="top" style="position: relative; display: flex; align-items: center; justify-content: center; gap: 0; padding: 56px 0 8px">
        <h1 aria-label="Portfolio" style="margin: 0; display: flex; align-items: center; justify-content: center; font-family: 'Anton', Impact, sans-serif; font-weight: 400; font-size: clamp(40px, 15vw, 236px); line-height: .9; letter-spacing: -.01em; text-transform: uppercase">
          <span>Portf</span>
          <span style="display: inline-block; width: .82em; aspect-ratio: 400 / 440; filter: drop-shadow(0 0 0 ${$v.c?.red}) drop-shadow(5px 0 0 ${$v.c?.red}) drop-shadow(-5px 0 0 ${$v.c?.red}) drop-shadow(0 5px 0 ${$v.c?.red}) drop-shadow(0 -5px 0 ${$v.c?.red})">
            <${C.Face} ink=${$v.c?.faceInk} paper=${$v.c?.facePaper} accent=${$v.c?.red} natural=${$v.c?.natural} />
          </span>
          <span>lio</span>
        </h1>
      </div>
      <div style="display: flex; flex-wrap: wrap; justify-content: space-between; align-items: end; gap: 16px; padding: 0 0 40px; font: 700 13px 'Space Mono', monospace; text-transform: uppercase">
        <span>Ege Erenler</span>
        <span style="font-family: 'Instrument Serif', serif; font-style: italic; font-weight: 400; font-size: clamp(22px, 2.4vw, 32px); text-transform: none">data that keeps running, built in London</span>
        <span>2026</span>
      </div>
      <div style="display: flex; justify-content: center; padding: 0 0 40px"><${C.CvWheel} ink=${$v.c?.ink} paper=${$v.c?.bg} card=${$v.c?.facePaper} line=${$v.c?.muted} accent=${$v.c?.red} onAccent="#FFFFFF" /></div>
    </div>
  </header>

  <div aria-hidden="true" style="background: ${$v.c?.ink}; color: ${$v.c?.bg}; clip-path: polygon(0 12%, 4% 0, 9% 10%, 15% 2%, 22% 12%, 30% 1%, 38% 11%, 46% 0, 54% 10%, 62% 2%, 70% 12%, 78% 0, 86% 10%, 93% 1%, 100% 9%, 100% 88%, 95% 100%, 88% 90%, 80% 99%, 72% 89%, 64% 100%, 56% 90%, 48% 99%, 40% 88%, 32% 100%, 24% 90%, 16% 99%, 8% 89%, 0 98%); padding: 30px 0; overflow: hidden">
    <div class="ee-run" style="display: flex; width: max-content; animation: ee-marquee 28s linear infinite; font-family: 'Anton', Impact, sans-serif; font-size: 40px; text-transform: uppercase; white-space: nowrap">
      <span style="padding-right: 40px">London Property Finder ✶ UK Energy Forecast ✶ London Pulse ✶ UK Housing Analytics ✶ Scoretime ✶ MediPulse AI ✶</span>
      <span style="padding-right: 40px">London Property Finder ✶ UK Energy Forecast ✶ London Pulse ✶ UK Housing Analytics ✶ Scoretime ✶ MediPulse AI ✶</span>
    </div>
  </div>

  <section class="fx-rise" id="hello" style="max-width: 1280px; margin: 0 auto; padding: 72px 32px; box-sizing: border-box; display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 260px), 1fr)); gap: 40px">
    <div>
      <h2 style="margin: 0; font-family: 'Anton', Impact, sans-serif; font-weight: 400; font-size: 64px; line-height: .95; text-transform: uppercase">Hello</h2>
      <p style="margin: 16px 0 0; font-size: 16px; line-height: 1.6">I’m Ege, a software and data engineer in London. I build pipelines, forecasts and apps that refresh themselves and stay live. Before London I wrote backend code in Istanbul.</p>
    </div>
    <div>
      <h3 style="margin: 0 0 14px; font: 700 13px 'Space Mono', monospace; text-transform: uppercase">Skills</h3>
      <div style="display: flex; flex-wrap: wrap; gap: 8px">
        ${($v.skills || []).map((s) => html`
          <span style="padding: 7px 12px; border: 2px solid ${$v.c?.ink}; border-radius: 999px; font: 700 12px 'Space Mono', monospace; background: ${$v.c?.bg}">${s}</span>
        `)}
      </div>
    </div>
    <div>
      <h3 style="margin: 0 0 14px; font: 700 13px 'Space Mono', monospace; text-transform: uppercase">Experience</h3>
      ${($v.jobs || []).map((j) => html`
        <div style="padding: 10px 0; border-top: 2px solid ${$v.c?.ink}">
          <div style="font-weight: 600; font-size: 16px">${j?.org}</div>
          <div style="font-size: 14px">${j?.role}</div>
          <div style="font: 400 12px 'Space Mono', monospace; color: ${$v.c?.muted}">${j?.when}</div>
        </div>
      `)}
    </div>
    <div>
      <h3 style="margin: 0 0 14px; font: 700 13px 'Space Mono', monospace; text-transform: uppercase">Education</h3>
      ${($v.edu || []).map((e) => html`
        <div style="padding: 10px 0; border-top: 2px solid ${$v.c?.ink}">
          <div style="font-weight: 600; font-size: 16px">${e?.title}</div>
          <div style="font-size: 14px">${e?.org}</div>
          <div style="font: 400 12px 'Space Mono', monospace; color: ${$v.c?.muted}">${e?.when}</div>
        </div>
      `)}
    </div>
  </section>

  ${($v.dark) ? html`
    <section class="fx-rise" aria-label="Profile and career as code" style="max-width: 1280px; margin: 0 auto; padding: 0 32px 88px; box-sizing: border-box">
      <h2 style="margin: 0 0 28px; font-family: 'Anton', Impact, sans-serif; font-weight: 400; font-size: clamp(56px, 8vw, 120px); line-height: .9; text-transform: uppercase">Source <span style="font-family: 'Instrument Serif', serif; font-style: italic; text-transform: none; color: #82AAFF">code</span></h2>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 460px), 1fr)); gap: 28px; align-items: start">
        <div style="transform: rotate(-.6deg); box-shadow: 10px 10px 0 ${$v.c?.red}; border-radius: 16px">
          <${C.Editor} accent="#FF4A2E" />
        </div>
        <div style="transform: rotate(.5deg); box-shadow: -10px 10px 0 #2034E8; border-radius: 16px">
          <${C.GitLog} />
        </div>
      </div>
    </section>
  ` : null}

  <section id="services" style="max-width: 1280px; margin: 0 auto; padding: 0 32px 96px; box-sizing: border-box"><${C.Services} ink=${$v.c?.ink} muted=${$v.c?.muted} card=${$v.c?.card} cardInk=${$v.c?.cardInk} line=${$v.c?.ink} accent=${$v.c?.red} onAccent="#FFFFFF" font="inherit" mono="'Space Mono', monospace" headFont="'Anton', Impact, sans-serif" headWeight="400" headCase="uppercase" headSize="clamp(64px, 9vw, 140px)" radius="6px" kicker="( what I do )" /></section>

  <section id="work" style="max-width: 1280px; margin: 0 auto; padding: 0 32px 96px; box-sizing: border-box"><${C.Projects} ink=${$v.c?.ink} muted=${$v.c?.muted} card=${$v.c?.card} cardInk=${$v.c?.cardInk} line=${$v.c?.ink} accent=${$v.c?.red} onAccent="#FFFFFF" font="inherit" mono="'Space Mono', monospace" headFont="'Anton', Impact, sans-serif" headWeight="400" headCase="uppercase" headSize="clamp(64px, 9vw, 140px)" radius="6px" kicker="( selected projects )" hot=${$v.c?.red} titleFont="'Anton', Impact, sans-serif" titleWeight="400" titleCase="uppercase" btnRadius="6px" /></section>

  <section class="fx-rise" aria-label="Where I am" style="max-width: 1280px; margin: 0 auto; padding: 0 32px 96px; box-sizing: border-box"><${C.WorldMap} art=${$v.art} bg=${$v.c?.mapBg} ink=${$v.c?.mapInk} muted=${$v.c?.muted} accent=${$v.c?.red} mono="'Space Mono', monospace" /></section>

  <section class="fx-rise" id="contact" style="background: ${$v.c?.blue}; color: #FFFFFF">
    <div style="max-width: 1280px; margin: 0 auto; padding: 88px 32px 40px; box-sizing: border-box">
      <h2 style="margin: 0; font-family: 'Anton', Impact, sans-serif; font-weight: 400; font-size: clamp(72px, 13vw, 210px); line-height: .88; text-transform: uppercase">Let’s work<br /><span style="font-family: 'Instrument Serif', serif; font-style: italic; text-transform: none">together.</span></h2>
      <div style="display: flex; flex-wrap: wrap; gap: 14px; margin-top: 40px">
        <a href="mailto:salih2000ege@gmail.com" style="display: inline-flex; align-items: center; min-height: 52px; padding: 0 24px; border-radius: 999px; text-decoration: none; font: 700 14px 'Space Mono', monospace; background: #FFFFFF; color: #111111; transform: rotate(-2deg)">salih2000ege@gmail.com</a>
        <a href="https://www.linkedin.com/in/ege-erenler" target="_blank" rel="noopener" style="display: inline-flex; align-items: center; min-height: 52px; padding: 0 24px; border-radius: 999px; text-decoration: none; font: 700 14px 'Space Mono', monospace; border: 2px solid #FFFFFF; transform: rotate(1.5deg)">LinkedIn ↗</a>
        <a href="https://github.com/EgeErenler" target="_blank" rel="noopener" style="display: inline-flex; align-items: center; min-height: 52px; padding: 0 24px; border-radius: 999px; text-decoration: none; font: 700 14px 'Space Mono', monospace; border: 2px solid #FFFFFF; transform: rotate(-1deg)">GitHub ↗</a>
      </div>
      <div style="display: flex; flex-wrap: wrap; justify-content: space-between; gap: 12px; margin-top: 80px; font: 700 12px 'Space Mono', monospace; text-transform: uppercase">
        <span>© 2026 Ege Erenler</span><span>London, UK</span>
      </div>
    </div>
  </section>
  </div>
</div>`;
  Component.defaultProps = {"linked":false,"startMode":"simple"};
  const off = Component.prototype.componentWillUnmount;
  Component.prototype.componentWillUnmount = function () { this.__alive = false; if (off) off.call(this); };
  return Component;
})();

C.Site = (() => {
  const DCLogic = DCBase;

class Component extends DCLogic {
  constructor(props) {
    super(props);
    this.state = { mode: null };
  }
  // The tab icon follows the mode: the EE mark in each mode's colours.
  setIcon(mode) {
    const T = { simple: ['#ECEBE7', '#121212', '#FF6A2B'], dark: ['#0B0E17', '#E4E8F5', '#82AAFF'], art: ['#08070A', '#FFF8EE', '#FF7A35'] }[mode] || ['#ECEBE7', '#121212', '#FF6A2B'];
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="22" fill="${T[0]}"/><g transform="translate(50 50) scale(.74) translate(-50 -50)" fill="none" stroke-width="10" stroke-linecap="square"><path stroke="${T[1]}" d="M12 22h30M12 50h22M12 78h30M17 22v56M58 22h30M58 78h30M63 22v56"/><path stroke="${T[2]}" d="M58 50h22"/></g></svg>`;
    try {
      const href = 'data:image/svg+xml,' + encodeURIComponent(svg);
      let link = document.querySelector('link[rel="icon"][data-mode-icon]');
      if (!link) { link = document.createElement('link'); link.rel = 'icon'; link.type = 'image/svg+xml'; link.setAttribute('data-mode-icon', ''); document.head.appendChild(link); }
      document.querySelectorAll('link[rel="icon"]:not([data-mode-icon])').forEach((l) => l.remove());
      link.href = href;
      let meta = document.querySelector('meta[name="theme-color"]');
      if (meta) meta.content = T[0];
    } catch (e) {}
  }
  componentDidMount() {
    this.setIcon(this.state.mode || this.props.startMode || 'simple');
    // Each page's Simple / Dark / Art switch tells the site which page to show.
    this.onMode = (e) => { if (['simple', 'dark', 'art'].includes(e.detail)) { this.setState({ mode: e.detail }); this.setIcon(e.detail); } };
    window.addEventListener('ee-mode', this.onMode);
  }
  componentWillUnmount() { window.removeEventListener('ee-mode', this.onMode); }
  renderVals() {
    const mode = this.state.mode || this.props.startMode || 'simple';
    return { simple: mode === 'simple', dark: mode === 'dark', art: mode === 'art' };
  }
}

  Component.__tpl = (html, $v, C) => html`<div style="width: 100%; min-height: 100vh">
  ${($v.simple) ? html`
    <div class="ee-swap" style="animation: ee-swap .45s ease both"><${C.Main} startMode="simple" linked=${true} /></div>
  ` : null}
  ${($v.dark) ? html`
    <div class="ee-swap" style="animation: ee-swap .45s ease both"><${C.Night} startMode="dark" linked=${true} /></div>
  ` : null}
  ${($v.art) ? html`
    <div class="ee-swap" style="animation: ee-swap .45s ease both"><${C.Main} startMode="art" linked=${true} /></div>
  ` : null}
</div>`;
  Component.defaultProps = {"startMode":"simple"};
  const off = Component.prototype.componentWillUnmount;
  Component.prototype.componentWillUnmount = function () { this.__alive = false; if (off) off.call(this); };
  return Component;
})();

// The 404 page: the same liquid band and portrait as the Art mode, with the face standing in for the zero.
function NotFound() {
  const mono = "'IBM Plex Mono', ui-monospace, monospace";
  const btn = 'display: inline-flex; align-items: center; min-height: 48px; padding: 0 22px; border-radius: 999px; text-decoration: none; font-weight: 700; font-size: 15px';
  return html`
  <div style="position: relative; min-height: 100vh; background: #08070A; color: #FFF8EE; font-family: 'Inter Tight', Arial, sans-serif">
    <div aria-hidden="true" style="position: fixed; left: 0; right: 0; top: 0; height: clamp(300px, 46vh, 540px); overflow: hidden">
      <${C.Shader} palette="ember" />
      <div style="position: absolute; inset: 0; background: rgba(8,7,10,.28)"></div>
    </div>
    <div style="position: relative; z-index: 1; max-width: 1280px; min-height: 100vh; margin: 0 auto; padding: 28px clamp(20px, 4vw, 40px) 48px; box-sizing: border-box; display: flex; flex-direction: column; gap: 32px">
      <nav aria-label="Main" style="display: flex; justify-content: space-between; align-items: center; font: 500 13px ${mono}">
        <a href="/" style="color: inherit; text-decoration: none">(EGE_ERENLER)</a>
        <a href="/" style="color: inherit; text-decoration: none">home ↗</a>
      </nav>
      <main style="flex: 1; display: flex; flex-direction: column; justify-content: center; gap: 28px">
        <p style="margin: 0; font: 500 13px ${mono}; color: #E4DACB">( error 404 · page not found )</p>
        <h1 aria-label="404" style="margin: 0; display: flex; align-items: center; font-size: clamp(120px, 26vw, 340px); font-weight: 900; letter-spacing: -.06em; line-height: .8">
          <span aria-hidden="true">4</span>
          <span aria-hidden="true" style="display: inline-block; width: .74em; aspect-ratio: 400 / 440; margin: 0 .02em">
            <${C.Face} ink="#FFF8EE" paper="#1A0E10" accent="#FF7A35" natural=${true} />
          </span>
          <span aria-hidden="true">4</span>
        </h1>
        <p style="max-width: 720px; margin: 0; font-size: clamp(22px, 2.6vw, 34px); line-height: 1.25; font-weight: 600; letter-spacing: -.02em">This page does not exist, or it has moved. Everything else is still running.</p>
        <div style="display: flex; flex-wrap: wrap; gap: 10px">
          <a href="/" style="${btn}; background: #FF7A35; color: #08070A">Back to the home page</a>
          <a href="/#work" style="${btn}; border: 1px solid rgba(255,248,238,.3); color: #FFF8EE">See my projects</a>
          <a href="/cv/Ege_Erenler_CV.pdf" style="${btn}; border: 1px solid rgba(255,248,238,.3); color: #FFF8EE">Download my CV</a>
        </div>
      </main>
      <footer style="display: flex; flex-wrap: wrap; justify-content: space-between; gap: 12px; font: 500 12px ${mono}; color: #E4DACB">
        <span>© 2026 Ege Erenler</span><span>( London, UK )</span>
      </footer>
    </div>
  </div>`;
}

const root = document.getElementById('app');
if (document.body.dataset.page === '404') render(html`<${NotFound} />`, root);
else render(html`<${C.Site} />`, root);
const fb = document.getElementById('fallback'); if (fb) fb.remove();
