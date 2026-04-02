export const STYLE_OPTIONS = [
  {
    id: 'normal',
    label: '普通',
    description: '接近原图的干净像素化，颜色保真，适合稳妥头像。'
  },
  {
    id: 'fresh',
    label: '清新',
    description: '提亮、降硬对比，带一点青绿色空气感。'
  },
  {
    id: 'cyber',
    label: '赛博',
    description: '高反差冷暖分离，带电感霓虹边缘。'
  },
  {
    id: 'dopamine',
    label: '多巴胺',
    description: '高饱和、高明度，偏向抖音式活跃撞色。'
  },
  {
    id: 'dark',
    label: '暗黑',
    description: '整体压暗冷调，保留高光与轮廓。'
  }
];

export const DEFAULT_STYLE_ID = STYLE_OPTIONS[0].id;

export const BACKGROUND_OPTIONS = [
  { label: '透明', value: 'transparent' },
  { label: '浅青', value: '#E6F7FF' },
  { label: '浅紫', value: '#F0F0FF' },
  { label: '浅粉', value: '#FF99AA' },
  { label: '纯白', value: '#FFFFFF' },
  { label: '黑灰', value: '#333333' }
];

export const PIXEL_LEVELS = [512, 256, 128, 64, 32, 16, 8, 5];
export const DEFAULT_PIXEL_LEVEL = PIXEL_LEVELS[0];

export const EXPORT_SIZE = 512;

export const GITHUB_URL = 'https://github.com/via-life/StyleForge';
