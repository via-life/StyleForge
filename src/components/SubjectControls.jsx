import { STYLE_OPTIONS } from '../lib/constants';
import { clampRgbChannel, hexToRgb, rgbToHex } from '../lib/colors';

import './SubjectControls.css';

function ColorStopEditor({ index, value, disabled, onChange }) {
  const rgb = hexToRgb(value);

  const handleRgbChange = (channel, nextValue) => {
    const nextColor = {
      ...rgb,
      [channel]: clampRgbChannel(Number(nextValue) || 0)
    };
    onChange(index, rgbToHex(nextColor));
  };

  return (
    <div className="subject-controls__color-row">
      <div className="subject-controls__color-meta">
        <span className="subject-controls__color-index">颜色 {String(index + 1).padStart(2, '0')}</span>
        <input
          type="color"
          value={value}
          onChange={event => onChange(index, event.target.value)}
          disabled={disabled}
        />
      </div>

      <div className="subject-controls__rgb-grid">
        {['r', 'g', 'b'].map(channel => (
          <label key={channel} className="subject-controls__rgb-field">
            <span>{channel.toUpperCase()}</span>
            <input
              type="number"
              min="0"
              max="255"
              value={rgb[channel]}
              disabled={disabled}
              onChange={event => handleRgbChange(channel, event.target.value)}
            />
          </label>
        ))}
      </div>
    </div>
  );
}

export default function SubjectControls({
  sourceImage,
  previewStyle,
  pixelLevel,
  pixelLevels,
  subjectOpacity,
  customStyleEnabled,
  customStyleColorCount,
  customStyleColors,
  onPixelLevelChange,
  onSubjectOpacityChange,
  onCustomStyleEnabledChange,
  onCustomStyleColorCountChange,
  onCustomStyleColorChange
}) {
  const currentStyle = STYLE_OPTIONS.find(style => style.id === previewStyle);
  const disabled = !sourceImage;
  const sliderIndex = Math.max(0, pixelLevels.indexOf(pixelLevel));

  return (
    <div className={`subject-controls ${disabled ? 'is-disabled' : ''}`}>
      <div className="subject-controls__stack">
        <article className="subject-controls__card">
          <div className="subject-controls__header">
            <div className="subject-controls__header-block">
              <p className="subject-controls__eyebrow">PIXEL DENSITY</p>
              <h3>像素颗粒度控制</h3>
            </div>
            <span className="subject-controls__value">{pixelLevel}</span>
          </div>

          <div className="subject-controls__control">
            <input
              className="subject-controls__slider"
              type="range"
              min="0"
              max={pixelLevels.length - 1}
              step="1"
              value={sliderIndex}
              onChange={event => onPixelLevelChange(pixelLevels[Number(event.target.value)])}
              disabled={disabled}
            />
          </div>

          <div className="subject-controls__copy">
            <p className="subject-controls__hint">左侧是 512，右侧是 5。越往右，主体会变成越粗的像素块。</p>
          </div>
        </article>

        <article className="subject-controls__card">
          <div className="subject-controls__header">
            <div className="subject-controls__header-block">
              <p className="subject-controls__eyebrow">SUBJECT OPACITY</p>
              <h3>主体透明度控制</h3>
            </div>
            <span className="subject-controls__value">{subjectOpacity}%</span>
          </div>

          <div className="subject-controls__control">
            <input
              className="subject-controls__slider"
              type="range"
              min="0"
              max="100"
              step="1"
              value={subjectOpacity}
              onChange={event => onSubjectOpacityChange(Number(event.target.value))}
              disabled={disabled}
            />
          </div>

          <div className="subject-controls__copy">
            <p className="subject-controls__hint">
              这里控制主体透明度，不改背景。顶部 6 个固定风格缩略图也会同步这一透明度。{currentStyle ? `当前固定风格基底：${currentStyle.label}。` : ''}
            </p>
          </div>
        </article>
      </div>

      <article className="subject-controls__card subject-controls__card--custom">
        <div className="subject-controls__header">
          <div>
            <p className="subject-controls__eyebrow">CUSTOM STYLE</p>
            <h3>自定义风格</h3>
          </div>

          <label className={`subject-controls__toggle ${customStyleEnabled ? 'is-active' : ''}`}>
            <input
              type="checkbox"
              checked={customStyleEnabled}
              disabled={disabled}
              onChange={event => onCustomStyleEnabledChange(event.target.checked)}
            />
            <span>{customStyleEnabled ? '已开启' : '已关闭'}</span>
          </label>
        </div>

        <p className="subject-controls__hint">
          开启后，会覆盖当前固定风格的主预览与导出，但不会改变顶部固定风格带的 6 张卡片。
        </p>

        <div className="subject-controls__count-picker">
          {[1, 2, 3].map(count => (
            <button
              key={count}
              type="button"
              className={`subject-controls__count-chip ${customStyleColorCount === count ? 'is-active' : ''}`}
              onClick={() => onCustomStyleColorCountChange(count)}
              disabled={disabled || !customStyleEnabled}
            >
              {count} 色
            </button>
          ))}
        </div>

        <div className="subject-controls__color-list">
          {customStyleColors.slice(0, customStyleColorCount).map((color, index) => (
            <ColorStopEditor
              key={index}
              index={index}
              value={color}
              disabled={disabled || !customStyleEnabled}
              onChange={onCustomStyleColorChange}
            />
          ))}
        </div>
      </article>
    </div>
  );
}
