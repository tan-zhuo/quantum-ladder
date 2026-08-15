/**
 * 量子力学阶梯 —— 离线支持。
 *
 * 手写而不是用 Workbox：这个站点的缓存需求非常规整，规则不到 60 行就能写完，
 * 而引入一整套构建期插件会让「纯静态、可直接扔到任何托管上」这条约束变复杂。
 *
 * 三条策略：
 *   1. /_astro/* 与图标——内容哈希命名，永不变更，**cache-first**；
 *   2. HTML 页面——**network-first**，断网时回落到缓存，再回落到离线提示；
 *   3. search-index.json——**stale-while-revalidate**，搜索框永远秒开，后台再更新。
 *
 * 注意 three.js 那个上百 KB 的 chunk 也落在 /_astro/ 下：第一次打开任意 3D 场景之后
 * 它就被永久缓存了，之后所有场景都是离线可用的。
 */

const VERSION = 'ql-v1'
const SHELL = `${VERSION}-shell`
const PAGES = `${VERSION}-pages`
const ASSETS = `${VERSION}-assets`

/** 安装时就抓下来的最小外壳：首页与实验室目录 */
const PRECACHE = ['./', './lab/', './manifest.webmanifest', './favicon.svg']

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(SHELL)
      // 单个资源 404 不应该让整个安装失败（比如部署在子路径下时）
      .then((cache) => Promise.allSettled(PRECACHE.map((url) => cache.add(url))))
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k))),
      )
      .then(() => self.clients.claim()),
  )
})

function isAsset(url) {
  return (
    url.pathname.includes('/_astro/') ||
    /\.(?:js|css|woff2?|png|svg|jpg|webp|ico)$/.test(url.pathname)
  )
}

self.addEventListener('fetch', (event) => {
  const req = event.request
  if (req.method !== 'GET') return

  const url = new URL(req.url)
  // 只管自己域下的东西；跨域请求（如果有）交给浏览器默认处理
  if (url.origin !== self.location.origin) return

  // 1) 内容哈希资源：cache-first
  if (isAsset(url)) {
    event.respondWith(
      caches.match(req).then(
        (hit) =>
          hit ||
          fetch(req).then((res) => {
            if (res.ok) {
              const copy = res.clone()
              caches.open(ASSETS).then((c) => c.put(req, copy))
            }
            return res
          }),
      ),
    )
    return
  }

  // 2) 搜索索引：stale-while-revalidate
  if (url.pathname.endsWith('/search-index.json')) {
    event.respondWith(
      caches.open(PAGES).then(async (cache) => {
        const hit = await cache.match(req)
        const fresh = fetch(req)
          .then((res) => {
            if (res.ok) cache.put(req, res.clone())
            return res
          })
          .catch(() => hit)
        return hit || fresh
      }),
    )
    return
  }

  // 3) 页面：network-first，断网回落缓存
  if (req.mode === 'navigate' || req.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (res.ok) {
            const copy = res.clone()
            caches.open(PAGES).then((c) => c.put(req, copy))
          }
          return res
        })
        .catch(async () => {
          const hit = await caches.match(req)
          if (hit) return hit
          const home = await caches.match('./')
          if (home) return home
          return new Response(
            '<!doctype html><meta charset="utf-8"><title>离线</title>' +
              '<body style="font-family:system-ui;padding:2rem;line-height:1.7">' +
              '<h1>当前离线</h1><p>这一页还没有被缓存过。之前打开过的页面仍然可以正常访问。</p></body>',
            { headers: { 'content-type': 'text/html; charset=utf-8' }, status: 503 },
          )
        }),
    )
  }
})
