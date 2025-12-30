# Slee Automation Blog Automation Setup

This guide walks you through setting up automated blog post generation using n8n and Notion.

## Overview

- **n8n** generates SEO/GEO blog posts using Claude AI (3x per week)
- **Notion** stores and manages your blog posts
- **Website** displays posts from Notion (with static fallback)

---

## Step 1: Create Notion Database

1. Go to https://notion.so and create a new page called "Blog Posts"
2. Convert it to a Database (Table view)
3. Add these properties:

| Property Name | Type | Required |
|--------------|------|----------|
| Title | Title | Yes |
| Slug | Text | Yes |
| Category | Select (GEO, SEO, Strategy) | Yes |
| Meta Description | Text | Yes |
| Read Time | Text | Yes |
| Author | Text | Yes |
| Publish Date | Date | Yes |
| Status | Select (Draft, Published) | Yes |

4. The page content will contain the full article

---

## Step 2: Create Notion Integration

1. Go to https://www.notion.so/my-integrations
2. Click "New integration"
3. Name: `Slee Blog Automation`
4. Select your workspace
5. Capabilities: Read content, Update content, Insert content
6. Click "Submit"
7. Copy the **Internal Integration Token** (starts with `secret_`)

### Connect Database to Integration

1. Open your Blog Posts database in Notion
2. Click "..." menu → "Add connections"
3. Select "Slee Blog Automation"

### Get Database ID

1. Open your Blog Posts database
2. Copy the URL, it looks like: `https://notion.so/your-workspace/abc123def456?v=...`
3. The Database ID is the part before the `?` (e.g., `abc123def456`)

---

## Step 3: Set Up n8n Workflow

### Add Credentials

1. In n8n, go to Settings → Credentials
2. Add **Anthropic API** credential:
   - API Key: Your Claude API key
3. Add **Notion API** credential:
   - API Token: Your Notion integration token (starts with `secret_`)

### Import Workflow

1. In n8n, go to Workflows
2. Click "Import from file"
3. Select `n8n-blog-workflow.json` from this folder
4. Update these values in the workflow:
   - **Notion node**: Replace `YOUR_NOTION_DATABASE_ID` with your database ID
   - **Claude node**: Ensure Anthropic credential is connected

### Configure Schedule

The workflow is set to run Mon/Wed/Fri at 9 AM. To change:

1. Click the Schedule node
2. Adjust the cron expression or interval

---

## Step 4: Create Vercel API Route (Optional)

To fetch Notion posts dynamically on your website, create this API route:

Create file: `api/blog-posts.js`

```javascript
const { Client } = require('@notionhq/client');

const notion = new Client({ auth: process.env.NOTION_API_KEY });

export default async function handler(req, res) {
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

    const posts = response.results.map(page => ({
      id: page.id,
      title: page.properties.Title?.title[0]?.plain_text || '',
      slug: page.properties.Slug?.rich_text[0]?.plain_text || '',
      category: page.properties.Category?.select?.name || 'SEO',
      metaDescription: page.properties['Meta Description']?.rich_text[0]?.plain_text || '',
      readTime: page.properties['Read Time']?.rich_text[0]?.plain_text || '5 min read',
      author: page.properties.Author?.rich_text[0]?.plain_text || 'Sandy Lee',
      publishDate: page.properties['Publish Date']?.date?.start || ''
    }));

    res.status(200).json(posts);
  } catch (error) {
    console.error('Notion API error:', error);
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
}
```

### Add Environment Variables to Vercel

```
NOTION_API_KEY=secret_xxxxxxxxxxxxx
NOTION_DATABASE_ID=your_database_id
```

---

## Step 5: Test the Workflow

1. In n8n, open the workflow
2. Click "Execute Workflow" (manual trigger for testing)
3. Check Notion to see if the post was created
4. Check your blog page to see if it appears

---

## Credentials Summary

Save these somewhere secure:

```
NOTION_API_KEY=secret_xxxxxxxxxxxxx
NOTION_DATABASE_ID=xxxxxxxxxxxxx
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxx
```

---

## Blog Topics

The workflow rotates through 25+ SEO/GEO topics:

- What is GEO?
- How to get cited by ChatGPT
- SEO vs GEO comparison
- Schema markup for AI
- Technical SEO checklist
- Entity optimization
- Featured snippets guide
- AI Overviews optimization
- And more...

To add topics, edit the "Select Random Topic" node in n8n.

---

## Troubleshooting

**Posts not appearing on website?**
- Check the API route URL in blog.html
- Verify Notion API credentials in Vercel
- Check browser console for errors

**n8n workflow failing?**
- Check Anthropic API credits
- Verify Notion integration has database access
- Check execution logs in n8n

**Schedule not triggering?**
- Ensure n8n is running (self-hosted) or active (cloud)
- Check timezone settings
