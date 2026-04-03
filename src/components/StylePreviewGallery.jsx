import { useDeferredValue } from 'react';

import CircularGallery from './CircularGallery';
import { clampRgbChannel, hexToRgb, rgbToHex } from '../lib/colors';

import './StylePreviewGallery.css';

function GalleryFallback({ items, selectedStyle, onSelectStyle, performanceTier }) {
  return (
    <div
      className={`style-preview__fallback ${
        performanceTier !== 'desktop' ? 'is-mobile-performance' : ''
      }`}
    >
      {items.map(item => (
        <button
          key={item.id}
          type="button"
          className={`style-preview__fallback-card ${selectedStyle === item.id ? 'is-active' : ''}`}
          onClick={() => onSelectStyle(item.id)}
        >
          <img src={item.image} alt={`${item.text} 风格预览`} />
          <span>{item.text}</span>
          <small>{item.note}</small>
        </button>
      ))}
    </div>
  );
}

export default function StylePreviewGallery({
  items,
  selectedStyle,
  onSelectStyle,
  backgrounds,
  backgroundMode,
  presetBackgroundColor,
  customBackgroundColor,
  backgroundColor,
  onPresetBackgroundChange,
  onCustomBackgroundChange,
  performanceTier,
  isReady,
  isLoading
}) {
  const deferredItems = useDeferredValue(items);
  const currentBackground = backgrounds.find(background => background.value === presetBackgroundColor);
  const customRgb = hexToRgb(customBackgroundColor);

  const updateCustomBackgroundRgb = (channel, value) => {
    const next = {
      ...customRgb,
      [channel]: clampRgbChannel(Number(value) || 0)
    };
    onCustomBackgroundChange(rgbToHex(next));
  };

  return (
    <div
      className={`style-preview ${performanceTier !== 'desktop' ? 'is-mobile-performance' : ''} ${
        performanceTier === 'low-end-mobile' ? 'is-low-end-mobile' : ''
      }`}
    >
      <div className="style-preview__heading">
        <div className="style-preview__copy">
          <p className="style-preview__eyebrow">{isReady ? 'YOUR FIXED STYLE STRIP' : 'STYLE PREVIEW'}</p>
          <div>
            <h2>{isReady ? '上传后这里固定显示 6 个基础风格' : '先看看六种基础风格'}</h2>
            <p>
              {isReady
                ? '顶部只负责普通、清新、赛博、多巴胺、暗黑、玻璃这 6 种固定风格。自定义风格会放在中间主预览下方单独控制。'
                : '先浏览 6 种固定风格的气质，上传后这里会换成你当前图片在这 6 种风格下的缩略预览。'}
            </p>
          </div>
        </div>

        <div className="style-preview__backgrounds">
          <div className="style-preview__background-title">
            <div>
              <p className="style-preview__eyebrow">BACKGROUND</p>
              <span>{backgroundMode === 'custom' ? '自定义背景' : `当前：${currentBackground?.label || '透明'}`}</span>
            </div>
            <strong>
              {backgroundMode === 'custom'
                ? customBackgroundColor.toUpperCase()
                : currentBackground?.label || '透明'}
            </strong>
          </div>

          <div className="style-preview__swatches">
            {backgrounds.map(background => (
              <button
                key={background.value}
                type="button"
                className={`style-preview__swatch ${
                  backgroundMode === 'preset' && presetBackgroundColor === background.value ? 'is-active' : ''
                } ${background.value === 'transparent' ? 'is-transparent' : ''}`}
                style={{ '--swatch-color': background.value }}
                onClick={() => onPresetBackgroundChange(background.value)}
                aria-label={`切换到 ${background.label}`}
              />
            ))}

            <button
              type="button"
              className={`style-preview__swatch style-preview__swatch--custom ${
                backgroundMode === 'custom' ? 'is-active' : ''
              }`}
              style={{ '--swatch-color': customBackgroundColor }}
              onClick={() => onCustomBackgroundChange(customBackgroundColor)}
              aria-label="启用自定义背景颜色"
            >
              C
            </button>
          </div>

          <div className={`style-preview__custom-background ${backgroundMode === 'custom' ? 'is-active' : ''}`}>
            <label className="style-preview__color-picker">
              <span>取色器</span>
              <input
                type="color"
                value={customBackgroundColor}
                onChange={event => onCustomBackgroundChange(event.target.value)}
              />
            </label>

            <div className="style-preview__rgb-grid">
              {['r', 'g', 'b'].map(channel => (
                <label key={channel} className="style-preview__rgb-field">
                  <span>{channel.toUpperCase()}</span>
                  <input
                    type="number"
                    min="0"
                    max="255"
                    value={customRgb[channel]}
                    onChange={event => updateCustomBackgroundRgb(channel, event.target.value)}
                  />
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="style-preview__stage">
        <CircularGallery
          items={deferredItems}
          bend={3}
          textColor="#10202d"
          borderRadius={0.08}
          scrollSpeed={2}
          scrollEase={0.05}
          performanceTier={performanceTier}
          fallback={
            <GalleryFallback
              items={deferredItems}
              selectedStyle={selectedStyle}
              onSelectStyle={onSelectStyle}
              performanceTier={performanceTier}
            />
          }
        />

        {isLoading ? <div className="style-preview__loading">正在生成当前图片的固定风格缩略图</div> : null}
      </div>

      <div className="style-preview__picker">
        {deferredItems.map(item => (
          <button
            key={item.id}
            type="button"
            className={`style-preview__chip ${selectedStyle === item.id ? 'is-active' : ''}`}
            onClick={() => onSelectStyle(item.id)}
          >
            <span className="style-preview__chip-label">{item.text}</span>
            <span className="style-preview__chip-note">{item.note}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
