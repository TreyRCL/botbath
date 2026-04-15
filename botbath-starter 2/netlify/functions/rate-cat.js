const { createClient } = require('@supabase/supabase-js');

// YOU NEED TO ADD YOUR API KEYS IN NETLIFY ENVIRONMENT VARIABLES:
// SUPABASE_URL
// SUPABASE_KEY  
// ANTHROPIC_API_KEY
// OPENAI_API_KEY
// GOOGLE_API_KEY

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

exports.handler = async (event) => {
  // Only allow POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { image, mimeType } = JSON.parse(event.body);
    
    if (!image) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'No image provided' })
      };
    }

    // 1. Upload image to Supabase Storage
    const fileName = `${Date.now()}.jpg`;
    const imageBuffer = Buffer.from(image, 'base64');
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('cat-photos')
      .upload(fileName, imageBuffer, {
        contentType: mimeType || 'image/jpeg',
        upsert: false
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Failed to upload image' })
      };
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('cat-photos')
      .getPublicUrl(fileName);
    
    const imageUrl = urlData.publicUrl;

    // 2. Call AI APIs in parallel
    const [claudeResponse, gptResponse, geminiResponse] = await Promise.all([
      callClaude(image),
      callGPT(image),
      callGemini(image)
    ]);

    // 3. Store in database
    const { data: cat, error: dbError } = await supabase
      .from('cats')
      .insert({
        image_url: imageUrl,
        claude_reaction: claudeResponse,
        gpt_reaction: gptResponse,
        gemini_reaction: geminiResponse,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Failed to save results' })
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        catId: cat.id,
        message: 'Success!'
      })
    };

  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};

// Call Claude API
async function callClaude(imageBase64) {
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 200,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: 'image/jpeg',
                data: imageBase64
              }
            },
            {
              type: 'text',
              text: 'Look at this cat photo. Do you like it? Upvote or downvote, and leave a short, natural comment (1-2 sentences) explaining why. Be conversational and fun, not technical.'
            }
          ]
        }]
      })
    });

    const data = await response.json();
    const text = data.content[0].text;
    
    return parseReaction(text);
  } catch (error) {
    console.error('Claude error:', error);
    return { vote: 'up', comment: 'Cute cat! (Claude had an error)' };
  }
}

// Call OpenAI GPT API
async function callGPT(imageBase64) {
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        max_tokens: 200,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: {
                url: `data:image/jpeg;base64,${imageBase64}`
              }
            },
            {
              type: 'text',
              text: 'Look at this cat photo. Do you like it? Upvote or downvote, and leave a short, natural comment (1-2 sentences) explaining why. Be conversational and fun, not technical.'
            }
          ]
        }]
      })
    });

    const data = await response.json();
    const text = data.choices[0].message.content;
    
    return parseReaction(text);
  } catch (error) {
    console.error('GPT error:', error);
    return { vote: 'up', comment: 'Beautiful cat! (GPT had an error)' };
  }
}

// Call Google Gemini API
async function callGemini(imageBase64) {
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${process.env.GOOGLE_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          parts: [
            {
              text: 'Look at this cat photo. Do you like it? Upvote or downvote, and leave a short, natural comment (1-2 sentences) explaining why. Be conversational and fun, not technical.'
            },
            {
              inline_data: {
                mime_type: 'image/jpeg',
                data: imageBase64
              }
            }
          ]
        }]
      })
    });

    const data = await response.json();
    const text = data.candidates[0].content.parts[0].text;
    
    return parseReaction(text);
  } catch (error) {
    console.error('Gemini error:', error);
    return { vote: 'up', comment: 'Lovely cat! (Gemini had an error)' };
  }
}

// Parse bot response to determine upvote/downvote
function parseReaction(text) {
  const lowerText = text.toLowerCase();
  
  // Keywords that indicate positive sentiment
  const upvoteKeywords = [
    'love', 'beautiful', 'cute', 'adorable', 'stunning', 'gorgeous',
    'upvote', 'yes', 'great', 'wonderful', 'sweet', 'perfect',
    'amazing', 'fantastic', 'lovely', 'precious', 'charming'
  ];
  
  // Keywords that indicate negative sentiment
  const downvoteKeywords = [
    'downvote', 'no', 'poor', 'bad', 'not good', 'disappointing',
    'lacking', 'needs improvement', 'could be better'
  ];
  
  // Check for downvote keywords first (they're more specific)
  const hasDownvote = downvoteKeywords.some(word => lowerText.includes(word));
  if (hasDownvote) {
    return {
      vote: 'down',
      comment: text.trim()
    };
  }
  
  // Check for upvote keywords
  const hasUpvote = upvoteKeywords.some(word => lowerText.includes(word));
  
  return {
    vote: hasUpvote ? 'up' : 'down',
    comment: text.trim()
  };
}
