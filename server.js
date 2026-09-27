// 咱俩的日记 · 本地服务
// 功能：1) 服务静态页面 2) 保存导出 PNG 3) 打开导出文件夹 4) 备份
const http = require('http');
const fs = require('fs');
const path = require('path');
const net = require('net');
const cp = require('child_process');

// 打包成 exe 后用 exe 所在目录；普通 node 用脚本目录
const root = (process.pkg ? path.dirname(process.execPath) : __dirname);
const PORT = process.env.PORT || 8765;
// 导出目录与备份目录：优先读同目录下的 config.json（不进仓库），否则用项目目录下的默认值
var CONFIG = (function () {
  try { return JSON.parse(fs.readFileSync(path.join(root, 'config.json'), 'utf8')) || {}; }
  catch (e) { return {}; }
})();
const SAVE_DIR = CONFIG.exportDir || path.join(root, '导出图片');
const BACKUP_DIR = CONFIG.backupDir || path.join(root, 'backups');
const MIME = {
  '.html':'text/html; charset=utf-8',
  '.css':'text/css; charset=utf-8',
  '.js':'text/javascript; charset=utf-8',
  '.json':'application/json; charset=utf-8', '.webmanifest':'application/manifest+json; charset=utf-8',
  '.png':'image/png', '.svg':'image/svg+xml', '.ico':'image/x-icon'
};

try { fs.mkdirSync(SAVE_DIR, { recursive: true }); } catch (e) {}
try { fs.mkdirSync(BACKUP_DIR, { recursive: true }); } catch (e) {}

function readBody(req, cb) {
  let data = '';
  req.on('data', function (chunk) { data += chunk; if (data.length > 50 * 1024 * 1024) { req.destroy(); } });
  req.on('end', function () { cb(data); });
}

function openBrowser() {
  if (process.argv.indexOf('--no-open') !== -1) return;
  var url = 'http://localhost:' + PORT + '/';
  try {
    if (process.platform === 'win32') cp.exec('cmd /c start "" "' + url + '"', function (e) { if (e) console.error('open browser failed: ' + e.message); });
    else if (process.platform === 'darwin') cp.exec('open "' + url + '"');
    else cp.exec('xdg-open "' + url + '"');
  } catch (e) {}
}

function startServer() {
  http.createServer(function (req, res) {
    // 保存图片
    if (req.method === 'POST' && req.url === '/save') {
      readBody(req, function (body) {
        try {
          var payload = JSON.parse(body);
          var dataUrl = payload.dataUrl || '';
          var name = payload.filename || 'export.png';
          name = path.basename(name).replace(/[\\/:*?"<>|]/g, '_');
          if (!/\.png$/i.test(name)) name += '.png';
          var buf = Buffer.from(String(dataUrl).replace(/^data:image\/png;base64,/, ''), 'base64');
          var fp = path.join(SAVE_DIR, name);
          fs.writeFileSync(fp, buf);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ ok: true, path: fp, file: name, size: buf.length }));
        } catch (e) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ ok: false, error: e.message }));
        }
      });
      return;
    }
    // 打开导出文件夹
    if (req.method === 'GET' && req.url === '/open-export') {
      try {
        var cmd = process.platform === 'win32' ? 'explorer' : 'xdg-open';
        cp.exec('"' + cmd + '" "' + SAVE_DIR + '"', function () {});
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true, dir: SAVE_DIR }));
      } catch (e) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: e.message }));
      }
      return;
    }
    // 备份
    if (req.method === 'POST' && req.url === '/backup') {
      readBody(req, function (body) {
        try {
          var payload = JSON.parse(body);
          var data = payload.data || [];
          var ts = new Date();
          var pad2 = function (n) { return (n < 10 ? '0' : '') + n; };
          var stamp = ts.getFullYear() + pad2(ts.getMonth()+1) + pad2(ts.getDate()) + '-' + pad2(ts.getHours()) + pad2(ts.getMinutes()) + pad2(ts.getSeconds());
          var fp = path.join(BACKUP_DIR, 'riji-backup-' + stamp + '.json');
          fs.writeFileSync(fp, JSON.stringify({ exportedAt: new Date().toISOString(), count: data.length, entries: data }, null, 2), 'utf8');
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ ok: true, path: fp, count: data.length }));
        } catch (e) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ ok: false, error: e.message }));
        }
      });
      return;
    }
    // 静态文件
    var p = decodeURIComponent(req.url.split('?')[0]);
    if (p === '/') p = '/index.html';
    var fp = path.join(root, path.normalize(p));
    if (!fp.startsWith(root)) { res.writeHead(403); res.end('forbidden'); return; }
    fs.readFile(fp, function (err, data) {
      if (err) { res.writeHead(404); res.end('not found'); return; }
      var ext = path.extname(fp).toLowerCase();
      res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
      res.end(data);
    });
  }).listen(PORT, function () {
    console.log('日记服务已启动 → http://localhost:' + PORT + '/');
    console.log('导出PNG保存目录 → ' + SAVE_DIR);
    openBrowser();
  });
}

// 检测端口：已占用则只开浏览器；否则启动服务
var probe = net.createServer();
probe.once('error', function () {
  console.log('服务已在运行，直接打开浏览器。');
  openBrowser();
});
probe.listen(PORT, function () {
  probe.close();
  startServer();
});
