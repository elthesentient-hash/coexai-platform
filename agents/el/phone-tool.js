/**
 * Phone Call Tool for EL Agent
 * Uses Twilio + ElevenLabs to make outbound calls
 */

const twilio = require('twilio');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

class PhoneTool {
  constructor() {
    this.twilioClient = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
    this.elevenLabsKey = process.env.ELEVENLABS_API_KEY;
    this.voiceId = process.env.ELEVENLABS_VOICE_ID || 'iP95p4xoKVk53GoZ742B';
    this.fromNumber = process.env.TWILIO_PHONE_NUMBER;
  }

  /**
   * Make a phone call with AI-generated voice message
   */
  async makeCall({ to, message, voiceId }) {
    try {
      // Generate voice audio with ElevenLabs
      const audioUrl = await this.generateVoice(message, voiceId);
      
      // Create TwiML for the call
      const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Play>${audioUrl}</Play>
</Response>`;

      // Make the call
      const call = await this.twilioClient.calls.create({
        twiml: twiml,
        to: to,
        from: this.fromNumber,
        statusCallback: process.env.WEBHOOK_URL + '/call-status',
        statusCallbackEvent: ['completed', 'answered', 'failed']
      });

      return {
        success: true,
        callSid: call.sid,
        to: to,
        message: message,
        status: call.status
      };

    } catch (error) {
      return {
        success: false,
        error: error.message,
        to: to
      };
    }
  }

  /**
   * Generate voice audio using ElevenLabs
   */
  async generateVoice(text, voiceId = this.voiceId) {
    const response = await axios.post(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        text: text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75
        }
      },
      {
        headers: {
          'xi-api-key': this.elevenLabsKey,
          'Content-Type': 'application/json'
        },
        responseType: 'arraybuffer'
      }
    );

    // Save audio file temporarily
    const audioPath = path.join('/tmp', `el-call-${Date.now()}.mp3`);
    fs.writeFileSync(audioPath, Buffer.from(response.data));

    // In production, upload to S3/CDN and return public URL
    // For now, we'd need to serve this file
    return `https://your-cdn.com/audio.mp3`; // Placeholder
  }

  /**
   * Make a smart call - EL decides what to say based on context
   */
  async makeSmartCall({ to, purpose, context }) {
    // Generate appropriate message based on purpose
    let message = '';
    
    switch (purpose) {
      case 'morning_briefing':
        message = await this.generateMorningBriefing(context);
        break;
      case 'alert':
        message = await this.generateAlert(context);
        break;
      case 'check_in':
        message = await this.generateCheckIn(context);
        break;
      default:
        message = context.message || 'Hello, this is EL calling.';
    }

    return this.makeCall({ to, message });
  }

  async generateMorningBriefing(context) {
    const { calendar, tasks, weather } = context;
    return `Good morning Elijah. This is EL with your daily briefing. 
      You have ${calendar?.events || 'no'} events today. 
      ${tasks?.pending || 'No'} tasks pending. 
      Remember: ${tasks?.priority || 'Focus on the mission'}. 
      Have a powerful day.`;
  }

  async generateAlert(context) {
    return `Alert from EL. ${context.message || 'Something requires your attention.'} 
      Check your dashboard for details.`;
  }

  async generateCheckIn(context) {
    return `Hey Elijah, EL here. Just checking in. ${context.question || 'How are things going?'}`;
  }

  /**
   * Get call status
   */
  async getCallStatus(callSid) {
    try {
      const call = await this.twilioClient.calls(callSid).fetch();
      return {
        success: true,
        status: call.status,
        duration: call.duration,
        to: call.to,
        from: call.from
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = PhoneTool;
