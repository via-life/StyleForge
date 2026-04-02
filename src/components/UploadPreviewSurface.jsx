/*
import { useEffect, useRef } from 'react';

import GlassSurface from './GlassSurface';
import { renderAvatarPreview } from '../lib/image';

import './UploadPreviewSurface.css';

export default function UploadPreviewSurface({
  sourceImage,
  cropRect,
  previewStyle,
  backgroundColor,
  uiState,
  dragActive,
  onBrowse,
  onPan
}) {
  const canvasRef = useRef(null);
  const dragStateRef = useRef(null);

  useEffect(() => {
    if (!sourceImage || !cropRect || !canvasRef.current) {
      return;
    }

    renderAvatarPreview({
      canvas: canvasRef.current,
      image: sourceImage,
      cropRect,
      style: previewStyle,
      backgroundColor
    });
  }, [backgroundColor, cropRect, previewStyle, sourceImage]);

  const handlePointerDown = event => {
    if (!sourceImage || !cropRect) {
      return;
    }

    const surfaceSize = canvasRef.current?.getBoundingClientRect().width || 1;
    dragStateRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      surfaceSize
    };

    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = event => {
    if (!dragStateRef.current || dragStateRef.current.pointerId !== event.pointerId) {
      return;
    }

    const deltaX = event.clientX - dragStateRef.current.startX;
    const deltaY = event.clientY - dragStateRef.current.startY;

    dragStateRef.current.startX = event.clientX;
    dragStateRef.current.startY = event.clientY;
    onPan({
      deltaX,
      deltaY,
      surfaceSize: dragStateRef.current.surfaceSize
    });
  };

  const handlePointerUp = event => {
    if (dragStateRef.current?.pointerId === event.pointerId) {
      dragStateRef.current = null;
    }
  };

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
            <canvas
              ref={canvasRef}
              className="upload-surface__canvas"
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
            />
          </div>

          <div className="upload-surface__overlay">
            <div>
              <span className="upload-surface__kicker">LIVE PREVIEW</span>
              <strong>拖动画面微调构图，缩放条在下方控制区</strong>
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
*/

import { useEffect, useRef } from 'react';

import GlassSurface from './GlassSurface';
import { renderAvatarPreview } from '../lib/image';

import './UploadPreviewSurface.css';

export default function UploadPreviewSurface({
  sourceImage,
  previewStyle,
  backgroundColor,
  pixelLevel,
  uiState,
  dragActive,
  onBrowse
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
      pixelLevel
    });
  }, [backgroundColor, pixelLevel, previewStyle, sourceImage]);

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
              <strong>当前预览就是最终导出结果，下方滑杆只控制像素颗粒度</strong>
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
