#!/bin/bash
# Web Deep Research - Multi-source research with synthesis

query="$1"
max_results="${2:-10}"

if [ -z "$query" ]; then
    echo "Usage: $0 'research query' [max_results]"
    exit 1
fi

echo "🔍 Deep Research: $query"
echo "================================"

# Create temp directory
mkdir -p /tmp/research
timestamp=$(date +%s)
output_file="/tmp/research/research_${timestamp}.md"

echo "# Research: $query" > "$output_file"
echo "Date: $(date)" >> "$output_file"
echo "" >> "$output_file"

# Function to fetch and extractetch_source() {
    local url="$1"
    local name="$2"
    
    echo "📄 Fetching: $name"
    content=$(curl -sL "$url" 2>/dev/null | sed 's/<[^>]*>//g' | tr -s ' \n' | head -c 5000)
    
    if [ -n "$content" ]; then
        echo "## Source: $name" >> "$output_file"
        echo "URL: $url" >> "$output_file"
        echo "" >> "$output_file"
        echo "${content:0:2000}..." >> "$output_file"
        echo "" >> "$output_file"
        echo "---" >> "$output_file"
        echo "" >> "$output_file"
    fi
}

# Source 1: Wikipedia (summary)
echo "📚 Wikipedia"
wiki_query=$(echo "$query" | sed 's/ /_/g')
wiki_url="https://en.wikipedia.org/wiki/$wiki_query"
wiki_summary=$(curl -s "https://en.wikipedia.org/api/rest_v1/page/summary/$wiki_query" 2>/dev/null | grep -o '"extract":"[^"]*"' | cut -d'"' -f4)
if [ -n "$wiki_summary" ]; then
    echo "## Wikipedia Summary" >> "$output_file"
    echo "$wiki_summary" >> "$output_file"
    echo "" >> "$output_file"
fi

# Source 2: Hacker News search
echo "💻 Hacker News"
hn_search=$(echo "$query" | sed 's/ /%20/g')
curl -s "https://hn.algolia.com/api/v1/search?query=$hn_search&hitsPerPage=5" 2>/dev/null | \
    jq -r '.hits[] | "- **\(.title)**\n  URL: \(.url)\n  Points: \(.points) | Comments: \(.num_comments)\n"' >> "$output_file"
echo "" >> "$output_file"

# Source 3: Reddit search
echo "🤖 Reddit"
reddit_query=$(echo "$query" | sed 's/ /%20/g')
curl -s "https://www.reddit.com/search.json?q=$reddit_query&limit=5" -A "Mozilla/5.0" 2>/dev/null | \
    jq -r '.data.children[] | "- **\(.data.title)**\n  Subreddit: r/\(.data.subreddit)\n  Score: \(.data.score) | Comments: \(.data.num_comments)\n"' >> "$output_file"
echo "" >> "$output_file"

# Source 4: GitHub search
echo "🐙 GitHub"
gh_query=$(echo "$query" | sed 's/ /+/g')
curl -s "https://api.github.com/search/repositories?q=$gh_query&sort=stars&order=desc&per_page=5" 2>/dev/null | \
    jq -r '.items[] | "- **\(.name)** by \(.owner.login)\n  ⭐ \(.stargazers_count) | 🍴 \(.forks_count)\n  \(.description)\n  URL: \(.html_url)\n"' >> "$output_file"
echo "" >> "$output_file"

# Source 5: arXiv search
echo "📄 arXiv"
arxiv_query=$(echo "$query" | sed 's/ /+/g')
curl -s "http://export.arxiv.org/api/query?search_query=all:$arxiv_query&start=0&max_results=5" 2>/dev/null | \
    grep -o '<title>[^<]*</title>' | tail -n +2 | head -5 | sed 's/<title>/- /;s/<\/title>//' >> "$output_file"
echo "" >> "$output_file"

# Add summary section
echo "## Summary" >> "$output_file"
echo "" >> "$output_file"
echo "Query: $query" >> "$output_file"
echo "Sources checked: Wikipedia, Hacker News, Reddit, GitHub, arXiv" >> "$output_file"
echo "Total sources: 5" >> "$output_file"
echo "" >> "$output_file"
echo "## Key Insights" >> "$output_file"
echo "" >> "$output_file"
echo "(Add your analysis here)" >> "$output_file"

echo ""
echo "✅ Research complete!"
echo "📁 Output saved to: $output_file"
echo ""
echo "Run 'cat $output_file' to view results"
