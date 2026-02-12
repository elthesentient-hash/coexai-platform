#!/usr/bin/env node
/**
 * EL Phone Call Example
 * Demonstrates how EL can call Elijah
 */

const PhoneTool = require('./phone-tool');

async function makeMorningCall() {
  const phone = new PhoneTool();
  
  // Morning briefing call
  const result = await phone.makeSmartCall({
    to: '+16103047272',  // Elijah's number
    purpose: 'morning_briefing',
    context: {
      calendar: { events: 3 },
      tasks: { pending: 5, priority: 'Ship COEXAI v2' },
      weather: 'Sunny, 72°F'
    }
  });
  
  console.log('Call result:', result);
}

async function makeAlertCall(message) {
  const phone = new PhoneTool();
  
  const result = await phone.makeSmartCall({
    to: '+16103047272',
    purpose: 'alert',
    context: { message }
  });
  
  console.log('Alert call result:', result);
}

// Example usage:
// makeMorningCall();
// makeAlertCall('Critical: Server down!');

module.exports = { makeMorningCall, makeAlertCall };

// Run if called directly
if (require.main === module) {
  const purpose = process.argv[2] || 'test';
  
  switch (purpose) {
    case 'morning':
      makeMorningCall();
      break;
    case 'alert':
      makeAlertCall(process.argv[3] || 'Test alert from EL');
      break;
    default:
      console.log('Usage: node phone-example.js [morning|alert] [message]');
  }
}
