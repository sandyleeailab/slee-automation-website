const { Client } = require('@notionhq/client');

const notion = new Client({ auth: process.env.NOTION_API_KEY });

module.exports = async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const response = await notion.databases.query({
      database_id: process.env.NOTION_DATABASE_ID,
      filter: {
        property: 'Status',
        select: {
          equals: 'Published'
        }
      },
      sorts: [
        {
          property: 'Publish Date',
          direction: 'descending'
        }
      ]
    });

    const posts = response.results.map(page => {
      // Try to get title from various properties or extract from URL
      let title = '';

      // Check for title in common property names
      const titleProp = page.properties.Title || page.properties.Name || page.properties.title;
      if (titleProp?.title?.[0]?.plain_text) {
        title = titleProp.title[0].plain_text;
      } else if (page.url) {
        // Extract title from Notion URL (format: notion.so/Title-With-Dashes-id)
        const urlParts = page.url.split('/').pop().split('-');
        urlParts.pop(); // Remove the ID at the end
        title = urlParts.join(' ').replace(/\d+$/, '').trim();
      }

      return {
        id: page.id,
        title: title,
        slug: page.properties.Slug?.rich_text?.[0]?.plain_text || '',
        category: page.properties.Category?.select?.name || 'GEO',
        metaDescription: page.properties['Meta Description']?.rich_text?.[0]?.plain_text || '',
        readTime: page.properties['Read Time']?.rich_text?.[0]?.plain_text || '5 min read',
        author: page.properties.Author?.rich_text?.[0]?.plain_text || 'Sandy Lee',
        publishDate: page.properties['Publish Date']?.date?.start || new Date().toISOString().split('T')[0],
        url: page.url
      };
    });

    res.status(200).json(posts);
  } catch (error) {
    console.error('Notion API error:', error);
    res.status(500).json({ error: 'Failed to fetch posts', details: error.message });
  }
};
