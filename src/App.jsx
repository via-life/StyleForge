/*
import { startTransition, useEffect, useRef, useState } from 'react';

import ControlPanel from './components/ControlPanel';
import MagnetBackground from './components/MagnetBackground';
import StylePreviewGallery from './components/StylePreviewGallery';
import ToastHost from './components/ToastHost';
import UploadPreviewSurface from './components/UploadPreviewSurface';
import {
  BACKGROUND_OPTIONS,
  DEFAULT_STYLE_ID,
  GITHUB_URL,
  STYLE_OPTIONS,
  ZOOM_RANGE
} from './lib/appConstants';
import {
  buildStylePreview,
  createCenteredCropRect,
  decodeLocalImage,
  exportAvatarPng,
  getDefaultGalleryItems,
  moveCropRect,
  zoomCropRect
} from './lib/image';
import { trackEvent, trackPageView } from './lib/analytics';

import './styles/app.css';

function createToast(message, tone = 'info') {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    message,
    tone
  };
}

function hasFiles(event) {
  return Array.from(event.dataTransfer?.types || []).includes('Files');
}

export default function App() {
  const fileInputRef = useRef(null);
  const dragDepthRef = useRef(0);
  const [sourceFile, setSourceFile] = useState(null);
  const [sourceImage, setSourceImage] = useState(null);
  const [previewStyle, setPreviewStyle] = useState(DEFAULT_STYLE_ID);
  const [backgroundColor, setBackgroundColor] = useState(BACKGROUND_OPTIONS[0].value);
  const [zoom, setZoom] = useState(1);
  const [cropRect, setCropRect] = useState(null);
  const [galleryItems, setGalleryItems] = useState(getDefaultGalleryItems());
  const [dragState, setDragState] = useState({ active: false });
  const [uiState, setUiState] = useState('empty');
  const [toast, setToast] = useState(null);
  const [isGeneratingGallery, setIsGeneratingGallery] = useState(false);

  useEffect(() => {
    trackPageView();
  }, []);

  useEffect(() => {
    if (!sourceImage || !cropRect) {
      setGalleryItems(getDefaultGalleryItems(backgroundColor));
      setIsGeneratingGallery(false);
      return undefined;
    }

    let cancelled = false;
    setIsGeneratingGallery(true);

    const run = async () => {
      const previews = await Promise.all(
        STYLE_OPTIONS.map(async style => ({
          id: style.id,
          text: style.label,
          note: style.description,
          image: await buildStylePreview({
            image: sourceImage,
            style: style.id,
            cropRect,
            backgroundColor
          })
        }))
      );

      if (cancelled) {
        return;
      }

      startTransition(() => {
        setGalleryItems(previews);
        setIsGeneratingGallery(false);
      });
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [backgroundColor, cropRect, sourceImage]);

  const pushToast = (message, tone = 'info') => {
    setToast(createToast(message, tone));
  };

  const resetInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleIncomingFile = async (file, source = 'select') => {
    try {
      const decoded = await decodeLocalImage(file);
      const nextCrop = createCenteredCropRect(decoded.image, 1);

      setSourceFile(decoded.file);
      setSourceImage(decoded.image);
      setPreviewStyle(DEFAULT_STYLE_ID);
      setZoom(1);
      setCropRect(nextCrop);
      setUiState('ready');
      setToast(null);
      trackEvent(source === 'drop' ? 'upload_drop' : 'upload_select');
    } catch (error) {
      const nextMessage = error instanceof Error ? error.message : '图片读取失败，请换一张试试。';
      setUiState(sourceImage ? 'ready' : 'error');
      pushToast(nextMessage, 'error');

      if (!sourceImage) {
        window.setTimeout(() => {
          setUiState('empty');
        }, 160);
      }
    } finally {
      resetInput();
    }
  };

  const handleIncomingFiles = async (files, source = 'select') => {
    if (!files.length) {
      setUiState(sourceImage ? 'ready' : 'empty');
      return;
    }

    if (files.length > 1) {
      setUiState(sourceImage ? 'ready' : 'error');
      pushToast('一次只能上传一张图片。', 'error');
      return;
    }

    await handleIncomingFile(files[0], source);
  };

  useEffect(() => {
    const onDragEnter = event => {
      if (!hasFiles(event)) {
        return;
      }

      event.preventDefault();
      dragDepthRef.current += 1;
      setDragState({ active: true });
      setUiState('dragging');
    };

    const onDragOver = event => {
      if (!hasFiles(event)) {
        return;
      }

      event.preventDefault();
    };

    const onDragLeave = event => {
      if (!hasFiles(event)) {
        return;
      }

      event.preventDefault();
      dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);

      if (dragDepthRef.current === 0) {
        setDragState({ active: false });
        setUiState(sourceImage ? 'ready' : 'empty');
      }
    };

    const onDrop = async event => {
      if (!hasFiles(event)) {
        return;
      }

      event.preventDefault();
      dragDepthRef.current = 0;
      setDragState({ active: false });
      await handleIncomingFiles(Array.from(event.dataTransfer?.files || []), 'drop');
    };

    window.addEventListener('dragenter', onDragEnter);
    window.addEventListener('dragover', onDragOver);
    window.addEventListener('dragleave', onDragLeave);
    window.addEventListener('drop', onDrop);

    return () => {
      window.removeEventListener('dragenter', onDragEnter);
      window.removeEventListener('dragover', onDragOver);
      window.removeEventListener('dragleave', onDragLeave);
      window.removeEventListener('drop', onDrop);
    };
  }, [sourceImage]);

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const handleInputChange = async event => {
    await handleIncomingFiles(Array.from(event.target.files || []), 'select');
  };

  const handleStyleSelect = styleId => {
    setPreviewStyle(styleId);
    trackEvent('style_change', { style: styleId });
  };

  const handleBackgroundChange = value => {
    setBackgroundColor(value);
    trackEvent('background_change', { background: value });
  };

  const handleZoomChange = value => {
    if (!sourceImage || !cropRect) {
      return;
    }

    const nextZoom = Number(value);
    setZoom(nextZoom);
    setCropRect(previous => zoomCropRect(sourceImage, previous, nextZoom));
  };

  const handlePan = ({ deltaX, deltaY, surfaceSize }) => {
    if (!sourceImage || !cropRect) {
      return;
    }

    const scale = cropRect.size / Math.max(surfaceSize, 1);
    setCropRect(previous =>
      moveCropRect(sourceImage, previous, -deltaX * scale, -deltaY * scale)
    );
  };

  const handleDownload = async () => {
    if (!sourceImage || !cropRect) {
      pushToast('先上传一张图片再下载。', 'error');
      return;
    }

    await exportAvatarPng({
      image: sourceImage,
      cropRect,
      style: previewStyle,
      backgroundColor,
      fileName: sourceFile?.name || 'avatar.png'
    });
    trackEvent('download_avatar', { style: previewStyle });
    pushToast('头像已开始下载。');
  };

  return (
    <div className="app-shell">
      <MagnetBackground />
      <div className="app-shell__grain" aria-hidden="true" />

      <main className="app">
        <header className="hero">
          <div className="hero__eyebrow">PIXEL PORTRAIT LAB</div>
          <div className="hero__copy">
            <h1>风格炼像室</h1>
            <p>
              上传一张照片，在同一页里试出你想要的像素头像风格。所有图像处理都只发生在你的浏览器里。
            </p>
          </div>
          <div className="hero__meta">
            <span className="hero__privacy">100% 纯本地计算，不上传到任何服务器</span>
            <a className="hero__github" href={GITHUB_URL} target="_blank" rel="noreferrer">
              GitHub
            </a>
          </div>
        </header>

        <section className="app__gallery">
          <StylePreviewGallery
            items={galleryItems}
            selectedStyle={previewStyle}
            onSelectStyle={handleStyleSelect}
            backgrounds={BACKGROUND_OPTIONS}
            backgroundColor={backgroundColor}
            onBackgroundChange={handleBackgroundChange}
            isReady={Boolean(sourceImage)}
            isLoading={isGeneratingGallery}
          />
        </section>

        <section className="app__surface">
          <UploadPreviewSurface
            sourceImage={sourceImage}
            cropRect={cropRect}
            previewStyle={previewStyle}
            backgroundColor={backgroundColor}
            uiState={uiState}
            dragActive={dragState.active}
            onBrowse={handleBrowseClick}
            onPan={handlePan}
          />
          <input
            ref={fileInputRef}
            className="app__file-input"
            type="file"
            accept="image/png,image/jpeg,.png,.jpg,.jpeg"
            onChange={handleInputChange}
          />
        </section>

        <section className="app__controls">
          <ControlPanel
            sourceFile={sourceFile}
            sourceImage={sourceImage}
            previewStyle={previewStyle}
            zoom={zoom}
            zoomRange={ZOOM_RANGE}
            onBrowse={handleBrowseClick}
            onDownload={handleDownload}
            onZoomChange={handleZoomChange}
          />
        </section>

        <footer className="app__footer">
          <p>Tips：建议上传背景干净、主体居中的照片，效果会更稳定。</p>
          <p>当前提供 5 种风格：普通、清新、赛博、多巴胺、暗黑。</p>
        </footer>
      </main>

      <ToastHost toast={toast} onClear={() => setToast(null)} />
    </div>
  );
}
*/

import { startTransition, useEffect, useRef, useState } from 'react';

import ControlPanel from './components/ControlPanel';
import MagnetBackground from './components/MagnetBackground';
import StylePreviewGallery from './components/StylePreviewGallery';
import ToastHost from './components/ToastHost';
import UploadPreviewSurface from './components/UploadPreviewSurface';
import {
  BACKGROUND_OPTIONS,
  DEFAULT_PIXEL_LEVEL,
  DEFAULT_STYLE_ID,
  GITHUB_URL,
  PIXEL_LEVELS,
  STYLE_OPTIONS
} from './lib/constants';
import {
  buildStylePreview,
  decodeLocalImage,
  exportAvatarPng,
  getDefaultGalleryItems
} from './lib/image';
import { trackEvent, trackPageView } from './lib/analytics';

import './styles/app.css';

function createToast(message, tone = 'info') {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    message,
    tone
  };
}

function hasFiles(event) {
  return Array.from(event.dataTransfer?.types || []).includes('Files');
}

export default function App() {
  const fileInputRef = useRef(null);
  const dragDepthRef = useRef(0);
  const [sourceFile, setSourceFile] = useState(null);
  const [sourceImage, setSourceImage] = useState(null);
  const [previewStyle, setPreviewStyle] = useState(DEFAULT_STYLE_ID);
  const [backgroundColor, setBackgroundColor] = useState(BACKGROUND_OPTIONS[0].value);
  const [pixelLevel, setPixelLevel] = useState(DEFAULT_PIXEL_LEVEL);
  const [galleryItems, setGalleryItems] = useState(getDefaultGalleryItems());
  const [dragState, setDragState] = useState({ active: false });
  const [uiState, setUiState] = useState('empty');
  const [toast, setToast] = useState(null);
  const [isGeneratingGallery, setIsGeneratingGallery] = useState(false);

  useEffect(() => {
    trackPageView();
  }, []);

  useEffect(() => {
    if (!sourceImage) {
      setGalleryItems(getDefaultGalleryItems(backgroundColor));
      setIsGeneratingGallery(false);
      return undefined;
    }

    let cancelled = false;
    setIsGeneratingGallery(true);

    const run = async () => {
      const previews = await Promise.all(
        STYLE_OPTIONS.map(async style => ({
          id: style.id,
          text: style.label,
          note: style.description,
          image: await buildStylePreview({
            image: sourceImage,
            style: style.id,
            backgroundColor,
            pixelLevel
          })
        }))
      );

      if (cancelled) {
        return;
      }

      startTransition(() => {
        setGalleryItems(previews);
        setIsGeneratingGallery(false);
      });
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [backgroundColor, pixelLevel, sourceImage]);

  const pushToast = (message, tone = 'info') => {
    setToast(createToast(message, tone));
  };

  const resetInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleIncomingFile = async (file, source = 'select') => {
    try {
      const decoded = await decodeLocalImage(file);

      setSourceFile(decoded.file);
      setSourceImage(decoded.image);
      setPreviewStyle(DEFAULT_STYLE_ID);
      setPixelLevel(DEFAULT_PIXEL_LEVEL);
      setUiState('ready');
      setToast(null);
      trackEvent(source === 'drop' ? 'upload_drop' : 'upload_select');
    } catch (error) {
      const nextMessage = error instanceof Error ? error.message : '图片读取失败，请换一张试试。';
      setUiState(sourceImage ? 'ready' : 'error');
      pushToast(nextMessage, 'error');

      if (!sourceImage) {
        window.setTimeout(() => {
          setUiState('empty');
        }, 160);
      }
    } finally {
      resetInput();
    }
  };

  const handleIncomingFiles = async (files, source = 'select') => {
    if (!files.length) {
      setUiState(sourceImage ? 'ready' : 'empty');
      return;
    }

    if (files.length > 1) {
      setUiState(sourceImage ? 'ready' : 'error');
      pushToast('一次只能上传一张图片。', 'error');
      return;
    }

    await handleIncomingFile(files[0], source);
  };

  useEffect(() => {
    const onDragEnter = event => {
      if (!hasFiles(event)) {
        return;
      }

      event.preventDefault();
      dragDepthRef.current += 1;
      setDragState({ active: true });
      setUiState('dragging');
    };

    const onDragOver = event => {
      if (!hasFiles(event)) {
        return;
      }

      event.preventDefault();
    };

    const onDragLeave = event => {
      if (!hasFiles(event)) {
        return;
      }

      event.preventDefault();
      dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);

      if (dragDepthRef.current === 0) {
        setDragState({ active: false });
        setUiState(sourceImage ? 'ready' : 'empty');
      }
    };

    const onDrop = async event => {
      if (!hasFiles(event)) {
        return;
      }

      event.preventDefault();
      dragDepthRef.current = 0;
      setDragState({ active: false });
      await handleIncomingFiles(Array.from(event.dataTransfer?.files || []), 'drop');
    };

    window.addEventListener('dragenter', onDragEnter);
    window.addEventListener('dragover', onDragOver);
    window.addEventListener('dragleave', onDragLeave);
    window.addEventListener('drop', onDrop);

    return () => {
      window.removeEventListener('dragenter', onDragEnter);
      window.removeEventListener('dragover', onDragOver);
      window.removeEventListener('dragleave', onDragLeave);
      window.removeEventListener('drop', onDrop);
    };
  }, [sourceImage]);

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const handleInputChange = async event => {
    await handleIncomingFiles(Array.from(event.target.files || []), 'select');
  };

  const handleStyleSelect = styleId => {
    setPreviewStyle(styleId);
    trackEvent('style_change', { style: styleId });
  };

  const handleBackgroundChange = value => {
    setBackgroundColor(value);
    trackEvent('background_change', { background: value });
  };

  const handlePixelLevelChange = value => {
    setPixelLevel(value);
    trackEvent('pixel_level_change', { pixelLevel: value });
  };

  const handleDownload = async () => {
    if (!sourceImage) {
      pushToast('先上传一张图片再下载。', 'error');
      return;
    }

    await exportAvatarPng({
      image: sourceImage,
      style: previewStyle,
      backgroundColor,
      fileName: sourceFile?.name || 'avatar.png',
      pixelLevel
    });
    trackEvent('download_avatar', { style: previewStyle, pixelLevel });
    pushToast('头像已开始下载。');
  };

  return (
    <div className="app-shell">
      <MagnetBackground />
      <div className="app-shell__grain" aria-hidden="true" />

      <main className="app">
        <header className="hero">
          <div className="hero__eyebrow">PIXEL PORTRAIT LAB</div>
          <div className="hero__copy">
            <h1>风格炼像室</h1>
            <p>上传一张照片，在同一页里试出你想要的像素头像风格。所有图像处理都只发生在你的浏览器里。</p>
          </div>
          <div className="hero__meta">
            <span className="hero__privacy">100% 纯本地计算，不上传到任何服务器</span>
            <a className="hero__github" href={GITHUB_URL} target="_blank" rel="noreferrer">
              GitHub
            </a>
          </div>
        </header>

        <section className="app__gallery">
          <StylePreviewGallery
            items={galleryItems}
            selectedStyle={previewStyle}
            onSelectStyle={handleStyleSelect}
            backgrounds={BACKGROUND_OPTIONS}
            backgroundColor={backgroundColor}
            onBackgroundChange={handleBackgroundChange}
            isReady={Boolean(sourceImage)}
            isLoading={isGeneratingGallery}
          />
        </section>

        <section className="app__surface">
          <UploadPreviewSurface
            sourceImage={sourceImage}
            previewStyle={previewStyle}
            backgroundColor={backgroundColor}
            pixelLevel={pixelLevel}
            uiState={uiState}
            dragActive={dragState.active}
            onBrowse={handleBrowseClick}
          />
          <input
            ref={fileInputRef}
            className="app__file-input"
            type="file"
            accept="image/png,image/jpeg,.png,.jpg,.jpeg"
            onChange={handleInputChange}
          />
        </section>

        <section className="app__controls">
          <ControlPanel
            sourceFile={sourceFile}
            sourceImage={sourceImage}
            previewStyle={previewStyle}
            pixelLevel={pixelLevel}
            pixelLevels={PIXEL_LEVELS}
            onBrowse={handleBrowseClick}
            onDownload={handleDownload}
            onPixelLevelChange={handlePixelLevelChange}
          />
        </section>

        <footer className="app__footer">
          <p>Tips：上传后默认颗粒度是 512，向右拖动滑杆会逐步变成 5x5 的粗像素头像。</p>
          <p>处理顺序固定为：主体提取、风格化、像素化、背景填充、导出。</p>
        </footer>
      </main>

      <ToastHost toast={toast} onClear={() => setToast(null)} />
    </div>
  );
}
