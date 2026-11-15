/** taste-blog · 基础库：D1 存储 / 管理员认证 / 上传 / 工具 / 图标 */

/* ---------------- D1 键值存储 ---------------- */

export async function kvGet(env, k, dflt = {}) {
    const r = await env.DB.prepare('SELECT v FROM kv WHERE k = ?1').bind(k).first();
    if (!r) return dflt;
    try { const v = JSON.parse(r.v); return (v && typeof v === 'object') ? v : dflt; }
    catch { return dflt; }
}
export async function kvSet(env, k, v) {
    await env.DB.prepare('INSERT INTO kv (k, v) VALUES (?1, ?2) ON CONFLICT(k) DO UPDATE SET v = ?2')
        .bind(k, JSON.stringify(v)).run();
    return v;
}
export async function kvEdit(env, k, fn, dflt = {}) {
    const cur = await kvGet(env, k, dflt);
    return kvSet(env, k, await fn(cur));
}

/* ---------------- 站点设置 ---------------- */

export async function settings(env) {
    const s = await kvGet(env, 'settings', {});
    return { installed: false, site_name: '我的博客', site_desc: '', avatar: '', bg: '', secret: '', ...s };
}
export async function settingsSet(env, patch) {
    return kvEdit(env, 'settings', s => ({ ...s, ...patch }));
}

/* ---------------- 通用工具 ---------------- */

export function h(s) {
    return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
export function asset(p) { return '/' + String(p ?? '').replace(/^\/+/, ''); }

/** 去掉表情符号，界面保持纯文本 */
export function cleanText(s) {
    return String(s ?? '').replace(/\r\n?/g, '\n').trim()
        .replace(/[\u{1F000}-\u{1FAFF}\u{1F1E6}-\u{1F1FF}\u{2600}-\u{27BF}\u{FE0F}\u{200D}\u{2190}-\u{21FF}\u{2B00}-\u{2BFF}]/gu, '');
}
export function uid(p = '') { return p + crypto.randomUUID().replace(/-/g, '').slice(0, 16); }
export function cut(s, n = 120) {
    s = String(s ?? '');
    return [...s].length > n ? [...s].slice(0, n).join('') + '…' : s;
}
export function nl(s) { return h(s).replace(/\n/g, '<br>'); }
export function shortNum(n) { return n >= 1000 ? Math.round(n / 100) / 10 + 'k' : String(n); }
export function humanSize(b) { b = Math.max(0, b | 0); return b >= 1048576 ? Math.round(b / 1048576 * 10) / 10 + ' MB' : Math.max(1, Math.round(b / 1024)) + ' KB'; }

/** 统一按东八区显示日期 */
export function fmtDate(t) {
    const d = new Date((t | 0) * 1000 + 8 * 3600 * 1000);
    return d.getUTCFullYear() + '.' + String(d.getUTCMonth() + 1).padStart(2, '0') + '.' + String(d.getUTCDate()).padStart(2, '0');
}
export function timeAgo(t) {
    const d = Math.floor(Date.now() / 1000) - (t | 0);
    if (d < 60) return '刚刚';
    if (d < 3600) return Math.floor(d / 60) + ' 分钟前';
    if (d < 86400) return Math.floor(d / 3600) + ' 小时前';
    if (d < 172800) return '昨天';
    if (d < 31536000) return fmtDate(t).slice(5).replace('.', ' 月 ') + ' 日';
    return fmtDate(t).replace('.', ' 年 ').replace('.', ' 月 ') + ' 日';
}

/* ---------------- 图标（纯 SVG，无表情符号） ---------------- */

const ICONS = {
    'home': 'M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z',
    'image': 'M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z',
    'attach': 'M16.5 6v11.5c0 2.21-1.79 4-4 4s-4-1.79-4-4V5c0-1.38 1.12-2.5 2.5-2.5s2.5 1.12 2.5 2.5v10.5c0 .55-.45 1-1 1s-1-.45-1-1V6H10v9.5c0 1.38 1.12 2.5 2.5 2.5s2.5-1.12 2.5-2.5V5c0-2.21-1.79-4-4-4S7 2.79 7 5v12.5c0 3.04 2.46 5.5 5.5 5.5s5.5-2.46 5.5-5.5V6h-1.5z',
    'file': 'M6 2c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6H6zm7 7V3.5L18.5 9H13z',
    'notice': 'M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z',
    'search': 'M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z',
    'settings': 'M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94L14.4 2.81c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41L9.25 5.35C8.66 5.59 8.12 5.92 7.63 6.29L5.24 5.33c-.22-.08-.47 0-.59.22L2.73 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .43-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z',
    'delete': 'M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z',
    'check': 'M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z',
    'edit': 'M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z',
    'logout': 'M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z',
    'comment': 'M21.99 4c0-1.1-.89-2-1.99-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14l4 4-.01-18z',
    'lock': 'M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 .9 2 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1s3.1 1.39 3.1 3.1v2z',
    'refresh': 'M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z',
    'moon': 'M12 3a9 9 0 1 0 9 9c0-.46-.04-.92-.1-1.36a5.4 5.4 0 0 1-4.4 2.26A5.4 5.4 0 0 1 13.36 3.1c-.44-.06-.9-.1-1.36-.1z',
    'sun': 'M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10z M11 0h2v3h-2z M11 21h2v3h-2z M0 11h3v2H0z M21 11h3v2h-3z M3.5 4.9l1.4-1.4 2.1 2.1-1.4 1.4z M16.9 18.3l1.4-1.4 2.1 2.1-1.4 1.4z M3.5 19.1l2.1-2.1 1.4 1.4-2.1 2.1z M16.9 5.7l2.1-2.1 1.4 1.4-2.1 2.1z',
    'menu': 'M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z',
    'info': 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z',
    'upload': 'M9 16h6v-6h4l-7-7-7 7h4v6zm-4 2h14v2H5v-2z',
    'push_pin': 'M16 9V4h1c.55 0 1-.45 1-1s-.45-1-1-1H7c-.55 0-1 .45-1 1s.45 1 1 1h1v5c0 1.66-1.34 3-3 3v2h5.97v7l1 1 1-1v-7H19v-2c-1.66 0-3-1.34-3-3z',
};
export function icon(name, size = 24, cls = '') {
    const d = ICONS[name] || ICONS['info'];
    return '<svg class="ic ' + h(cls) + '" width="' + (size | 0) + '" height="' + (size | 0) +
        '" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="' + d + '"></path></svg>';
}

/* ---------------- 密码与签名（WebCrypto，Workers 自带） ---------------- */

const enc = new TextEncoder();

function b64url(s) {
    const bin = String.fromCharCode(...new TextEncoder().encode(s));
    return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function unb64url(s) {
    s = s.replace(/-/g, '+').replace(/_/g, '/');
    while (s.length % 4) s += '=';
    return new TextDecoder().decode(Uint8Array.from(atob(s), c => c.charCodeAt(0)));
}

async function hmacKey(secret) {
    return crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
}
async function hmacSign(secret, msg) {
    const sig = await crypto.subtle.sign('HMAC', await hmacKey(secret), enc.encode(msg));
    return [...new Uint8Array(sig)].map(b => b.toString(16).padStart(2, '0')).join('');
}
export async function hashPassword(pw) {
    const salt = crypto.randomUUID().replace(/-/g, '').slice(0, 16);
    const key = await crypto.subtle.importKey('raw', enc.encode(pw), 'PBKDF2', false, ['deriveBits']);
    const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: enc.encode(salt), iterations: 100000 }, key, 256);
    const hash = [...new Uint8Array(bits)].map(b => b.toString(16).padStart(2, '0')).join('');
    return 'pbkdf2$100000$' + salt + '$' + hash;
}
export async function verifyPassword(pw, stored) {
    try {
        const [algo, iters, salt, hash] = String(stored).split('$');
        if (algo !== 'pbkdf2') return false;
        const key = await crypto.subtle.importKey('raw', enc.encode(pw), 'PBKDF2', false, ['deriveBits']);
        const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: enc.encode(salt), iterations: +iters }, key, 256);
        const calc = [...new Uint8Array(bits)].map(b => b.toString(16).padStart(2, '0')).join('');
        return calc === hash;
    } catch { return false; }
}

/* ---------------- Cookie 会话 / 提示 / CSRF ---------------- */

function parseCookies(request) {
    const out = {};
    const raw = request.headers.get('Cookie') || '';
    for (const part of raw.split(';')) {
        const i = part.indexOf('=');
        if (i > 0) out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
    }
    return out;
}

export class Session {
    constructor(request, env, st) {
        this.env = env; this.st = st;
        this.cookies = parseCookies(request);
        this.setCookies = [];
        this.authed = false;
        this.flashMsg = null;
    }
    /** 校验登录签名 */
    async load() {
        const tok = this.cookies['bb_auth'];
        if (tok && this.st.secret) {
            const [payload, sig] = tok.split('.');
            if (payload && sig && await hmacSign(this.st.secret, payload) === sig) {
                try {
                    const d = JSON.parse(unb64url(payload));
                    if (d.exp > Date.now() / 1000) this.authed = true;
                } catch {}
            }
        }
        if (this.cookies['bb_flash']) {
            try { this.flashMsg = JSON.parse(this.cookies['bb_flash']).m; } catch {}
            this.setCookies.push('bb_flash=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax');
        }
        return this;
    }
    flash(msg) { this.setCookies.push('bb_flash=' + encodeURIComponent(JSON.stringify({ m: msg })) + '; Path=/; Max-Age=120; HttpOnly; SameSite=Lax'); }
    takeFlash() { const m = this.flashMsg; this.flashMsg = null; return m; }
    async login() {
        const exp = Math.floor(Date.now() / 1000) + 14 * 86400;
        const payload = b64url(JSON.stringify({ exp }));
        const sig = await hmacSign(this.st.secret, payload);
        this.setCookies.push('bb_auth=' + payload + '.' + sig + '; Path=/; Max-Age=1209600; HttpOnly; SameSite=Lax');
        this.authed = true;
    }
    logout() {
        this.setCookies.push('bb_auth=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax');
        this.authed = false;
    }
    /** CSRF 双提交：cookie 存随机值，表单字段必须一致 */
    async csrfToken() {
        let t = this.cookies['bb_csrf'];
        if (!t || !/^[0-9a-f]{32}$/.test(t)) {
            t = crypto.randomUUID().replace(/-/g, '');
            this.setCookies.push('bb_csrf=' + t + '; Path=/; Max-Age=604800; SameSite=Lax');
        }
        return t;
    }
    csrfOk(form, token) { return !!form && form.get('csrf') === token; }
    /** 多个 Set-Cookie 头（必须逐头发送，不能逗号拼接） */
    cookieList() { return this.setCookies.slice(); }
}

/* ---------------- 内容 ---------------- */

export async function postsSorted(env, q = '') {
    const posts = await kvGet(env, 'posts', {});
    let out = Object.values(posts);
    if (q) {
        const qq = q.toLowerCase();
        out = out.filter(p => (p.title + ' ' + p.content).toLowerCase().includes(qq));
    }
    out.sort((a, b) => (b.pinned - a.pinned) || (b.created - a.created));
    return out;
}
export async function postGet(env, id) {
    const posts = await kvGet(env, 'posts', {});
    return posts[id] || null;
}
export async function commentsOf(env, postId) {
    const cs = await kvGet(env, 'comments', {});
    return Object.values(cs).filter(c => c.post === postId).sort((a, b) => a.created - b.created);
}
export async function commentCount(env, postId) {
    const cs = await kvGet(env, 'comments', {});
    let n = 0; for (const c of Object.values(cs)) if (c.post === postId) n++;
    return n;
}

/* ---------------- 抖音视频 ---------------- */

const UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1';

async function resolveRedirect(u) {
    try {
        const r = await fetch(u, { redirect: 'follow', headers: { 'user-agent': UA, 'accept': 'text/html,*/*' }, cf: { cacheTtl: 600 } });
        try { if (r.body) await r.body.cancel(); } catch {}
        return r.url || '';
    } catch { return ''; }
}

/** 从分享口令 / 链接 / 嵌入代码 / 纯 ID 里提取视频 ID；只留白名单字符 */
export async function douyinVid(raw) {
    let s = String(raw ?? '').trim();
    if (!s) return '';
    if (/v\.douyin\.com/i.test(s)) {
        const m = s.match(/https?:\/\/v\.douyin\.com\/[A-Za-z0-9_./-]+/i);
        if (m) {
            const eff = await resolveRedirect(m[0].replace(/[./]+$/, ''));
            if (eff) s += ' ' + eff;
        }
    }
    let m = s.match(/vid=([A-Za-z0-9_-]{6,40})/i);
    if (m) return m[1];
    m = s.match(/\/video\/([A-Za-z0-9_-]{6,40})/i);
    if (m) return m[1];
    if (/^[A-Za-z0-9_-]{6,40}$/.test(s)) return s;
    const ms = s.match(/[A-Za-z0-9_-]{6,40}/g) || [];
    for (const x of ms) if (x.length >= 15 && /[0-9]/.test(x)) return x;
    return '';
}
export function douyinPlayer(vid) {
    return 'https://open.douyin.com/player/video?vid=' + encodeURIComponent(vid) + '&autoplay=0';
}

/* ---------------- 上传（存进 D1） ---------------- */

export const LIMITS = { imageMax: 1536 * 1024, attachMax: 512 * 1024, avatarMax: 512 * 1024, bgMax: 2048 * 1024 };
const IMG_EXT = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'avif'];
const ATT_EXT = ['txt', 'md', 'pdf', 'zip', '7z', 'gz', 'json', 'yaml', 'yml', 'conf', 'ini', 'csv', 'log', 'sh', 'py', 'js', 'ts', 'css', 'html', 'xml', 'toml', 'patch', 'diff'];

const MIME = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', gif: 'image/gif', webp: 'image/webp', svg: 'image/svg+xml', avif: 'image/avif' };

export function itemSrc(im) { return im.id ? '/a/' + im.id : (im.src || ''); }

/** 保存一组上传文件；kind: image | attach | avatar | bg；返回 {items, errors} */
export async function saveFiles(env, form, field, kind, limit = 0) {
    const items = [], errors = [];
    const exts = kind === 'attach' ? ATT_EXT : IMG_EXT;
    const max = kind === 'attach' ? LIMITS.attachMax : (kind === 'bg' ? LIMITS.bgMax : (kind === 'avatar' ? LIMITS.avatarMax : LIMITS.imageMax));
    let files = [...form.getAll(field)].filter(f => f && typeof f === 'object' && 'arrayBuffer' in f && f.size > 0);
    if (limit && files.length > limit) { files = files.slice(0, limit); errors.push('最多上传 ' + limit + ' 个'); }
    for (const f of files) {
        const orig = (f.name || 'file').split(/[\\/]/).pop();
        const ext = (orig.split('.').pop() || '').toLowerCase();
        if (f.size > max) { errors.push(orig + ' 超过 ' + humanSize(max)); continue; }
        if (!exts.includes(ext)) { errors.push('不支持的格式：' + orig); continue; }
        const buf = new Uint8Array(await f.arrayBuffer());
        // 图片做一次简单校验（文件头魔数）
        if (kind !== 'attach' && !looksLikeImage(buf, ext)) { errors.push('不是有效图片：' + orig); continue; }
        const id = 'f' + crypto.randomUUID().replace(/-/g, '').slice(0, 20);
        let bin = '';
        for (const b of buf) bin += String.fromCharCode(b);
        const b64 = btoa(bin);
        const mime = MIME[ext] || 'application/octet-stream';
        await env.DB.prepare('INSERT INTO uploads (id, mime, name, size, data, created) VALUES (?1,?2,?3,?4,?5,?6)')
            .bind(id, mime, orig, f.size, b64, Math.floor(Date.now() / 1000)).run();
        items.push({ id, name: orig, size: f.size, ext });
    }
    return { items, errors };
}
function looksLikeImage(b, ext) {
    if (ext === 'svg') { const s = new TextDecoder().decode(b.slice(0, 512)); return s.includes('<svg') || s.includes('<?xml'); }
    if (b.length < 8) return false;
    const jpg = b[0] === 0xFF && b[1] === 0xD8;
    const png = b[0] === 0x89 && b[1] === 0x50;
    const gif = b[0] === 0x47 && b[1] === 0x49;
    const webp = b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50;
    const avif = b[4] === 0x66 && b[5] === 0x74 && b[6] === 0x79 && b[7] === 0x70;
    return jpg || png || gif || webp || avif;
}
export async function removeUpload(env, id) {
    if (id && /^[A-Za-z0-9_-]+$/.test(id)) {
        await env.DB.prepare('DELETE FROM uploads WHERE id = ?1').bind(id).run();
    }
}
export async function getUpload(env, id) {
    if (!/^[A-Za-z0-9_-]+$/.test(id)) return null;
    return env.DB.prepare('SELECT * FROM uploads WHERE id = ?1').bind(id).first();
}
