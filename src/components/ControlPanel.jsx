import { STYLE_OPTIONS } from '../lib/constants';

import './ControlPanel.css';

export default function ControlPanel({
  sourceFile,
  sourceImage,
  previewStyle,
  customStyleEnabled,
  onBrowse,
  onDownload
}) {
  const currentStyle = STYLE_OPTIONS.find(style => style.id === previewStyle);

  return (
    <div className="control-panel control-panel--compact">
      <article className="control-panel__card">
        <p className="control-panel__eyebrow">CURRENT OUTPUT</p>
        <h3>{customStyleEnabled ? '自定义风格已接管主预览' : `${currentStyle?.label || '普通'} 风格正在生效`}</h3>
        <p>
          {customStyleEnabled
            ? '中间主预览下方的自定义风格模块已经覆盖当前固定风格，导出也会使用这套结果。'
            : currentStyle?.description}
        </p>
        <p className="control-panel__hint">顶部固定风格带始终只显示 6 个风格，不会出现自定义风格卡片。</p>
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
