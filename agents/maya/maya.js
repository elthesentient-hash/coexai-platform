// Maya AI Content Creator - Core Functions
// This module handles video processing, transcription, and content generation

const OpenAI = require('openai');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const util = require('util');

const execPromise = util.promisify(exec);

class MayaAgent {
    constructor(apiKey) {
        this.openai = new OpenAI({ apiKey });
        this.tempDir = path.join(__dirname, '../temp');
        
        // Ensure temp directory exists
        if (!fs.existsSync(this.tempDir)) {
            fs.mkdirSync(this.tempDir, { recursive: true });
        }
    }

    /**
     * Process a YouTube video and generate content
     * @param {string} videoUrl - YouTube URL
     * @param {string} userId - User ID for tracking
     * @returns {Promise<Object>} Generated content
     */
    async processVideo(videoUrl, userId) {
        const projectId = Date.now().toString();
        const outputPath = path.join(this.tempDir, `${projectId}`);
        
        try {
            console.log(`[Maya] Starting processing for: ${videoUrl}`);
            
            // Step 1: Download video
            const videoPath = await this.downloadVideo(videoUrl, outputPath);
            
            // Step 2: Extract audio
            const audioPath = await this.extractAudio(videoPath, outputPath);
            
            // Step 3: Transcribe with Whisper
            const transcript = await this.transcribeAudio(audioPath);
            
            // Step 4: Generate content with GPT-4
            const content = await this.generateContent(transcript);
            
            // Step 5: Cleanup
            await this.cleanup(outputPath);
            
            return {
                success: true,
                projectId,
                transcript,
                content,
                metadata: {
                    videoUrl,
                    processedAt: new Date().toISOString(),
                    userId
                }
            };
            
        } catch (error) {
            console.error('[Maya] Processing error:', error);
            await this.cleanup(outputPath).catch(() => {});
            throw error;
        }
    }

    /**
     * Download YouTube video
     */
    async downloadVideo(url, outputPath) {
        const videoFile = path.join(outputPath, 'video.mp4');
        
        console.log('[Maya] Downloading video...');
        
        // Use yt-dlp to download
        const command = `yt-dlp -f "best[height<=720]" -o "${videoFile}" "${url}"`;
        
        try {
            await execPromise(command);
            
            if (!fs.existsSync(videoFile)) {
                throw new Error('Video download failed');
            }
            
            return videoFile;
        } catch (error) {
            console.error('[Maya] Download error:', error);
            throw new Error('Failed to download video. Please check the URL.');
        }
    }

    /**
     * Extract audio from video
     */
    async extractAudio(videoPath, outputPath) {
        const audioFile = path.join(outputPath, 'audio.mp3');
        
        console.log('[Maya] Extracting audio...');
        
        const command = `ffmpeg -i "${videoPath}" -vn -acodec libmp3lame -q:a 2 "${audioFile}"`;
        
        try {
            await execPromise(command);
            return audioFile;
        } catch (error) {
            console.error('[Maya] Audio extraction error:', error);
            throw new Error('Failed to extract audio');
        }
    }

    /**
     * Transcribe audio using Whisper
     */
    async transcribeAudio(audioPath) {
        console.log('[Maya] Transcribing audio...');
        
        try {
            const transcription = await this.openai.audio.transcriptions.create({
                file: fs.createReadStream(audioPath),
                model: 'whisper-1',
                response_format: 'text'
            });
            
            return transcription;
        } catch (error) {
            console.error('[Maya] Transcription error:', error);
            throw new Error('Failed to transcribe audio');
        }
    }

    /**
     * Generate content from transcript
     */
    async generateContent(transcript) {
        console.log('[Maya] Generating content...');
        
        const prompt = `You are an expert content creator. Transform the following video transcript into multiple content pieces.

TRANSCRIPT:
${transcript}

Generate the following:
1. FIVE engaging Twitter/X posts (each under 280 characters, include hooks)
2. THREE LinkedIn carousel slide descriptions (educational, professional tone)
3. TWO short video scripts (15-30 seconds, viral hooks)
4. ONE blog post outline with 5 key points
5. TEN relevant hashtags organized by platform

Format as JSON:
{
  "tweets": [{"text": "...", "hook": "..."}],
  "carousel": [{"slide": 1, "content": "..."}],
  "videoScripts": [{"duration": "15s", "script": "..."}],
  "blogOutline": {"title": "...", "points": [...]},
  "hashtags": {"twitter": [...], "linkedin": [...], "instagram": [...]}
}`;

        try {
            const completion = await this.openai.chat.completions.create({
                model: 'gpt-4-turbo-preview',
                messages: [
                    {
                        role: 'system',
                        content: 'You are an expert content marketer who creates viral, engaging content that drives engagement and conversions.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.8,
                response_format: { type: 'json_object' }
            });
            
            const content = JSON.parse(completion.choices[0].message.content);
            return content;
            
        } catch (error) {
            console.error('[Maya] Content generation error:', error);
            throw new Error('Failed to generate content');
        }
    }

    /**
     * Generate a single tweet variation
     */
    async generateTweet(transcript, style = 'educational') {
        const styles = {
            educational: 'Share valuable insights and teach something',
            storytelling: 'Use a personal story or anecdote',
            controversial: 'Challenge common beliefs (respectfully)',
            humorous: 'Add humor and personality',
            inspirational: 'Motivate and inspire action'
        };

        const prompt = `Create a viral tweet based on this content. Style: ${styles[style]}

Content: ${transcript.substring(0, 2000)}

Requirements:
- Under 280 characters
- Strong hook in first 5 words
- Include call-to-action
- Make it shareable

Return only the tweet text.`;

        const completion = await this.openai.chat.completions.create({
            model: 'gpt-4-turbo-preview',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.9,
            max_tokens: 150
        });

        return completion.choices[0].message.content.trim();
    }

    /**
     * Generate carousel slides
     */
    async generateCarousel(transcript, numSlides = 5) {
        const prompt = `Create a LinkedIn carousel post with ${numSlides} slides based on this content:

${transcript.substring(0, 3000)}

Each slide should:
- Have a clear, concise message
- Use bullet points where appropriate
- Build on the previous slide
- End with a strong CTA on the last slide

Return as array of slide contents.`;

        const completion = await this.openai.chat.completions.create({
            model: 'gpt-4-turbo-preview',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.7,
            response_format: { type: 'json_object' }
        });

        return JSON.parse(completion.choices[0].message.content);
    }

    /**
     * Cleanup temporary files
     */
    async cleanup(outputPath) {
        try {
            if (fs.existsSync(outputPath)) {
                fs.rmSync(outputPath, { recursive: true, force: true });
            }
        } catch (error) {
            console.error('[Maya] Cleanup error:', error);
        }
    }
}

module.exports = MayaAgent;
