/** taste-blog · 界面（dots 标志 / hero / 索引列表 / footer-dark / 安装面板 / 管理后台） */
import {
    h, asset, cut, nl, shortNum, humanSize, fmtDate, timeAgo, icon,
    itemSrc, douyinPlayer, commentCount,
} from './lib.js';

/* ---------------- 布局 ---------------- */

export function layout(ctx, title, opt = {}) {
    const { st, sess } = ctx;
    const nav = opt.nav || '';
    const kicker = opt.kicker || '';
    const intro = opt.intro || '';
    const plain = !!opt.plain;
    const auth = !!opt.auth;
    const name = st.site_name || '我的博客';
    const bgv = st.bg ? '?v=1' : '';
    const links = [['文章', '/'], ['公告', '/notices'], ['搜索', '/search']];
    const flash = sess.takeFlash();

    let head = `<!DOCTYPE html>
<html lang="zh-CN" data-theme="dark">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" id="theme-color" content="#18191b">
<meta name="color-scheme" id="color-scheme" content="dark">
<title>${h(title === name ? name + ' — 记录折腾，分享所得' : title + ' · ' + name)}</title>
<script>
(function () { try {
  var t = localStorage.getItem('bb_theme');
  if (t !== 'light') t = 'dark';
  var d = document.documentElement;
  d.setAttribute('data-theme', t);
  d.style.colorScheme = t;
  document.getElementById('theme-color').setAttribute('content', t === 'dark' ? '#18191b' : '#eff0f1');
  document.getElementById('color-scheme').setAttribute('content', t);
} catch (e) {} })();
</script>
<link rel="stylesheet" href="/assets/style.css">${st.bg ? `\n<style>body.has-bg::before{background-image:url('${asset(st.bg ? '/a/' + st.bg : '')}${bgv}')}</style>` : ''}
</head>
<body class="${auth ? 'auth-body' : ''}${st.bg ? ' has-bg' : ''} page-enter">
<header class="head">
  <div class="head-in">
    <a class="brand" href="/">
      <span class="dots" aria-hidden="true"><i></i><i></i><i></i></span>
      <span class="brand-name">${h(name)}</span>
    </a>
    <nav class="head-nav" aria-label="主导航">
${links.map(l => `      <a class="hn-link${nav === l[0] ? ' on' : ''}" href="${l[1]}">${h(l[0])}</a>`).join('\n')}
${sess.authed ? '      <a class="hn-link hn-admin" href="/admin">后台</a>' : ''}
    </nav>
    <div class="head-act">
      <button type="button" class="iconbtn" id="theme-toggle" aria-label="切换浅色与深色" title="浅色 / 深色"><span class="ic-moon">${icon('moon', 20)}</span><span class="ic-sun">${icon('sun', 20)}</span></button>
      <button type="button" class="iconbtn burger" id="burger" aria-label="菜单" aria-expanded="false" aria-controls="m-drawer">${icon('menu', 22)}</button>
    </div>
  </div>
</header>
<div class="drawer" id="m-drawer" hidden>
  <nav class="drawer-nav" aria-label="菜单">
${links.map((l, i) => `    <a class="dn-link${nav === l[0] ? ' on' : ''}" href="${l[1]}"><span class="dn-no">${String(i + 1).padStart(2, '0')}</span>${h(l[0])}</a>`).join('\n')}
${sess.authed ? `    <a class="dn-link" href="/admin"><span class="dn-no">04</span>后台</a>` : ''}
  </nav>
  <div class="drawer-foot">
${sess.authed
        ? `    <a class="dn-link dn-quiet" href="/logout">退出管理</a>`
        : `    <a class="btn-solid" href="/admin">管理后台</a>`}
  </div>
</div>
<main class="main" id="main">
${(!plain && !auth) ? `<div class="page-head">
  <p class="ph-kicker">${kicker || 'PAGE'}</p>
  <h1 class="ph-title">${h(title)}</h1>
${intro ? `  <p class="ph-intro">${h(intro)}</p>` : ''}
</div>` : ''}
`;
    ctx._layoutEnd = () => layoutEnd(ctx, flash);
    return head;
}

function layoutEnd(ctx, flash) {
    const { st, sess } = ctx;
    const name = st.site_name || '我的博客';
    return `</main>
<footer class="foot">
  <div class="foot-in">
    <div class="foot-brand">
      <span class="dots dots-lg" aria-hidden="true"><i></i><i></i><i></i></span>
      <b>${h(name)}</b>
      <p>${h(st.site_desc || '记录折腾，分享所得。')}</p>
    </div>
    <nav class="foot-nav" aria-label="页脚导航">
      <div class="foot-col">
        <b class="mono">SITE</b>
        <a href="/">文章</a>
        <a href="/notices">公告</a>
        <a href="/search">搜索</a>
      </div>
      <div class="foot-col">
        <b class="mono">ADMIN</b>
        <a href="/admin">管理后台</a>
${sess.authed ? '        <a href="/logout">退出管理</a>' : ''}
      </div>
    </nav>
  </div>
  <div class="foot-base mono"><span>© ${new Date().getFullYear()} ${h(name)}</span><span>Powered by Cloudflare</span></div>
</footer>
<a class="fab" href="/admin" aria-label="管理后台">＋</a>
<div class="snackbar ${flash ? 'on' : ''}" id="snackbar" role="status">
  <span class="sn-msg">${flash ? h(flash) : ''}</span>
  <button type="button" class="sn-ok" id="snack-ok">知道了</button>
</div>
<div class="dlg-mask" id="dlg-mask" hidden>
  <div class="dialog" role="dialog" aria-modal="true">
    <h2 id="dlg-title">确认</h2>
    <p id="dlg-text"></p>
    <div class="dlg-actions">
      <button type="button" class="tbtn" id="dlg-cancel">取消</button>
      <button type="button" class="tbtn tbtn-solid" id="dlg-yes">确定</button>
    </div>
  </div>
</div>
<input type="hidden" id="csrf" value="${h(ctx.csrf || '')}">
<script src="/assets/app.js" defer></script>
</body>
</html>`;
}

/* ---------------- 通用构件 ---------------- */

function emptyState(text) {
    return '<div class="empty"><span class="empty-no mono">—</span><span>' + h(text) + '</span></div>';
}
function field(name, label, type = 'text', val = '', extra = '') {
    return '<div class="field"><input type="' + h(type) + '" id="f_' + h(name) + '" name="' + h(name) +
        '" value="' + h(val) + '" placeholder="' + h(label) + '" ' + extra + '><label class="mono" for="f_' + h(name) + '">' + h(label) + '</label></div>';
}
function textarea(name, label, val = '', rows = 5, extra = '') {
    return '<div class="field area"><textarea id="f_' + h(name) + '_a" name="' + h(name) + '" rows="' + (rows | 0) +
        '" placeholder="' + h(label) + '" ' + extra + '>' + h(val) + '</textarea><label class="mono" for="f_' + h(name) + '_a">' + h(label) + '</label></div>';
}
function section(t) { return '<div class="sec-label mono">' + h(t) + '</div>'; }
function csrfField(ctx) { return '<input type="hidden" name="csrf" value="' + h(ctx.csrf || '') + '">'; }

function rowKind(p) {
    let out = '';
    if (p.video) out += '<span class="rk">视频</span>';
    const ni = (p.images || []).length;
    if (ni) out += '<span class="rk">图 ' + ni + '</span>';
    const nf = (p.files || []).length;
    if (nf) out += '<span class="rk">附件 ' + nf + '</span>';
    if (p.pinned) out += '<span class="rk rk-hot">置顶</span>';
    return out;
}
function videoBox(vid) {
    if (!vid) return '';
    return '<div class="video-box" data-src="' + h(douyinPlayer(vid)) + '">' +
        '<button type="button" class="video-play" aria-label="播放视频"><span class="vp-tri"></span><span class="mono">播放</span></button>' +
        '</div>';
}
function imgGrid(images) {
    if (!images || !images.length) return '';
    const n = images.length;
    const cls = n === 1 ? 'g1' : (n === 2 ? 'g2' : 'g3');
    let out = '<div class="imggrid ' + cls + '">';
    for (const im of images) {
        const src = itemSrc(im);
        out += '<a class="imgcell" href="' + h(src) + '" target="_blank" rel="noopener">' +
            '<img src="' + h(src) + '" alt="" loading="lazy"></a>';
    }
    return out + '</div>';
}
function fileRows(p) {
    if (!p.files || !p.files.length) return '';
    let out = '<div class="filerows">';
    p.files.forEach((f, i) => {
        out += '<a class="filerow" href="/f/' + h(p.id) + '/' + i + '">' +
            '<span class="fr-name">' + h(f.name) + '</span>' +
            '<span class="fr-meta mono">' + humanSize(f.size || 0) + '</span>' +
            '<span class="fr-dl mono">下载</span></a>';
    });
    return out + '</div>';
}
function likeBtn(ctx, p, back) {
    const liked = likeCookie(ctx, p.id);
    return '<form method="post" action="/like" class="inline-form likeform" data-post="' + h(p.id) + '">' +
        csrfField(ctx) + '<input type="hidden" name="post" value="' + h(p.id) + '">' +
        '<input type="hidden" name="back" value="' + h(back) + '">' +
        '<button type="submit" class="like mono' + (liked ? ' liked' : '') + '">♥ ' + shortNum(p.likes || 0) + '</button></form>';
}
function likeCookie(ctx, pid) {
    // 渲染时不知道浏览器本地状态，交给前端脚本处理；这里只按计数显示
    return false;
}

function postList(ctx, posts, page, basePath, q = '') {
    const PER = 8;
    const total = posts.length;
    const pages = Math.max(1, Math.ceil(total / PER));
    page = Math.max(1, Math.min(page, pages));
    const slice = posts.slice((page - 1) * PER, page * PER);
    let out = '<section class="index">';
    if (!slice.length) return out + emptyState('还没有文章，去后台写下第一篇') + '</section>';
    out += '<div class="idx-head mono"><span>INDEX · 文章</span><span>' + total + '</span></div>';
    let no = (page - 1) * PER;
    for (const p of slice) {
        no++;
        out += `<article class="row">
    <a class="row-main" href="/post/${h(p.id)}">
      <span class="row-no mono">${String(no).padStart(2, '0')}</span>
      <span class="row-txt">
        <span class="row-title">${h(p.title)}</span>
        ${p.content ? `<span class="row-x">${h(cut(p.content, 76))}</span>` : ''}
        <span class="row-meta mono">${h(fmtDate(p.created))}${rowKind(p)}</span>
      </span>
      <span class="row-arrow" aria-hidden="true">→</span>
    </a>
    <div class="row-act">${likeBtn(ctx, p, basePath)}<a class="like mono" href="/post/${h(p.id)}#replies">评论 ${commentCountCache.get(p.id) || 0}</a></div>
  </article>`;
    }
    if (pages > 1) {
        out += '<div class="pager mono">';
        for (let i = 1; i <= pages; i++) {
            const qs = q ? '&q=' + encodeURIComponent(q) : '';
            out += `<a class="pg${i === page ? ' on' : ''}" href="${basePath}?page=${i}${qs}">${i}</a>`;
        }
        out += '</div>';
    }
    return out + '</section>';
}
const commentCountCache = new Map();
/** 预取一页列表的评论数，避免渲染中再查库 */
export async function preloadCounts(env, posts) {
    commentCountCache.clear();
    for (const p of posts.slice(0, 8)) commentCountCache.set(p.id, await commentCount(env, p.id));
}

/* ---------------- 安装面板 ---------------- */

export function pageInstall(ctx, vals = {}, errs = []) {
    let out = `<!DOCTYPE html>
<html lang="zh-CN" data-theme="dark">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#18191b">
<meta name="color-scheme" content="dark">
<title>安装 · taste-blog</title>
<link rel="stylesheet" href="/assets/style.css">
</head>
<body class="auth-body page-enter">
<div class="auth-wrap">
  <div class="auth-card">
    <span class="dots dots-xl" aria-hidden="true"><i></i><i></i><i></i></span>
    <h1 class="auth-title">开始安装</h1>
    <p class="auth-sub mono">SETUP · 三步完成，随后即可写作</p>
    <div class="install-steps mono">
      <span class="istep on"><b>1</b> 填写站点信息</span>
      <span class="istep"><b>2</b> 设置管理员</span>
      <span class="istep"><b>3</b> 开始写作</span>
    </div>
${errs.map(e => `    <div class="form-err mono">${h(e)}</div>`).join('')}
    <form method="post" action="/install" enctype="multipart/form-data" class="auth-form">
      <input type="hidden" name="csrf" value="${h(ctx.csrf || '')}">
      ${field('site_name', '填写你的名字', 'text', vals.site_name || '', 'maxlength="30" required')}
      ${field('site_desc', '一句话介绍（可选）', 'text', vals.site_desc || '', 'maxlength="60"')}
      ${field('admin_name', '管理员用户名', 'text', vals.admin_name || '', 'maxlength="20" required autocomplete="username"')}
      ${field('admin_pass', '管理员密码（至少 6 位）', 'password', '', 'minlength="6" required autocomplete="new-password"')}
      <label class="picker">
        <span class="mono">博客头像（可选）</span>
        <input type="file" name="avatar" accept="image/*">
      </label>
      <div class="auth-bar"><button type="submit" class="btn-solid">完成安装</button></div>
    </form>
    <p class="auth-foot mono">安装信息保存在你的数据库里，随时可在后台修改</p>
  </div>
</div>
</body>
</html>`;
    return out;
}

/* ---------------- 首页 ---------------- */

export async function pageHome(ctx) {
    const { env, st } = ctx;
    const { postsSorted } = await import('./lib.js');
    const posts = await postsSorted(env);
    await preloadCounts(env, posts);
    let out = layout(ctx, st.site_name, { plain: true });
    const last = posts[0];
    const notices = Object.values(await (await import('./lib.js')).kvGet(env, 'notices', {}));
    notices.sort((a, b) => b.created - a.created);
    const notice = notices[0];
    out += `<section class="hero">
  <p class="hero-k mono">${h(st.site_desc || 'TECH SHARING — 记录与分享')}</p>
  <h1 class="hero-t">记录折腾，<br>分享所得。</h1>
  <div class="hero-meta mono">
    <span>${posts.length} 篇文章</span>
    <span>${last ? '更新于 ' + h(timeAgo(last.created)) : '尚无内容'}</span>
  </div>
</section>`;
    if (notice) {
        out += `<a class="notice-strip" href="/notices">
  <span class="ns-label mono">公告</span>
  <span class="ns-title">${h(notice.title)}</span>
  <span class="ns-arrow" aria-hidden="true">→</span>
</a>`;
    }
    out += postList(ctx, posts, parseInt(ctx.query.get('page') || '1', 10) || 1, '/');
    out += ctx._layoutEnd();
    return out;
}

/* ---------------- 文章详情 ---------------- */

export async function pagePost(ctx, id) {
    const { env } = ctx;
    const { postGet, commentsOf } = await import('./lib.js');
    const p = await postGet(env, id);
    if (!p) return null;
    let out = layout(ctx, p.title, { plain: true });
    out += `<article class="post">
  <p class="ph-kicker post-kicker">ARTICLE · 文章</p>
  <div class="post-meta mono">
    <span>${h(fmtDate(p.created))}</span>
    <span>${rowKind(p) || '文字'}</span>
  </div>
  <h1 class="post-h1">${h(p.title)}</h1>
${p.content ? `<div class="post-text">${nl(p.content)}</div>` : ''}
${videoBox(p.video)}
${imgGrid(p.images)}
${fileRows(p)}
  <div class="post-act">
    ${likeBtn(ctx, p, '/post/' + h(p.id))}
${sessAdmin(ctx) ? `
    <form method="post" action="/admin/post/pin" class="inline-form">
      ${csrfField(ctx)}<input type="hidden" name="post" value="${h(p.id)}">
      <input type="hidden" name="back" value="/post/${h(p.id)}">
      <button type="submit" class="act-ghost mono">${p.pinned ? '取消置顶' : '置顶'}</button>
    </form>
    <form method="post" action="/admin/post/delete" class="inline-form" data-confirm="删除这篇文章？">
      ${csrfField(ctx)}<input type="hidden" name="post" value="${h(p.id)}">
      <input type="hidden" name="back" value="/">
      <button type="submit" class="act-ghost mono danger">删除</button>
    </form>` : ''}
  </div>
</article>
<a id="replies"></a>
<section class="replies">
  <div class="idx-head mono"><span>REPLIES · 评论</span><span>${(await commentsOf(env, id)).length}</span></div>
`;
    const cs = await commentsOf(env, id);
    if (!cs.length) out += emptyState('还没有评论，说点什么吧');
    for (const c of cs) {
        out += `<div class="reply"><div class="reply-top"><b>${h(c.name)}</b><span class="mono">${h(timeAgo(c.created))}</span></div>` +
            `<p>${nl(c.content)}</p>`;
        if (sessAdmin(ctx)) {
            out += `<form method="post" action="/admin/comment/delete" data-confirm="删除这条评论？">${csrfField(ctx)}` +
                `<input type="hidden" name="comment" value="${h(c.id)}">` +
                `<input type="hidden" name="back" value="/post/${h(id)}">` +
                `<button type="submit" class="act-ghost mono danger">删除</button></form>`;
        }
        out += '</div>';
    }
    out += `<form class="composer" method="post" action="/comment">
    ${csrfField(ctx)}<input type="hidden" name="post" value="${h(id)}">
${field('name', '昵称（可不填）', 'text', '', 'maxlength="20"')}
${textarea('content', '写评论', '', 3, 'maxlength="1000" required')}
    <div class="composer-bar"><button type="submit" class="btn-solid">发送评论</button></div>
  </form>
</section>`;
    out += ctx._layoutEnd();
    return out;
}
function sessAdmin(ctx) { return !!ctx.sess.authed; }

/* ---------------- 公告 / 搜索 ---------------- */

export async function pageNotices(ctx) {
    const { env } = ctx;
    const { kvGet } = await import('./lib.js');
    const ns = Object.values(await kvGet(env, 'notices', {}));
    ns.sort((a, b) => b.created - a.created);
    let out = layout(ctx, '公告', { nav: '公告', kicker: 'NOTICES · 公告' });
    out += '<section class="index"><div class="idx-head mono"><span>NOTICES</span><span>' + ns.length + '</span></div>';
    if (!ns.length) out += emptyState('还没有公告');
    let no = 0;
    for (const n of ns) {
        no++;
        out += `<article class="row"><div class="row-main row-static">` +
            `<span class="row-no mono">${String(no).padStart(2, '0')}</span>` +
            `<span class="row-txt"><span class="row-title">${h(n.title)}</span>` +
            `<span class="row-x">${nl(n.content)}</span>` +
            `<span class="row-meta mono">${h(fmtDate(n.created))}</span></span></div></article>`;
    }
    out += '</section>' + ctx._layoutEnd();
    return out;
}

export async function pageSearch(ctx) {
    const q = (ctx.query.get('q') || '').trim().slice(0, 50);
    let out = layout(ctx, '搜索', { kicker: 'SEARCH · 搜索' });
    out += `<form class="searchbar" method="get" action="/search">
  <input type="search" name="q" value="${h(q)}" placeholder="搜索文章" aria-label="搜索" class="mono">
  <button type="submit" class="btn-solid">搜索</button>
</form>`;
    if (q) {
        const { postsSorted } = await import('./lib.js');
        const r = await postsSorted(ctx.env, q);
        if (!r.length) out += emptyState('没有找到相关文章，换个词试试');
        else out += postList(ctx, r, parseInt(ctx.query.get('page') || '1', 10) || 1, '/search', q);
    }
    out += ctx._layoutEnd();
    return out;
}

/* ---------------- 管理后台 ---------------- */

export function pageAdminLogin(ctx, errs = [], init = false) {
    let out = layout(ctx, '管理后台', { auth: true });
    out += `<div class="auth-wrap">
  <div class="auth-card">
    <span class="dots dots-xl" aria-hidden="true"><i></i><i></i><i></i></span>
    <h1 class="auth-title">${init ? '设置管理员' : '管理后台'}</h1>
    <p class="auth-sub mono">${init ? 'SETUP · 站点还没有管理员，现在创建一个' : 'ADMIN · 只有站长可以进入'}</p>
${errs.map(e => `    <div class="form-err mono">${h(e)}</div>`).join('')}
    <form method="post" action="${init ? '/admin/init' : '/admin'}" class="auth-form">
      ${csrfField(ctx)}
      ${field('name', '管理员用户名', 'text', '', 'required autocomplete="username"')}
      ${field('pass', init ? '设置密码（至少 6 位）' : '密码', 'password', '', 'required ' + (init ? 'minlength="6" autocomplete="new-password"' : 'autocomplete="current-password"'))}
      <div class="auth-bar"><button type="submit" class="btn-solid">${init ? '创建并进入' : '进入后台'}</button></div>
    </form>
    <p class="auth-foot mono">${init ? '创建后即可发布文章与管理站点' : '账号密码在安装时设置，忘记可用 wrangler 重置（见 README）'}</p>
  </div>
</div>`;
    out += ctx._layoutEnd();
    return out;
}

const ADMIN_TABS = [['posts', '文章'], ['notices', '公告'], ['brand', '外观']];

export async function pageAdmin(ctx, tab = 'posts') {
    const { env, st } = ctx;
    const { postsSorted, kvGet, settings } = await import('./lib.js');
    const tabs = ADMIN_TABS.map(t => t[0]);
    if (!tabs.includes(tab)) tab = 'posts';
    let out = layout(ctx, '管理后台', { kicker: 'CONSOLE · 后台' });
    out += `<nav class="adm-tabs mono">
${ADMIN_TABS.map(t => `  <a class="at${tab === t[0] ? ' on' : ''}" href="/admin/${t[0]}">${h(t[1])}</a>`).join('\n')}
</nav>`;

    if (tab === 'posts') {
        const posts = await postsSorted(env);
        await preloadCounts(env, posts);
        out += `<form class="panel form" method="post" action="/admin/publish" enctype="multipart/form-data">
  ${csrfField(ctx)}
${field('title', '标题', 'text', '', 'maxlength="80" required')}
${textarea('content', '正文', '', 8, 'maxlength="10000"')}
${field('video', '抖音视频 · 分享链接或 ID（可选）', 'text', '', 'maxlength="200"')}
${section('图片 · 每张 1.5MB 内，最多 9 张')}
  <label class="picker">
    <span class="mono">添加图片</span>
    <input type="file" name="images" accept="image/*" multiple data-preview="imgPreview">
  </label>
  <div class="preview" id="imgPreview"></div>
${section('附件 · 每个 512KB 内，最多 5 个')}
  <label class="picker">
    <span class="mono">添加附件</span>
    <input type="file" name="files" multiple data-preview="filePreview">
  </label>
  <div class="filechips" id="filePreview"></div>
  <div class="form-bar"><button type="submit" class="btn-solid">发布</button></div>
</form>`;
        out += section('已发布');
        if (!posts.length) out += '<div class="panel">' + emptyState('还没有文章') + '</div>';
        out += '<div class="adm-list">';
        for (const p of posts) {
            out += `<div class="adm-row">
  <span class="adm-txt"><b><a href="/post/${h(p.id)}">${h(p.title)}</a></b><small class="mono">${h(timeAgo(p.created))} · ${(p.images || []).length} 图 ${(p.files || []).length} 附件</small></span>
  <span class="adm-ops">
    <form method="post" action="/admin/post/pin" class="inline-form">
      ${csrfField(ctx)}<input type="hidden" name="post" value="${h(p.id)}">
      <input type="hidden" name="back" value="/admin/posts">
      <button class="act-ghost mono" type="submit">${p.pinned ? '取消置顶' : '置顶'}</button>
    </form>
    <form method="post" action="/admin/post/delete" class="inline-form" data-confirm="删除这篇文章？">
      ${csrfField(ctx)}<input type="hidden" name="post" value="${h(p.id)}">
      <input type="hidden" name="back" value="/admin/posts">
      <button class="act-ghost mono danger" type="submit">删除</button>
    </form>
  </span>
</div>`;
        }
        out += '</div>';
    }

    if (tab === 'notices') {
        const ns = Object.values(await kvGet(env, 'notices', {}));
        ns.sort((a, b) => b.created - a.created);
        out += `<form class="panel form" method="post" action="/admin/notice">
  ${csrfField(ctx)}
${field('title', '标题', 'text', '', 'maxlength="60" required')}
${textarea('content', '内容', '', 4, 'maxlength="1000" required')}
  <div class="form-bar"><button type="submit" class="btn-solid">发布公告</button></div>
</form>`;
        out += section('已发布');
        if (!ns.length) out += '<div class="panel">' + emptyState('暂无公告') + '</div>';
        out += '<div class="adm-list">';
        for (const n of ns) {
            out += `<div class="adm-row">
  <span class="adm-txt"><b>${h(n.title)}</b><small class="mono">${h(timeAgo(n.created))}</small></span>
  <form method="post" action="/admin/notice/delete" data-confirm="删除这条公告？">
    ${csrfField(ctx)}<input type="hidden" name="id" value="${h(n.id)}">
    <button class="act-ghost mono danger" type="submit">删除</button>
  </form>
</div>`;
        }
        out += '</div>';
    }

    if (tab === 'brand') {
        const cur = await settings(env);
        const avSrc = cur.avatar ? '/a/' + cur.avatar : '/assets/community.jpg';
        out += section('站点信息');
        out += `<form class="panel form" method="post" action="/admin/site">
  ${csrfField(ctx)}
${field('site_name', '站点名称', 'text', cur.site_name, 'maxlength="30" required')}
${field('site_desc', '一句话介绍', 'text', cur.site_desc || '', 'maxlength="60"')}
  <div class="form-bar"><button type="submit" class="btn-solid">保存</button></div>
</form>`;
        out += section('博客头像');
        out += `<div class="panel"><div class="brand-row">
  <img class="avatar community" style="width:56px;height:56px" src="${h(avSrc)}" alt="">
  <form class="brand-form" method="post" action="/admin/avatar" enctype="multipart/form-data">
    ${csrfField(ctx)}
    <label class="picker">
      <span class="mono">选择图片</span>
      <input type="file" name="avatar" accept="image/*" data-preview="brandPreview">
    </label>
    <div class="preview one" id="brandPreview"></div>
    <button class="btn-solid" type="submit">保存头像</button>
  </form>
${cur.avatar ? `<form method="post" action="/admin/avatar/reset" data-confirm="恢复默认头像？">
  ${csrfField(ctx)}
  <button class="act-ghost mono" type="submit">恢复默认</button>
</form>` : ''}
</div></div>`;
        out += section('网站背景 · 全站固定显示，顶栏底栏透明融合');
        out += `<div class="panel"><div class="brand-row">
  <span class="bg-preview" style="${cur.bg ? `background-image:url('/a/${h(cur.bg)}?v=1')` : ''}">${cur.bg ? '' : '<span class="mono">未设置</span>'}</span>
  <div class="brand-info">
    <b>${cur.bg ? '已设置，全站固定显示' : '未设置，使用默认纯色'}</b>
    <form class="brand-form" method="post" action="/admin/bg" enctype="multipart/form-data">
      ${csrfField(ctx)}
      <label class="picker">
        <span class="mono">选择背景图片</span>
        <input type="file" name="bg" accept="image/*" data-preview="bgPreview">
      </label>
      <div class="preview one" id="bgPreview"></div>
      <button class="btn-solid" type="submit">保存背景</button>
    </form>
${cur.bg ? `<form method="post" action="/admin/bg/reset" data-confirm="恢复默认背景？">
  ${csrfField(ctx)}
  <button class="act-ghost mono" type="submit">恢复默认背景</button>
</form>` : ''}
  </div>
</div></div>`;
    }

    out += ctx._layoutEnd();
    return out;
}

/* ---------------- 404 ---------------- */

export async function page404(ctx) {
    let out = layout(ctx, '页面不存在', { kicker: '404', intro: '这个地址没有对应的内容' });
    out += emptyState('回首页看看别的文章吧');
    out += ctx._layoutEnd();
    return out;
}
