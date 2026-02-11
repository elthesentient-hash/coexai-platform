// Test Maya Agent
const MayaAgent = require('./agents/maya/maya');

// Test video URL (replace with your own)
const TEST_VIDEO_URL = process.argv[2] || 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';

async function testMaya() {
    console.log('🎬 Testing Maya AI Content Creator...\n');
    
    const maya = new MayaAgent(process.env.OPENAI_API_KEY);
    
    try {
        const result = await maya.processVideo(TEST_VIDEO_URL, 'test-user');
        
        console.log('\n✅ SUCCESS! Generated content:\n');
        console.log('TRANSCRIPT (first 500 chars):');
        console.log(result.transcript.substring(0, 500) + '...\n');
        
        console.log('TWEETS:');
        result.content.tweets.forEach((tweet, i) => {
            console.log(`${i + 1}. ${tweet.text || tweet}\n`);
        });
        
        console.log('CAROUSEL SLIDES:');
        result.content.carousel.forEach((slide, i) => {
            console.log(`Slide ${slide.slide || i + 1}: ${slide.content || slide}\n`);
        });
        
        console.log('HASHTAGS:');
        console.log(result.content.hashtags);
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

// Run test
console.log('Make sure you have:');
console.log('1. OPENAI_API_KEY set in environment');
console.log('2. yt-dlp installed (pip install yt-dlp)');
console.log('3. ffmpeg installed\n');

testMaya();
