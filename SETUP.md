# CoExAI Setup Instructions

## 1. Supabase Setup

1. Create account at https://supabase.com
2. Create new project
3. Go to SQL Editor
4. Run the schema: `database/schema.sql`
5. Copy Project URL and Anon Key to `.env.local`

## 2. Stripe Setup

1. Create account at https://stripe.com
2. Get API keys from Developers > API Keys
3. Create 5 products:
   - Alex ($2,000/mo)
   - Maya ($1,500/mo)
   - Jordan ($1,000/mo)
   - Sam ($800/mo)
   - Taylor ($497/mo)
4. Copy price IDs to `.env.local`

## 3. OpenAI Setup

1. Get API key from https://platform.openai.com
2. Add to `.env.local`

## 4. Twilio Setup (for Alex)

1. Create account at https://twilio.com
2. Get Account SID and Auth Token
3. Buy a phone number
4. Add credentials to `.env.local`

## 5. Local Development

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local

# Edit .env.local with your keys

# Run development server
npm run dev
```

## 6. Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

## Testing Maya

```bash
# Set your OpenAI key
export OPENAI_API_KEY=sk-...

# Run test
node test-maya.js "https://youtube.com/watch?v=..."
```

## File Structure

```
├── agents/
│   ├── alex/         # Appointment setter
│   ├── maya/         # Content creator
│   ├── jordan/       # LinkedIn growth
│   ├── sam/          # Local SEO
│   └── taylor/       # Document processor
├── api/              # API routes
├── components/       # React components
├── database/         # SQL schema
├── pages/            # Next.js pages
├── public/           # Static assets
└── styles/           # CSS files
```

## Next Steps

1. ✅ Database schema created
2. ✅ Maya core functions ready
3. ⏳ Next: Build dashboard UI
4. ⏳ Next: Add Stripe payments
5. ⏳ Next: Test Maya end-to-end
6. ⏳ Next: Build Alex agent
7. ⏳ Next: Build Jordan, Sam, Taylor

## Support

Questions? Contact: hello@coexai.com
