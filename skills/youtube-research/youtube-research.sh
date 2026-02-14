#!/bin/bash
# YouTube Research Toolkit - CLI Interface
# Usage: ./youtube-research.sh [command] [args]

API_BASE="https://yt.lemnoslife.com"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Extract video ID from URL
extract_video_id() {
    local url="$1"
    local video_id=""
    
    # Handle various YouTube URL formats
    if [[ $url =~ v=([^\&]+) ]]; then
        video_id="${BASH_REMATCH[1]}"
    elif [[ $url =~ youtu\.be/([^\?]+) ]]; then
        video_id="${BASH_REMATCH[1]}"
    elif [[ $url =~ youtube\.com/shorts/([^\?]+) ]]; then
        video_id="${BASH_REMATCH[1]}"
    elif [[ $url =~ ^[a-zA-Z0-9_-]{11}$ ]]; then
        video_id="$url"
    fi
    
    echo "$video_id"
}

# Get video info
video_info() {
    local video_id=$(extract_video_id "$1")
    
    if [ -z "$video_id" ]; then
        echo -e "${RED}Error: Could not extract video ID${NC}"
        exit 1
    fi
    
    echo -e "${YELLOW}Fetching video info...${NC}"
    
    curl -s "${API_BASE}/videos?part=snippet,statistics&id=${video_id}" | jq -r '
        .items[0] | {
            title: .snippet.title,
            channel: .snippet.channelTitle,
            published: .snippet.publishedAt,
            views: .statistics.viewCount,
            likes: .statistics.likeCount,
            comments: .statistics.commentCount
        } | "Title: \(.title)\nChannel: \(.channel)\nPublished: \(.published)\nViews: \(.views)\nLikes: \(.likes)\nComments: \(.comments)"
    '
}

# Search YouTube
search_videos() {
    local query="$1"
    local max_results="${2:-5}"
    
    echo -e "${YELLOW}Searching YouTube for: $query${NC}"
    
    curl -s "${API_BASE}/search?q=$(echo "$query" | sed 's/ /+/g')&type=video&maxResults=${max_results}" | jq -r '
        .items[] | select(.id.videoId != null) | 
        "[\(.id.videoId)] \(.snippet.title)"
    '
}

# Get channel info
channel_info() {
    local channel_id="$1"
    
    echo -e "${YELLOW}Fetching channel info...${NC}"
    
    curl -s "${API_BASE}/channels?part=snippet,statistics&id=${channel_id}" | jq -r '
        .items[0] | {
            title: .snippet.title,
            description: .snippet.description,
            subscribers: .statistics.subscriberCount,
            videos: .statistics.videoCount,
            views: .statistics.viewCount
        } | "Title: \(.title)\nSubscribers: \(.subscribers)\nVideos: \(.videos)\nTotal Views: \(.views)"
    '
}

# Get video transcript (using yt-dlp if available)
get_transcript() {
    local video_id=$(extract_video_id "$1")
    
    if command -v yt-dlp >/dev/null 2>&1; then
        echo -e "${YELLOW}Fetching transcript...${NC}"
        yt-dlp --skip-download --print "%(title)s" --write-auto-subs --sub-langs en --convert-subs srt -o - "https://youtube.com/watch?v=${video_id}" 2>/dev/null | head -100
    else
        echo -e "${RED}yt-dlp not installed. Install with: pip install yt-dlp${NC}"
        echo "Alternative: Use YouTube's transcript API directly"
    fi
}

# Main command handler
case "${1:-}" in
    info|i)
        video_info "$2"
        ;;
    search|s)
        search_videos "$2" "$3"
        ;;
    channel|c)
        channel_info "$2"
        ;;
    transcript|t)
        get_transcript "$2"
        ;;
    help|--help|-h|"")
        echo "YouTube Research Toolkit"
        echo ""
        echo "Usage:"
        echo "  $0 info <video_url>       - Get video information"
        echo "  $0 search <query> [n]     - Search YouTube (default 5 results)"
        echo "  $0 channel <channel_id>  - Get channel information"
        echo "  $0 transcript <video_url> - Get video transcript"
        echo ""
        echo "Examples:"
        echo "  $0 info https://youtube.com/watch?v=dQw4w9WgXcQ"
        echo "  $0 search 'AI trading bots' 10"
        echo "  $0 channel UC_x5XG1OV2P6uZZ5FSM9Ttw"
        ;;
    *)
        echo -e "${RED}Unknown command: $1${NC}"
        echo "Run '$0 help' for usage"
        exit 1
        ;;
esac
