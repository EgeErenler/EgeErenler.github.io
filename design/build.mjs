// Turns the design's .dc.html components into one static Preact app for egeerenler.com.
import fs from 'node:fs';
import path from 'node:path';
import { parseDocument } from 'htmlparser2';

const SRC = process.argv[2];   // folder with the .dc.html files
const OUT = process.argv[3];   // site folder
const NAMES = ['Stamp', 'Face', 'Shader', 'Editor', 'GitLog', 'CvWheel', 'WorldMap', 'Services', 'Projects', 'Main', 'Night', 'Poster', 'Site'];
const VOID = new Set(['br', 'img', 'input', 'meta', 'hr', 'link', 'source', 'area', 'col', 'wbr']);

const escStatic = (s) => s.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$\{/g, '\\${');
const ENT = { amp: '&', nbsp: ' ', quot: '"', apos: "'", rsquo: '’', lsquo: '‘', middot: '·', mdash: '—', ndash: '–', hellip: '…', copy: '©', pound: '£' };
// Static text: decode entities, but keep < and > as expressions so htm does not read them as tags.
function staticText(s, inAttr) {
  let out = '';
  const parts = s.split(/(&#?\w+;)/);
  for (const p of parts) {
    const m = p.match(/^&(#?)(\w+);$/);
    if (!m) { out += escAttr(p, inAttr); continue; }
    let ch;
    if (m[1]) ch = String.fromCodePoint(m[2][0] === 'x' ? parseInt(m[2].slice(1), 16) : parseInt(m[2], 10));
    else if (m[2] === 'lt') ch = '<'; else if (m[2] === 'gt') ch = '>'; else ch = ENT[m[2]];
    if (ch == null) { out += escAttr(p, inAttr); continue; }
    if (ch === '<' || ch === '>' || (inAttr && ch === '"')) out += '${' + JSON.stringify(ch) + '}';
    else out += escStatic(ch);
  }
  return out;
}
function escAttr(s, inAttr) {
  let t = escStatic(s);
  if (!inAttr) t = t.replace(/</g, '${"<"}').replace(/>/g, '${">"}');
  return t;
}
function expr(raw, scope) {
  const e = raw.trim();
  if (/^(true|false|null|-?\d+(\.\d+)?)$/.test(e)) return e;
  if (/^'[^']*'$/.test(e)) return e;
  if (!/^[A-Za-z_$][\w$]*(\.[A-Za-z_$][\w$]*)*$/.test(e)) throw new Error('Unsupported hole: ' + e);
  const segs = e.split('.');
  const base = scope.includes(segs[0]) ? segs[0] : '$v.' + segs[0];
  return [base, ...segs.slice(1)].join('?.');
}
// A string with {{holes}} as template content.
function holes(s, scope, inAttr) {
  let out = '', i = 0;
  const re = /\{\{([\s\S]*?)\}\}/g; let m;
  while ((m = re.exec(s))) { out += staticText(s.slice(i, m.index), inAttr) + '${' + expr(m[1], scope) + '}'; i = re.lastIndex; }
  return out + staticText(s.slice(i), inAttr);
}
function attrValue(v, scope) {
  const whole = v.match(/^\s*\{\{([\s\S]*?)\}\}\s*$/);
  if (whole) return '${' + expr(whole[1], scope) + '}';
  return '"' + holes(v, scope, true) + '"';
}
const helmet = [];
function node(n, scope) {
  if (n.type === 'text') return holes(n.data, scope, false);
  if (n.type === 'comment' || n.type === 'directive') return '';
  if (n.type !== 'tag' && n.type !== 'script' && n.type !== 'style') return '';
  const name = n.name;
  const kids = (sc) => (n.children || []).map((c) => node(c, sc)).join('');
  if (name === 'helmet') { helmet.push(n); return ''; }
  if (name === 'sc-for') {
    const list = (n.attribs.list || '').match(/\{\{([\s\S]*?)\}\}/)[1];
    const as = n.attribs.as;
    return '${(' + expr(list, scope) + ' || []).map((' + as + ') => html`' + kids([...scope, as]) + '`)}';
  }
  if (name === 'sc-if') {
    const v = (n.attribs.value || '').match(/\{\{([\s\S]*?)\}\}/)[1];
    return '${(' + expr(v, scope) + ') ? html`' + kids(scope) + '` : null}';
  }
  let tag = name, attrs = '';
  if (name === 'dc-import') tag = '${C.' + n.attribs.name + '}';
  for (const [k, v] of Object.entries(n.attribs || {})) {
    if (k.startsWith('hint-') || (name === 'dc-import' && k === 'name')) continue;
    attrs += ' ' + k + (v === '' && !/\{\{/.test(v) ? '=""' : '=' + attrValue(v, scope));
  }
  if (name === 'dc-import') return '<' + tag + attrs + ' />';
  if (VOID.has(name)) return '<' + tag + attrs + ' />';
  if (name === 'style' || name === 'script') return '<' + tag + attrs + '>' + escStatic((n.children || []).map((c) => c.data || '').join('')) + '</' + tag + '>';
  return '<' + tag + attrs + '>' + kids(scope) + '</' + tag + '>';
}
function find(n, pred) {
  if (pred(n)) return n;
  for (const c of n.children || []) { const f = find(c, pred); if (f) return f; }
  return null;
}
const css = new Set(), links = new Set();
let js = `import { h, Component as PC, render } from './vendor/preact.mjs';
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
`;
for (const name of NAMES) {
  const file = path.join(SRC, name + '.dc.html');
  const src = fs.readFileSync(file, 'utf8');
  const doc = parseDocument(src, { lowerCaseTags: false, lowerCaseAttributeNames: false, recognizeSelfClosing: true, decodeEntities: false });
  const head = find(doc, (n) => n.name === 'head');
  for (const l of (head && head.children) || []) if (l.name === 'link' && /fonts\.googleapis\.com\/css2/.test(l.attribs.href || '')) links.add(l.attribs.href);
  const xdc = find(doc, (n) => n.name === 'x-dc');
  helmet.length = 0;
  const body = (xdc.children || []).map((c) => node(c, [])).join('');
  for (const hm of helmet) for (const c of hm.children || []) {
    if (c.name === 'style') css.add((c.children || []).map((t) => t.data).join(''));
    if (c.name === 'link' && /fonts\.googleapis/.test(c.attribs.href || '')) links.add(c.attribs.href);
  }
  const script = find(doc, (n) => n.name === 'script' && n.attribs && 'data-dc-script' in n.attribs);
  const code = (script.children || []).map((c) => c.data).join('');
  const props = JSON.parse((script.attribs['data-props'] || '{}').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&'));
  const defaults = {};
  for (const [k, v] of Object.entries(props)) if (!k.startsWith('$') && v && 'default' in v) defaults[k] = v.default;
  js += `
C.${name} = (() => {
  const DCLogic = DCBase;
${code}
  Component.__tpl = (html, $v, C) => html\`${body.trim()}\`;
  Component.defaultProps = ${JSON.stringify(defaults)};
  const off = Component.prototype.componentWillUnmount;
  Component.prototype.componentWillUnmount = function () { this.__alive = false; if (off) off.call(this); };
  return Component;
})();
`;
}
js += fs.readFileSync(new URL('./notfound.js', import.meta.url), 'utf8');
js += `
const root = document.getElementById('app');
if (document.body.dataset.page === '404') render(html\`<\${NotFound} />\`, root);
else render(html\`<\${C.Site} />\`, root);
const fb = document.getElementById('fallback'); if (fb) fb.remove();
`;
fs.mkdirSync(path.join(OUT, 'vendor'), { recursive: true });
fs.writeFileSync(path.join(OUT, 'app.js'), js);
fs.writeFileSync(path.join(OUT, 'app.css'), [...css].map((s) => s.trim()).join('\n'));
fs.writeFileSync(path.join(OUT, 'fonts.json'), JSON.stringify([...links], null, 1));
console.log('components', NAMES.length, 'css blocks', css.size, 'font links', links.size, 'app.js bytes', js.length);
