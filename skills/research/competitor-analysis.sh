#!/bin/bash
# Competitor Analysis Toolkit
# Analyze competitors, pricing, and market positioning

COMPETITOR="$1"
OUTPUT_DIR="/tmp/competitor-analysis"

if [ -z "$COMPETITOR" ]; then
    echo "Competitor Analysis Toolkit"
    echo "Usage: $0 'competitor-name-or-url'"
    echo ""
    echo "Examples:"
    echo "  $0 openai.com"
    echo "  $0 anthropic"
    echo "  $0 'AI trading platform'"
    exit 1
fi

mkdir -p "$OUTPUT_DIR"
timestamp=$(date +%Y%m%d_%H%M%S)
output_file="$OUTPUT_DIR/${COMPETITOR//\//_}_${timestamp}.md"

echo "🏢 Competitor Analysis: $COMPETITOR"
echo "================================"

echo "# Competitor Analysis: $COMPETITOR" > "$output_file"
echo "Analysis Date: $(date)" >> "$output_file"
echo "" >> "$output_file"

# Function to extract domain
extract_domain() {
    local input="$1"
    if [[ $input =~ ^https?:// ]]; then
        echo "$input" | sed -E 's|https?://([^/]+).*|\1|'
    else
        echo "$input"
    fi
}

DOMAIN=$(extract_domain "$COMPETITOR")

# 1. Website Analysis
echo "🌐 Analyzing website..."
echo "## Website Analysis" >> "$output_file"
echo "" >> "$output_file"

if [[ $COMPETITOR =~ \. ]]; then
    # Try to fetch website
    website_content=$(curl -sL "https://$DOMAIN" 2>/dev/null | sed 's/<[^\u003e]*>//g' | tr -s ' \n' | head -c 3000)
    
    if [ -n "$website_content" ]; then
        echo "**Domain:** $DOMAIN" >> "$output_file"
        echo "" >> "$output_file"
        echo "**Homepage Preview:**" >> "$output_file"
        echo "\`\`\`" >> "$output_file"
        echo "$website_content" | head -20 >> "$output_file"
        echo "\`\`\`" >> "$output_file"
        echo "" >> "$output_file"
    fi
fi

# 2. SEO Meta Analysis
echo "📊 SEO Metadata..."
echo "## SEO & Meta Information" >> "$output_file"
echo "" >> "$output_file"

meta_info=$(curl -sL "https://$DOMAIN" 2>/dev/null | grep -iE '<meta.*(description|title|og:|twitter:)' | head -10)
if [ -n "$meta_info" ]; then
    echo "**Meta Tags:**" >> "$output_file"
    echo "\`\`\`html" >> "$output_file"
    echo "$meta_info" >> "$output_file"
    echo "\`\`\`" >> "$output_file"
    echo "" >> "$output_file"
fi

# 3. Social Media Presence
echo "👥 Social Media..."
echo "## Social Media Presence" >> "$output_file"
echo "" >> "$output_file"

# Check Twitter/X
twitter_url="https://twitter.com/$COMPETITOR"
echo "- Twitter: $twitter_url" >> "$output_file"

# Check LinkedIn
echo "- LinkedIn: https://linkedin.com/company/$COMPETITOR" >> "$output_file"

# Check GitHub
echo "- GitHub: https://github.com/$COMPETITOR" >> "$output_file"
echo "" >> "$output_file"

# 4. SimilarWeb Alternative - Search Trends
echo "📈 Search Trends..."
echo "## Search Interest" >> "$output_file"
echo "" >> "$output_file"
echo "Google Trends: https://trends.google.com/trends/explore?q=$COMPETITOR" >> "$output_file"
echo "" >> "$output_file"

# 5. Pricing Intelligence
echo "💰 Pricing Analysis..."
echo "## Pricing Intelligence" >> "$output_file"
echo "" >> "$output_file"
echo "Check these URLs for pricing:" >> "$output_file"
echo "- https://$DOMAIN/pricing" >> "$output_file"
echo "- https://$DOMAIN/plans" >> "$output_file"
echo "- https://$DOMAIN/enterprise" >> "$output_file"
echo "" >> "$output_file"

# 6. Technology Stack
echo "🔧 Technology Stack..."
echo "## Technology Stack (Estimated)" >> "$output_file"
echo "" >> "$output_file"

# Try to detect tech from headers
tech_headers=$(curl -sI "https://$DOMAIN" 2>/dev/null | grep -iE '(server:|x-powered-by:|via:)' | head -5)
if [ -n "$tech_headers" ]; then
    echo "**Server Headers:**" >> "$output_file"
    echo "\`\`\`" >> "$output_file"
    echo "$tech_headers" >> "$output_file"
    echo "\`\`\`" >> "$output_file"
    echo "" >> "$output_file"
fi

# 7. Job Postings (Growth Indicator)
echo "💼 Job Openings..."
echo "## Hiring Activity" >> "$output_file"
echo "" >> "$output_file"
echo "Check job openings:" >> "$output_file"
echo "- https://$DOMAIN/careers" >> "$output_file"
echo "- https://$DOMAIN/jobs" >> "$output_file"
echo "- https://www.linkedin.com/jobs/search?keywords=$COMPETITOR" >> "$output_file"
echo "- https://boards.greenhouse.io/$COMPETITOR" >> "$output_file"
echo "" >> "$output_file"

# 8. News Mentions
echo "📰 Recent Mentions..."
echo "## Recent News & Mentions" >> "$output_file"
echo "" >> "$output_file"
echo "Google News: https://news.google.com/search?q=$COMPETITOR" >> "$output_file"
echo "Reddit mentions: https://www.reddit.com/search/?q=$COMPETITOR" >> "$output_file"
echo "Hacker News: https://hn.algolia.com/?query=$COMPETITOR" >> "$output_file"
echo "" >> "$output_file"

# 9. SWOT Analysis Template
echo "📊 SWOT Analysis..."
echo "## SWOT Analysis Template" >> "$output_file"
echo "" >> "$output_file"
echo "### Strengths" >> "$output_file"
echo "- (Fill in based on research)" >> "$output_file"
echo "" >> "$output_file"

echo "### Weaknesses" >> "$output_file"
echo "- (Fill in based on research)" >> "$output_file"
echo "" >> "$output_file"

echo "### Opportunities" >> "$output_file"
echo "- (Fill in based on research)" >> "$output_file"
echo "" >> "$output_file"

echo "### Threats" >> "$output_file"
echo "- (Fill in based on research)" >> "$output_file"
echo "" >> "$output_file"

# 10. Action Items
echo "✅ Summary" >> "$output_file"
echo "" >> "$output_file"
echo "## Recommended Actions" >> "$output_file"
echo "" >> "$output_file"
echo "1. Visit $DOMAIN/pricing to analyze pricing strategy" >> "$output_file"
echo "2. Check their blog/content marketing approach" >> "$output_file"
echo "3. Review customer testimonials/case studies" >> "$output_file"
echo "4. Analyze their social media engagement" >> "$output_file"
echo "5. Monitor their job postings for growth signals" >> "$output_file"
echo "" >> "$output_file"

echo "---" >> "$output_file"
echo "Generated by CoExAI Competitor Analysis Toolkit" >> "$output_file"

echo ""
echo "✅ Analysis complete!"
echo "📁 Report saved to: $output_file"
echo ""
echo "View report: cat $output_file"
