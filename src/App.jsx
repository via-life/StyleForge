import { startTransition, useEffect, useRef, useState } from 'react';

import ControlPanel from './components/ControlPanel';
import MagnetBackground from './components/MagnetBackground';
import StylePreviewGallery from './components/StylePreviewGallery';
import SubjectControls from './components/SubjectControls';
import ToastHost from './components/ToastHost';
import UploadPreviewSurface from './components/UploadPreviewSurface';
import {
  BACKGROUND_OPTIONS,
  DEFAULT_BACKGROUND_MODE,
  DEFAULT_CUSTOM_BACKGROUND,
  DEFAULT_CUSTOM_STYLE_COLOR_COUNT,
  DEFAULT_CUSTOM_STYLE_COLORS,
  DEFAULT_PIXEL_LEVEL,
  DEFAULT_STYLE_ID,
  DEFAULT_SUBJECT_OPACITY,
  GITHUB_URL,
  PIXEL_LEVELS
} from './lib/constants';
import { normalizeHexColor } from './lib/colors';
import {
  buildStylePreviewsProgressive,
  decodeLocalImage,
  exportAvatarPng,
  getDefaultGalleryItems
} from './lib/image';
import { trackEvent, trackPageView } from './lib/analytics';
import { detectPerformanceTier, isMobilePerformanceTier } from './lib/performance';

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
  const [backgroundMode, setBackgroundMode] = useState(DEFAULT_BACKGROUND_MODE);
  const [presetBackgroundColor, setPresetBackgroundColor] = useState(BACKGROUND_OPTIONS[0].value);
  const [customBackgroundColor, setCustomBackgroundColor] = useState(DEFAULT_CUSTOM_BACKGROUND);
  const [pixelLevel, setPixelLevel] = useState(DEFAULT_PIXEL_LEVEL);
  const [subjectOpacity, setSubjectOpacity] = useState(DEFAULT_SUBJECT_OPACITY);
  const [customStyleEnabled, setCustomStyleEnabled] = useState(false);
  const [customStyleColorCount, setCustomStyleColorCount] = useState(DEFAULT_CUSTOM_STYLE_COLOR_COUNT);
  const [customStyleColors, setCustomStyleColors] = useState(DEFAULT_CUSTOM_STYLE_COLORS);
  const [galleryItems, setGalleryItems] = useState(getDefaultGalleryItems(BACKGROUND_OPTIONS[0].value));
  const [dragState, setDragState] = useState({ active: false });
  const [uiState, setUiState] = useState('empty');
  const [toast, setToast] = useState(null);
  const [isGeneratingGallery, setIsGeneratingGallery] = useState(false);
  const [performanceTier, setPerformanceTier] = useState(() => detectPerformanceTier());
  const isMobilePerformanceMode = isMobilePerformanceTier(performanceTier);

  const backgroundColor =
    backgroundMode === 'custom' ? normalizeHexColor(customBackgroundColor, DEFAULT_CUSTOM_BACKGROUND) : presetBackgroundColor;

  useEffect(() => {
    trackPageView();
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    const updatePerformanceTier = () => {
      setPerformanceTier(detectPerformanceTier());
    };

    const mediaQueries = [
      window.matchMedia('(pointer: coarse)'),
      window.matchMedia('(prefers-reduced-motion: reduce)')
    ];

    updatePerformanceTier();
    window.addEventListener('resize', updatePerformanceTier);
    mediaQueries.forEach(mediaQuery => {
      if (typeof mediaQuery.addEventListener === 'function') {
        mediaQuery.addEventListener('change', updatePerformanceTier);
        return;
      }

      mediaQuery.addListener(updatePerformanceTier);
    });

    return () => {
      window.removeEventListener('resize', updatePerformanceTier);
      mediaQueries.forEach(mediaQuery => {
        if (typeof mediaQuery.removeEventListener === 'function') {
          mediaQuery.removeEventListener('change', updatePerformanceTier);
          return;
        }

        mediaQuery.removeListener(updatePerformanceTier);
      });
    };
  }, []);

  useEffect(() => {
    if (!sourceImage) {
      setGalleryItems(getDefaultGalleryItems(backgroundColor));
      setIsGeneratingGallery(false);
      return undefined;
    }

    const controller = new AbortController();
    setIsGeneratingGallery(true);

    const run = async () => {
      try {
        await buildStylePreviewsProgressive({
          image: sourceImage,
          backgroundColor,
          pixelLevel,
          priorityStyle: previewStyle,
          subjectOpacity,
          tier: performanceTier,
          signal: controller.signal,
          onPreview: preview => {
            if (controller.signal.aborted) {
              return;
            }

            startTransition(() => {
              setGalleryItems(currentItems => {
                const fallbackItems = currentItems.length ? currentItems : getDefaultGalleryItems(backgroundColor);
                return fallbackItems.map(item => (item.id === preview.id ? preview : item));
              });
            });
          }
        });

        if (!controller.signal.aborted) {
          setIsGeneratingGallery(false);
        }
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }

        console.error('Failed to build gallery previews.', error);
        setIsGeneratingGallery(false);
      }
    };

    run();

    return () => {
      controller.abort();
    };
  }, [backgroundColor, performanceTier, pixelLevel, previewStyle, sourceImage, subjectOpacity]);

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
      setSubjectOpacity(DEFAULT_SUBJECT_OPACITY);
      setCustomStyleEnabled(false);
      setCustomStyleColorCount(DEFAULT_CUSTOM_STYLE_COLOR_COUNT);
      setCustomStyleColors(DEFAULT_CUSTOM_STYLE_COLORS);
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

  const handlePresetBackgroundChange = value => {
    setBackgroundMode('preset');
    setPresetBackgroundColor(value);
    trackEvent('background_change', { background: value, mode: 'preset' });
  };

  const handleCustomBackgroundChange = value => {
    const nextColor = normalizeHexColor(value, DEFAULT_CUSTOM_BACKGROUND);
    setBackgroundMode('custom');
    setCustomBackgroundColor(nextColor);
    trackEvent('background_change', { background: nextColor, mode: 'custom' });
  };

  const handlePixelLevelChange = value => {
    setPixelLevel(value);
    trackEvent('pixel_level_change', { pixelLevel: value });
  };

  const handleSubjectOpacityChange = value => {
    setSubjectOpacity(value);
    trackEvent('subject_opacity_change', { subjectOpacity: value });
  };

  const handleCustomStyleEnabledChange = enabled => {
    setCustomStyleEnabled(enabled);
    trackEvent('custom_style_toggle', { enabled });
  };

  const handleCustomStyleColorCountChange = value => {
    setCustomStyleColorCount(value);
    trackEvent('custom_style_color_count_change', { count: value });
  };

  const handleCustomStyleColorChange = (index, value) => {
    const nextColor = normalizeHexColor(value, DEFAULT_CUSTOM_STYLE_COLORS[index] || DEFAULT_CUSTOM_STYLE_COLORS[0]);
    setCustomStyleColors(currentColors => {
      const nextColors = [...currentColors];
      nextColors[index] = nextColor;
      return nextColors;
    });
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
      pixelLevel,
      subjectOpacity,
      customStyleEnabled,
      customStyleColors,
      customStyleColorCount
    });
    trackEvent('download_avatar', {
      style: customStyleEnabled ? 'custom' : previewStyle,
      pixelLevel,
      subjectOpacity
    });
    pushToast('头像已开始下载。');
  };

  return (
    <div
      className={`app-shell ${isMobilePerformanceMode ? 'is-mobile-performance' : ''} ${
        performanceTier === 'low-end-mobile' ? 'is-low-end-mobile' : ''
      }`}
    >
      <MagnetBackground performanceTier={performanceTier} />
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
            backgroundMode={backgroundMode}
            presetBackgroundColor={presetBackgroundColor}
            customBackgroundColor={customBackgroundColor}
            backgroundColor={backgroundColor}
            onPresetBackgroundChange={handlePresetBackgroundChange}
            onCustomBackgroundChange={handleCustomBackgroundChange}
            performanceTier={performanceTier}
            isReady={Boolean(sourceImage)}
            isLoading={isGeneratingGallery}
          />
        </section>

        <section className="app__surface">
          <div className="app__surface-stack">
            <UploadPreviewSurface
              sourceImage={sourceImage}
              previewStyle={previewStyle}
              backgroundColor={backgroundColor}
              pixelLevel={pixelLevel}
              performanceTier={performanceTier}
              uiState={uiState}
              dragActive={dragState.active}
              onBrowse={handleBrowseClick}
              subjectOpacity={subjectOpacity}
              customStyleEnabled={customStyleEnabled}
              customStyleColorCount={customStyleColorCount}
              customStyleColors={customStyleColors}
            />

            <SubjectControls
              sourceImage={sourceImage}
              previewStyle={previewStyle}
              pixelLevel={pixelLevel}
              pixelLevels={PIXEL_LEVELS}
              subjectOpacity={subjectOpacity}
              customStyleEnabled={customStyleEnabled}
              customStyleColorCount={customStyleColorCount}
              customStyleColors={customStyleColors}
              onPixelLevelChange={handlePixelLevelChange}
              onSubjectOpacityChange={handleSubjectOpacityChange}
              onCustomStyleEnabledChange={handleCustomStyleEnabledChange}
              onCustomStyleColorCountChange={handleCustomStyleColorCountChange}
              onCustomStyleColorChange={handleCustomStyleColorChange}
            />
          </div>

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
            customStyleEnabled={customStyleEnabled}
            onBrowse={handleBrowseClick}
            onDownload={handleDownload}
          />
        </section>

        <footer className="app__footer">
          <p>Tips：顶部始终是 6 种固定风格带；开启“自定义风格”后，只会覆盖中间主预览和最终导出。</p>
          <p>处理顺序固定为：主体提取、固定风格或自定义风格渲染、像素化、主体透明度应用、背景填充、导出。</p>
        </footer>
      </main>

      <ToastHost toast={toast} onClear={() => setToast(null)} />
    </div>
  );
}
