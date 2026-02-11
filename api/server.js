// ============================================
// COEXAI - Real Authentication & Payment System
// Supabase Auth + Stripe + Platform OAuth
// ============================================

require('dotenv').config();
const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const Stripe = require('stripe');
const crypto = require('crypto');

const app = express();
app.use(express.json());

// Initialize clients
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

// ============================================
// AUTHENTICATION ENDPOINTS
// ============================================

// Register new user
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name, plan } = req.body;
    
    // 1. Create Supabase auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
          plan: plan
        }
      }
    });
    
    if (authError) throw authError;
    
    // 2. Create user profile in database
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authData.user.id,
        email,
        full_name: name,
        plan,
        status: 'trial',
        trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        created_at: new Date().toISOString()
      });
    
    if (profileError) throw profileError;
    
    // 3. Create Stripe customer
    const customer = await stripe.customers.create({
      email,
      name,
      metadata: {
        user_id: authData.user.id,
        plan
      }
    });
    
    // 4. Update profile with Stripe customer ID
    await supabase
      .from('profiles')
      .update({ stripe_customer_id: customer.id })
      .eq('id', authData.user.id);
    
    res.json({
      success: true,
      user: authData.user,
      message: 'Account created! Check your email to confirm.'
    });
    
  } catch (error) {
    console.error('Registration error:', error);
    res.status(400).json({ error: error.message });
  }
});

// Login user
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) throw error;
    
    // Get full profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();
    
    res.json({
      success: true,
      session: data.session,
      user: data.user,
      profile
    });
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(401).json({ error: error.message });
  }
});

// Get current user
app.get('/api/auth/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error) throw error;
    
    // Get full profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    
    res.json({
      success: true,
      user,
      profile
    });
    
  } catch (error) {
    console.error('Auth check error:', error);
    res.status(401).json({ error: error.message });
  }
});

// Logout
app.post('/api/auth/logout', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    await supabase.auth.signOut(token);
    
    res.json({ success: true, message: 'Logged out' });
    
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Reset password
app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const { email } = req.body;
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.APP_URL}/auth/reset-password`
    });
    
    if (error) throw error;
    
    res.json({ success: true, message: 'Password reset email sent' });
    
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ============================================
// PAYMENT ENDPOINTS (STRIPE)
// ============================================

// Create checkout session
app.post('/api/payments/create-checkout', async (req, res) => {
  try {
    const { priceId, successUrl, cancelUrl } = req.body;
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    // Get user
    const { data: { user } } = await supabase.auth.getUser(token);
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single();
    
    const session = await stripe.checkout.sessions.create({
      customer: profile.stripe_customer_id,
      payment_method_types: ['card'],
      line_items: [{
        price: priceId,
        quantity: 1
      }],
      mode: 'subscription',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        user_id: user.id
      }
    });
    
    res.json({ success: true, sessionId: session.id, url: session.url });
    
  } catch (error) {
    console.error('Checkout error:', error);
    res.status(400).json({ error: error.message });
  }
});

// Get subscription details
app.get('/api/payments/subscription', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    const { data: { user } } = await supabase.auth.getUser(token);
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id, stripe_subscription_id')
      .eq('id', user.id)
      .single();
    
    if (!profile.stripe_subscription_id) {
      return res.json({ subscription: null });
    }
    
    const subscription = await stripe.subscriptions.retrieve(
      profile.stripe_subscription_id
    );
    
    res.json({ subscription });
    
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Cancel subscription
app.post('/api/payments/cancel', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    const { data: { user } } = await supabase.auth.getUser(token);
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_subscription_id')
      .eq('id', user.id)
      .single();
    
    if (!profile.stripe_subscription_id) {
      return res.status(400).json({ error: 'No active subscription' });
    }
    
    const subscription = await stripe.subscriptions.cancel(
      profile.stripe_subscription_id
    );
    
    // Update user status
    await supabase
      .from('profiles')
      .update({ 
        status: 'cancelled',
        subscription_ends_at: new Date(subscription.current_period_end * 1000).toISOString()
      })
      .eq('id', user.id);
    
    res.json({ success: true, subscription });
    
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Stripe webhook
app.post('/api/payments/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const sig = req.headers['stripe-signature'];
    const event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
    
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object;
        
        // Update user subscription
        await supabase
          .from('profiles')
          .update({
            stripe_subscription_id: session.subscription,
            status: 'active',
            subscription_started_at: new Date().toISOString()
          })
          .eq('id', session.metadata.user_id);
        break;
        
      case 'invoice.payment_failed':
        const invoice = event.data.object;
        
        await supabase
          .from('profiles')
          .update({ status: 'past_due' })
          .eq('stripe_customer_id', invoice.customer);
        break;
        
      case 'customer.subscription.deleted':
        const subscription = event.data.object;
        
        await supabase
          .from('profiles')
          .update({ status: 'cancelled' })
          .eq('stripe_subscription_id', subscription.id);
        break;
    }
    
    res.json({ received: true });
    
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(400).json({ error: error.message });
  }
});

// ============================================
// PLATFORM CONNECTIONS (OAuth)
// ============================================

// YouTube OAuth initiation
app.get('/api/connect/youtube', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    const { data: { user } } = await supabase.auth.getUser(token);
    
    const state = crypto.randomBytes(32).toString('hex');
    
    // Store state in database for verification
    await supabase.from('oauth_states').insert({
      state,
      user_id: user.id,
      platform: 'youtube',
      expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString()
    });
    
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${process.env.YOUTUBE_CLIENT_ID}` +
      `&redirect_uri=${process.env.APP_URL}/api/connect/youtube/callback` +
      `&response_type=code` +
      `&scope=https://www.googleapis.com/auth/youtube.readonly https://www.googleapis.com/auth/youtube.force-ssl` +
      `&state=${state}` +
      `&access_type=offline` +
      `&prompt=consent`;
    
    res.json({ url: authUrl });
    
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// YouTube OAuth callback
app.get('/api/connect/youtube/callback', async (req, res) => {
  try {
    const { code, state } = req.query;
    
    // Verify state
    const { data: stateData } = await supabase
      .from('oauth_states')
      .select('*')
      .eq('state', state)
      .single();
    
    if (!stateData) {
      return res.redirect(`${process.env.APP_URL}/auth?error=invalid_state`);
    }
    
    // Exchange code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: process.env.YOUTUBE_CLIENT_ID,
        client_secret: process.env.YOUTUBE_CLIENT_SECRET,
        redirect_uri: `${process.env.APP_URL}/api/connect/youtube/callback`,
        grant_type: 'authorization_code'
      })
    });
    
    const tokens = await tokenResponse.json();
    
    // Get channel info
    const channelResponse = await fetch(
      'https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&mine=true',
      {
        headers: { Authorization: `Bearer ${tokens.access_token}` }
      }
    );
    
    const channelData = await channelResponse.json();
    const channel = channelData.items[0];
    
    // Store connection
    await supabase.from('platform_connections').insert({
      user_id: stateData.user_id,
      platform: 'youtube',
      channel_id: channel.id,
      channel_name: channel.snippet.title,
      subscriber_count: channel.statistics.subscriberCount,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString()
    });
    
    // Clean up state
    await supabase.from('oauth_states').delete().eq('state', state);
    
    res.redirect(`${process.env.APP_URL}/dashboard?connected=youtube`);
    
  } catch (error) {
    console.error('YouTube callback error:', error);
    res.redirect(`${process.env.APP_URL}/auth?error=connection_failed`);
  }
});

// TikTok OAuth initiation
app.get('/api/connect/tiktok', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    const { data: { user } } = await supabase.auth.getUser(token);
    
    const state = crypto.randomBytes(32).toString('hex');
    
    await supabase.from('oauth_states').insert({
      state,
      user_id: user.id,
      platform: 'tiktok',
      expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString()
    });
    
    const authUrl = `https://www.tiktok.com/auth/authorize/?` +
      `client_key=${process.env.TIKTOK_CLIENT_KEY}` +
      `&redirect_uri=${process.env.APP_URL}/api/connect/tiktok/callback` +
      `&response_type=code` +
      `&scope=user.info.basic,video.list` +
      `&state=${state}`;
    
    res.json({ url: authUrl });
    
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get connected platforms
app.get('/api/platforms', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    const { data: { user } } = await supabase.auth.getUser(token);
    
    const { data: connections } = await supabase
      .from('platform_connections')
      .select('*')
      .eq('user_id', user.id);
    
    res.json({ connections });
    
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Disconnect platform
app.delete('/api/platforms/:platform', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    const { data: { user } } = await supabase.auth.getUser(token);
    const { platform } = req.params;
    
    await supabase
      .from('platform_connections')
      .delete()
      .eq('user_id', user.id)
      .eq('platform', platform);
    
    res.json({ success: true, message: `${platform} disconnected` });
    
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ============================================
// START SERVER
// ============================================

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 CoExAI API running on port ${PORT}`);
  console.log('✅ Endpoints:');
  console.log('  POST /api/auth/register');
  console.log('  POST /api/auth/login');
  console.log('  GET  /api/auth/me');
  console.log('  POST /api/payments/create-checkout');
  console.log('  GET  /api/connect/youtube');
  console.log('  GET  /api/platforms');
});

module.exports = app;
