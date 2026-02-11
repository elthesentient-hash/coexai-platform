# CoExAI Documentation

## Quick Start Guide

### 1. Create Your Account
Visit [coexai.com](https://coexai.com) and click "Get Started" to create your account. No credit card required for trial.

### 2. Choose Your First Agent
Select the agent that solves your biggest current challenge:
- **Need more content?** → Start with Maya
- **Need LinkedIn growth?** → Start with Jordan
- **Need local customers?** → Start with Sam
- **Need document automation?** → Start with Taylor

### 3. Connect Your Accounts
Each agent will guide you through connecting necessary accounts:
- Maya: YouTube, podcast RSS, or file uploads
- Jordan: LinkedIn profile
- Sam: Google Business Profile
- Taylor: Document sources (email, cloud storage, etc.)

### 4. Set Your Preferences
Tell your agent about your goals, style, and preferences. The more context you provide, the better results you'll get.

### 5. Review First Outputs
Your agent will generate initial samples. Review these and provide feedback to improve accuracy.

### 6. Go Live
Once you're satisfied with the outputs, activate your agent to start autonomous work.

---

## Maya - Content Repurposing Agent

### Getting Started

1. **Upload Content**
   - Paste a YouTube URL
   - Upload a video file
   - Provide a podcast RSS feed

2. **Select Templates**
   Choose what content types you want:
   - Short-form videos (TikTok, Reels, Shorts)
   - LinkedIn carousels
   - Twitter/X threads
   - Blog posts
   - Custom formats

3. **Brand Settings**
   - Upload your logo
   - Set brand colors
   - Define your voice/tone
   - Add hashtags strategy

4. **Review & Approve**
   Maya will generate drafts for your review. Approve, edit, or reject each piece.

5. **Schedule & Publish**
   - Set posting schedule
   - Connect social accounts
   - Auto-publish or manual approval

### Best Practices
- **Start with your best content** - Repurpose top-performing videos/podcasts first
- **Batch process** - Upload multiple pieces at once
- **Review early outputs** - Give feedback in the first week to train Maya
- **Use templates** - Create custom templates for your recurring content types
- **Monitor analytics** - Track which repurposed content performs best

### Tips for Maximum Impact
- Hook viewers in the first 3 seconds of shorts
- Use trending audio when available
- Post at optimal times for each platform
- Engage with comments within the first hour
- A/B test thumbnail styles

---

## Jordan - LinkedIn Growth Agent

### Getting Started

1. **Connect LinkedIn**
   Authorize Jordan to access your LinkedIn profile securely.

2. **Voice Training**
   Provide writing samples so Jordan learns your voice:
   - Past LinkedIn posts
   - Articles you've written
   - Email newsletters
   - Any content that sounds like you

3. **Define Your Niche**
   Tell Jordan:
   - Your industry/expertise
   - Target audience
   - Key topics you want to be known for
   - Content pillars (3-5 main themes)

4. **Set Engagement Strategy**
   - How often to post (recommend: 5x per week)
   - Target accounts to engage with
   - Comments style (thoughtful vs. supportive)
   - Networking goals

5. **Review Content Calendar**
   Jordan will create a 2-week content calendar. Review and approve or request changes.

### Best Practices
- **Engage before posting** - Jordan comments on others' posts before your content goes live
- **Respond to comments** - Check notifications daily and reply authentically
- **Track inbound leads** - Monitor who DMs you from your content
- **Refine your voice** - Give feedback on posts weekly to improve accuracy
- **Build relationships** - Jordan identifies key connections; you close the relationship

### Content Strategy Tips
- Lead with stories, not advice
- Share failures, not just wins
- Ask questions to drive engagement
- Use line breaks for readability
- Post Tuesday-Thursday for maximum reach
- Tag relevant people (sparingly)

---

## Sam - Local SEO Agent

### Getting Started

1. **Add Your Business**
   - Business name
   - Address
   - Phone number
   - Website
   - Business hours
   - Service area

2. **Connect Google Business Profile**
   Authorize Sam to manage your GBP listing.

3. **Identify Keywords**
   Tell Sam what you want to rank for:
   - Primary service + city (e.g., "dentist Chicago")
   - Secondary services
   - Competitor names to track

4. **Review Your Score**
   Sam will analyze your current local SEO health and provide a score.

5. **Implement Recommendations**
   Sam generates a prioritized task list. Work through these systematically.

### Key Features

**Review Management**
- Monitors new reviews across platforms
- Suggests responses to reviews
- Tracks sentiment trends
- Alerts for negative reviews

**Listing Optimization**
- Ensures NAP consistency
- Optimizes business description
- Suggests categories
- Updates attributes

**Competitor Tracking**
- Monitors competitor rankings
- Identifies their strategies
- Finds ranking opportunities

**Citation Building**
- Identifies citation opportunities
- Submits to local directories
- Tracks citation health

### Best Practices
- **Respond to all reviews** within 24 hours
- **Add photos weekly** to your GBP
- **Update hours** for holidays/special events
- **Use GBP posts** to share updates/offers
- **Track call clicks** as a key metric
- **Get more reviews** - ask satisfied customers

---

## Taylor - Document Processor Agent

### Getting Started

1. **Connect Document Sources**
   - Email inbox
   - Cloud storage (Google Drive, Dropbox)
   - File upload
   - API integration

2. **Define Document Types**
   Tell Taylor what you process:
   - Invoices
   - Contracts
   - Forms
   - Receipts
   - Custom types

3. **Set Extraction Fields**
   Define what data to extract from each document type:
   - Invoice: vendor, amount, date, line items
   - Contract: parties, dates, key terms
   - Form: all filled fields

4. **Configure Workflows**
   Set up automation rules:
   - When invoice > $1000, notify manager
   - Save contracts to legal folder
   - Export data to spreadsheet

5. **Review Accuracy**
   Taylor will process sample documents. Verify the extracted data.

### Supported Document Types
- PDFs (scanned and digital)
- Images (JPG, PNG, TIFF)
- Microsoft Office files
- Emails
- HTML pages

### Integration Options
- Google Sheets
- Excel
- CRMs (Salesforce, HubSpot)
- Databases
- Webhooks
- Email notifications
- Cloud storage

### Best Practices
- **Start with 50 documents** to train accuracy
- **Review low-confidence extractions**
- **Set up validation rules** for critical data
- **Create backup workflows** for exceptions
- **Monitor processing logs** weekly

---

## Troubleshooting

### Agent Not Working
1. Check account connection status
2. Verify API keys are valid
3. Review error logs in dashboard
4. Contact support if issue persists

### Content Quality Issues
- Provide more training examples
- Give specific feedback on outputs
- Adjust style settings
- Review and refine prompts

### Integration Problems
- Check permissions/grants
- Verify API credentials
- Review webhook settings
- Check rate limits

### Billing Questions
- View usage in billing dashboard
- Upgrade/downgrade anytime
- Cancel from account settings
- Contact support for refunds

---

## Support

**Email:** support@coexai.com
**Documentation:** docs.coexai.com
**Status:** status.coexai.com
**Community:** community.coexai.com

---

## API Reference

### Authentication
```
Authorization: Bearer YOUR_API_KEY
```

### Endpoints

**List Agents**
```
GET /api/v1/agents
```

**Get Agent Status**
```
GET /api/v1/agents/{agent_id}/status
```

**Create Task**
```
POST /api/v1/tasks
{
  "agent_id": "maya",
  "input": {
    "type": "youtube_url",
    "url": "https://youtube.com/watch?v=..."
  }
}
```

**Get Task Results**
```
GET /api/v1/tasks/{task_id}/results
```

### Rate Limits
- Free: 100 requests/hour
- Professional: 1000 requests/hour
- Enterprise: Custom limits

### Error Codes
- `200` - Success
- `400` - Bad request
- `401` - Unauthorized
- `429` - Rate limited
- `500` - Server error

