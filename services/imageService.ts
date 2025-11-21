
/**
 * Searches for a game image/icon using multiple sources:
 * 1. CheapShark API (Indexes Steam/PC Stores) - Good for generic box art.
 * 2. iTunes Search API (Apps & Music) - Surprisingly excellent for finding high-res square icons for console games via Soundtracks or iOS ports.
 */
export const searchGameImage = async (gameName: string): Promise<string | null> => {
  try {
    // 1. Clean up the search term
    // Logic: The database entries are often "Chinese Name (English Name)".
    // Store APIs work best with English names.
    let searchTerm = gameName;
    const englishMatch = gameName.match(/\(([^)]+)\)/);
    
    if (englishMatch && englishMatch[1]) {
      searchTerm = englishMatch[1];
    }

    // Remove special characters that might confuse APIs, but keep numbers
    // e.g. "Marvel's Spider-Man 2" -> "Marvels Spider Man 2" often searches better, but strict APIs might need exacts.
    // Let's keep it relatively raw but trimmed.
    searchTerm = searchTerm.trim();

    console.log(`[Image Service] Searching for: ${searchTerm}`);

    // 2. Define Search Providers
    
    // Provider A: iTunes Search (Music/OSTs often have the best square high-res game art)
    const fetchItunes = async () => {
        try {
            // Search for albums (soundtracks) first as they represent the IP well
            const response = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(searchTerm)}&media=music&entity=album&limit=1`);
            const data = await response.json();
            if (data.results && data.results.length > 0) {
                // Upgrade resolution from 100x100 to 600x600
                return data.results[0].artworkUrl100.replace('100x100', '600x600');
            }
            return null;
        } catch (e) {
            return null;
        }
    };

    // Provider B: CheapShark (PC Games)
    const fetchCheapShark = async () => {
        try {
            const response = await fetch(`https://www.cheapshark.com/api/1.0/games?title=${encodeURIComponent(searchTerm)}&limit=1`);
            const data = await response.json();
            if (data && data.length > 0) {
                let url = data[0].thumb;
                // Try to get a better steam image if possible
                if (url.includes('steamstatic')) {
                    // Steam capsules usually allow higher res if we change the filename, but thumb is decent.
                }
                return url;
            }
            return null;
        } catch (e) {
            return null;
        }
    };

    // 3. Execute searches in parallel for speed
    const [itunesImage, cheapSharkImage] = await Promise.all([fetchItunes(), fetchCheapShark()]);

    // 4. Prioritize results
    // iTunes usually gives clean square art which fits the UI better.
    // CheapShark usually gives rectangular box art.
    
    if (itunesImage) {
        console.log(`[Image Service] Found image via iTunes: ${itunesImage}`);
        return itunesImage;
    }

    if (cheapSharkImage) {
        console.log(`[Image Service] Found image via CheapShark: ${cheapSharkImage}`);
        return cheapSharkImage;
    }

    console.warn(`[Image Service] No results found for: ${searchTerm}`);
    return null;

  } catch (error) {
    console.error("[Image Service] Error searching for game image:", error);
    return null;
  }
};
