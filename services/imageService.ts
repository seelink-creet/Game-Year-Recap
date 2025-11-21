
import { PlatformType } from '../types';

/**
 * Searches for a game image/icon using multiple sources:
 * 1. Libretro Thumbnails (High Quality Box Art) - Requires precise name matching
 * 2. CheapShark API (Indexes Steam/PC Stores) - Best for Box Art
 * 3. Wikipedia API (Page Images) - Good for general titles
 * 4. iTunes Search API (Software - iOS Apps) - Good for mobile/indie ports
 */
export const searchGameImage = async (gameName: string, platform?: PlatformType | null, randomize: boolean = false): Promise<string | null> => {
  if (!gameName || typeof gameName !== 'string') {
    console.warn("[Image Service] Invalid game name provided");
    return null;
  }

  try {
    let searchTerm = gameName.trim();
    let secondarySearchTerm = "";

    // Extract English name from "Chinese (English)" format if present
    try {
      const englishMatch = gameName.match(/\(([^)]+)\)/);
      if (englishMatch && englishMatch[1]) {
        secondarySearchTerm = searchTerm; // Keep original as secondary
        searchTerm = englishMatch[1].trim();
      }
    } catch (e) {
      console.warn("[Image Service] Regex match failed, using original name");
    }

    console.log(`[Image Service] Searching for: ${searchTerm} on ${platform} (Randomize: ${randomize})`);

    // Lower limit ensures we only get high-relevance results, even when randomizing.
    // High limits (e.g. 20) bring in loose matches which cause "strange" images.
    const limit = randomize ? 3 : 1;

    // --- Search Providers ---

    // Provider A: Libretro Thumbnails (Static File Server)
    const fetchLibretro = async (term: string, plat?: PlatformType | null) => {
        if (!plat) return [];

        const systemMap: Partial<Record<PlatformType, string[]>> = {
            [PlatformType.PS5]: ['Sony - PlayStation 5', 'Sony - PlayStation 4'], // Fallback to PS4 for cross-gen
            [PlatformType.SWITCH]: ['Nintendo - Nintendo Switch'],
            [PlatformType.XBOX]: ['Microsoft - Xbox Series X_S', 'Microsoft - Xbox One'],
            [PlatformType.STEAM]: ['Microsoft - Windows'],
            [PlatformType.BATTLENET]: ['Microsoft - Windows'], // Battle.net games are PC games
            [PlatformType.PC]: ['Microsoft - Windows'],
        };

        const systems = systemMap[plat] || [];
        if (systems.length === 0) return [];

        // Sanitize term for Libretro filename (replace forbidden chars with underscore)
        // Ref: https://docs.libretro.com/guides/roms-playlists-thumbnails/#thumbnail-specifications
        const forbidden = /[&*/:`<>?\\|"]/g;
        const cleanName = term.replace(forbidden, '_');
        
        // Variations to try for exact filename matching
        const variations = [
            cleanName,
            `${cleanName} (World)`,
            `${cleanName} (USA)`,
            `${cleanName} (Europe)`,
            `${cleanName} (En,Ja,Ko,Zh)`, // Common for Switch
            term // Try original just in case
        ];

        const candidates: string[] = [];
        
        for (const sys of systems) {
            const baseUrl = `https://thumbnails.libretro.com/${encodeURIComponent(sys)}/Named_Boxarts`;
            for (const v of variations) {
                candidates.push(`${baseUrl}/${encodeURIComponent(v)}.png`);
            }
        }
        
        // Validate URLs (Libretro is static, must check existence)
        // We use a lightweight fetch check.
        const validUrls: string[] = [];
        await Promise.all(candidates.map(async (url) => {
            try {
                const res = await fetch(url, { method: 'HEAD' });
                if (res.ok && res.headers.get('content-type')?.includes('image')) {
                    validUrls.push(url);
                }
            } catch (e) {
                // Ignore fetch errors
            }
        }));

        return validUrls;
    };

    // Provider B: CheapShark (PC/Console Games)
    const fetchCheapShark = async (term: string) => {
        try {
            const response = await fetch(`https://www.cheapshark.com/api/1.0/games?title=${encodeURIComponent(term)}&limit=${limit}`);
            const data = await response.json();
            return (data || []).map((d: any) => d.thumb);
        } catch (e) { return []; }
    };

    // Provider C: Wikipedia API
    const fetchWikipedia = async (term: string) => {
        try {
            const response = await fetch(`https://en.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(term + " video game")}&gsrlimit=${limit}&prop=pageimages&piprop=thumbnail&pithumbsize=600&origin=*&format=json`);
            const data = await response.json();
            if (!data.query || !data.query.pages) return [];
            return Object.values(data.query.pages)
                .map((p: any) => p.thumbnail?.source)
                .filter((url: string | undefined) => !!url);
        } catch (e) { return []; }
    };

    // Provider D: iTunes Search (Software/iOS)
    const fetchItunesSoftware = async (term: string) => {
        try {
            const response = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(term)}&media=software&limit=${limit}`);
            const data = await response.json();
            return (data.results || []).map((r: any) => r.artworkUrl100?.replace('100x100', '512x512')); 
        } catch (e) { return []; }
    };

    // Helper to run all fetchers
    const runFetch = async (term: string) => {
      const [lib, cs, wiki, app] = await Promise.all([
          fetchLibretro(term, platform),
          fetchCheapShark(term),
          fetchWikipedia(term),
          fetchItunesSoftware(term)
      ]);
      // Merge with Libretro first (High Quality)
      return [...lib, ...cs, ...wiki, ...app];
    };

    // 3. Execute searches
    let allImages = await runFetch(searchTerm);

    // Fallback: Try secondary search term
    if (allImages.length === 0 && secondarySearchTerm && secondarySearchTerm !== searchTerm) {
        console.log(`[Image Service] No results for "${searchTerm}", trying "${secondarySearchTerm}"...`);
        allImages = await runFetch(secondarySearchTerm);
    }

    // Filter out duplicates and invalid urls
    allImages = [...new Set(allImages)].filter(url => url && url.startsWith('http'));

    if (allImages.length === 0) {
        console.warn(`[Image Service] No results found for: ${gameName}`);
        return null;
    }

    // 5. Return result
    if (randomize) {
        if (allImages.length > 1) {
             const randomIndex = Math.floor(Math.random() * allImages.length);
             return allImages[randomIndex];
        }
        return allImages[0];
    } else {
        return allImages[0];
    }

  } catch (error) {
    console.error("[Image Service] Error searching for game image:", error);
    return null;
  }
};
