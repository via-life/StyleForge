export const STYLE_OPTIONS = [
  {
    id: 'normal',
    label: '普通',
    description: '接近原图的干净像素头像，颜色保真，适合稳妥输出。'
  },
  {
    id: 'fresh',
    label: '清新',
    description: '提亮并降低硬对比，带一点青绿色空气感。'
  },
  {
    id: 'cyber',
    label: '赛博',
    description: '高对比冷暖分离，偏霓虹电感和冷光边缘。'
  },
  {
    id: 'dopamine',
    label: '多巴胺',
    description: '高饱和、高明度，偏社交媒体常见的活跃撞色。'
  },
  {
    id: 'dark',
    label: '暗黑',
    description: '整体压暗偏冷，保留高光和轮廓，氛围更沉。'
  },
  {
    id: 'glass',
    label: '玻璃',
    description: '借鉴 Liquid Glass 的半透明高光、冷白折射和柔和镜面感。'
  }
];

export const DEFAULT_STYLE_ID = STYLE_OPTIONS[0].id;

export const BACKGROUND_OPTIONS = [
  { label: '透明', value: 'transparent' },
  { label: '浅青', value: '#E6F7FF' },
  { label: '浅紫', value: '#F0F0FF' },
  { label: '浅粉', value: '#FFD7E6' },
  { label: '纯白', value: '#FFFFFF' },
  { label: '黑灰', value: '#333333' }
];

export const PIXEL_LEVELS = [512, 256, 128, 64, 32, 16, 8, 5];
export const DEFAULT_PIXEL_LEVEL = PIXEL_LEVELS[0];

export const DEFAULT_SUBJECT_OPACITY = 100;
export const DEFAULT_BACKGROUND_MODE = 'preset';
export const DEFAULT_CUSTOM_BACKGROUND = '#BFE5FF';
export const DEFAULT_CUSTOM_STYLE_COLOR_COUNT = 2;
export const DEFAULT_CUSTOM_STYLE_COLORS = ['#6FD2FF', '#9AF3D0', '#FFFFFF'];

export const EXPORT_SIZE = 512;

export const GITHUB_URL = 'https://github.com/via-life/StyleForge';
