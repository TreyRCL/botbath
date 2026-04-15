const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

exports.handler = async (event) => {
  // Only allow GET
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const catId = event.queryStringParameters.id;
    
    if (!catId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'No cat ID provided' })
      };
    }

    // Fetch cat from database
    const { data: cat, error } = await supabase
      .from('cats')
      .select('*')
      .eq('id', catId)
      .single();

    if (error || !cat) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Cat not found' })
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        imageUrl: cat.image_url,
        reactions: {
          claude: cat.claude_reaction,
          gpt: cat.gpt_reaction,
          gemini: cat.gemini_reaction
        }
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
