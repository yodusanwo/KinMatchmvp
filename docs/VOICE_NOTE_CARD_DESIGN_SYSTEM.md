# KinMatch Voice Note Card Design System

## Philosophy: Digital Friendship Postcards

Each voice note should feel like receiving a personalized postcard from a friend, not a generic audio file. The card system creates visual consistency within each friendship while maintaining variety across different relationships.

---

## Design Principles

1. **Friendship Identity**: Each friendship gets a consistent visual theme
2. **Emotional Resonance**: Warm, inviting, personal
3. **Contextual Variety**: Note titles and relationship status add meaning
4. **Accessibility First**: High contrast, readable typography
5. **Mobile-Optimized**: Looks beautiful in iMessage/WhatsApp previews

---

## Card Anatomy

```
┌─────────────────────────────────────────┐
│ [Pattern/Texture Background]            │
│                                          │
│  [Icon/Illustration]                     │
│                                          │
│  "Note Title"                            │
│  A voice note from [Name]                │
│                                          │
│  [Relationship Indicator]                │
│                                          │
│  Tap to listen · KinMatch        [Logo] │
└─────────────────────────────────────────┘
```

---

## Theme System (20 Variations)

### Warm Themes
1. **Sunrise** - Peachy orange gradients, morning warmth
2. **Golden Hour** - Soft yellows and warm creams
3. **Terracotta** - Earthy reds and sandy beiges
4. **Honey** - Amber and warm gold tones
5. **Coral** - Soft coral with cream accents

### Cool Themes
6. **Sage Garden** - Muted greens and soft grays
7. **Ocean Mist** - Soft blues and seafoam
8. **Lavender Fields** - Gentle purples and grays
9. **Mint Fresh** - Light mint with white
10. **Sky Blue** - Soft azure and cloud white

### Neutral Elegant
11. **Latte** - Coffee browns and cream
12. **Stone** - Warm grays and taupe
13. **Canvas** - Natural beige and off-white
14. **Driftwood** - Gray-brown and sand
15. **Parchment** - Aged paper tones

### Vibrant Friendly
16. **Citrus** - Bright orange and yellow
17. **Berry** - Deep red with soft pink
18. **Meadow** - Fresh grass green
19. **Sunset** - Purple-orange gradient
20. **Autumn** - Rust, gold, and brown

---

## Note Title System

AI-generated titles based on context, time of day, relationship momentum:

### Affectionate
- "Thinking of You"
- "Missing Your Voice"
- "Sending Love"
- "You Crossed My Mind"

### Casual Check-In
- "Quick Hello"
- "Just Checking In"
- "Catching Up"
- "Saying Hi"

### Updates
- "Life Update"
- "News to Share"
- "Something Happened"
- "Quick Story"

### Celebration
- "Good News!"
- "Exciting Update"
- "Celebrating Together"
- "Big Win"

### Support
- "Thinking About You"
- "Here for You"
- "Sending Support"
- "Let's Talk"

### Spontaneous
- "Funny Story"
- "Random Thought"
- "Had to Tell You"
- "This Made Me Think of You"

---

## Relationship Indicators

Visual badges that appear on cards:

- 🌱 **Growing** - Green leaf, "Friendship growing"
- 💚 **Stable** - Soft green heart, "Staying connected"
- 🔔 **Needs Attention** - Gentle amber bell, "Been a while"

---

## Pattern Library

### Subtle Textures
1. **Paper Grain** - Subtle noise texture
2. **Watercolor Wash** - Soft gradient bleed
3. **Linen** - Fabric-like texture
4. **Speckled** - Tiny dots scattered
5. **Brushstroke** - Horizontal soft strokes

### Organic Shapes
6. **Leaves** - Simple botanical silhouettes
7. **Waves** - Gentle curved lines
8. **Clouds** - Soft rounded shapes
9. **Hills** - Rolling landscape curves
10. **Petals** - Flower-inspired shapes

---

## Icon/Illustration System

Each theme gets a unique central icon (similar to current implementation but themed):

- **Sunflower** (Sunrise, Golden Hour)
- **Heart** (Terracotta, Coral, Berry)
- **Leaf** (Sage Garden, Meadow, Autumn)
- **Wave** (Ocean Mist, Sky Blue)
- **Star** (Lavender, Citrus)
- **Moon** (Stone, Driftwood)
- **Sun** (Honey, Sunset)
- **Flower** (Mint, Parchment)

---

## Typography System

```css
/* Note Title */
font-size: 32px
font-weight: 600
line-height: 1.2
font-family: Instrument Sans

/* Sender Name */
font-size: 56px
font-weight: 500
line-height: 1.1
font-family: Instrument Sans

/* Subtitle */
font-size: 18px
font-weight: 400
font-style: italic
line-height: 1.4
font-family: Inter

/* Footer Text */
font-size: 20px
font-weight: 400
font-family: Inter
```

---

## Implementation Architecture

### 1. Database Schema

```typescript
// Add to voice_notes table
interface VoiceNote {
  // ... existing fields
  note_title?: string;        // AI-generated title
  theme_id?: string;          // Assigned theme (consistent per friendship)
  relationship_status?: 'growing' | 'stable' | 'needs_attention';
}

// New table: friendship_themes
interface FriendshipTheme {
  user_id: uuid;
  friend_id: uuid;
  theme_id: string;           // One of 20 theme variants
  assigned_at: timestamp;
  primary key (user_id, friend_id);
}
```

### 2. Theme Selection Logic

```typescript
// Deterministic theme selection per friendship
function getFriendshipTheme(userId: string, friendId: string): ThemeId {
  // Hash the friendship pair to get consistent theme
  const hash = hashString(`${userId}-${friendId}`);
  const themes = ['sunrise', 'golden-hour', 'terracotta', ...];
  return themes[hash % themes.length];
}
```

### 3. Note Title Generation

```typescript
// AI-powered title generation
async function generateNoteTitle(context: {
  senderName: string;
  friendshipMomentum: 'growing' | 'stable' | 'needs_attention';
  timeOfDay: 'morning' | 'afternoon' | 'evening';
  daysSinceLastContact: number;
}): Promise<string> {
  // Use Gemini to generate contextual title
  // Fallback to template-based selection
}
```

### 4. Component Structure

```typescript
// OG Image Component
<VoiceNoteCard
  theme={theme}
  noteTitle={noteTitle}
  senderName={senderName}
  relationshipStatus={relationshipStatus}
  pattern={pattern}
  icon={icon}
/>
```

---

## Mobile Preview Optimization

### iMessage Preview (iOS)
- Dimensions: 1200x630px (OG image standard)
- Safe zone: 80px padding all sides
- Text contrast: WCAG AA minimum (4.5:1)

### WhatsApp Preview (Android/iOS)
- Same dimensions work well
- Ensure key text is in top 60% of image

---

## Accessibility Standards

- **Color Contrast**: All text at least 4.5:1 ratio
- **Font Size**: Minimum 18px for body text
- **Pattern Opacity**: Background patterns at 10-20% opacity
- **Alternative Text**: Include descriptive alt text

---

## Next Steps for Implementation

1. ✅ Create theme constants and color palettes
2. ✅ Build theme selection utility
3. ✅ Update OG image route with theme support
4. ⏳ Add database columns for theme and title
5. ⏳ Integrate AI title generation
6. ⏳ Add relationship status indicators
7. ⏳ Create pattern/texture library
8. ⏳ Build theme preview gallery

---

## Example Card Mockups

See implementation in `/src/app/api/og/voice-note/[shareToken]/route.tsx`

Each theme creates a unique visual identity while maintaining:
- Brand consistency (KinMatch logo and style)
- Readability (high contrast text)
- Emotional warmth (inviting color palettes)
- Personal touch (consistent per friendship)
