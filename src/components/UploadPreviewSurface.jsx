import { useEffect, useRef } from 'react';

import GlassSurface from './GlassSurface';
import { renderAvatarPreview } from '../lib/image';

import './UploadPreviewSurface.css';

export default function UploadPreviewSurface({
  sourceImage,
  previewStyle,
  backgroundColor,
  pixelLevel,
  performanceTier,
  uiState,
  dragActive,
  onBrowse,
  subjectOpacity,
  customStyleEnabled,
  customStyleColorCount,
  customStyleColors
}) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!sourceImage || !canvasRef.current) {
      return;
    }

    renderAvatarPreview({
      canvas: canvasRef.current,
      image: sourceImage,
      style: previewStyle,
      backgroundColor,
      pixelLevel,
      subjectOpacity,
      customStyleEnabled,
      customStyleColorCount,
      customStyleColors
    });
  }, [
    backgroundColor,
    customStyleColorCount,
    customStyleColors,
    customStyleEnabled,
    pixelLevel,
    previewStyle,
    sourceImage,
    subjectOpacity
  ]);

  return (
    <GlassSurface
      width="100%"
      height={sourceImage ? 'auto' : 'min(76vw, 34rem)'}
      borderRadius={34}
      brightness={68}
      opacity={0.84}
      blur={14}
      backgroundOpacity={0.08}
      saturation={1.2}
      displace={0.6}
      performanceTier={performanceTier}
      className={`upload-surface ${dragActive ? 'is-dragging' : ''} ${sourceImage ? 'is-ready' : ''}`}
    >
      {!sourceImage ? (
        <button
          type="button"
          className={`upload-surface__empty ${uiState === 'error' ? 'is-error' : ''}`}
          onClick={onBrowse}
        >
          <span className="upload-surface__kicker">DROP OR BROWSE</span>
          <strong>把图片拖到这里，或者点一下上传</strong>
          <p>支持 JPG / JPEG / PNG。整页都能接收拖拽，但视觉反馈只会聚焦在这里。</p>
        </button>
      ) : (
        <div className="upload-surface__ready">
          <div className="upload-surface__canvas-frame">
            <canvas ref={canvasRef} className="upload-surface__canvas" />
          </div>

          <div className="upload-surface__overlay">
            <div>
              <span className="upload-surface__kicker">LIVE PREVIEW</span>
              <strong>{customStyleEnabled ? '当前输出已切换为自定义风格' : '当前预览就是最终导出结果'}</strong>
              <p>{customStyleEnabled ? '顶部 6 个固定风格保持不变，自定义模块只接管这里和导出。' : '下方控制区调像素颗粒度，中间模块调主体透明度和自定义风格。'}</p>
            </div>
            <button type="button" className="upload-surface__reupload" onClick={onBrowse}>
              重新上传
            </button>
          </div>
        </div>
      )}
    </GlassSurface>
  );
}
