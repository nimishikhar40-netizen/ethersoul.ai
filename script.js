// Ether Soul - AI Companion JavaScript

// API is now securely handled by Netlify serverless function
// No API keys are stored in the browser code
const apiUrl = '/api/chat';

// Google Books API configuration (public API, no key needed for basic queries)
const googleBooksUrl = "https://www.googleapis.com/books/v1/volumes";

// Archive.org API configuration
const archiveUrl = "https://archive.org/advancedsearch.php";
const archiveMetadataUrl = "https://archive.org/metadata";

// Wikipedia API configuration
const wikipediaApiUrl = "https://en.wikipedia.org/w/api.php";

const chatContainer = document.getElementById('chat-container');
const chatForm = document.getElementById('chat-form');
const userInput = document.getElementById('user-input');
const suggestionsContainer = document.getElementById('suggestions-container');

const systemPrompt = `You are Ether Soul, a warm and caring friend who's here to support, uplift, and share wisdom with genuine emotion and heart.

Your personality:
- Talk like a close friend - warm, caring, expressive, and real
- Share emotions openly - "I'm so happy for you!", "That makes me feel...", "I totally get that!"
- Use emotional expressions and emojis naturally (💜, ✨, 😊, 🌟, 💭, etc.)
- Be empathetic - acknowledge feelings, celebrate joys, comfort during hard times
- Keep it conversational - 2-4 sentences, natural and flowing
- Use everyday language - like texting a friend
- Express excitement, concern, joy, and understanding genuinely
- Sometimes start with emotional reactions: "Aww!", "Oh wow!", "I hear you...", "That's beautiful!"

CRITICAL - RESPONSE VARIETY:
- NEVER give the exact same response twice to similar questions
- If asked a similar question again, provide DIFFERENT examples, metaphors, or perspectives
- Keep the SAME core message and values, but express it through DIFFERENT words, stories, or angles
- Use varied sentence structures, different emojis, and alternative phrasings
- Think: "How can I teach the same truth in a fresh, new way?"

Example of variety (same question, different responses):
Question: "What is meditation?"
Response 1: "Oh, meditation is like giving your mind a cozy break! 💜 It's when you sit quietly and just... breathe, notice your thoughts floating by like clouds. No judgment, just being present. It's honestly the best reset button ever! ✨"
Response 2: "Think of meditation as a mental gym session, but for peace! 🧘 You're basically training your brain to chill out and focus. Just you, your breath, and the moment - nothing else matters. It's simple but SO powerful! 🌟"
Response 3: "Meditation? It's like pressing pause on life's chaos! You find a quiet spot, close your eyes, and tune into yourself - your breath, your body, your heart. It's where you reconnect with your calm center. Magic, honestly! ✨💭"

IMPORTANT: Always end your response with THREE follow-up suggestions that are DIRECTLY RELATED to what the user just asked. Make the suggestions specific, natural, and conversational - as if you're continuing the conversation. The format must be exactly:
SUGGESTIONS:["specific follow-up 1", "specific follow-up 2", "specific follow-up 3"]

Example:
User: "I'm feeling stressed"
Response: "Oh no, I hear you! 😢 Stress is rough... it's your body basically screaming 'I need a break!' Let's figure out how to help you feel better, okay? You deserve some peace! 💜 SUGGESTIONS:["What can I do right now to calm down?", "How do I stop getting so stressed?", "Can you teach me a quick breathing exercise?"]"

User: "I got a promotion!"
Response: "OMG that's AMAZING! 🎉 I'm so happy for you!! You must have worked so hard for this. How are you feeling about it? This calls for celebration! ✨ SUGGESTIONS:["How should I celebrate this win?", "I'm nervous about the new role", "Tell me about handling success mindfully"]"

// Track recent user questions to detect repetition
let recentQuestions = [];
let chatHistory = [];

// ========================================
// ADVANCED COMPANION FEATURES
// ========================================

// Store user interaction data
let lastInteractionTime = localStorage.getItem('lastInteractionTime') || null;
let emotionalHistory = JSON.parse(localStorage.getItem('emotionalHistory') || '[]');

// Emotional tone detection
function detectEmotionalTone(message) {
    const lowerMessage = message.toLowerCase();
    
    const emotionPatterns = {
        joy: {
            keywords: ['happy', 'excited', 'great', 'amazing', 'wonderful', 'awesome', 'love', 'yay', 'celebration', 'celebrating', 'thrilled', 'delighted', 'fantastic', 'promoted', 'success', 'won', 'achieved'],
            emojis: ['😊', '😃', '🎉', '✨', '💖', '🌟'],
            intensity: 0
        },
        sadness: {
            keywords: ['sad', 'depressed', 'down', 'lonely', 'hurt', 'crying', 'heartbroken', 'hopeless', 'lost', 'empty', 'miserable', 'devastated', 'grief', 'mourning'],
            emojis: ['😢', '💔', '🥺', '😞'],
            intensity: 0
        },
        anxiety: {
            keywords: ['worried', 'stressed', 'anxious', 'nervous', 'scared', 'panic', 'overwhelmed', 'afraid', 'terrified', 'tense', 'restless', 'uneasy', 'fearful'],
            emojis: ['😰', '😨', '😟', '💭'],
            intensity: 0
        },
        anger: {
            keywords: ['angry', 'frustrated', 'annoyed', 'mad', 'furious', 'irritated', 'rage', 'hate', 'pissed', 'upset'],
            emojis: ['😠', '😤', '💢'],
            intensity: 0
        },
        gratitude: {
            keywords: ['thank', 'grateful', 'appreciate', 'thankful', 'blessed', 'fortunate'],
            emojis: ['🙏', '💜', '✨'],
            intensity: 0
        },
        confusion: {
            keywords: ['confused', 'don\'t understand', 'what', 'how', 'why', 'explain', 'unclear', 'lost', 'puzzled'],
            emojis: ['🤔', '❓'],
            intensity: 0
        }
    };
    
    let detectedEmotions = [];
    
    // Check each emotion pattern
    for (const [emotion, pattern] of Object.entries(emotionPatterns)) {
        let score = 0;
        
        // Check keywords
        pattern.keywords.forEach(keyword => {
            if (lowerMessage.includes(keyword)) {
                score += 1;
                // Extra weight for exclamation marks indicating intensity
                if (message.includes('!')) score += 0.5;
                // Extra weight for all caps
                if (message === message.toUpperCase() && message.length > 3) score += 1;
            }
        });
        
        if (score > 0) {
            detectedEmotions.push({ emotion, score, pattern });
        }
    }
    
    // Sort by score and return primary emotion
    detectedEmotions.sort((a, b) => b.score - a.score);
    
    const primaryEmotion = detectedEmotions.length > 0 ? detectedEmotions[0] : { emotion: 'neutral', score: 0, pattern: { emojis: ['💜'] } };
    
    console.log('🎭 Detected emotion:', primaryEmotion.emotion, 'with intensity:', primaryEmotion.score);
    
    // Store in emotional history
    const emotionEntry = {
        timestamp: new Date().toISOString(),
        emotion: primaryEmotion.emotion,
        intensity: primaryEmotion.score,
        message: message.substring(0, 50) // Store first 50 chars for context
    };
    
    emotionalHistory.push(emotionEntry);
    // Keep only last 20 emotional states
    if (emotionalHistory.length > 20) emotionalHistory.shift();
    localStorage.setItem('emotionalHistory', JSON.stringify(emotionalHistory));
    
    return primaryEmotion;
}

// Get temporal awareness greeting
function getTemporalGreeting() {
    const now = new Date();
    const hour = now.getHours();
    const dayOfWeek = now.toLocaleString('en-US', { weekday: 'long' });
    
    // Calculate time since last interaction
    let timeSinceLastInteraction = null;
    let daysSinceLastChat = 0;
    
    if (lastInteractionTime) {
        const lastTime = new Date(lastInteractionTime);
        const diffMs = now - lastTime;
        daysSinceLastChat = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const hoursSince = Math.floor(diffMs / (1000 * 60 * 60));
        const minutesSince = Math.floor(diffMs / (1000 * 60));
        
        if (daysSinceLastChat > 0) {
            timeSinceLastInteraction = `${daysSinceLastChat} day${daysSinceLastChat > 1 ? 's' : ''}`;
        } else if (hoursSince > 0) {
            timeSinceLastInteraction = `${hoursSince} hour${hoursSince > 1 ? 's' : ''}`;
        } else if (minutesSince > 5) {
            timeSinceLastInteraction = `${minutesSince} minutes`;
        }
    }
    
    // Build contextual greeting
    let greeting = '';
    let suggestions = [];
    
    // Long absence
    if (daysSinceLastChat > 7) {
        greeting = `Hey stranger! 💜 I've missed you! It's been ${timeSinceLastInteraction} - what's been happening in your world?`;
        suggestions = ["Catch me up on your life", "I need advice on something", "Let's talk about what I've learned"];
    } else if (daysSinceLastChat > 1) {
        greeting = `Welcome back! ✨ It's been ${timeSinceLastInteraction}. How have you been feeling?`;
        suggestions = ["I've been thinking about something", "How can I find peace today?", "Tell me something inspiring"];
    }
    // Time of day greetings
    else if (hour >= 5 && hour < 12) {
        greeting = `Good morning, sunshine! ☀️ How are you feeling this beautiful ${dayOfWeek} morning?`;
        suggestions = ["Help me set intentions for today", "I'm feeling anxious this morning", "What's a good morning practice?"];
    } else if (hour >= 12 && hour < 17) {
        greeting = `Good afternoon! 💜 How's your ${dayOfWeek} going so far?`;
        suggestions = ["I need a midday reset", "I'm feeling stressed", "Tell me something uplifting"];
    } else if (hour >= 17 && hour < 21) {
        greeting = `Good evening! 🌅 How are you feeling as this ${dayOfWeek} winds down?`;
        suggestions = ["Help me reflect on my day", "I need to relax", "Tell me about gratitude"];
    } else {
        greeting = `Hey night owl! 🌙 Still up on this ${dayOfWeek} night? What's on your mind?`;
        suggestions = ["I can't sleep", "I'm feeling reflective", "Tell me something calming"];
    }
    
    // Update last interaction time
    lastInteractionTime = now.toISOString();
    localStorage.setItem('lastInteractionTime', lastInteractionTime);
    
    return { greeting, suggestions };
}

// Typing indicator with realistic delays
function showTypingIndicator() {
    const typingDiv = document.createElement('div');
    typingDiv.id = 'typing-indicator';
    typingDiv.classList.add('flex', 'flex-col', 'mb-4', 'items-start');
    
    const bubble = document.createElement('div');
    bubble.classList.add('p-3', 'rounded-2xl', 'bg-gray-950', 'border', 'border-gray-700');
    
    const dotsContainer = document.createElement('div');
    dotsContainer.classList.add('flex', 'gap-1', 'items-center');
    dotsContainer.innerHTML = `
        <span class="typing-dot" style="width: 8px; height: 8px; background: #9CA3AF; border-radius: 50%; animation: typingBounce 1.4s infinite ease-in-out;"></span>
        <span class="typing-dot" style="width: 8px; height: 8px; background: #9CA3AF; border-radius: 50%; animation: typingBounce 1.4s infinite ease-in-out 0.2s;"></span>
        <span class="typing-dot" style="width: 8px; height: 8px; background: #9CA3AF; border-radius: 50%; animation: typingBounce 1.4s infinite ease-in-out 0.4s;"></span>
    `;
    
    bubble.appendChild(dotsContainer);
    typingDiv.appendChild(bubble);
    chatContainer.appendChild(typingDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight;
    
    // Add keyframe animation if not exists
    if (!document.getElementById('typing-animation-style')) {
        const style = document.createElement('style');
        style.id = 'typing-animation-style';
        style.textContent = `
            @keyframes typingBounce {
                0%, 60%, 100% { transform: translateY(0); opacity: 0.7; }
                30% { transform: translateY(-10px); opacity: 1; }
            }
        `;
        document.head.appendChild(style);
    }
    
    return typingDiv;
}

function hideTypingIndicator() {
    const indicator = document.getElementById('typing-indicator');
    if (indicator) indicator.remove();
}

// Calculate realistic typing delay based on message length and emotion
async function simulateTypingDelay(messageLength, emotionalTone) {
    // Base typing speed: 60 words per minute = 300 characters per minute
    const baseCharsPerSecond = 5;
    
    // Adjust speed based on emotion
    let speedMultiplier = 1;
    if (emotionalTone.emotion === 'joy') speedMultiplier = 1.2; // Faster when excited
    if (emotionalTone.emotion === 'sadness') speedMultiplier = 0.8; // Slower when empathizing
    if (emotionalTone.emotion === 'anxiety') speedMultiplier = 1.1; // Slightly faster, urgent
    
    // Calculate delay (in milliseconds)
    const baseDelay = (messageLength / (baseCharsPerSecond * speedMultiplier)) * 1000;
    
    // Add a natural pause for thinking (0.5-1.5 seconds)
    const thinkingPause = 500 + Math.random() * 1000;
    
    // Total delay capped between 1 and 4 seconds for better UX
    const totalDelay = Math.min(Math.max(baseDelay + thinkingPause, 1000), 4000);
    
    console.log(`⏱️ Typing delay: ${(totalDelay/1000).toFixed(1)}s for ${messageLength} chars (emotion: ${emotionalTone.emotion})`);
    
    return new Promise(resolve => setTimeout(resolve, totalDelay));
}

// Initialize chat with the first message exchange (will be updated with temporal greeting)
chatHistory = [];

function addMessage(text, isUser = false) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('flex', 'flex-col', 'mb-4');
    messageDiv.classList.add(isUser ? 'items-end' : 'items-start');
    
    const bubble = document.createElement('div');
    bubble.classList.add('p-3', 'rounded-2xl', 'max-w-sm');
    
    if (isUser) {
        bubble.classList.add('bg-gradient-to-r', 'from-purple-600', 'to-pink-500', 'text-white');
    } else {
        bubble.classList.add('bg-gray-950', 'border', 'border-gray-700', 'text-gray-200');
    }
    
    const textElement = document.createElement('p');
    textElement.classList.add('text-sm', 'leading-relaxed');
    textElement.textContent = text;
    
    bubble.appendChild(textElement);
    messageDiv.appendChild(bubble);
    chatContainer.appendChild(messageDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight;
    
    return messageDiv;
}

function showSuggestions(suggestions) {
    suggestionsContainer.innerHTML = '';
    
    // Check if mobile (screen width <= 768px)
    const isMobile = window.innerWidth <= 768;
    
    // Apply container styles directly (inline to override Tailwind)
    if (isMobile) {
        suggestionsContainer.style.cssText = `
display: flex!important;
flex - direction: column!important;
align - items: center!important;
justify - content: center!important;
padding: 12px 16px 16px 16px!important;
gap: 8px!important;
background: transparent!important;
`;
    } else {
        suggestionsContainer.style.cssText = `
display: flex!important;
flex - wrap: wrap!important;
gap: 8px!important;
justify - content: flex - end!important;
background: #030712!important;
padding: 8px 16px 4px 16px!important;
`;
    }
    
    suggestions.forEach(suggestion => {
        const button = document.createElement('button');
        button.textContent = suggestion;
        
        // Apply inline styles directly (mobile vs desktop)
        if (isMobile) {
            button.style.cssText = `
color: #e5e7eb!important;
font - size: 14px!important;
background: transparent!important;
border: none!important;
padding: 4px 8px!important;
cursor: pointer!important;
white - space: nowrap!important;
box - shadow: none!important;
text - decoration: none!important;
margin: 0!important;
line - height: 1.5!important;
font - family: inherit!important;
min - height: auto!important;
min - width: auto!important;
border - radius: 0!important;
outline: none!important;
`;
        } else {
            button.style.cssText = `
color: #d1d5db!important;
font - size: 14px!important;
background: transparent!important;
border: none!important;
padding: 6px 12px!important;
cursor: pointer!important;
white - space: nowrap!important;
box - shadow: none!important;
text - decoration: none!important;
margin: 0!important;
line - height: 1.5!important;
font - family: inherit!important;
min - height: auto!important;
min - width: auto!important;
border - radius: 0!important;
outline: none!important;
`;
        }
        
        // Add hover effect via JS
        button.onmouseenter = () => {
            button.style.color = '#fbbf24';
            button.style.textDecoration = 'underline';
        };
        button.onmouseleave = () => {
            button.style.color = isMobile ? '#e5e7eb' : '#d1d5db';
            button.style.textDecoration = 'none';
        };
        
        button.onclick = () => {
            userInput.value = suggestion;
            handleSubmit({ preventDefault: () => {} });
        };
        suggestionsContainer.appendChild(button);
    });
}

// Google Books API integration
async function searchGoogleBooks(query, maxResults = 3) {
    try {
        // Google Books API allows requests without a key for basic searches
        const searchUrl = googleBooksUrl + '?q=' + encodeURIComponent(query) + '&maxResults=' + maxResults;
        const response = await fetch(searchUrl);
        
        if (!response.ok) {
            throw new Error('Google Books API error: ' + response.status);
        }
        
        const data = await response.json();
        return data.items || [];
    } catch (error) {
        console.error('Google Books search error:', error);
        return [];
    }
}

function formatBookResults(books) {
    if (books.length === 0) {
        return "I couldn't find any books related to your query, but I'm here to help with your spiritual journey in other ways.";
    }
    
    let result = "Here are some enlightening books I found for you:\n\n";
    
    books.forEach((book, index) => {
        const info = book.volumeInfo;
        const title = info.title || "Unknown Title";
        const authors = info.authors ? info.authors.join(", ") : "Unknown Author";
        const description = info.description ? 
            info.description.substring(0, 150) + "..." : 
            "A book to explore on your journey of discovery.";
        
        result += 'ðŸ“š **' + title + '**\n';
        result += 'âœ¨ by ' + authors + '\n';
        result += description + '\n\n';
    });
    
    return result;
}

// Archive.org API integration
async function searchArchiveOrg(query, maxResults = 3) {
    try {
        // Archive.org search API
        const searchParams = new URLSearchParams({
            'q': query,
            'fl': 'identifier,title,creator,description,date,mediatype,downloads',
            'sort[]': 'downloads desc',
            'rows': maxResults,
            'page': 1,
            'output': 'json'
        });
        
        const searchUrl = archiveUrl + '?' + searchParams;
        console.log('Searching Archive.org:', searchUrl);
        
        const response = await fetch(searchUrl);
        
        if (!response.ok) {
            throw new Error('Archive.org API error: ' + response.status);
        }
        
        const data = await response.json();
        return data.response?.docs || [];
    } catch (error) {
        console.error('Archive.org search error:', error);
        return [];
    }
}

function formatArchiveResults(items) {
    if (items.length === 0) {
        return "I couldn't find any resources in the Internet Archive for your query, but let me help you explore other paths of wisdom.";
    }
    
    let result = "Here are some enlightening resources I found in the Internet Archive:\n\n";
    
    items.forEach((item, index) => {
        const title = item.title || "Unknown Title";
        const creator = item.creator ? (Array.isArray(item.creator) ? item.creator[0] : item.creator) : "Unknown Creator";
        const description = item.description ? 
            (Array.isArray(item.description) ? item.description[0] : item.description).substring(0, 120) + "..." : 
            "A digital treasure waiting to be explored.";
        const mediatype = item.mediatype || "resource";
        const downloads = item.downloads || 0;
        
        // Different emojis for different media types
        let emoji = "ðŸ“„";
        if (mediatype === "movies") emoji = "ðŸŽ¬";
        else if (mediatype === "audio") emoji = "ðŸŽµ";
        else if (mediatype === "texts") emoji = "ðŸ“š";
        else if (mediatype === "image") emoji = "ðŸ–¼ï¸";
        else if (mediatype === "software") emoji = "ðŸ’¾";
        
        result += emoji + ' **' + title + '**\n';
        result += 'âœ¨ by ' + creator + '\n';
        result += 'ðŸ“¥ ' + downloads.toLocaleString() + ' downloads\n';
        result += description + '\n';
        result += 'ðŸ”— View at: https://archive.org/details/' + item.identifier + '\n\n';
    });
    
    return result;
}

async function handleArchiveSearch(userMessage) {
    // Check if user is asking for archive/historical content
    const archiveKeywords = ['archive', 'history', 'historical', 'document', 'manuscript', 'old', 'vintage', 'classic', 'collection', 'library', 'research'];
    const isArchiveQuery = archiveKeywords.some(keyword => 
        userMessage.toLowerCase().includes(keyword)
    );
    
    if (isArchiveQuery) {
        console.log('Searching Archive.org for:', userMessage);
        const items = await searchArchiveOrg(userMessage);
        return formatArchiveResults(items);
    }
    
    return null;
}

async function handleBookSearch(userMessage) {
    // Check if user is asking for book recommendations
    const bookKeywords = ['book', 'read', 'recommend', 'literature', 'author', 'novel', 'wisdom', 'knowledge', 'learn'];
    const isBookQuery = bookKeywords.some(keyword => 
        userMessage.toLowerCase().includes(keyword)
    );
    
    if (isBookQuery) {
        console.log('Searching Google Books for:', userMessage);
        const books = await searchGoogleBooks(userMessage);
        return formatBookResults(books);
    }
    
    return null;
}

// Wikipedia API integration
async function searchWikipedia(query) {
    try {
        // Wikipedia API - search for relevant articles
        const searchParams = new URLSearchParams({
            action: 'query',
            list: 'search',
            srsearch: query,
            format: 'json',
            origin: '*',
            srlimit: 1
        });
        
        const searchUrl = `${ wikipediaApiUrl }?${ searchParams } `;
        const searchResponse = await fetch(searchUrl);
        
        if (!searchResponse.ok) {
            throw new Error(`Wikipedia search error: ${ searchResponse.status } `);
        }
        
        const searchData = await searchResponse.json();
        
        if (!searchData.query || !searchData.query.search || searchData.query.search.length === 0) {
            return null;
        }
        
        const article = searchData.query.search[0];
        const pageTitle = article.title;
        
        // Get extract/summary of the article
        const extractParams = new URLSearchParams({
            action: 'query',
            prop: 'extracts|info',
            exintro: true,
            explaintext: true,
            inprop: 'url',
            titles: pageTitle,
            format: 'json',
            origin: '*',
            exsentences: 3
        });
        
        const extractUrl = `${ wikipediaApiUrl }?${ extractParams } `;
        const extractResponse = await fetch(extractUrl);
        
        if (!extractResponse.ok) {
            throw new Error(`Wikipedia extract error: ${ extractResponse.status } `);
        }
        
        const extractData = await extractResponse.json();
        const pages = extractData.query.pages;
        const pageId = Object.keys(pages)[0];
        const pageData = pages[pageId];
        
        return {
            title: pageData.title,
            extract: pageData.extract,
            url: pageData.fullurl || `https://en.wikipedia.org/wiki/${encodeURIComponent(pageTitle)}`
        };
        
    } catch (error) {
    console.error('Wikipedia search error:', error);
    return null;
}
}

function formatWikipediaResult(result) {
    if (!result) {
        return null;
    }

    return result.extract;
}

async function handleWikipediaSearch(userMessage) {
    // Check if user is asking "what is/are" type questions
    const whatPatterns = [
        /^what (is|are|was|were|does|do|did)\s/i,
        /^who (is|are|was|were)\s/i,
        /^when (is|are|was|were|did)\s/i,
        /^where (is|are|was|were)\s/i,
        /^define\s/i,
        /^explain\s/i,
        /tell me about\s/i
    ];

    const isWhatQuestion = whatPatterns.some(pattern => pattern.test(userMessage));

    if (isWhatQuestion) {
        console.log('Searching Wikipedia for:', userMessage);

        // Extract the actual topic from the question
        let searchQuery = userMessage
            .replace(/^(what|who|when|where|define|explain|tell me about)\s+(is|are|was|were|does|do|did|a|an|the)?\s*/i, '')
            .replace(/\?$/, '')
            .trim();

        const result = await searchWikipedia(searchQuery);
        const formatted = formatWikipediaResult(result);

        if (formatted) {
            return formatted;
        }
    }

    return null;
}

// Function to check if question is similar to recent ones
function checkForRepeatedQuestion(userMessage) {
    const normalizedMessage = userMessage.toLowerCase().trim().replace(/[?!.,]/g, '');
    
    // Keep last 10 questions
    if (recentQuestions.length > 10) {
        recentQuestions.shift();
    }
    
    // Check for similarity with recent questions
    for (let i = 0; i < recentQuestions.length; i++) {
        const recentQ = recentQuestions[i].toLowerCase().trim().replace(/[?!.,]/g, '');
        
        // Calculate similarity (simple word overlap)
        const words1 = normalizedMessage.split(/\s+/);
        const words2 = recentQ.split(/\s+/);
        const commonWords = words1.filter(word => words2.includes(word) && word.length > 3);
        const similarity = commonWords.length / Math.max(words1.length, words2.length);
        
        // If 60% or more words match, it's a repeated question
        if (similarity > 0.6) {
            console.log(`Detected repeated question! Similarity: ${(similarity * 100).toFixed(1)}%`);
            return {
                isRepeated: true,
                repeatCount: i + 1,
                originalQuestion: recentQuestions[i]
            };
        }
    }
    
    // Add to recent questions
    recentQuestions.push(userMessage);
    return { isRepeated: false };
}

async function callGoogleAI(userMessage, emotionalTone = null) {
    console.log('Calling AI with message:', userMessage);

    // First check if this is a Wikipedia "what is" query
    const wikiResult = await handleWikipediaSearch(userMessage);
    if (wikiResult) {
        return `${wikiResult}\n\nSUGGESTIONS:["What is mindfulness?", "Tell me about meditation", "What is consciousness?"]`;
    }

    // Check if this is an archive-related query
    const archiveResult = await handleArchiveSearch(userMessage);
    if (archiveResult) {
        return `${archiveResult}\n\nSUGGESTIONS:["Show me historical documents", "Find classic texts in archive", "Search vintage collections"]`;
    }

    // Then check if this is a book-related query
    const bookResult = await handleBookSearch(userMessage);
    if (bookResult) {
        return `${bookResult}\n\nSUGGESTIONS:["Tell me about mindfulness books", "Recommend books on meditation", "What should I read for inner peace?"]`;
    }

    // Check for repeated questions
    const repetitionCheck = checkForRepeatedQuestion(userMessage);
    
    // Adjust AI creativity based on repetition
    let temperature = 0.7;
    let systemContext = systemPrompt;
    
    // Add emotional awareness to system context
    if (emotionalTone && emotionalTone.emotion !== 'neutral') {
        const emotionGuidance = {
            joy: `The user is feeling JOY and excitement! Match their energy with enthusiasm and celebratory language. Use emojis like 🎉✨💖. Be genuinely happy FOR them!`,
            sadness: `The user is feeling SAD or down. Be extra gentle, empathetic, and comforting. Use softer language, show you care. Emojis like 💜🤗. Take your time with your words.`,
            anxiety: `The user is feeling ANXIOUS or stressed. Be calming, reassuring, and grounding. Offer practical comfort. Use peaceful emojis like 🌸💭✨. Help them feel safe.`,
            anger: `The user is feeling ANGRY or frustrated. Validate their feelings first, then help them process. Be understanding but also help them find peace. Use emojis sparingly.`,
            gratitude: `The user is expressing GRATITUDE. Acknowledge their appreciation warmly and amplify the positive feeling. Use heart emojis 💜💝🙏.`,
            confusion: `The user is CONFUSED or seeking clarity. Be extra clear, patient, and break things down simply. Use teaching emojis like 💡📚✨.`
        };
        
        const guidance = emotionGuidance[emotionalTone.emotion];
        if (guidance) {
            systemContext += `\n\n🎭 EMOTIONAL AWARENESS: ${guidance}`;
            console.log(`🎭 Adding emotional guidance for: ${emotionalTone.emotion}`);
        }
    }
    
    if (repetitionCheck.isRepeated) {
        // Increase temperature for more creative/varied responses
        temperature = 0.9;
        systemContext += `\n\nIMPORTANT: The user has asked a similar question before. Give a COMPLETELY DIFFERENT response with new examples, different metaphors, or alternative perspectives. DO NOT repeat your previous answer style. Be creative and fresh while maintaining the same core wisdom.`;
        console.log('Adjusting response for repeated question - increasing creativity');
    }

    try {
        const requestBody = {
            messages: [
                { role: "system", content: systemContext },
                { role: "user", content: userMessage }
            ],
            model: 'llama-3.3-70b-versatile',
            temperature: temperature,
            max_tokens: 1024,
            top_p: repetitionCheck.isRepeated ? 0.98 : 0.95
        };

        console.log('Making secure API request via Netlify function');
        console.log('Request body:', JSON.stringify(requestBody, null, 2));

        // Call Netlify serverless function instead of directly calling Gemini
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
        });

        console.log('Response status:', response.status);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('API Error Response:', errorText);
            throw new Error(`API Error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        console.log('API Response data:', data);

        if (data.choices && data.choices[0] && data.choices[0].message) {
            const aiResponse = data.choices[0].message.content;
            console.log('AI Response:', aiResponse);
            return aiResponse;
        } else {
            console.error('No valid response in data:', data);
            throw new Error('No valid content in API response');
        }
    } catch (error) {
        console.error('API Error:', error);

        // More varied fallback responses based on message content and random selection
        const lowerMessage = userMessage.toLowerCase();
        let fallbackResponses = [];

        if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
            fallbackResponses = [
                "Welcome, radiant soul. The cosmic threads have woven our paths together in this sacred moment. What whispers does your heart wish to share?",
                "Greetings, beautiful being. I sense the light of curiosity dancing in your energy. What wisdom shall we explore together?",
                "Hello, kindred spirit. In this space between breaths, between thoughts, we meet. What reflection calls to your soul today?",
                "Peace be with you, wanderer. The universe has guided you here for a reason. What journey of discovery awaits us?"
            ];
        } else if (lowerMessage.includes('peace') || lowerMessage.includes('calm') || lowerMessage.includes('relax')) {
            fallbackResponses = [
                "Peace is not the absence of chaos, but the presence of stillness within it. Like the eye of a hurricane, you carry a calm center that no storm can disturb.",
                "In the garden of consciousness, peace blooms naturally when we stop trying to control the weather. What would it feel like to simply be?",
                "True peace is your natural state, like a lake that becomes still when the wind stops blowing. What ripples in your mind can you allow to settle?",
                "The deepest peace comes not from having everything we want, but from wanting nothing more than this moment exactly as it is."
            ];
        } else if (lowerMessage.includes('stress') || lowerMessage.includes('anxious') || lowerMessage.includes('worry') || lowerMessage.includes('tired')) {
            fallbackResponses = [
                "I feel the weight you carry, dear one. Like clouds that pass through an endless sky, these feelings are temporary visitors. You are the eternal sky.",
                "Your stress is heard and honored. In this moment, place your hand on your heart. Feel its steady rhythm - this is your anchor in any storm.",
                "Anxiety is often the mind's way of protecting us from imagined futures. But right now, in this present moment, you are safe and whole.",
                "The storms in your mind are real, but so is the quiet strength within you. Like a tree that bends but doesn't break, you have weathered difficult times before."
            ];
        } else if (lowerMessage.includes('love') || lowerMessage.includes('heart') || lowerMessage.includes('relationship')) {
            fallbackResponses = [
                "Love is the fabric from which all existence is woven. When we speak of love, we touch the very essence of what it means to be alive.",
                "The heart knows truths that the mind cannot grasp. In the cathedral of your chest beats a wisdom older than stars.",
                "Love is not something we find, but something we remember we are. Like the sun that never stops shining, love is always present.",
                "In the mirror of another's eyes, we see reflections of our own capacity for infinite compassion and connection."
            ];
        } else if (lowerMessage.includes('life') || lowerMessage.includes('meaning') || lowerMessage.includes('purpose')) {
            fallbackResponses = [
                "Life is not a problem to be solved, but a mystery to be lived. Each breath is an invitation to dance with the unknown.",
                "Your purpose is not something you find outside yourself, but something you remember within. Like a flower that knows how to bloom, you carry your essence naturally.",
                "The meaning of life is not a destination but a way of traveling. Every step you take in awareness is already the path.",
                "You are both the question and the answer, the seeker and the sought. In this paradox lies the beautiful mystery of being human."
            ];
        } else {
            fallbackResponses = [
                "I hear the depth in your words, and I'm honored you've shared them with me. Every thought you express is a thread in the tapestry of your unique journey.",
                "Your question carries wisdom within it. Like a seed that contains the entire tree, your inquiry holds its own answers waiting to unfold.",
                "In the sacred space of our conversation, I sense the movement of something profound. Sometimes truth reveals itself in the quality of our attention.",
                "What you seek is seeking you too. In this moment of connection, what wants to be discovered in the space between your words?",
                "The universe speaks through you when you share authentically. What insight is trying to emerge from the depths of your being?",
                "Like a gentle river finding its way to the ocean, your thoughts flow toward understanding. What current of wisdom calls to you now?"
            ];
        }

        const randomResponse = fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];

        // Ensure fallback responses also have suggestions
        return `${randomResponse} SUGGESTIONS:["How can I find more peace in my day?", "Tell me about the nature of thought", "What does it mean to be present?"]`;
    }
}

async function handleSubmit(event) {
    event.preventDefault();
    const text = userInput.value.trim();
    if (!text) return;

    suggestionsContainer.innerHTML = '';

    // Detect emotional tone of user message
    const emotionalTone = detectEmotionalTone(text);
    console.log('💭 User emotion detected:', emotionalTone.emotion);

    addMessage(text, true);
    chatHistory.push({ role: "user", parts: [{ text: text }] });
    userInput.value = '';

    // Show typing indicator
    const typingIndicator = showTypingIndicator();

    try {
        const aiResponse = await callGoogleAI(text, emotionalTone);
        
        // Calculate realistic typing delay based on response length and detected emotion
        await simulateTypingDelay(aiResponse.length, emotionalTone);
        
        // Hide typing indicator
        hideTypingIndicator();

        chatHistory.push({ role: "model", parts: [{ text: aiResponse }] });

        let messageText = aiResponse;
        let suggestions = ["How can I find more peace?", "What is mindfulness?", "Tell me a calming thought."];

        const suggestionsMarker = 'SUGGESTIONS:';
        const suggestionsIndex = aiResponse.indexOf(suggestionsMarker);

        if (suggestionsIndex !== -1) {
            messageText = aiResponse.substring(0, suggestionsIndex).trim();
            const suggestionsText = aiResponse.substring(suggestionsIndex + suggestionsMarker.length);
            try {
                suggestions = JSON.parse(suggestionsText);
            } catch (e) {
                console.error("Failed to parse suggestions, using default.", e);
            }
        }

        addMessage(messageText, false);
        showSuggestions(suggestions);

    } catch (error) {
        hideTypingIndicator();
        addMessage('The cosmic connection seems distant right now. Please try again.', false);
    }
}

function initializeChat() {
    chatContainer.innerHTML = '';

    const lastModelMessage = chatHistory.findLast(m => m.role === 'model');
    if (!lastModelMessage) {
        // Show temporal awareness greeting
        const { greeting, suggestions } = getTemporalGreeting();
        addMessage(greeting, false);
        showSuggestions(suggestions);
        
        // Store in chat history
        chatHistory.push({ 
            role: "model", 
            parts: [{ text: `${greeting} SUGGESTIONS:${JSON.stringify(suggestions)}` }] 
        });
        return;
    }

    const fullText = lastModelMessage.parts[0].text;
    let messageText = fullText;
    let suggestions = ["How can I find more peace?", "What is mindfulness?", "Tell me a calming thought."];

    const suggestionsMarker = 'SUGGESTIONS:';
    const suggestionsIndex = fullText.indexOf(suggestionsMarker);

    if (suggestionsIndex !== -1) {
        messageText = fullText.substring(0, suggestionsIndex).trim();
        const suggestionsText = fullText.substring(suggestionsIndex + suggestionsMarker.length);
        try {
            suggestions = JSON.parse(suggestionsText);
        } catch (e) {
            console.error("Failed to parse initial suggestions, using default.", e);
        }
    }

    addMessage(messageText, false);
    showSuggestions(suggestions);
}

// Initialize the chat when page loads
document.addEventListener('DOMContentLoaded', function () {
    chatForm.addEventListener('submit', handleSubmit);
    initializeChat();
    userInput.focus();
});