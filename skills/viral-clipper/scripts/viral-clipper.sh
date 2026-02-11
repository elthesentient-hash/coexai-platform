#!/bin/bash
# viral-clipper.sh - Download and cut viral clips from YouTube videos

VIDEO_URL="$1"
START_TIME="$2"
DURATION="$3"
OUTPUT_NAME="$4"

if [ -z "$VIDEO_URL" ] || [ -z "$START_TIME" ] || [ -z "$DURATION" ] || [ -z "$OUTPUT_NAME" ]; then
    echo "Usage: viral-clipper.sh <video_url> <start_time> <duration> <output_name>"
    echo "Example: viral-clipper.sh https://youtu.be/... 00:01:30 15 clip1.mp4"
    exit 1
fi

yt-dlp --force-ipv4 -f "best[height<=720]" -o "temp_video.%(ext)s" "$VIDEO_URL" && \
ffmpeg -i temp_video.* -ss "$START_TIME" -t "$DURATION" -c copy "$OUTPUT_NAME" -y && \
rm temp_video.* && \
echo "✅ Clip created: $OUTPUT_NAME"
