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
  },
  // 15 new quotes added
  {
    text: "Every moment is a fresh beginning.",
    author: "T.S. Eliot",
    category: "presence"
  },
  {
    text: "The only way to do great work is to love what you do.",
    author: "Steve Jobs",
    category: "wisdom"
  },
  {
    text: "Listen to the silence, it has much to say.",
    author: "Rumi",
    category: "reflection"
  },
  {
    text: "Simplicity is the ultimate sophistication.",
    author: "Leonardo da Vinci",
    category: "wisdom"
  },
  {
    text: "The earth has music for those who listen.",
    author: "George Santayana",
    category: "nature"
  },
  {
    text: "Be the change you wish to see in the world.",
    author: "Mahatma Gandhi",
    category: "presence"
  },
  {
    text: "In stillness, the world restores and renews.",
    author: "Anonymous",
    category: "mindfulness"
  },
  {
    text: "The journey of a thousand miles begins with one step.",
    author: "Lao Tzu",
    category: "wisdom"
  },
  {
    text: "Look deep into nature, and then you will understand everything better.",
    author: "Albert Einstein",
    category: "nature"
  },
  {
    text: "What you seek is seeking you.",
    author: "Rumi",
    category: "reflection"
  },
  {
    text: "The only constant in life is change.",
    author: "Heraclitus",
    category: "wisdom"
  },
  {
    text: "Find peace in the present moment.",
    author: "Anonymous",
    category: "mindfulness"
  },
  {
    text: "The soul always knows what to do to heal itself.",
    author: "Caroline Myss",
    category: "reflection"
  },
  {
    text: "Gratitude turns what we have into enough.",
    author: "Anonymous",
    category: "presence"
  },
  {
    text: "The mountains are calling and I must go.",
    author: "John Muir",
    category: "nature"
  },
  {
    text: "Wisdom comes from experience, and experience comes from mistakes.",
    author: "Anonymous",
    category: "wisdom"
  },
  {
    text: "Breathe deeply and know that you are alive.",
    author: "Anonymous",
    category: "mindfulness"
  }
];

export class QuoteService {
  static getHourlyQuote(): Quote {
    // Use current date and hour as seed to ensure same quote per hour
    const now = new Date();
    const dateHourString = `${now.toDateString()}-${now.getHours()}`;
    const seed = this.hashCode(dateHourString);
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

  // Simple hash function for consistent hourly quotes
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