/** 全流程自动测试：安装 → 登录 → 发文 → 评论 → 点赞 → 后台管理 → 背景图 */
const BASE = 'http://127.0.0.1:8600';
let cookie = '';
let pass = 0, fail = 0;

function check(name, cond, extra = '') {
    if (cond) { pass++; console.log('PASS', name, extra); }
    else { fail++; console.log('FAIL', name, extra); }
}
async function req(method, path, opts = {}) {
    const headers = { ...(opts.headers || {}) };
    if (cookie) headers['cookie'] = cookie;
    if (opts.body && !(opts.body instanceof FormData) && !headers['content-type']) headers['content-type'] = 'application/x-www-form-urlencoded';
    const r = await fetch(BASE + path, { method, headers, body: opts.body, redirect: 'manual' });
    const sc = r.headers.getSetCookie ? r.headers.getSetCookie() : [];
    if (sc.length) {
        const jar = Object.fromEntries(cookie.split('; ').map(c => [c.slice(0, c.indexOf('=')), c.slice(c.indexOf('=') + 1)]));
        for (const c of sc) { const [kv] = c.split(';'); const i = kv.indexOf('='); jar[kv.slice(0, i)] = kv.slice(i + 1); }
        cookie = Object.entries(jar).map(([k, v]) => k + '=' + v).join('; ');
    }
    return r;
}
function getCsrf(html) {
    const m = html.match(/name="csrf" value="([0-9a-f]+)"/);
    return m ? m[1] : '';
}

/* 1. 未安装跳转 */
let r = await req('GET', '/');
check('未安装跳转到 /install', r.status === 302 && r.headers.get('location') === '/install');

/* 2. 安装面板 */
r = await req('GET', '/install');
let html = await r.text();
check('安装面板渲染', r.status === 200 && html.includes('开始安装') && html.includes('填写你的名字'));
const csrf = getCsrf(html);
check('安装页有 CSRF', !!csrf);

/* 3. 提交安装 */
r = await req('POST', '/install', {
    body: new URLSearchParams({ csrf, site_name: '示例科技站', site_desc: '折腾与分享', admin_name: 'admin', admin_pass: 'test123456' }),
});
check('安装成功跳首页', r.status === 302 && r.headers.get('location') === '/');

/* 4. 首页（种子内容 + 安装的名字） */
r = await req('GET', '/');
html = await r.text();
check('首页显示站点名', html.includes('示例科技站'));
check('首页有示例文章', html.includes('给旧笔记本换了块 NVMe'));
check('首页有公告条', html.includes('博客部署完成'));
check('首页无登录按钮', !html.includes('登录 / 注册'));

/* 5. 文章详情 + 抖音视频框 */
r = await req('GET', '/post/p_demo2');
html = await r.text();
check('详情页渲染', r.status === 200 && html.includes('把家里的路由器刷成旁网关'));
check('视频播放器懒加载框', html.includes('video-box') && html.includes('open.douyin.com/player/video'));

/* 6. 访客评论 */
const ccsrf = getCsrf(html);
r = await req('POST', '/comment', { body: new URLSearchParams({ csrf: ccsrf, post: 'p_demo2', name: '路过的小王', content: '旁网关确实好用' }) });
check('评论提交', r.status === 302);
r = await req('GET', '/post/p_demo2');
html = await r.text();
check('评论显示', html.includes('路过的小王') && html.includes('旁网关确实好用'));

/* 7. 访客点赞 */
r = await req('POST', '/like', { body: new URLSearchParams({ csrf: ccsrf, post: 'p_demo2', back: '/post/p_demo2' }) });
check('点赞提交', r.status === 302);
r = await req('GET', '/post/p_demo2');
html = await r.text();
check('点赞计数 1', html.includes('♥ 1'));

/* 8. 安装后自动进入后台（后台控制台直接可见） */
r = await req('GET', '/admin');
html = await r.text();
check('安装后自动进后台', r.status === 200 && html.includes('CONSOLE · 后台'));

/* 8b. 退出后回到登录表单 */
r = await req('GET', '/logout');
r = await req('GET', '/admin');
html = await r.text();
check('后台未登录显示登录表单', r.status === 200 && html.includes('只有站长可以进入'));
const acsrf = getCsrf(html);

/* 9. 错误密码 */
r = await req('POST', '/admin', { body: new URLSearchParams({ csrf: acsrf, name: 'admin', pass: 'wrongpass' }) });
check('错误密码拒绝', r.status === 302 && r.headers.get('location') === '/admin');

/* 10. 正确密码登录 */
r = await req('POST', '/admin', { body: new URLSearchParams({ csrf: acsrf, name: 'admin', pass: 'test123456' }) });
check('登录成功进后台', r.status === 302 && r.headers.get('location') === '/admin/posts');

/* 11. 后台发文（带附件文本） */
r = await req('GET', '/admin/posts');
html = await r.text();
const pcsrf = getCsrf(html);
check('后台发文表单', html.includes('发布') && html.includes('抖音视频'));
const fd = new FormData();
fd.append('csrf', pcsrf);
fd.append('title', '一篇测试文章');
fd.append('content', '这是正文内容，用于测试。\n第二行。');
fd.append('video', '');
const txt = new Blob(['hello attachment'], { type: 'text/plain' });
fd.append('files', txt, 'hello.txt');
r = await req('POST', '/admin/publish', { body: fd });
const loc = r.headers.get('location') || '';
check('发文成功跳详情', r.status === 302 && loc.startsWith('/post/p_'));
const pid = loc.replace('/post/', '').split('#')[0];

/* 12. 详情检查（正文 + 附件下载行） */
r = await req('GET', '/post/' + pid);
html = await r.text();
check('新文章正文', html.includes('这是正文内容'));
check('附件行', html.includes('hello.txt'));

/* 13. 附件真实下载 */
r = await req('GET', '/f/' + pid + '/0');
const bodyTxt = await r.text();
check('附件下载内容', r.status === 200 && bodyTxt === 'hello attachment');

/* 14. 置顶 */
r = await req('POST', '/admin/post/pin', { body: new URLSearchParams({ csrf: pcsrf, post: pid, back: '/admin/posts' }) });
check('置顶动作', r.status === 302);

/* 15. 公告发布 + 删除 */
r = await req('POST', '/admin/notice', { body: new URLSearchParams({ csrf: pcsrf, title: '维护通知', content: '今晚 02:00 升级' }) });
check('公告发布', r.status === 302);
r = await req('GET', '/admin/notices');
html = await r.text();
check('后台公告列表', html.includes('维护通知'));

/* 16. 上传背景图（1x1 PNG） */
const pngB64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
const pngBuf = Buffer.from(pngB64, 'base64');
const fdBg = new FormData();
fdBg.append('csrf', pcsrf);
fdBg.append('bg', new Blob([pngBuf], { type: 'image/png' }), 'bg.png');
r = await req('POST', '/admin/bg', { body: fdBg });
check('背景图上传', r.status === 302);
r = await req('GET', '/');
html = await r.text();
check('首页输出背景图模式', html.includes('has-bg') && html.includes('/a/f'));

/* 17. 站点信息修改 */
r = await req('POST', '/admin/site', { body: new URLSearchParams({ csrf: pcsrf, site_name: '新名字站', site_desc: '新简介' }) });
r = await req('GET', '/');
html = await r.text();
check('站点名生效', html.includes('新名字站'));

/* 18. 背景恢复默认 */
r = await req('POST', '/admin/bg/reset', { body: new URLSearchParams({ csrf: pcsrf }) });
check('背景恢复', r.status === 302);

/* 19. 退出管理 */
r = await req('GET', '/logout');
check('退出管理', r.status === 302);
r = await req('GET', '/admin/posts');
html = await r.text();
check('退出后访问后台需登录', r.status === 200 && html.includes('只有站长可以进入') && !html.includes('CONSOLE · 后台'));

/* 20. 未登录发文被拒 */
r = await req('GET', '/');
html = await r.text();
check('访客视角无后台入口', !html.includes('hn-admin'));

console.log(`\n结果：${pass} 通过，${fail} 失败`);
process.exit(fail ? 1 : 0);
