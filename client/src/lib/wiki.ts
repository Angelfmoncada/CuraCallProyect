interface WikipediaSearchResult {
  query: {
    search: Array<{
      title: string;
      snippet: string;
      pageid: number;
    }>;
  };
}

interface WikipediaPageResult {
  query: {
    pages: {
      [key: string]: {
        title: string;
        extract: string;
      };
    };
  };
}

export async function fetchWikipediaSummary(query: string): Promise<string | null> {
  try {
    // First, search for relevant pages
    const searchUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`;
    
    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'CuraCall/1.0 (https://example.com/contact)'
      }
    });

    if (!response.ok) {
      // If direct summary fails, try search
      return await searchAndSummarize(query);
    }

    const data = await response.json();
    
    if (data.extract) {
      return formatWikipediaResponse(data.extract, data.title);
    }

    return await searchAndSummarize(query);
  } catch (error) {
    console.error('Wikipedia fetch error:', error);
    return null;
  }
}

async function searchAndSummarize(query: string): Promise<string | null> {
  try {
    // Search for relevant pages
    const searchUrl = `https://en.wikipedia.org/api/rest_v1/page/search?q=${encodeURIComponent(query)}&limit=3`;
    
    const searchResponse = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'CuraCall/1.0 (https://example.com/contact)'
      }
    });

    if (!searchResponse.ok) {
      return null;
    }

    const searchData = await searchResponse.json();
    
    if (searchData.pages && searchData.pages.length > 0) {
      const firstResult = searchData.pages[0];
      
      // Get summary of the first result
      const summaryUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(firstResult.title)}`;
      
      const summaryResponse = await fetch(summaryUrl, {
        headers: {
          'User-Agent': 'CuraCall/1.0 (https://example.com/contact)'
        }
      });

      if (summaryResponse.ok) {
        const summaryData = await summaryResponse.json();
        return formatWikipediaResponse(summaryData.extract, summaryData.title);
      }
    }

    return null;
  } catch (error) {
    console.error('Wikipedia search error:', error);
    return null;
  }
}

function formatWikipediaResponse(extract: string, title: string): string {
  const cleanExtract = extract
    .replace(/\([^)]*\)/g, '') // Remove parenthetical content
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();

  return `Based on Wikipedia information about "${title}":

${cleanExtract}

Please note: This information is from Wikipedia and I'm providing it as a basic reference. For more detailed or current information, you may want to consult additional sources.`;
}

export function extractKeywords(query: string): string[] {
  return query
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 2)
    .filter(word => !['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'].includes(word));
}
