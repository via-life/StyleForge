# 风格炼像室

基于 `React + Vite + OGL` 的单页像素头像生成器。页面在浏览器本地完成图片读取、主体提取、风格化、像素化、背景填充和 `512x512 PNG` 导出，不依赖后端服务。

## 当前版本

- 单页纵向布局，无路由、无模态。
- 整页 `MagnetLines` 背景氛围层。
- 上方 `CircularGallery` 风格预览区。
  - 内部使用重复数组保证无限循环顺滑。
  - 首屏优先看到 5 个唯一风格。
  - 小屏根据宽度减少同时可见张数，但仍可横向连续滑动。
- 中间 `GlassSurface` 上传 / 主预览区。
- 上传入口支持点击上传和整页拖拽上传。
- 五种风格：普通、清新、赛博、多巴胺、暗黑。
- 背景色默认透明，只改变背景层，不改变主体风格颜色。
- 像素颗粒度固定档位：`512 / 256 / 128 / 64 / 32 / 16 / 8 / 5`。
- 默认颗粒度为 `512`。
- 导出格式固定为 `512x512 PNG`，结果与中间 `GlassSurface` 主预览一致。

## 当前图像处理链路

1. 读取本地图片。
2. 完整显示图片，四周留空或留背景色，不做裁切缩放。
3. 提取图片主体，背景初始转为透明。
4. 对主体应用当前风格。
5. 按当前颗粒度执行像素化。
6. 按用户选择填充背景色。
7. 生成顶部风格预览、中间主预览和最终导出图。

## 本地启动

```bash
npm install
npm run dev
```

默认开发地址通常为 `http://localhost:5173`。

## 生产构建

```bash
npm run build
npm run preview
```

构建产物输出到 `dist/`，可以直接部署到 GitHub Pages 或其他静态托管平台。

## 当前目录结构

```text
风格炼像室/
├─ index.html
├─ package.json
├─ vite.config.js
├─ PRD.md
├─ README.md
├─ dist/
└─ src/
   ├─ App.jsx
   ├─ main.jsx
   ├─ components/
   │  ├─ CircularGallery.css
   │  ├─ CircularGallery.jsx
   │  ├─ ControlPanel.css
   │  ├─ ControlPanel.jsx
   │  ├─ GlassSurface.css
   │  ├─ GlassSurface.jsx
   │  ├─ MagnetBackground.css
   │  ├─ MagnetBackground.jsx
   │  ├─ MagnetLines.css
   │  ├─ MagnetLines.jsx
   │  ├─ StylePreviewGallery.css
   │  ├─ StylePreviewGallery.jsx
   │  ├─ ToastHost.css
   │  ├─ ToastHost.jsx
   │  ├─ UploadPreviewSurface.css
   │  └─ UploadPreviewSurface.jsx
   ├─ lib/
   │  ├─ analytics.js
   │  ├─ appConstants.js
   │  ├─ constants.js
   │  └─ image.js
   └─ styles/
      ├─ app.css
      └─ global.css
```

## 关键文件说明

- `src/App.jsx`：页面状态中心，负责上传、拖拽、风格切换、背景切换、像素颗粒度切换和导出。
- `src/components/CircularGallery.jsx`：曲面风格预览组件，内部使用重复数组实现顺滑循环。
- `src/components/UploadPreviewSurface.jsx`：中间主预览区，显示最终导出一致的实时结果。
- `src/components/ControlPanel.jsx`：当前风格说明、像素颗粒度滑杆和输出动作区。
- `src/lib/image.js`：图像处理核心，包括主体提取、风格化、像素化、背景填充和导出。

## 备注

- 当前仓库里同时保留了 `src/lib/appConstants.js` 和 `src/lib/constants.js` 两份常量文件。
- 文档以当前仓库真实结构为准；后续如果做清理重构，需要再次同步 README。
