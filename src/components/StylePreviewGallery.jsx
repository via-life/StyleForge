import { useDeferredValue } from 'react';

import CircularGallery from './CircularGallery';

import './StylePreviewGallery.css';

function GalleryFallback({ items, selectedStyle, onSelectStyle }) {
  return (
    <div className="style-preview__fallback">
      {items.map(item => (
        <button
          key={item.id}
          type="button"
          className={`style-preview__fallback-card ${selectedStyle === item.id ? 'is-active' : ''}`}
          onClick={() => onSelectStyle(item.id)}
        >
          <img src={item.image} alt={item.text} />
          <span>{item.text}</span>
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
  backgroundColor,
  onBackgroundChange,
  isReady,
  isLoading
}) {
  const deferredItems = useDeferredValue(items);
  const currentBackground = backgrounds.find(background => background.value === backgroundColor);

  return (
    <div className="style-preview">
      <div className="style-preview__heading">
        <div className="style-preview__copy">
          <p className="style-preview__eyebrow">{isReady ? 'YOUR STYLE MATRIX' : 'STYLE PREVIEW'}</p>
          <div>
            <h2>{isReady ? '上传后这里会变成你的风格选择带' : '先看看五种默认风格'}</h2>
            <p>
              {isReady
                ? '上方展示的是当前图片的五种风格缩略预览，点击下方标签即可切换主预览。'
                : '先浏览五种风格气质，上传后这里会换成你自己的头像预览。'}
            </p>
          </div>
        </div>

        <div className="style-preview__backgrounds">
          <div className="style-preview__background-title">
            <p className="style-preview__eyebrow">BACKGROUND</p>
            <span>{currentBackground?.label || backgroundColor}</span>
          </div>
          <div className="style-preview__swatches">
            {backgrounds.map(background => (
              <button
                key={background.value}
                type="button"
                className={`style-preview__swatch ${backgroundColor === background.value ? 'is-active' : ''} ${
                  background.value === 'transparent' ? 'is-transparent' : ''
                }`}
                style={{ '--swatch-color': background.value }}
                onClick={() => onBackgroundChange(background.value)}
                aria-label={`切换到 ${background.label}`}
              />
            ))}
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
          fallback={
            <GalleryFallback
              items={deferredItems}
              selectedStyle={selectedStyle}
              onSelectStyle={onSelectStyle}
            />
          }
        />

        {isLoading ? <div className="style-preview__loading">正在生成新的风格缩略图…</div> : null}
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
