/*
import { STYLE_OPTIONS } from '../lib/appConstants';

import './ControlPanel.css';

export default function ControlPanel({
  sourceFile,
  sourceImage,
  previewStyle,
  zoom,
  zoomRange,
  onBrowse,
  onDownload,
  onZoomChange
}) {
  const currentStyle = STYLE_OPTIONS.find(style => style.id === previewStyle);

  return (
    <div className="control-panel">
      <article className="control-panel__card">
        <p className="control-panel__eyebrow">CURRENT STYLE</p>
        <h3>{currentStyle?.label}</h3>
        <p>{currentStyle?.description}</p>
        <p className="control-panel__hint">顶部风格区会同步展示当前图片在五种风格下的缩略图。</p>
      </article>

      <article className="control-panel__card">
        <div className="control-panel__header">
          <div>
            <p className="control-panel__eyebrow">CROP + ZOOM</p>
            <h3>缩放构图</h3>
          </div>
          <span className="control-panel__value">{zoom.toFixed(2)}x</span>
        </div>
        <input
          className="control-panel__slider"
          type="range"
          min={zoomRange.min}
          max={zoomRange.max}
          step={zoomRange.step}
          value={zoom}
          onChange={event => onZoomChange(event.target.value)}
          disabled={!sourceImage}
        />
        <p className="control-panel__hint">上传后可拖动画面微调，再用这里放大或缩小。</p>
      </article>

      <article className="control-panel__card control-panel__card--actions">
        <p className="control-panel__eyebrow">OUTPUT</p>
        <h3>{sourceFile?.name || '还没有图片'}</h3>
        <p>下载始终输出 512x512 PNG，视觉结果与主预览保持一致。</p>
        <div className="control-panel__actions">
          <button type="button" className="control-panel__button control-panel__button--secondary" onClick={onBrowse}>
            上传图片
          </button>
          <button
            type="button"
            className="control-panel__button control-panel__button--primary"
            onClick={onDownload}
            disabled={!sourceImage}
          >
            下载头像
          </button>
        </div>
      </article>
    </div>
  );
}
*/

import { STYLE_OPTIONS } from '../lib/constants';

import './ControlPanel.css';

export default function ControlPanel({
  sourceFile,
  sourceImage,
  previewStyle,
  pixelLevel,
  pixelLevels,
  onBrowse,
  onDownload,
  onPixelLevelChange
}) {
  const currentStyle = STYLE_OPTIONS.find(style => style.id === previewStyle);
  const sliderIndex = Math.max(0, pixelLevels.indexOf(pixelLevel));

  return (
    <div className="control-panel">
      <article className="control-panel__card">
        <p className="control-panel__eyebrow">CURRENT STYLE</p>
        <h3>{currentStyle?.label}</h3>
        <p>{currentStyle?.description}</p>
        <p className="control-panel__hint">顶部风格区会同步展示当前图片在五种风格下、当前颗粒度下的缩略图。</p>
      </article>

      <article className="control-panel__card">
        <div className="control-panel__header">
          <div>
            <p className="control-panel__eyebrow">PIXEL DENSITY</p>
            <h3>像素颗粒度控制</h3>
          </div>
          <span className="control-panel__value">{pixelLevel}</span>
        </div>
        <input
          className="control-panel__slider"
          type="range"
          min={0}
          max={pixelLevels.length - 1}
          step={1}
          value={sliderIndex}
          onChange={event => onPixelLevelChange(pixelLevels[Number(event.target.value)])}
          disabled={!sourceImage}
        />
        <p className="control-panel__hint">左侧是 512，右侧是 5。越往右，主体会变成越粗的像素块。</p>
      </article>

      <article className="control-panel__card control-panel__card--actions">
        <p className="control-panel__eyebrow">OUTPUT</p>
        <h3 className="control-panel__filename">{sourceFile?.name || '还没有图片'}</h3>
        <p>下载始终输出 512x512 PNG，内容与中间 GlassSurface 预览完全一致。</p>
        <div className="control-panel__actions">
          <button type="button" className="control-panel__button control-panel__button--secondary" onClick={onBrowse}>
            上传图片
          </button>
          <button
            type="button"
            className="control-panel__button control-panel__button--primary"
            onClick={onDownload}
            disabled={!sourceImage}
          >
            下载头像
          </button>
        </div>
      </article>
    </div>
  );
}
