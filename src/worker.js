/** taste-blog · 单入口路由（Cloudflare Worker） */

import {
    kvGet, kvSet, settings, settingsSet,
    hashPassword, verifyPassword, cleanText, uid,
    postsSorted, postGet, commentsOf,
    douyinVid, saveFiles, removeUpload, getUpload, LIMITS,
} from './lib.js';
import {
    pageInstall, pageHome, pagePost, pageNotices, pageSearch,
    pageAdminLogin, pageAdmin, page404,
} from './views.js';

const enc = new TextEncoder();

function html(body, sess, status = 200) {
    const headers = new Headers({
        'content-type': 'text/html; charset=utf-8',
        'x-content-type-options': 'nosniff',
        'cache-control': 'no-store',
    });
    if (sess) for (const c of sess.cookieList()) headers.append('set-cookie', c);
    return new Response(body, { status, headers });
}
function redirect(to, sess, flashMsg) {
    if (flashMsg && sess) sess.flash(flashMsg);
    const headers = new Headers({ 'location': to });
    if (sess) for (const c of sess.cookieList()) headers.append('set-cookie', c);
    return new Response(null, { status: 302, headers });
}
function notFound(sess) {
    return html('<p style="font-family:monospace;padding:40px">404</p>', sess, 404);
}

/** 应用公共上下文（设置 / 会话 / CSRF / query） */
async function makeCtx(request, env) {
    const st = await settings(env);
    if (!st.secret) { st.secret = crypto.randomUUID().replace(/-/g, ''); await settingsSet(env, { secret: st.secret }); }
    const { Session } = await import('./lib.js');
    const sess = await new Session(request, env, st).load();
    const url = new URL(request.url);
    const csrf = await sess.csrfToken();
    return { request, env, st, sess, csrf, url, query: url.searchParams };
}

/** 首次部署自动建表 */
async function ensureSchema(env) {
    await env.DB.prepare('CREATE TABLE IF NOT EXISTS kv (k TEXT PRIMARY KEY, v TEXT NOT NULL)').run();
    await env.DB.prepare('CREATE TABLE IF NOT EXISTS uploads (id TEXT PRIMARY KEY, mime TEXT, name TEXT, size INTEGER, data TEXT, created INTEGER)').run();
}

/* ================= 安装 ================= */

async function seedDemo(env, st) {
    const now = Math.floor(Date.now() / 1000);
    const posts = {};
    posts['p_demo1'] = { id: 'p_demo1', title: '给旧笔记本换了块 NVMe', created: now - 3600, pinned: 0, likes: 0,
        content: '2015 年的机器，机械盘换成 NVMe，系统直接迁移过去。\n开机从一分半缩到十几秒，风扇也不再一直转。',
        images: [{ src: '/uploads/images/demo1.svg', name: 'nvme.svg' }, { src: '/uploads/images/demo2.svg', name: 'bench.svg' }],
        files: [], video: '' };
    posts['p_demo2'] = { id: 'p_demo2', title: '把家里的路由器刷成旁网关', created: now - 10800, pinned: 0, likes: 0,
        content: '主路由不动，旁边挂一台小主机跑 OpenWrt，DNS 和广告过滤都交给它。它挂了也不影响家里其他人上网。',
        images: [], files: [], video: '7312846593021749541' };
    // 示例附件存进上传表
    const attId = 'fdemo' + crypto.randomUUID().replace(/-/g, '').slice(0, 12);
    const demoTxt = 'port = 8080\ndebug = false\n';
    await env.DB.prepare('INSERT INTO uploads (id, mime, name, size, data, created) VALUES (?1,?2,?3,?4,?5,?6)')
        .bind(attId, 'text/plain', 'config.txt', demoTxt.length, btoa(demoTxt), now).run();
    posts['p_demo3'] = { id: 'p_demo3', title: '一份能用的自托管配置备忘', created: now - 86400, pinned: 0, likes: 0,
        content: '反代、证书、端口映射，三样凑齐就能从外网访问。踩过的坑连同端口表记在附件里。',
        images: [], files: [{ id: attId, name: 'config.txt', size: demoTxt.length }], video: '' };
    await kvSet(env, 'posts', posts);
    await kvSet(env, 'notices', { n_first: { id: 'n_first', title: '博客部署完成', created: now - 7200,
        content: '这是示例公告，进后台可以修改或删除。示例文章也可以删掉，然后写你自己的第一篇。' } });
}

export default {
    async fetch(request, env) {
        await ensureSchema(env);
        const ctx = await makeCtx(request, env);
        const { sess, st } = ctx;
        const method = request.method;
        const path = ctx.url.pathname.replace(/\/+$/, '') || '/';
        let m;

        /* 静态资源交给 Cloudflare 托管，这里兜底防漏 */
        if (path.startsWith('/assets/') || path.startsWith('/uploads/')) {
            if (env.ASSETS) return env.ASSETS.fetch(request);
        }

        /* ---------- 未安装：只能进安装面板 ---------- */
        if (!st.installed) {
            if (path === '/install' && method === 'GET') {
                return html(pageInstall(ctx), sess);
            }
            if (path === '/install' && method === 'POST') {
                const form = await request.formData();
                if (!sess.csrfOk(form, ctx.csrf)) return redirect('/install', sess, '页面已过期，请重试');
                const siteName = cleanText(form.get('site_name') || '').slice(0, 30);
                const siteDesc = cleanText(form.get('site_desc') || '').slice(0, 60);
                const adminName = cleanText(form.get('admin_name') || '').slice(0, 20);
                const adminPass = String(form.get('pass') ?? form.get('admin_pass') ?? '');
                const errs = [];
                if (!siteName) errs.push('站点名称要填一个');
                if (!adminName) errs.push('管理员用户名要填一个');
                if (adminPass.length < 6) errs.push('管理员密码至少 6 位');
                if (errs.length) return html(pageInstall(ctx, {
                    site_name: siteName, site_desc: siteDesc, admin_name: adminName,
                }, errs), sess);
                // 头像（可选）
                let avatarId = '';
                const av = await saveFiles(env, form, 'avatar', 'avatar', 1);
                if (av.items.length) avatarId = av.items[0].id;
                await settingsSet(env, {
                    installed: true, site_name: siteName, site_desc: siteDesc,
                    avatar: avatarId,
                });
                const fresh = await settings(env);
                await kvSet(env, 'admin', { name: adminName, pass: await hashPassword(adminPass), created: Math.floor(Date.now() / 1000) });
                await seedDemo(env, fresh);
                await sess.login();
                return redirect('/', sess, '安装完成，开始写作吧');
            }
            return redirect('/install', sess);
        }

        /* ---------- 上传文件服务 ---------- */
        if (method === 'GET' && (m = path.match(/^\/a\/([A-Za-z0-9_-]+)$/))) {
            const up = await getUpload(env, m[1]);
            if (!up) return notFound(sess);
            const bin = Uint8Array.from(atob(up.data), c => c.charCodeAt(0));
            return new Response(bin, {
                headers: {
                    'content-type': up.mime || 'application/octet-stream',
                    'cache-control': 'public, max-age=31536000, immutable',
                    'x-content-type-options': 'nosniff',
                },
            });
        }

        /* ---------- 附件下载 ---------- */
        if (method === 'GET' && (m = path.match(/^\/f\/([A-Za-z0-9_-]+)\/(\d+)$/))) {
            const p = await postGet(env, m[1]);
            const f = p && p.files && p.files[+m[2]];
            if (!f || !f.id) return notFound(sess);
            const up = await getUpload(env, f.id);
            if (!up) return notFound(sess);
            const bin = Uint8Array.from(atob(up.data), c => c.charCodeAt(0));
            return new Response(bin, {
                headers: {
                    'content-type': 'application/octet-stream',
                    'content-disposition': `attachment; filename="download"; filename*=UTF-8''${encodeURIComponent(f.name || 'file')}`,
                    'x-content-type-options': 'nosniff',
                },
            });
        }

        /* ---------- 访客动作 ---------- */
        if (method === 'POST' && path === '/comment') {
            const form = await request.formData();
            if (!sess.csrfOk(form, ctx.csrf)) return redirect('/', sess, '页面已过期，请重试');
            const pid = String(form.get('post') || '');
            const p = await postGet(env, pid);
            if (!p) return redirect('/', sess);
            const content = cleanText(form.get('content') || '').slice(0, 1000);
            if (!content) return redirect('/post/' + pid, sess, '评论内容不能为空');
            const name = cleanText(form.get('name') || '').slice(0, 20) || '访客';
            const id = uid('c_');
            const c = await kvGet(env, 'comments', {});
            c[id] = { id, post: pid, name, content, created: Math.floor(Date.now() / 1000) };
            await kvSet(env, 'comments', c);
            return redirect('/post/' + pid + '#replies', sess, '评论已发送');
        }

        if (method === 'POST' && path === '/like') {
            const form = await request.formData();
            if (!sess.csrfOk(form, ctx.csrf)) return redirect('/', sess);
            const pid = String(form.get('post') || '');
            const back = String(form.get('back') || '/');
            if (!/^\/(post\/[A-Za-z0-9_-]*)?$/.test(back)) return redirect('/', sess);
            const posts = await kvGet(env, 'posts', {});
            if (posts[pid]) { posts[pid].likes = (posts[pid].likes || 0) + 1; await kvSet(env, 'posts', posts); }
            return redirect(back, sess);
        }

        /* ---------- 登出 ---------- */
        if (path === '/logout') {
            sess.logout();
            return redirect('/', sess, '已退出管理');
        }

        /* ---------- 管理后台 ---------- */
        if (path === '/admin' || path.startsWith('/admin/')) {
            const sub = path === '/admin' ? '' : path.slice('/admin/'.length);

            if (method === 'POST' && sub === 'init') {
                // 站点还没有管理员时（例如忘记密码后在数据库里删除了 admin 记录），允许重新创建
                const exists = await kvGet(env, 'admin', {});
                if (exists && exists.name) return redirect('/admin', sess);
                const form = await request.formData();
                if (!sess.csrfOk(form, ctx.csrf)) return redirect('/admin', sess, '页面已过期，请重试');
                const name = cleanText(form.get('name') || '').slice(0, 20);
                const pass = String(form.get('pass') || '');
                if (!name || pass.length < 6) return redirect('/admin', sess, '用户名要填，密码至少 6 位');
                await kvSet(env, 'admin', { name, pass: await hashPassword(pass), created: Math.floor(Date.now() / 1000) });
                await sess.login();
                return redirect('/admin/posts', sess, '管理员已创建，开始写作吧');
            }

            if (method === 'POST' && sub === '') {
                const form = await request.formData();
                if (!sess.csrfOk(form, ctx.csrf)) return redirect('/admin', sess, '页面已过期，请重试');
                const admin = await kvGet(env, 'admin', {});
                const nameOk = admin.name && cleanText(form.get('name') || '') === admin.name;
                const passOk = nameOk && await verifyPassword(String(form.get('pass') || ''), admin.pass || '');
                if (!nameOk || !passOk) return redirect('/admin', sess, '用户名或密码不正确');
                await sess.login();
                return redirect('/admin/posts', sess, '已进入后台');
            }

            if (!sess.authed) {
                if (method === 'GET') {
                    const admin = await kvGet(env, 'admin', {});
                    return html(pageAdminLogin(ctx, [], !(admin && admin.name)), sess);
                }
                return redirect('/admin', sess, '请先登录');
            }

            // POST 动作
            if (method === 'POST') {
                const form = await request.formData();
                const back = String(form.get('back') || '/admin');
                const backOk = back.startsWith('/') ? back : '/admin';
                if (!sess.csrfOk(form, ctx.csrf)) return redirect(backOk, sess, '页面已过期，请重试');
                const now = Math.floor(Date.now() / 1000);

                if (sub === 'publish') {
                    const title = cleanText(form.get('title') || '').slice(0, 80);
                    const content = cleanText(form.get('content') || '').slice(0, 10000);
                    const videoRaw = String(form.get('video') || '').trim().slice(0, 200);
                    if (!title) return redirect('/admin/posts', sess, '标题要填一个');
                    if (!content && !videoRaw) return redirect('/admin/posts', sess, '内容和视频至少有一 样');
                    const video = videoRaw ? await douyinVid(videoRaw) : '';
                    if (videoRaw && !video) return redirect('/admin/posts', sess, '视频链接没认出来，换完整链接或纯 ID 再试');
                    const imgs = await saveFiles(env, form, 'images', 'image', 9);
                    const fils = await saveFiles(env, form, 'files', 'attach', 5);
                    if (imgs.errors.length || fils.errors.length) {
                        for (const it of imgs.items) await removeUpload(env, it.id);
                        for (const it of fils.items) await removeUpload(env, it.id);
                        return redirect('/admin/posts', sess, imgs.errors[0] || fils.errors[0]);
                    }
                    const id = uid('p_');
                    const posts = await kvGet(env, 'posts', {});
                    posts[id] = {
                        id, title, content, video,
                        images: imgs.items, files: fils.items,
                        likes: 0, pinned: 0, created: now,
                    };
                    await kvSet(env, 'posts', posts);
                    return redirect('/post/' + id, sess, '已发布');
                }

                if (sub === 'post/pin') {
                    const pid = String(form.get('post') || '');
                    const posts = await kvGet(env, 'posts', {});
                    if (posts[pid]) posts[pid].pinned = posts[pid].pinned ? 0 : 1;
                    await kvSet(env, 'posts', posts);
                    return redirect(backOk, sess);
                }
                if (sub === 'post/delete') {
                    const pid = String(form.get('post') || '');
                    const posts = await kvGet(env, 'posts', {});
                    const p = posts[pid];
                    if (p) {
                        for (const im of (p.images || [])) if (im.id) await removeUpload(env, im.id);
                        for (const fi of (p.files || [])) if (fi.id) await removeUpload(env, fi.id);
                        delete posts[pid];
                        await kvSet(env, 'posts', posts);
                        const cs = await kvGet(env, 'comments', {});
                        let changed = false;
                        for (const k of Object.keys(cs)) if (cs[k].post === pid) { delete cs[k]; changed = true; }
                        if (changed) await kvSet(env, 'comments', cs);
                    }
                    return redirect(backOk, sess, '已删除');
                }
                if (sub === 'comment/delete') {
                    const cid = String(form.get('comment') || '');
                    const cs = await kvGet(env, 'comments', {});
                    if (cs[cid]) { delete cs[cid]; await kvSet(env, 'comments', cs); }
                    return redirect(backOk, sess, '已删除');
                }
                if (sub === 'notice') {
                    const t = cleanText(form.get('title') || '').slice(0, 60);
                    const c = cleanText(form.get('content') || '').slice(0, 1000);
                    if (!t || !c) return redirect('/admin/notices', sess, '标题和内容都要填');
                    const id = uid('n_');
                    const ns = await kvGet(env, 'notices', {});
                    ns[id] = { id, title: t, content: c, created: now };
                    await kvSet(env, 'notices', ns);
                    return redirect('/admin/notices', sess, '公告已发布');
                }
                if (sub === 'notice/delete') {
                    const id = String(form.get('id') || '');
                    const ns = await kvGet(env, 'notices', {});
                    if (ns[id]) { delete ns[id]; await kvSet(env, 'notices', ns); }
                    return redirect('/admin/notices', sess, '已删除');
                }
                if (sub === 'site') {
                    const name = cleanText(form.get('site_name') || '').slice(0, 30);
                    const desc = cleanText(form.get('site_desc') || '').slice(0, 60);
                    if (!name) return redirect('/admin/brand', sess, '站点名称要填一个');
                    await settingsSet(env, { site_name: name, site_desc: desc });
                    return redirect('/admin/brand', sess, '站点信息已保存');
                }
                if (sub === 'avatar') {
                    const up = await saveFiles(env, form, 'avatar', 'avatar', 1);
                    if (up.errors.length) return redirect('/admin/brand', sess, up.errors[0]);
                    if (up.items.length) {
                        const old = (await settings(env)).avatar;
                        await settingsSet(env, { avatar: up.items[0].id });
                        if (old && old !== up.items[0].id) await removeUpload(env, old);
                    }
                    return redirect('/admin/brand', sess, '头像已更新');
                }
                if (sub === 'avatar/reset') {
                    const old = (await settings(env)).avatar;
                    await settingsSet(env, { avatar: '' });
                    if (old) await removeUpload(env, old);
                    return redirect('/admin/brand', sess, '已恢复默认头像');
                }
                if (sub === 'bg') {
                    const up = await saveFiles(env, form, 'bg', 'bg', 1);
                    if (up.errors.length) return redirect('/admin/brand', sess, up.errors[0]);
                    if (up.items.length) {
                        const old = (await settings(env)).bg;
                        await settingsSet(env, { bg: up.items[0].id });
                        if (old && old !== up.items[0].id) await removeUpload(env, old);
                    }
                    return redirect('/admin/brand', sess, '网站背景已更新');
                }
                if (sub === 'bg/reset') {
                    const old = (await settings(env)).bg;
                    await settingsSet(env, { bg: '' });
                    if (old) await removeUpload(env, old);
                    return redirect('/admin/brand', sess, '已恢复默认背景');
                }
                return redirect(backOk, sess);
            }

            // GET 页面
            if (sub === '' || sub === 'posts' || sub === 'notices' || sub === 'brand') {
                return html(await pageAdmin(ctx, sub || 'posts'), sess);
            }
            return redirect('/admin', sess);
        }

        /* ---------- 页面 ---------- */
        if (method === 'GET') {
            if (path === '/') return html(await pageHome(ctx), sess);
            if ((m = path.match(/^\/post\/([A-Za-z0-9_-]+)$/))) {
                const body = await pagePost(ctx, m[1]);
                if (body === null) return redirect('/', sess, '内容不存在');
                return html(body, sess);
            }
            if (path === '/notices') return html(await pageNotices(ctx), sess);
            if (path === '/search') return html(await pageSearch(ctx), sess);
            if (path === '/install') return redirect('/', sess);
        }

        return html(await page404(ctx), sess, 404);
    },
};
