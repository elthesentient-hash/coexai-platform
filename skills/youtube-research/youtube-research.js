/**
 * YouTube Research Toolkit
 * Complete YouTube capabilities for AI agents
 */

const axios = require('axios');
const { execSync } = require('child_process');

class YouTubeResearch {
  constructor(apiKey = null) {
    this.apiKey = apiKey;
    this.invidiousBase = 'https://yt.lemnoslife.com';
    this.officialBase = 'https://www.googleapis.com/youtube/v3';
  }

  /**
   * Extract video ID from various YouTube URL formats
   */
  extractVideoId(url) {
    const patterns = [
      /v=([a-zA-Z0-9_-]{11})/,
      /youtu\.be\/([a-zA-Z0-9_-]{11})/,
      /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
      /^([a-zA-Z0-9_-]{11})$/
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    
    return null;
  }

  /**
   * Get video information using Invidious (free, no API key)
   */
  async getVideoInfo(videoUrl) {
    const videoId = this.extractVideoId(videoUrl);
    if (!videoId) throw new Error('Invalid YouTube URL');
    
    try {
      const response = await axios.get(
        `${this.invidiousBase}/videos?part=snippet,statistics&id=${videoId}`
      );
      
      const video = response.data.items[0];
      if (!video) throw new Error('Video not found');
      
      return {
        id: videoId,
        title: video.snippet.title,
        description: video.snippet.description,
        channel: video.snippet.channelTitle,
        channelId: video.snippet.channelId,
        publishedAt: video.snippet.publishedAt,
        views: parseInt(video.statistics.viewCount) || 0,
        likes: parseInt(video.statistics.likeCount) || 0,
        comments: parseInt(video.statistics.commentCount) || 0,
        tags: video.snippet.tags || [],
        category: video.snippet.categoryId,
        thumbnail: video.snippet.thumbnails?.high?.url || video.snippet.thumbnails?.default?.url
      };
    } catch (error) {
      throw new Error(`Failed to get video info: ${error.message}`);
    }
  }

  /**
   * Search YouTube videos
   */
  async searchVideos(query, maxResults = 10) {
    try {
      const response = await axios.get(
        `${this.invidiousBase}/search?q=${encodeURIComponent(query)}&type=video&maxResults=${maxResults}`
      );
      
      return response.data.items
        .filter(item => item.id.videoId)
        .map(item => ({
          id: item.id.videoId,
          title: item.snippet.title,
          channel: item.snippet.channelTitle,
          channelId: item.snippet.channelId,
          publishedAt: item.snippet.publishedAt,
          thumbnail: item.snippet.thumbnails?.medium?.url
        }));
    } catch (error) {
      throw new Error(`Search failed: ${error.message}`);
    }
  }

  /**
   * Get channel information
   */
  async getChannelInfo(channelId) {
    try {
      const response = await axios.get(
        `${this.invidiousBase}/channels?part=snippet,statistics&id=${channelId}`
      );
      
      const channel = response.data.items[0];
      if (!channel) throw new Error('Channel not found');
      
      return {
        id: channelId,
        title: channel.snippet.title,
        description: channel.snippet.description,
        subscribers: parseInt(channel.statistics.subscriberCount) || 0,
        videos: parseInt(channel.statistics.videoCount) || 0,
        views: parseInt(channel.statistics.viewCount) || 0,
        thumbnail: channel.snippet.thumbnails?.medium?.url,
        banner: channel.snippet.bannerExternalUrl,
        country: channel.snippet.country,
        publishedAt: channel.snippet.publishedAt
      };
    } catch (error) {
      throw new Error(`Failed to get channel info: ${error.message}`);
    }
  }

  /**
   * Get video transcript using yt-dlp
   */
  async getTranscript(videoUrl) {
    const videoId = this.extractVideoId(videoUrl);
    if (!videoId) throw new Error('Invalid YouTube URL');
    
    try {
      // Use yt-dlp to extract auto-generated subtitles
      const output = execSync(
        `yt-dlp --skip-download --write-auto-subs --sub-langs en --convert-subs srt -o - "https://youtube.com/watch?v=${videoId}" 2>/dev/null | head -500`,
        { encoding: 'utf-8', timeout: 30000 }
      );
      
      // Parse SRT format
      const lines = output.split('\n');
      const transcript = [];
      let current = { text: '', start: '', end: '' };
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        // Skip empty lines and sequence numbers
        if (!line || /^\d+$/.test(line)) continue;
        
        // Parse timestamp line (00:00:00,000 --> 00:00:05,000)
        if (line.includes('-->')) {
          const parts = line.split('-->');
          current.start = parts[0].trim();
          current.end = parts[1].trim();
        } else {
          // Text line
          current.text += ' ' + line;
          
          // If next line is empty or new entry, push current
          if (!lines[i + 1] || lines[i + 1].trim() === '' || /^\d+$/.test(lines[i + 1])) {
            if (current.text.trim()) {
              transcript.push({
                text: current.text.trim(),
                start: current.start,
                end: current.end
              });
            }
            current = { text: '', start: '', end: '' };
          }
        }
      }
      
      return {
        videoId,
        fullText: transcript.map(t => t.text).join(' '),
        segments: transcript
      };
      
    } catch (error) {
      // Fallback: return video description as transcript
      const videoInfo = await this.getVideoInfo(videoUrl);
      return {
        videoId,
        fullText: videoInfo.description,
        segments: [],
        fallback: true
      };
    }
  }

  /**
   * Get channel videos
   */
  async getChannelVideos(channelId, maxResults = 20) {
    try {
      // Search for videos by channel
      const response = await axios.get(
        `${this.invidiousBase}/search?channelId=${channelId}&type=video&maxResults=${maxResults}`
      );
      
      return response.data.items
        .filter(item => item.id.videoId)
        .map(item => ({
          id: item.id.videoId,
          title: item.snippet.title,
          publishedAt: item.snippet.publishedAt,
          thumbnail: item.snippet.thumbnails?.medium?.url
        }));
    } catch (error) {
      throw new Error(`Failed to get channel videos: ${error.message}`);
    }
  }

  /**
   * Analyze video performance
   */
  async analyzeVideo(videoUrl) {
    const info = await this.getVideoInfo(videoUrl);
    
    // Calculate engagement rate
    const engagementRate = info.views > 0 
      ? ((info.likes + info.comments) / info.views * 100).toFixed(2)
      : 0;
    
    // Days since published
    const daysSince = Math.floor(
      (Date.now() - new Date(info.publishedAt).getTime()) / (1000 * 60 * 60 * 24)
    );
    
    // Daily view rate
    const dailyViews = daysSince > 0 
      ? Math.round(info.views / daysSince)
      : info.views;
    
    return {
      ...info,
      engagementRate: parseFloat(engagementRate),
      daysSincePublished: daysSince,
      dailyViewRate: dailyViews
    };
  }

  /**
   * Research topic - search and analyze top videos
   */
  async researchTopic(query, maxResults = 10) {
    const videos = await this.searchVideos(query, maxResults);
    
    const detailedVideos = [];
    for (const video of videos.slice(0, 5)) {
      try {
        const info = await this.getVideoInfo(video.id);
        detailedVideos.push({
          ...video,
          ...info,
          url: `https://youtube.com/watch?v=${video.id}`
        });
      } catch (e) {
        detailedVideos.push(video);
      }
    }
    
    // Calculate averages
    const avgViews = detailedVideos.reduce((sum, v) => sum + (v.views || 0), 0) / detailedVideos.length;
    const avgLikes = detailedVideos.reduce((sum, v) => sum + (v.likes || 0), 0) / detailedVideos.length;
    
    return {
      query,
      totalResults: videos.length,
      videos: detailedVideos,
      summary: {
        averageViews: Math.round(avgViews),
        averageLikes: Math.round(avgLikes),
        topChannel: detailedVideos[0]?.channel || 'N/A',
        oldestVideo: detailedVideos[detailedVideos.length - 1]?.publishedAt
      }
    };
  }
}

module.exports = YouTubeResearch;

// CLI usage
if (require.main === module) {
  const yt = new YouTubeResearch();
  
  const command = process.argv[2];
  const arg = process.argv[3];
  
  switch (command) {
    case 'info':
      yt.getVideoInfo(arg).then(console.log).catch(console.error);
      break;
    case 'search':
      yt.searchVideos(arg, process.argv[4] || 5).then(console.log).catch(console.error);
      break;
    case 'channel':
      yt.getChannelInfo(arg).then(console.log).catch(console.error);
      break;
    case 'transcript':
      yt.getTranscript(arg).then(console.log).catch(console.error);
      break;
    case 'analyze':
      yt.analyzeVideo(arg).then(console.log).catch(console.error);
      break;
    case 'research':
      yt.researchTopic(arg, process.argv[4] || 10).then(console.log).catch(console.error);
      break;
    default:
      console.log('YouTube Research Toolkit');
      console.log('Commands: info, search, channel, transcript, analyze, research');
  }
}
