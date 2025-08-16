// Curated catalog of categories and brands used across the app
// Keep in sync with backend normalization rules
export const CATALOG = [
  {
    category: 'Biscuits Pack',
    icon: '🍪',
    brands: ['Britannia', 'Sunfeast', 'Parle'],
    synonyms: ['biscuit', 'biscuits', 'cookie', 'cookies']
  },
  {
    category: 'Noodles Pack',
    icon: '🍜',
    brands: ['Maggi', 'Top Ramen', 'Yippee!'],
    synonyms: ['noodle', 'noodles', 'instant']
  },
  {
    category: 'Chips Pack',
    icon: '🍟',
    brands: ['Lays', 'Bingo!', 'Haldiram’s'],
    synonyms: ['chips', 'namkeen', 'snack']
  },
  {
    category: 'Chocolate / Candy Pack',
    icon: '🍫',
    brands: ['Nestlé (KitKat, Munch)', 'Cadbury', 'Amul'],
    synonyms: ['chocolate', 'candy', 'sweet', 'confectionery', 'kitkat', 'munch', 'nestle', 'nestlé']
  },
  {
    category: 'Juice / Tetra Pack',
    icon: '🧃',
    brands: ['Real', 'Tropicana', 'Frooti / Appy'],
    synonyms: ['juice', 'tetra', 'box', 'frooti', 'appy']
  }
];

export const CATEGORY_OPTIONS = CATALOG.map(c => ({ value: c.category, label: `${c.icon} ${c.category}` }));

export function getBrandsForCategory(category) {
  const entry = CATALOG.find(c => c.category === category);
  return entry ? entry.brands : [];
}