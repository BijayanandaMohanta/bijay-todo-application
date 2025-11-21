/**
 * Google Gemini AI Integration
 * Using Gemini API for text improvement
 */

const GEMINI_API_KEY = 'AIzaSyAHlH7G2Xx8Cg5HDjlyeu1N5HnA7j4GYG4';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

// Rate limiting to stay within free tier limits
// Free tier: 15 requests per minute, 1500 requests per day
let requestCount = 0;
let lastRequestTime = Date.now();
let dailyRequestCount = 0;
let dailyResetTime = Date.now();

const RATE_LIMITS = {
  MAX_PER_MINUTE: 10, // Conservative limit (free tier is 15)
  MAX_PER_DAY: 1000,  // Conservative limit (free tier is 1500)
  MINUTE_WINDOW: 60000, // 1 minute in ms
  DAY_WINDOW: 86400000  // 24 hours in ms
};

/**
 * Check and update rate limits
 */
const checkRateLimit = () => {
  const now = Date.now();
  
  // Reset minute counter if window has passed
  if (now - lastRequestTime > RATE_LIMITS.MINUTE_WINDOW) {
    requestCount = 0;
    lastRequestTime = now;
  }
  
  // Reset daily counter if window has passed
  if (now - dailyResetTime > RATE_LIMITS.DAY_WINDOW) {
    dailyRequestCount = 0;
    dailyResetTime = now;
  }
  
  // Check if we've exceeded limits
  if (requestCount >= RATE_LIMITS.MAX_PER_MINUTE) {
    throw new Error(`Rate limit exceeded: Maximum ${RATE_LIMITS.MAX_PER_MINUTE} requests per minute. Please wait.`);
  }
  
  if (dailyRequestCount >= RATE_LIMITS.MAX_PER_DAY) {
    throw new Error(`Daily limit exceeded: Maximum ${RATE_LIMITS.MAX_PER_DAY} requests per day.`);
  }
  
  // Increment counters
  requestCount++;
  dailyRequestCount++;
  
  console.log(`API Usage - This minute: ${requestCount}/${RATE_LIMITS.MAX_PER_MINUTE}, Today: ${dailyRequestCount}/${RATE_LIMITS.MAX_PER_DAY}`);
};

/**
 * Improve todo text using Google Gemini AI
 * @param {string} text - Original transcribed text
 * @param {string} context - Additional context from user (optional)
 * @returns {Promise<string>} - Improved text
 */
export const improveTodoWithAI = async (text, context = '') => {
  console.log('Attempting to improve text with Gemini:', text);
  
  try {
    // Check rate limits
    checkRateLimit();
    
    let prompt = '';
    if (context) {
      prompt = `Given this todo: "${text}" and this additional context: "${context}", improve the todo to be clear, concise, and actionable. Include relevant details from the context. Keep it brief (1-2 sentences max). Return only the improved task text without any explanation: `;
    } else {
      prompt = `Improve this todo task to be clear, concise, and actionable. Keep it brief (1-2 sentences max). Return only the improved task text without any explanation or formatting: "${text}"`;
    }
    
    const requestBody = {
      contents: [{
        parts: [{
          text: prompt
        }]
      }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 100, // Keep it short to save quota
        topK: 40,
        topP: 0.95,
      },
      safetySettings: [
        {
          category: "HARM_CATEGORY_HARASSMENT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
          category: "HARM_CATEGORY_HATE_SPEECH",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
          category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
          category: "HARM_CATEGORY_DANGEROUS_CONTENT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        }
      ]
    };
    
    console.log('Calling Gemini API...');
    
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Gemini API error:', errorData);
      throw new Error(`Gemini API error: ${errorData.error?.message || response.statusText}`);
    }
    
    const data = await response.json();
    console.log('Gemini API response:', data);
    
    // Extract the generated text
    let improvedText = '';
    if (data.candidates && data.candidates[0] && data.candidates[0].content) {
      const content = data.candidates[0].content;
      if (content.parts && content.parts[0]) {
        improvedText = content.parts[0].text;
      }
    }
    
    // Clean up the response
    improvedText = improvedText.trim().replace(/^["']|["']$/g, '');
    
    console.log('Improved text:', improvedText);
    return improvedText || text;
    
  } catch (error) {
    console.error('Error improving text with Gemini AI:', error);
    console.error('Error details:', error.message);
    
    // Return original text if AI fails
    if (error.message.includes('Rate limit') || error.message.includes('Daily limit')) {
      // Show the rate limit error to user
      throw error;
    }
    return text;
  }
};

/**
 * Get current API usage stats
 * @returns {Object} - Usage statistics
 */
export const getAPIUsage = () => {
  return {
    minuteUsage: `${requestCount}/${RATE_LIMITS.MAX_PER_MINUTE}`,
    dailyUsage: `${dailyRequestCount}/${RATE_LIMITS.MAX_PER_DAY}`,
    minuteRemaining: RATE_LIMITS.MAX_PER_MINUTE - requestCount,
    dailyRemaining: RATE_LIMITS.MAX_PER_DAY - dailyRequestCount
  };
};


