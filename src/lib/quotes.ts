export interface Quote {
  text: string;
  author: string;
  category: 'mindfulness' | 'reflection' | 'presence' | 'nature' | 'wisdom';
}

export const quotes: Quote[] = [
  {
    text: "In the depth of winter, I finally learned that within me there lay an invincible summer.",
    author: "Albert Camus",
    category: "wisdom"
  },
  {
    text: "The present moment is the only time over which we have dominion.",
    author: "Thích Nhất Hạnh",
    category: "mindfulness"
  },
  {
    text: "Wherever you are, be there totally.",
    author: "Eckhart Tolle",
    category: "presence"
  },
  {
    text: "The best way to take care of the future is to take care of the present moment.",
    author: "Thích Nhất Hạnh",
    category: "mindfulness"
  },
  {
    text: "In every walk with nature, one receives far more than they seek.",
    author: "John Muir",
    category: "nature"
  },
  {
    text: "Peace comes from within. Do not seek it without.",
    author: "Buddha",
    category: "wisdom"
  },
  {
    text: "The quieter you become, the more able you are to hear.",
    author: "Rumi",
    category: "reflection"
  },
  {
    text: "Yesterday is history, tomorrow is a mystery, today is a gift.",
    author: "Eleanor Roosevelt",
    category: "presence"
  },
  {
    text: "Breathe in peace, breathe out stress.",
    author: "Anonymous",
    category: "mindfulness"
  },
  {
    text: "Nature does not hurry, yet everything is accomplished.",
    author: "Lao Tzu",
    category: "nature"
  },
  {
    text: "The cave you fear to enter holds the treasure you seek.",
    author: "Joseph Campbell",
    category: "wisdom"
  },
  {
    text: "Be yourself and be where you are.",
    author: "Anonymous",
    category: "presence"
  },
  {
    text: "In the silence of nature, we find the answers we seek.",
    author: "Anonymous",
    category: "nature"
  },
  {
    text: "The mind is everything. What you think you become.",
    author: "Buddha",
    category: "reflection"
  },
  {
    text: "Let go of what has passed. Let go of what may come. Let go of what is happening now.",
    author: "Rumi",
    category: "mindfulness"
  }
];

export class QuoteService {
  static getDailyQuote(): Quote {
    // Use current date as seed to ensure same quote per day
    const today = new Date();
    const dateString = today.toDateString();
    const seed = this.hashCode(dateString);
    const index = Math.abs(seed) % quotes.length;
    return quotes[index];
  }

  static getRandomQuote(): Quote {
    const randomIndex = Math.floor(Math.random() * quotes.length);
    return quotes[randomIndex];
  }

  static getQuotesByCategory(category: Quote['category']): Quote[] {
    return quotes.filter(quote => quote.category === category);
  }

  // Simple hash function for consistent daily quotes
  private static hashCode(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash;
  }
} 