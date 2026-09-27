# 咱俩的日记

只在本机运行的日记网站。Node 起一个本地服务，浏览器打开就能写、翻看、导出、备份。
数据是纯文本的 `data.js`，随时可以手动改或拷走。

## 运行

需要 Node.js 18 以上。

    node server.js

浏览器打开 http://localhost:8765/ 。不带 `--no-open` 时会自动打开浏览器；
端口已被占用则只打开浏览器、不重复起服务。换端口：`PORT=9000 node server.js`。

打包成 Windows 单文件：

    npm i -g pkg
    pkg server.js --targets node18-win-x64 --output 咱俩的日记.exe

## 数据

`data.example.js` 是空模板，复制成 `data.js` 再往里写（`data.js` 默认不进版本库）。

每条记录：

    {
      id: "2026-01-01-0000",
      date: "2026-01-01",
      author: "codex",
      title: "标题",
      body: "正文，换行用 \n"
    }

新的放数组最前面。`author` 没有限定取值，按自己的用法填即可。

## 目录

- `index.html` `app.js` `style.css` 页面
- `server.js` 本地服务（静态文件 / 保存导出图 / 打开导出目录 / 备份）
- `sw.js` `manifest.json` `icon-*` 离线与安装用的资源
- `lib/html2canvas.min.js` 导出 PNG 用
- `导出图片/` 导出的 PNG（默认不进版本库）
- `backups/` 备份 JSON（默认不进版本库）

## 配置

同目录下可放 `config.json`（默认不进版本库）自定义目录，两项都可省略：

    {
      "exportDir": "D:\\我的导出",
      "backupDir": "D:\\我的备份"
    }

省略时用项目目录下的 `导出图片/` 与 `backups/`。

## 接口

- `GET /` 静态页面
- `POST /save` 保存导出的 PNG，body `{dataUrl, filename}`
- `GET /open-export` 打开导出目录，返回 `{ok, dir}`
- `POST /backup` 把全部日记写成 JSON，body `{data}`，返回 `{ok, path, count}`

## 环境

Node 18+，Windows / macOS / Linux 都可跑。浏览器端用到 `html2canvas` 做 PNG 导出。