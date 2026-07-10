// -*- coding: utf-8 -*-
// -*- Python Version: 2.7 -*- (Simulated Python environment / JS context compatibility)

/**
 * Couture AI Cost-Saving Offline Cache Lookup Service
 *
 * Algorithmically matches user-selected options (materials, palettes, garments, aesthetics, sizes)
 * to a cost-saving library of 2,000 pre-generated combinations (couture_0001 to couture_2000).
 * Bypasses live Gemini API generation charges for free tier users.
 */

export const CACHED_MATERIALS = [
  'Mulberry Silk',
  'Selvedge Denim',
  'Graphene Mesh',
  'Merino Wool',
  'Silk & Satin',
  'Structured Denim',
  'Heavy Leather'
];

export const CACHED_PALETTES = [
  'Monochrome Brutalism',
  'Earth Tones',
  'Pastel Dream',
  'Neon Cyber'
];

export const CACHED_GARMENTS = [
  'oversized hoodie',
  'structured blazer',
  'flowing maxi dress',
  'tailored jumpsuit',
  'asymmetric skirt',
  'cropped jacket',
  'deconstructed shirt',
  'floor-length coat',
  'slip dress',
  'cargo pants',
  'corset top',
  'trench coat'
];

export const CACHED_AESTHETICS = [
  'Minimalist Brutalism',
  'Futuristic Gorpcore',
  'Ethereal Avant-Garde',
  '90s Archival Grunge',
  'Cyberpunk Techwear'
];

export const CACHED_SIZES = ['XS', 'M', 'L', '3XL'];

export const SEASONAL_GARMENTS: Record<string, string[]> = {
  'Spring': ['translucent rain trench', 'floral-appliqué midi dress'],
  'Summer': ['breezy linen shorts set', 'backless silk romper'],
  'Autumn': ['leather-trimmed knit cardigan', 'asymmetric wool poncho'],
  'Winter': ['quilted oversized parka', 'double-layered wool cape']
};

export const REMIX_STYLES = [
  'color-inverted negative',
  'minimalist deconstructed',
  'maximalist embellished',
  'athleisure reinterpretation',
  'haute couture runway',
  'streetwear casual',
  'vintage retro',
  'futuristic sci-fi',
  'sustainable eco',
  'gender-neutral androgynous'
];

// Beautiful high-end fashion fallback images to represent different categories beautifully when caching is enabled
const FALLBACK_IMAGES: Record<string, string> = {
  'oversized hoodie': 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&q=80&w=800&h=1000',
  'structured blazer': 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&q=80&w=800&h=1000',
  'flowing maxi dress': 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&q=80&w=800&h=1000',
  'tailored jumpsuit': 'https://images.unsplash.com/photo-1485968579580-b6d095142e6e?auto=format&fit=crop&q=80&w=800&h=1000',
  'asymmetric skirt': 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&q=80&w=800&h=1000',
  'cropped jacket': 'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&q=80&w=800&h=1000',
  'deconstructed shirt': 'https://images.unsplash.com/photo-1598033129183-c4f50c736f10?auto=format&fit=crop&q=80&w=800&h=1000',
  'floor-length coat': 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=800&h=1000',
  'slip dress': 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&q=80&w=800&h=1000',
  'cargo pants': 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&q=80&w=800&h=1000',
  'corset top': 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&q=80&w=800&h=1000',
  'trench coat': 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&q=80&w=800&h=1000',
  // Materials Fallbacks
  'Mulberry Silk': 'https://images.unsplash.com/photo-1528459801416-a9e53bbf4e17?auto=format&fit=crop&q=80&w=800&h=1000',
  'Selvedge Denim': 'https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&q=80&w=800&h=1000',
  'Graphene Mesh': 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=800&h=1000',
  'Merino Wool': 'https://images.unsplash.com/photo-1574169208507-84376144848b?auto=format&fit=crop&q=80&w=800&h=1000',
  'Silk & Satin': 'https://images.unsplash.com/photo-1492707892479-7bc8d5a4ee93?auto=format&fit=crop&q=80&w=800&h=1000',
  'Structured Denim': 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&q=80&w=800&h=1000',
  'Heavy Leather': 'https://images.unsplash.com/photo-1568252542512-9fe8fe9c87bb?auto=format&fit=crop&q=80&w=800&h=1000'
};

export interface MatchResult {
  id: string;
  imageUrl: string;
  fallbackUrl: string;
  msg: string;
}

/**
 * Searches the pre-computed 2,000 lookbook combinations and returns the matched cache metadata.
 */
export function matchLookbookCache(params: {
  material: string;
  palette: string;
  garment?: string;
  aesthetic?: string;
  size?: string;
  promptText?: string;
}): MatchResult | null {
  const normalizedMaterial = params.material.trim();
  const normalizedPalette = params.palette.trim();
  const promptLower = (params.promptText || '').toLowerCase();

  // Find material index
  let mIndex = CACHED_MATERIALS.findIndex(m => m.toLowerCase() === normalizedMaterial.toLowerCase());
  if (mIndex === -1) {
    // Attempt fuzzy match from prompt text or selection
    mIndex = CACHED_MATERIALS.findIndex(m => lowerIncludes(params.promptText, m) || lowerPromptContains(normalizedMaterial, m));
    if (mIndex === -1) mIndex = 0; // default to Mulberry Silk
  }

  // Find palette index
  let pIndex = CACHED_PALETTES.findIndex(p => p.toLowerCase() === normalizedPalette.toLowerCase());
  if (pIndex === -1) {
    const foundPIndex = CACHED_PALETTES.findIndex(p => lowerPromptIncludes(params.promptText, p));
    pIndex = foundPIndex !== -1 ? foundPIndex : 0;
  }

  // Determine sub-flow
  // 1. Editorial Exclusive (1955 - 2000)
  if (promptLower.includes('editorial exclusive') || promptLower.includes('met gala') || promptLower.includes('paris fashion week') || promptLower.includes('runway') || promptLower.includes('exclusive')) {
    // Matches the 46 exclusive entries based on keyword similarity
    const keywordMatches = [
      { id: 1955, keywords: ['met gala', 'gown'] },
      { id: 1956, keywords: ['paris', 'runway', 'coat'] },
      { id: 1957, keywords: ['milan', 'power suit', 'blazer'] },
      { id: 1958, keywords: ['tokyo', 'street style', 'hoodie'] },
      { id: 1959, keywords: ['london', 'avant-garde', 'shirt'] },
      { id: 1960, keywords: ['new york', 'minimalist', 'jumpsuit'] },
      { id: 1961, keywords: ['cannes', 'premiere', 'maxi dress'] },
      { id: 1962, keywords: ['berlin', 'techno', 'cropped'] },
      { id: 1963, keywords: ['seoul', 'street', 'skirt'] },
      { id: 1964, keywords: ['lagos', 'corset'] },
      { id: 1965, keywords: ['mumbai', 'bridal', 'slip'] },
      { id: 1966, keywords: ['carnival', 'cargo'] },
      { id: 1967, keywords: ['dubai', 'trench'] },
      { id: 1968, keywords: ['sydney', 'beach'] },
      { id: 1969, keywords: ['stockholm', 'scandinavian'] },
      { id: 1970, keywords: ['copenhagen'] },
      { id: 1971, keywords: ['accra', 'textile'] },
      { id: 1972, keywords: ['nairobi', 'innovation'] },
      { id: 1973, keywords: ['moscow', 'winter'] },
      { id: 1974, keywords: ['shanghai', 'neon'] },
      { id: 1975, keywords: ['beijing', 'imperial'] },
      { id: 1976, keywords: ['istanbul', 'bazaar'] },
      { id: 1977, keywords: ['marrakech', 'desert'] },
      { id: 1978, keywords: ['cairo', 'pyramid'] },
      { id: 1979, keywords: ['cape town'] },
      { id: 1980, keywords: ['johannesburg'] },
      { id: 1981, keywords: ['bangkok'] },
      { id: 1982, keywords: ['hanoi'] },
      { id: 1983, keywords: ['singapore'] },
      { id: 1984, keywords: ['kuala lumpur'] },
      { id: 1985, keywords: ['manila'] },
      { id: 1986, keywords: ['jakarta'] },
      { id: 1987, keywords: ['taipei'] },
      { id: 1988, keywords: ['hong kong'] },
      { id: 1989, keywords: ['osaka'] },
      { id: 1990, keywords: ['buenos aires'] },
      { id: 1991, keywords: ['mexico city'] },
      { id: 1992, keywords: ['rio de janeiro'] },
      { id: 1993, keywords: ['lima', 'inca'] },
      { id: 1994, keywords: ['bogota'] },
      { id: 1995, keywords: ['vienna'] },
      { id: 1996, keywords: ['prague'] },
      { id: 1997, keywords: ['budapest'] },
      { id: 1998, keywords: ['warsaw'] },
      { id: 1999, keywords: ['lisbon', 'tile'] }
    ];

    const match = keywordMatches.find(entry => entry.keywords.some(k => promptLower.includes(k)));
    const matchedId = match ? match.id : 1955 + (mIndex + pIndex) % 45;
    const formattedId = `couture_${String(matchedId).padStart(4, '0')}`;
    const garmentFallback = params.garment || 'structured blazer';

    return {
      id: formattedId,
      imageUrl: `/cache/${formattedId}.jpg`,
      fallbackUrl: FALLBACK_IMAGES[garmentFallback] || FALLBACK_IMAGES['structured blazer'],
      msg: `Exclusive Atelier Match: Loaded Editorial lookbook exclusive #${matchedId} (${CACHED_MATERIALS[mIndex]} under ${CACHED_PALETTES[pIndex]}).`
    };
  }

  // 2. Virtual Try-On (1945 - 1954)
  if (promptLower.includes('model') || promptLower.includes('try-on') || promptLower.includes('wearing') || promptLower.includes('showcase')) {
    const models = ['East Asian', 'West African', 'Northern European', 'South Asian', 'Latin American'];
    let modelIdx = models.findIndex(m => promptLower.includes(m.toLowerCase()));
    if (modelIdx === -1) modelIdx = (mIndex + pIndex) % 5;

    const matchedId = 1945 + modelIdx * 2 + (pIndex % 2);
    const formattedId = `couture_${String(matchedId).padStart(4, '0')}`;
    
    return {
      id: formattedId,
      imageUrl: `/cache/${formattedId}.jpg`,
      fallbackUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=800&h=1000',
      msg: `Virtual Try-On Cache Match: Loaded ${models[modelIdx]} model showcase couture asset #${matchedId}.`
    };
  }

  // 3. Remix Variations (1905 - 1944)
  let rStyleIdx = REMIX_STYLES.findIndex(style => promptLower.includes(style) || promptLower.includes(style.split(' ')[0]));
  if (rStyleIdx !== -1 || promptLower.includes('remix') || promptLower.includes('inverted') || promptLower.includes('deconstructed')) {
    if (rStyleIdx === -1) rStyleIdx = 0; // Default to negative inverted
    
    // Find matching offset within the 4 slots of this style index
    const baseOffset = rStyleIdx * 4;
    let bestJ = 0;
    for (let j = 0; j < 4; j++) {
      if ((baseOffset + j) % 4 === pIndex) {
        bestJ = j;
        break;
      }
    }
    const matchedId = 1905 + baseOffset + bestJ;
    const formattedId = `couture_${String(matchedId).padStart(4, '0')}`;
    const garmentFallback = params.garment || 'cropped jacket';

    return {
      id: formattedId,
      imageUrl: `/cache/${formattedId}.jpg`,
      fallbackUrl: FALLBACK_IMAGES[garmentFallback] || FALLBACK_IMAGES['cropped jacket'],
      msg: `Remix Variant Cache Hit: Loaded style variant #${matchedId} representing ${REMIX_STYLES[rStyleIdx]}.`
    };
  }

  // 4. Seasonal Collections (1681 - 1904)
  const seasons = ['Spring', 'Summer', 'Autumn', 'Winter'];
  const matchedSeason = seasons.find(s => promptLower.includes(s.toLowerCase()) || (params.promptText && params.promptText.includes(s)));
  
  if (matchedSeason) {
    const sIdx = seasons.indexOf(matchedSeason);
    const seasonalGarments = SEASONAL_GARMENTS[matchedSeason];
    let gIdx = seasonalGarments.findIndex(g => promptLower.includes(g) || (params.garment && params.garment.toLowerCase().includes(g.split(' ')[0])));
    if (gIdx === -1) gIdx = 0;

    const pairIndex = mIndex * 4 + pIndex;
    const matchedId = 1681 + sIdx * 56 + pairIndex * 2 + gIdx;
    const formattedId = `couture_${String(matchedId).padStart(4, '0')}`;
    
    return {
      id: formattedId,
      imageUrl: `/cache/${formattedId}.jpg`,
      fallbackUrl: FALLBACK_IMAGES[seasonalGarments[gIdx]] || FALLBACK_IMAGES['slip dress'],
      msg: `Seasonal Collection Cache Hit: Retrieved ${matchedSeason} look #${matchedId} (${seasonalGarments[gIdx]}).`
    };
  }

  // 5. Standard Core Lookbook Matches (0001 - 1680)
  let garmentIdx = CACHED_GARMENTS.findIndex(g => 
    (params.garment && params.garment.toLowerCase().includes(g)) || 
    promptLower.includes(g)
  );
  if (garmentIdx === -1) {
    // Fuzzy matching from prompt keywords
    garmentIdx = CACHED_GARMENTS.findIndex(g => {
      const words = g.split(' ');
      return words.every(w => promptLower.includes(w));
    });
    if (garmentIdx === -1) garmentIdx = 0; // Default to hoodie
  }

  let aestheticIdx = CACHED_AESTHETICS.findIndex(a => 
    promptLower.includes(a.toLowerCase()) || 
    promptLower.includes(a.split(' ')[0].toLowerCase())
  );
  if (aestheticIdx === -1) aestheticIdx = 0; // Default to Minimalist Brutalism

  const pairIndex = mIndex * 4 + pIndex;
  const matchedId = pairIndex * 60 + garmentIdx * 5 + aestheticIdx + 1;
  const formattedId = `couture_${String(matchedId).padStart(4, '0')}`;
  
  const targetGarment = CACHED_GARMENTS[garmentIdx];
  const targetMaterial = CACHED_MATERIALS[mIndex];

  return {
    id: formattedId,
    imageUrl: `/cache/${formattedId}.jpg`,
    fallbackUrl: FALLBACK_IMAGES[targetGarment] || FALLBACK_IMAGES[targetMaterial] || FALLBACK_IMAGES['oversized hoodie'],
    msg: `Core Lookbook Cache Hit: Loaded couture combination #${matchedId} matching a ${targetMaterial} ${targetGarment} in ${CACHED_PALETTES[pIndex]}.`
  };
}

// Inline helper functions to prevent any syntax or runtime issues
function lowerIncludes(str?: string, term?: string): boolean {
  if (!str || !term) return false;
  return str.toLowerCase().includes(term.toLowerCase());
}

function lowerPromptContains(normalizedParam: string, item: string): boolean {
  return normalizedParam.toLowerCase().includes(item.toLowerCase());
}

function lowerPromptIncludes(promptText?: string, value?: string): boolean {
  if (!promptText || !value) return false;
  return promptText.toLowerCase().includes(value.toLowerCase());
}
