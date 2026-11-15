/** 本地开发/测试：把 Worker 跑成普通 HTTP 服务（用内存模拟 D1，无需 Cloudflare 账号） */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import worker from '../src/worker.js';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const PUBLIC = path.join(ROOT, 'public');
const MIME = {
    '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
    '.woff2': 'font/woff2', '.jpg': 'image/jpeg', '.png': 'image/png',
    '.svg': 'image/svg+xml', '.txt': 'text/plain; charset=utf-8', '.ico': 'image/x-icon',
};
function serveStatic(pathname) {
    const rel = decodeURIComponent(pathname).replace(/^\/+/, '');
    if (!rel.startsWith('assets/') && !rel.startsWith('uploads/')) return null;
    const file = path.join(PUBLIC, rel);
    if (!file.startsWith(PUBLIC) || !fs.existsSync(file) || !fs.statSync(file).isFile()) return null;
    return new Response(fs.readFileSync(file), {
        headers: { 'content-type': MIME[path.extname(file)] || 'application/octet-stream', 'cache-control': 'public, max-age=3600' },
    });
}

/** 极简内存版 D1：只实现本项目用到的查询 */
function mockD1() {
    const kv = new Map();
    const uploads = new Map();
    function norm(s) { return s.replace(/\s+/g, ' ').trim().toLowerCase(); }
    return {
        prepare(sql) {
            const q = norm(sql);
            const self = {
                _args: [],
                bind(...a) { this._args = a; return this; },
                async first() {
                    if (q.startsWith('select v from kv')) {
                        const k = this._args[0];
                        return kv.has(k) ? { v: kv.get(k) } : null;
                    }
                    if (q.startsWith('select * from uploads')) {
                        const u = uploads.get(this._args[0]);
                        return u || null;
                    }
                    return null;
                },
                async run() {
                    if (q.startsWith('insert into kv')) {
                        kv.set(this._args[0], this._args[1]);
                    } else if (q.startsWith('delete from uploads')) {
                        uploads.delete(this._args[0]);
                    } else if (q.startsWith('insert into uploads')) {
                        const [id, mime, name, size, data, created] = this._args;
                        uploads.set(id, { id, mime, name, size, data, created });
                    } else if (q.startsWith('create table')) { /* noop */ }
                    return { success: true };
                },
                async all() { return { results: [] }; },
            };
            return self;
        },
        _kv: kv, _uploads: uploads,
    };
}

const env = { DB: mockD1(), ASSETS: undefined };

const server = http.createServer(async (req, res) => {
    try {
        const url = new URL('http://local.test' + req.url);
        const st = serveStatic(url.pathname);
        if (st) {
            const buf = Buffer.from(await st.arrayBuffer());
            res.writeHead(st.status, Object.fromEntries(st.headers));
            res.end(buf);
            return;
        }
        const chunks = [];
        for await (const c of req) chunks.push(c);
        const body = chunks.length ? Buffer.concat(chunks) : undefined;
        const req2 = new Request('http://local.test' + req.url, {
            method: req.method,
            headers: req.headers,
            body: body && req.method !== 'GET' && req.method !== 'HEAD' ? body : undefined,
            redirect: 'manual',
        });
        const resp = await worker.fetch(req2, env);
        const headers = {};
        resp.headers.forEach((v, k) => { if (k !== 'set-cookie') headers[k] = v; });
        const setCookies = resp.headers.getSetCookie ? resp.headers.getSetCookie() : [];
        if (setCookies.length) res.setHeader('set-cookie', setCookies);
        res.writeHead(resp.status, headers);
        const buf = Buffer.from(await resp.arrayBuffer());
        res.end(buf);
    } catch (e) {
        console.error('SERVER ERROR', e);
        res.writeHead(500, { 'content-type': 'text/plain; charset=utf-8' });
        res.end('500 ' + (e && e.message));
    }
});

const port = process.env.PORT || 8600;
server.listen(port, () => console.log('mock worker listening on http://127.0.0.1:' + port));
