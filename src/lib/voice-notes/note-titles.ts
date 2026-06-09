/**
 * Voice Note Title Generation
 * 
 * Generates contextual, warm titles for voice notes based on:
 * - Time of day
 * - Relationship momentum
 * - Days since last contact
 * - Sender/recipient relationship
 */

export type NoteTitleCategory =
  | 'affectionate'
  | 'casual-checkin'
  | 'update'
  | 'celebration'
  | 'support'
  | 'spontaneous';

export interface NoteTitleContext {
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  daysSinceLastContact: number;
  relationshipMomentum?: 'growing' | 'stable' | 'needs_attention';
  friendCategory?: 'inner_circle' | 'village' | 'family' | 'acquaintance';
}

const NOTE_TITLES: Record<NoteTitleCategory, string[]> = {
  affectionate: [
    'Thinking of You',
    'Missing Your Voice',
    'Sending Love',
    'You Crossed My Mind',
    'Just Wanted to Say Hi',
    'Been Thinking About You',
  ],
  'casual-checkin': [
    'Quick Hello',
    'Just Checking In',
    'Catching Up',
    'Saying Hi',
    'How Are You?',
    'Long Time!',
  ],
  update: [
    'Life Update',
    'News to Share',
    'Something Happened',
    'Quick Story',
    'Guess What',
    'You Won\'t Believe This',
  ],
  celebration: [
    'Good News!',
    'Exciting Update',
    'Celebrating Together',
    'Big Win',
    'Something to Celebrate',
    'Great News',
  ],
  support: [
    'Thinking About You',
    'Here for You',
    'Sending Support',
    'Let\'s Talk',
    'Checking On You',
    'Wanted to Reach Out',
  ],
  spontaneous: [
    'Funny Story',
    'Random Thought',
    'Had to Tell You',
    'This Made Me Think of You',
    'Quick Voice Note',
    'Just Because',
  ],
};

/**
 * Select appropriate category based on context
 */
function selectCategory(context: NoteTitleContext): NoteTitleCategory {
  const { daysSinceLastContact, relationshipMomentum, friendCategory } = context;

  // Support for "needs attention" relationships
  if (relationshipMomentum === 'needs_attention' || daysSinceLastContact > 30) {
    return Math.random() > 0.5 ? 'support' : 'affectionate';
  }

  // Affectionate for close relationships
  if (friendCategory === 'inner_circle' || friendCategory === 'family') {
    if (daysSinceLastContact < 3) {
      return 'spontaneous';
    }
    if (daysSinceLastContact < 7) {
      return Math.random() > 0.5 ? 'casual-checkin' : 'affectionate';
    }
    return 'affectionate';
  }

  // More casual for village/acquaintances
  if (daysSinceLastContact < 7) {
    return 'casual-checkin';
  }

  if (daysSinceLastContact < 14) {
    return Math.random() > 0.5 ? 'casual-checkin' : 'update';
  }

  return 'casual-checkin';
}

/**
 * Generate a contextual note title
 */
export function generateNoteTitle(context: NoteTitleContext): string {
  const category = selectCategory(context);
  const titles = NOTE_TITLES[category];
  
  // Use a deterministic selection based on time to avoid regenerating
  // but still provide variety
  const seed = Date.now() % titles.length;
  return titles[seed];
}

/**
 * Get a random title from a specific category
 */
export function getRandomTitle(category: NoteTitleCategory): string {
  const titles = NOTE_TITLES[category];
  const index = Math.floor(Math.random() * titles.length);
  return titles[index];
}

/**
 * Get all available titles
 */
export function getAllTitles(): string[] {
  return Object.values(NOTE_TITLES).flat();
}

/**
 * Simple fallback titles when no context available
 */
export const DEFAULT_TITLES = [
  'A Voice Note',
  'Quick Message',
  'Voice Message',
  'Audio Note',
  'Listen When You Can',
];

export function getDefaultTitle(): string {
  return DEFAULT_TITLES[Math.floor(Math.random() * DEFAULT_TITLES.length)];
}
