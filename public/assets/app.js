/** taste-blog · 前端交互：主题 / 抽屉 / 提示条 / 确认框 / 预览 / 视频懒加载 / 点赞防重复 */
(function () {
  'use strict';

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* ---- 主题切换（深色为默认） ---- */
  var themeBtn = $('#theme-toggle');
  var themeRow = $('#theme-row');
  function setTheme(t) {
    document.documentElement.setAttribute('data-theme', t);
    document.documentElement.style.colorScheme = t;
    try { localStorage.setItem('bb_theme', t); } catch (e) {}
    var mc = $('#theme-color');
    if (mc) mc.setAttribute('content', t === 'dark' ? '#18191b' : '#eff0f1');
    var st = $('#theme-state');
    if (st) st.textContent = t === 'dark' ? 'ON' : 'OFF';
  }
  setTheme(document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark');
  if (themeBtn) themeBtn.addEventListener('click', function () {
    setTheme(document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
  });
  if (themeRow) themeRow.addEventListener('click', function () {
    setTheme(document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
  });
  if (themeRow) themeRow.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); themeRow.click(); }
  });

  /* ---- 全屏抽屉菜单 ---- */
  var burger = $('#burger'), drawer = $('#m-drawer');
  function drawerOpen(on) {
    if (!drawer) return;
    drawer.hidden = false;
    requestAnimationFrame(function () {
      drawer.classList.toggle('on', on);
      if (burger) burger.setAttribute('aria-expanded', on ? 'true' : 'false');
      document.body.classList.toggle('drawer-open', on);
      if (!on) setTimeout(function () { if (!drawer.classList.contains('on')) drawer.hidden = true; }, 260);
    });
  }
  if (burger && drawer) {
    burger.addEventListener('click', function () { drawerOpen(!drawer.classList.contains('on')); });
    drawer.addEventListener('click', function (e) { if (e.target === drawer) drawerOpen(false); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && drawer.classList.contains('on')) drawerOpen(false);
    });
    $$('.dn-link', drawer).forEach(function (a) { a.addEventListener('click', function () { drawerOpen(false); }); });
  }

  /* ---- Snackbar ---- */
  var snack = $('#snackbar'), snackTimer = null;
  function showSnack(msg) {
    if (!snack) return;
    var m = $('.sn-msg', snack);
    if (m) m.textContent = msg;
    snack.classList.add('on');
    clearTimeout(snackTimer);
    snackTimer = setTimeout(function () { snack.classList.remove('on'); }, 3200);
  }
  var snackOk = $('#snack-ok');
  if (snackOk) snackOk.addEventListener('click', function () {
    snack.classList.remove('on');
    clearTimeout(snackTimer);
  });
  setTimeout(function () { if (snack && snack.classList.contains('on')) snack.classList.remove('on'); }, 4200);

  /* ---- 确认对话框 ---- */
  var mask = $('#dlg-mask'), dlgText = $('#dlg-text'), pendingForm = null;
  function dlgOpen(text, form) {
    if (!mask) { if (confirm(text)) form.submit(); return; }
    dlgText.textContent = text;
    pendingForm = form;
    mask.hidden = false;
    requestAnimationFrame(function () { mask.classList.add('on'); });
  }
  function dlgClose() {
    if (!mask) return;
    mask.classList.remove('on');
    setTimeout(function () { mask.hidden = true; pendingForm = null; }, 200);
  }
  document.addEventListener('submit', function (e) {
    var f = e.target;
    if (!(f instanceof HTMLFormElement)) return;
    if (f.hasAttribute('data-confirm') && !f._confirmed) {
      e.preventDefault();
      dlgOpen(f.getAttribute('data-confirm'), f);
      return;
    }
    /* 访客点赞：一台设备只加一次，重复点击直接拦截 */
    if (f.classList.contains('likeform')) {
      var pid = f.getAttribute('data-post');
      var key = 'bb_like_' + pid;
      var liked = false;
      try { liked = !!localStorage.getItem(key); } catch (err) {}
      if (liked) {
        e.preventDefault();
        showSnack('已经赞过了');
        return;
      }
      try { localStorage.setItem(key, '1'); } catch (err) {}
    }
    /* 提交时禁用按钮防双击 */
    var btn = f.querySelector('button[type=submit]');
    if (btn) setTimeout(function () { btn.disabled = true; }, 0);
  }, true);
  if (mask) {
    mask.addEventListener('click', function (e) { if (e.target === mask) dlgClose(); });
    $('#dlg-cancel').addEventListener('click', dlgClose);
    $('#dlg-yes').addEventListener('click', function () {
      if (pendingForm) { pendingForm._confirmed = true; pendingForm.submit(); }
      dlgClose();
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') dlgClose(); });
  }

  /* ---- 文件选择预览 ---- */
  function previewFor(input) {
    var target = input.getAttribute('data-preview');
    return target ? document.getElementById(target) : null;
  }
  $$('input[type=file]').forEach(function (input) {
    input.addEventListener('change', function () {
      var box = previewFor(input);
      if (!box) return;
      box.innerHTML = '';
      var files = Array.prototype.slice.call(input.files || []);
      if (input.accept && input.accept.indexOf('image') >= 0) {
        files.forEach(function (f) {
          var cell = document.createElement('span');
          cell.className = 'pv-cell';
          var img = document.createElement('img');
          img.src = URL.createObjectURL(f);
          img.onload = function () { URL.revokeObjectURL(img.src); };
          cell.appendChild(img);
          box.appendChild(cell);
        });
      } else {
        files.forEach(function (f) {
          var chip = document.createElement('span');
          chip.className = 'chip mono';
          chip.textContent = f.name;
          box.appendChild(chip);
        });
      }
    });
  });

  /* ---- 图片淡入 + 坏图占位 ---- */
  function watchImg(img) {
    if (img.complete && img.naturalWidth) { img.classList.add('ld'); return; }
    img.addEventListener('load', function () { img.classList.add('ld'); });
    img.addEventListener('error', function () {
      var p = img.parentNode;
      if (p) {
        var ph = document.createElement('span');
        ph.className = 'img-broken mono';
        ph.textContent = '图片加载失败';
        img.replaceWith(ph);
      }
    });
  }
  $$('.imgcell img, .avatar img').forEach(watchImg);
  new MutationObserver(function (muts) {
    muts.forEach(function (mu) {
      Array.prototype.forEach.call(mu.addedNodes, function (n) {
        if (n.nodeType !== 1) return;
        if (n.tagName === 'IMG') watchImg(n);
        $$('img', n).forEach(watchImg);
      });
    });
  }).observe(document.body, { childList: true, subtree: true });

  /* ---- 抖音视频：点一下才加载官方播放器 ---- */
  $$('.video-play').forEach(function (b) {
    b.addEventListener('click', function () {
      var box = b.parentNode;
      var src = box.getAttribute('data-src');
      if (!src) return;
      box.innerHTML = '<div class="video-loading mono">正在加载播放器</div>';
      var f = document.createElement('iframe');
      f.src = src;
      f.setAttribute('loading', 'lazy');
      f.setAttribute('allowfullscreen', '');
      f.setAttribute('referrerpolicy', 'no-referrer');
      f.setAttribute('scrolling', 'no');
      var done = false;
      var finish = function () {
        if (done) return;
        done = true;
        var ld = $('.video-loading', box);
        if (ld) ld.remove();
        box.appendChild(f);
      };
      f.addEventListener('load', finish);
      setTimeout(finish, 6000);
    });
  });

  /* ---- 应用栏抬升 + FAB 下滚收起 ---- */
  var ticking = false, lastY = 0;
  window.addEventListener('scroll', function () {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      var y = window.scrollY;
      document.body.classList.toggle('scrolled', y > 4);
      var fab = $('.fab');
      if (fab) {
        if (y > 640 && y > lastY + 4) document.body.classList.add('fab-hide');
        else if (y < lastY - 4 || y <= 640) document.body.classList.remove('fab-hide');
      }
      lastY = y;
      ticking = false;
    });
  }, { passive: true });

  /* ---- 页面加载转场收尾 ---- */
  requestAnimationFrame(function () {
    document.body.classList.remove('page-enter');
  });
})();
