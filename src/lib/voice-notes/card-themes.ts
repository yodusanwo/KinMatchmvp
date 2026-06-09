/**
 * Voice Note Card Theme System
 * 
 * Creates visual variety and personalization for voice note preview cards.
 * Each friendship gets a consistent theme to build recognition and warmth.
 */

export type ThemeId = 
  | 'sunrise' | 'golden-hour' | 'terracotta' | 'honey' | 'coral'
  | 'sage-garden' | 'ocean-mist' | 'lavender-fields' | 'mint-fresh' | 'sky-blue'
  | 'latte' | 'stone' | 'canvas' | 'driftwood' | 'parchment'
  | 'citrus' | 'berry' | 'meadow' | 'sunset' | 'autumn';

export interface ThemeColors {
  background: string;
  backgroundSecondary: string;
  textPrimary: string;
  textSecondary: string;
  accent: string;
  accentDark: string;
}

export interface CardTheme {
  id: ThemeId;
  name: string;
  colors: ThemeColors;
  iconType: 'sunflower' | 'heart' | 'leaf' | 'wave' | 'star' | 'moon' | 'sun' | 'flower';
}

export const CARD_THEMES: Record<ThemeId, CardTheme> = {
  // Warm Themes
  'sunrise': {
    id: 'sunrise',
    name: 'Sunrise',
    colors: {
      background: '#FFE5D4',
      backgroundSecondary: '#FFD4B8',
      textPrimary: '#3D2817',
      textSecondary: '#6B4E37',
      accent: '#FF8C42',
      accentDark: '#E67332',
    },
    iconType: 'sun',
  },
  'golden-hour': {
    id: 'golden-hour',
    name: 'Golden Hour',
    colors: {
      background: '#FFF4E0',
      backgroundSecondary: '#FFE9C5',
      textPrimary: '#3D3420',
      textSecondary: '#6B5D3F',
      accent: '#F5C56E',
      accentDark: '#DBA857',
    },
    iconType: 'sunflower',
  },
  'terracotta': {
    id: 'terracotta',
    name: 'Terracotta',
    colors: {
      background: '#F2EAD9',
      backgroundSecondary: '#EBE0C9',
      textPrimary: '#1F1A14',
      textSecondary: '#463C2E',
      accent: '#B65232',
      accentDark: '#8E3D22',
    },
    iconType: 'heart',
  },
  'honey': {
    id: 'honey',
    name: 'Honey',
    colors: {
      background: '#FFF8E7',
      backgroundSecondary: '#FFEEC2',
      textPrimary: '#3D2F17',
      textSecondary: '#6B5437',
      accent: '#E8D494',
      accentDark: '#C8B474',
    },
    iconType: 'sun',
  },
  'coral': {
    id: 'coral',
    name: 'Coral',
    colors: {
      background: '#FFE8E0',
      backgroundSecondary: '#FFD4C8',
      textPrimary: '#3D1F1A',
      textSecondary: '#6B3F37',
      accent: '#FF9B82',
      accentDark: '#E67D64',
    },
    iconType: 'heart',
  },

  // Cool Themes
  'sage-garden': {
    id: 'sage-garden',
    name: 'Sage Garden',
    colors: {
      background: '#E8EFEA',
      backgroundSecondary: '#D5E0D5',
      textPrimary: '#1F2D20',
      textSecondary: '#3F5440',
      accent: '#6B7A5C',
      accentDark: '#556146',
    },
    iconType: 'leaf',
  },
  'ocean-mist': {
    id: 'ocean-mist',
    name: 'Ocean Mist',
    colors: {
      background: '#E5F3F5',
      backgroundSecondary: '#D0E7EA',
      textPrimary: '#1A2D30',
      textSecondary: '#37545A',
      accent: '#7DBED3',
      accentDark: '#609CB0',
    },
    iconType: 'wave',
  },
  'lavender-fields': {
    id: 'lavender-fields',
    name: 'Lavender Fields',
    colors: {
      background: '#F0E8F5',
      backgroundSecondary: '#E5D4EA',
      textPrimary: '#2D1A30',
      textSecondary: '#54375A',
      accent: '#B08FC7',
      accentDark: '#9070A5',
    },
    iconType: 'star',
  },
  'mint-fresh': {
    id: 'mint-fresh',
    name: 'Mint Fresh',
    colors: {
      background: '#E8F5F0',
      backgroundSecondary: '#D4EAE0',
      textPrimary: '#1A302D',
      textSecondary: '#375A54',
      accent: '#7DC7AC',
      accentDark: '#60A58A',
    },
    iconType: 'leaf',
  },
  'sky-blue': {
    id: 'sky-blue',
    name: 'Sky Blue',
    colors: {
      background: '#E5F0FF',
      backgroundSecondary: '#D0E5FF',
      textPrimary: '#1A2630',
      textSecondary: '#374F5A',
      accent: '#7DB1E5',
      accentDark: '#6090C2',
    },
    iconType: 'wave',
  },

  // Neutral Elegant
  'latte': {
    id: 'latte',
    name: 'Latte',
    colors: {
      background: '#F5F0E8',
      backgroundSecondary: '#EAE0D4',
      textPrimary: '#2D2520',
      textSecondary: '#544A40',
      accent: '#A0826D',
      accentDark: '#806554',
    },
    iconType: 'moon',
  },
  'stone': {
    id: 'stone',
    name: 'Stone',
    colors: {
      background: '#EEEAE5',
      backgroundSecondary: '#E0D8D0',
      textPrimary: '#2A2520',
      textSecondary: '#524A40',
      accent: '#9B8F7E',
      accentDark: '#7D7165',
    },
    iconType: 'moon',
  },
  'canvas': {
    id: 'canvas',
    name: 'Canvas',
    colors: {
      background: '#FAF8F5',
      backgroundSecondary: '#F0EBE5',
      textPrimary: '#2A2520',
      textSecondary: '#524A40',
      accent: '#C8B8A0',
      accentDark: '#A89680',
    },
    iconType: 'flower',
  },
  'driftwood': {
    id: 'driftwood',
    name: 'Driftwood',
    colors: {
      background: '#EBE8E2',
      backgroundSecondary: '#DDD8CF',
      textPrimary: '#2A2823',
      textSecondary: '#52514A',
      accent: '#9B968A',
      accentDark: '#7D786C',
    },
    iconType: 'moon',
  },
  'parchment': {
    id: 'parchment',
    name: 'Parchment',
    colors: {
      background: '#F8F4E8',
      backgroundSecondary: '#EDE5D4',
      textPrimary: '#2D2820',
      textSecondary: '#544F40',
      accent: '#C8B896',
      accentDark: '#A89676',
    },
    iconType: 'flower',
  },

  // Vibrant Friendly
  'citrus': {
    id: 'citrus',
    name: 'Citrus',
    colors: {
      background: '#FFF5E0',
      backgroundSecondary: '#FFE8C2',
      textPrimary: '#3D2F17',
      textSecondary: '#6B5437',
      accent: '#FFB84D',
      accentDark: '#E69933',
    },
    iconType: 'sun',
  },
  'berry': {
    id: 'berry',
    name: 'Berry',
    colors: {
      background: '#FFE8F0',
      backgroundSecondary: '#FFD4E5',
      textPrimary: '#3D1A2D',
      textSecondary: '#6B3754',
      accent: '#D6608C',
      accentDark: '#B54870',
    },
    iconType: 'heart',
  },
  'meadow': {
    id: 'meadow',
    name: 'Meadow',
    colors: {
      background: '#E8F5E0',
      backgroundSecondary: '#D4EAC2',
      textPrimary: '#1F2D17',
      textSecondary: '#3F5437',
      accent: '#7DC754',
      accentDark: '#60A540',
    },
    iconType: 'leaf',
  },
  'sunset': {
    id: 'sunset',
    name: 'Sunset',
    colors: {
      background: '#FFE5F0',
      backgroundSecondary: '#FFD0E0',
      textPrimary: '#3D1F2D',
      textSecondary: '#6B3F54',
      accent: '#E57BA0',
      accentDark: '#C55D80',
    },
    iconType: 'star',
  },
  'autumn': {
    id: 'autumn',
    name: 'Autumn',
    colors: {
      background: '#F5E8D4',
      backgroundSecondary: '#EAD4B8',
      textPrimary: '#2D2017',
      textSecondary: '#543F37',
      accent: '#C68F3E',
      accentDark: '#A67028',
    },
    iconType: 'leaf',
  },
};

// Get all theme IDs
export const THEME_IDS: ThemeId[] = Object.keys(CARD_THEMES) as ThemeId[];

/**
 * Get a consistent theme for a friendship pair
 */
export function getFriendshipTheme(userId: string, friendId: string): CardTheme {
  // Create a deterministic hash from the friendship pair
  const pairString = [userId, friendId].sort().join('-');
  let hash = 0;
  for (let i = 0; i < pairString.length; i++) {
    const char = pairString.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  const index = Math.abs(hash) % THEME_IDS.length;
  const themeId = THEME_IDS[index];
  return CARD_THEMES[themeId];
}

/**
 * Get theme by ID
 */
export function getThemeById(themeId: ThemeId): CardTheme {
  return CARD_THEMES[themeId];
}
