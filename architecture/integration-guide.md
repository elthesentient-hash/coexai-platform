# CoExAI Integration Guide

## Table of Contents

1. [Getting Started](#getting-started)
2. [Authentication](#authentication)
3. [Core Concepts](#core-concepts)
4. [Agent Integration](#agent-integration)
5. [Webhook Integration](#webhook-integration)
6. [Stripe Integration](#stripe-integration)
7. [File Uploads](#file-uploads)
8. [Error Handling](#error-handling)
9. [Rate Limiting](#rate-limiting)
10. [SDK Examples](#sdk-examples)
11. [Best Practices](#best-practices)
12. [Troubleshooting](#troubleshooting)

---

## Getting Started

### Base URLs

| Environment | URL |
|-------------|-----|
| Production | `https://api.coexai.com/v1` |
| Staging | `https://api.staging.coexai.com/v1` |

### Prerequisites

1. Create a CoExAI account at [https://coexai.com/signup](https://coexai.com/signup)
2. Generate an API key from your dashboard
3. Subscribe to a plan (Free tier available for testing)

### Quick Start Example

```bash
# Test your API key
curl -X GET https://api.coexai.com/v1/users/me \
  -H "Authorization: Bearer YOUR_API_KEY"

# Create your first job
curl -X POST https://api.coexai.com/v1/jobs \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "agent_id": "maya",
    "input_data": {
      "source_type": "text",
      "content": "Your content here...",
      "target_formats": ["twitter", "linkedin"]
    }
  }'
```

---

## Authentication

### API Key Authentication

CoExAI uses Bearer token authentication. Include your API key in the `Authorization` header:

```
Authorization: Bearer coexai_live_xxxxx
```

API keys have the following characteristics:
- **Format:** `coexai_live_<random>` or `coexai_test_<random>`
- **Prefix:** First 8 characters shown in dashboard for identification
- **Scopes:** `read`, `write`, `admin`
- **Expiration:** Configurable (default: never)
- **IP Restrictions:** Optional allowlist

### JWT Authentication (Web App)

For web applications, use OAuth/JWT flow:

```javascript
// 1. Login to get tokens
const response = await fetch('https://api.coexai.com/v1/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'secure_password'
  })
});

const { tokens } = await response.json();

// 2. Use access token for API calls
const jobs = await fetch('https://api.coexai.com/v1/jobs', {
  headers: { 'Authorization': `Bearer ${tokens.access_token}` }
});

// 3. Refresh when expired
const refreshed = await fetch('https://api.coexai.com/v1/auth/refresh', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ refresh_token: tokens.refresh_token })
});
```

### OAuth Integration

Supported providers: Google, Microsoft, GitHub

```javascript
// Redirect user to OAuth provider
window.location.href = 'https://api.coexai.com/v1/auth/oauth/google';

// Handle callback (token in URL fragment or cookie)
// CoExAI will redirect to your configured callback URL
```

---

## Core Concepts

### Organization-Based Multi-Tenancy

All resources are scoped to an **Organization**. Users can belong to multiple organizations with different roles.

```
Organization
├── Users (with roles: owner, admin, member, viewer)
├── API Keys
├── Jobs
├── Files
├── Subscriptions
└── Webhooks
```

### Agent Architecture

| Agent | Purpose | Input Types | Output Formats |
|-------|---------|-------------|----------------|
| **Maya** | Content Repurposing | URL, Text, File (docx, pdf, mp3, mp4) | JSON, Markdown, Text |
| **Jordan** | LinkedIn Growth | Profile URL, Text | JSON, Analytics Report |
| **Sam** | Local SEO | Business Info, Location | JSON, PDF, HTML Report |
| **Taylor** | Document Processing | PDF, Images | JSON, CSV, Structured Data |

### Job Lifecycle

```
PENDING → QUEUED → PROCESSING → COMPLETED
              ↓
         FAILED (retry 3x) → DEAD_LETTER
              ↓
         CANCELLED (by user)
```

**Timeline:**
1. **PENDING** (0-5s) - Validation, quota check
2. **QUEUED** (variable) - Waiting for worker
3. **PROCESSING** (30s-10min) - Active execution
4. **COMPLETED/FAILED** - Final state

---

## Agent Integration

### Maya - Content Repurposing

Transform content across formats and platforms.

**Use Cases:**
- Blog post → Twitter thread
- Podcast transcript → Newsletter
- Video → LinkedIn article
- Content calendar generation

**Example Request:**
```json
{
  "agent_id": "maya",
  "input_data": {
    "source_type": "url",
    "url": "https://example.com/blog-post",
    "target_formats": ["twitter_thread", "linkedin_post", "newsletter"],
    "tone": "professional",
    "include_hashtags": true,
    "max_length": 280
  },
  "config": {
    "extract_images": true,
    "summarize_first": false
  }
}
```

**Example Response:**
```json
{
  "id": "job_maya_123",
  "status": "completed",
  "output_data": {
    "twitter_thread": {
      "posts": [
        {"text": "🧵 Thread starter...", "char_count": 278},
        {"text": "2/ Continuation...", "char_count": 240}
      ]
    },
    "linkedin_post": {
      "text": "Full LinkedIn article...",
      "estimated_read_time": "3 min"
    }
  }
}
```

### Jordan - LinkedIn Growth

Optimize LinkedIn presence and engagement.

**Use Cases:**
- Profile optimization suggestions
- Content calendar with optimal timing
- Engagement analytics
- DM campaign templates

**Example Request:**
```json
{
  "agent_id": "jordan",
  "input_data": {
    "action": "content_creation",
    "content_topic": "AI in marketing",
    "target_audience": "B2B marketers",
    "tone": "thought_leadership"
  }
}
```

**Example Response:**
```json
{
  "suggested_posts": [
    {
      "content": "5 ways AI is transforming...",
      "optimal_posting_time": "2024-01-16T09:00:00Z",
      "hashtags": ["#AI", "#Marketing", "#B2B"],
      "predicted_engagement": "high"
    }
  ]
}
```

### Sam - Local SEO

Improve local search visibility.

**Use Cases:**
- Google Business Profile optimization
- Local citation audit
- Competitor analysis
- Review response templates

**Example Request:**
```json
{
  "agent_id": "sam",
  "input_data": {
    "business_name": "Joe's Coffee Shop",
    "location": "Seattle, WA",
    "website": "https://joescoffee.com",
    "gmb_url": "https://business.google.com/...",
    "primary_keywords": ["coffee shop", "espresso", "cafe"],
    "service_area": "Capitol Hill, Downtown Seattle"
  }
}
```

**Example Response:**
```json
{
  "audit_results": {
    "gmb_score": 72,
    "citation_consistency": 85,
    "recommendations": [
      {
        "priority": "high",
        "category": "gmb",
        "action": "Add 5 more photos to GMB listing",
        "expected_impact": "+15% visibility"
      }
    ]
  }
}
```

### Taylor - Document Processor

Intelligent document processing and extraction.

**Use Cases:**
- OCR and text extraction
- Invoice data extraction
- Form field recognition
- Document classification

**Example Request:**
```json
{
  "agent_id": "taylor",
  "input_data": {
    "extraction_type": "form_data",
    "language": "auto"
  },
  "file_ids": ["file_abc123"]
}
```

**Example Response:**
```json
{
  "extracted_data": {
    "invoice_number": "INV-2024-001",
    "date": "2024-01-15",
    "vendor": "Acme Corp",
    "line_items": [
      {"description": "Service A", "amount": 100.00}
    ],
    "total": 100.00
  },
  "confidence": 0.94,
  "pages_processed": 1
}
```

---

## Webhook Integration

### Configuring Webhooks

Set up webhooks to receive real-time event notifications:

```bash
curl -X POST https://api.coexai.com/v1/webhooks \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://your-app.com/webhooks/coexai",
    "events": ["job.completed", "job.failed", "subscription.updated"],
    "description": "Production webhook"
  }'
```

### Webhook Payload Structure

All webhooks include:

```json
{
  "event": "job.completed",
  "timestamp": "2024-01-15T10:30:00Z",
  "webhook_id": "wh_abc123",
  "data": { /* Event-specific data */ }
}
```

### Signature Verification

Verify webhook authenticity using HMAC-SHA256:

```python
import hmac
import hashlib

def verify_webhook(payload, signature, secret):
    """
    Verify webhook signature from X-CoExAI-Signature header
    Format: sha256=<hex_digest>
    """
    expected = hmac.new(
        secret.encode(),
        payload.encode(),
        hashlib.sha256
    ).hexdigest()
    
    provided = signature.replace('sha256=', '')
    return hmac.compare_digest(expected, provided)

# Express.js example
app.post('/webhooks/coexai', (req, res) => {
    const signature = req.headers['x-coexai-signature'];
    const payload = JSON.stringify(req.body);
    
    if (!verify_webhook(payload, signature, WEBHOOK_SECRET)) {
        return res.status(401).send('Invalid signature');
    }
    
    // Process webhook
    handleWebhook(req.body);
    res.status(200).send('OK');
});
```

### Event Types

| Event | Description | Payload |
|-------|-------------|---------|
| `job.completed` | Job finished successfully | Job details + output URL |
| `job.failed` | Job failed after retries | Job details + error info |
| `subscription.created` | New subscription | Subscription details |
| `subscription.updated` | Plan changed | Before/after details |
| `subscription.cancelled` | Subscription ended | Cancellation details |
| `payment.succeeded` | Invoice paid | Payment details |
| `payment.failed` | Payment failed | Failure reason |

### Retry Logic

- Failed webhooks are retried with exponential backoff
- 5 attempts over ~3 days
- After max retries, event is available via API

```
Attempt 1: Immediate
Attempt 2: 5 minutes
Attempt 3: 30 minutes
Attempt 4: 2 hours
Attempt 5: 6 hours
```

---

## Stripe Integration

### Overview

CoExAI uses Stripe for payment processing. Your application can sync with Stripe for:

- Subscription management
- Invoice display
- Payment method updates
- Usage-based billing

### Stripe Connect (Optional)

For platforms building on CoExAI:

```javascript
// 1. Create connected account
const account = await stripe.accounts.create({
  type: 'standard',
});

// 2. Generate onboarding link
const accountLink = await stripe.accountLinks.create({
  account: account.id,
  refresh_url: 'https://your-app.com/stripe/refresh',
  return_url: 'https://your-app.com/stripe/return',
  type: 'account_onboarding',
});
```

### Webhook Handling

Handle Stripe webhooks and sync to CoExAI:

```python
@app.route('/webhooks/stripe', methods=['POST'])
def stripe_webhook():
    payload = request.get_data()
    sig_header = request.headers.get('Stripe-Signature')
    
    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, STRIPE_WEBHOOK_SECRET
        )
    except ValueError:
        return 'Invalid payload', 400
    except stripe.error.SignatureVerificationError:
        return 'Invalid signature', 400
    
    # Handle events
    if event['type'] == 'invoice.payment_succeeded':
        # Sync to CoExAI if needed
        sync_invoice_to_coexai(event['data']['object'])
    
    return '', 200
```

### Metered Billing

For usage-based pricing, report usage to Stripe:

```python
# Report usage for metered billing
stripe.billing.meter_events.create(
    event_name='maya_job_completed',
    payload={
        'value': '1',
        'stripe_customer_id': customer_id,
    },
)
```

---

## File Uploads

### Direct Upload

Upload files up to 500MB (depending on plan):

```bash
# Upload file
curl -X POST https://api.coexai.com/v1/files \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -F "file=@document.pdf" \
  -F 'metadata={"source": "user_upload"}'

# Response: {"id": "file_abc123", ...}
```

### Upload with Job

Upload and process in one request:

```bash
curl -X POST https://api.coexai.com/v1/jobs \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -F "agent_id=taylor" \
  -F "config={\"extraction_type\":\"ocr\"}" \
  -F "files=@document.pdf" \
  -F "files=@second_page.pdf"
```

### Pre-signed URLs (Large Files)

For files > 100MB, use pre-signed URLs:

```javascript
// 1. Request upload URL
const { upload_url, file_id } = await fetch('/v1/files/upload-url', {
  method: 'POST',
  headers: { 'Authorization': 'Bearer TOKEN' },
  body: JSON.stringify({
    filename: 'large-video.mp4',
    content_type: 'video/mp4',
    size_bytes: 500000000
  })
});

// 2. Upload directly to storage
await fetch(upload_url, {
  method: 'PUT',
  body: fileBlob,
  headers: { 'Content-Type': 'video/mp4' }
});

// 3. Confirm upload
await fetch(`/v1/files/${file_id}/confirm`, {
  method: 'POST',
  headers: { 'Authorization': 'Bearer TOKEN' }
});
```

### Supported File Types

| Agent | Supported Formats | Max Size |
|-------|------------------|----------|
| Maya | PDF, DOCX, TXT, MD, MP3, MP4 | 100MB |
| Jordan | TXT, MD, URL | 10MB |
| Sam | PDF, DOCX, CSV | 50MB |
| Taylor | PDF, PNG, JPG, TIFF, BMP | 100MB |

---

## Error Handling

### Error Response Format

All errors follow a consistent structure:

```json
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "API rate limit exceeded. Try again in 60 seconds.",
    "details": {
      "limit": 100,
      "remaining": 0,
      "reset_at": "2024-01-15T11:00:00Z"
    },
    "request_id": "req_abc123xyz"
  }
}
```

### Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `UNAUTHORIZED` | 401 | Invalid or missing API key |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `VALIDATION_ERROR` | 422 | Invalid request data |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `QUOTA_EXCEEDED` | 429 | Monthly quota exceeded |
| `INSUFFICIENT_CREDITS` | 402 | Payment required |
| `INTERNAL_ERROR` | 500 | Server error |

### Retry Strategy

Implement exponential backoff for 5xx and 429 errors:

```python
import time
import random

def api_call_with_retry(func, max_retries=3):
    for attempt in range(max_retries):
        try:
            return func()
        except CoexAIError as e:
            if e.status_code == 429:
                # Rate limit - respect Retry-After header
                retry_after = int(e.headers.get('Retry-After', 60))
                time.sleep(retry_after)
            elif e.status_code >= 500:
                # Server error - exponential backoff
                delay = (2 ** attempt) + random.uniform(0, 1)
                time.sleep(delay)
            else:
                raise
    raise Exception("Max retries exceeded")
```

---

## Rate Limiting

### Limits by Tier

| Tier | Requests/Min | Burst | Concurrent Jobs |
|------|-------------|-------|-----------------|
| Free | 60 | 10 | 1 |
| Pro | 600 | 100 | 5 |
| Enterprise | 6000 | 1000 | 25 |

### Rate Limit Headers

```
X-RateLimit-Limit: 600
X-RateLimit-Remaining: 599
X-RateLimit-Reset: 1705312800
X-RateLimit-Retry-After: 60
```

### Handling Limits

```javascript
const api = axios.create({
  baseURL: 'https://api.coexai.com/v1',
  headers: { 'Authorization': `Bearer ${API_KEY}` }
});

// Add rate limit tracking
api.interceptors.response.use(
  response => {
    const remaining = response.headers['x-ratelimit-remaining'];
    if (remaining && parseInt(remaining) < 10) {
      console.warn('Approaching rate limit');
    }
    return response;
  },
  async error => {
    if (error.response?.status === 429) {
      const retryAfter = error.response.headers['retry-after'] || 60;
      await sleep(retryAfter * 1000);
      return api.request(error.config);
    }
    throw error;
  }
);
```

---

## SDK Examples

### JavaScript/TypeScript

```typescript
import { CoExAI } from '@coexai/sdk';

const coexai = new CoExAI({
  apiKey: process.env.COEXAI_API_KEY,
  // Optional: webhook secret for verification
  webhookSecret: process.env.COEXAI_WEBHOOK_SECRET
});

// Create a job
const job = await coexai.jobs.create({
  agentId: 'maya',
  input: {
    sourceType: 'text',
    content: 'Your content here...',
    targetFormats: ['twitter', 'linkedin']
  }
});

// Poll for completion
const result = await coexai.jobs.waitForCompletion(job.id, {
  timeout: 600000, // 10 minutes
  pollInterval: 5000 // 5 seconds
});

// Or use webhooks
app.post('/webhooks/coexai', coexai.webhooks.handler((event) => {
  if (event.type === 'job.completed') {
    console.log('Job completed:', event.data.id);
  }
}));
```

### Python

```python
from coexai import CoExAI

coexai = CoExAI(api_key="your_api_key")

# Create job with file upload
with open("document.pdf", "rb") as f:
    job = coexai.jobs.create(
        agent_id="taylor",
        input_data={"extraction_type": "ocr"},
        files=[f]
    )

# Get result
result = coexai.jobs.get_output(job.id)
print(result.content)

# Async support
import asyncio

async def process_documents():
    jobs = await coexai.jobs.create_batch([
        {"agent_id": "taylor", "file": "doc1.pdf"},
        {"agent_id": "taylor", "file": "doc2.pdf"}
    ])
    results = await asyncio.gather(*[
        coexai.jobs.wait_for_completion(job.id)
        for job in jobs
    ])
    return results
```

### Go

```go
package main

import (
    "context"
    "log"
    "github.com/coexai/coexai-go"
)

func main() {
    client := coexai.NewClient("your_api_key")
    
    // Create job
    job, err := client.Jobs.Create(context.Background(), coexai.JobCreateRequest{
        AgentID: "maya",
        InputData: map[string]interface{}{
            "source_type": "text",
            "content": "Your content...",
            "target_formats": []string{"twitter"},
        },
    })
    if err != nil {
        log.Fatal(err)
    }
    
    // Poll for completion
    result, err := client.Jobs.WaitForCompletion(context.Background(), job.ID)
    if err != nil {
        log.Fatal(err)
    }
    
    log.Printf("Output: %+v", result.OutputData)
}
```

### cURL Examples

```bash
# Get user profile
curl https://api.coexai.com/v1/users/me \
  -H "Authorization: Bearer $API_KEY"

# Create Maya job
curl -X POST https://api.coexai.com/v1/jobs \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "agent_id": "maya",
    "input_data": {
      "source_type": "url",
      "url": "https://example.com/blog",
      "target_formats": ["twitter_thread"]
    }
  }'

# Upload and process file
curl -X POST https://api.coexai.com/v1/jobs \
  -H "Authorization: Bearer $API_KEY" \
  -F "agent_id=taylor" \
  -F "config={\"extraction_type\":\"form_data\"}" \
  -F "files=@invoice.pdf"

# Get job output
curl https://api.coexai.com/v1/jobs/$JOB_ID/output \
  -H "Authorization: Bearer $API_KEY"
```

---

## Best Practices

### 1. Use Webhooks, Not Polling

```javascript
// ❌ Bad: Polling
while (job.status !== 'completed') {
  await sleep(5000);
  job = await api.getJob(jobId);
}

// ✅ Good: Webhooks
app.post('/webhooks/coexai', (req, res) => {
  if (req.body.event === 'job.completed') {
    processResult(req.body.data);
  }
  res.sendStatus(200);
});
```

### 2. Implement Idempotency

```python
# Use idempotency key for retries
headers = {
    'Authorization': f'Bearer {API_KEY}',
    'Idempotency-Key': str(uuid.uuid4())  # Same key for retries
}

response = requests.post(url, json=data, headers=headers)
```

### 3. Handle Errors Gracefully

```typescript
class CoexAIClient {
  async createJobWithFallback(input: JobInput): Promise<Job> {
    try {
      return await this.jobs.create(input);
    } catch (error) {
      if (error.code === 'QUOTA_EXCEEDED') {
        // Queue for later or notify user
        await this.queueForRetry(input);
        throw new QuotaExceededError();
      }
      throw error;
    }
  }
}
```

### 4. Secure Your Webhooks

```python
@app.route('/webhooks/coexai', methods=['POST'])
def handle_webhook():
    # Always verify signature
    signature = request.headers.get('X-CoExAI-Signature')
    if not verify_signature(request.data, signature, WEBHOOK_SECRET):
        return 'Unauthorized', 401
    
    # Process asynchronously
    process_webhook_async.delay(request.json)
    
    # Return quickly
    return 'OK', 200
```

### 5. Use Batch Operations

```javascript
// ❌ Bad: Sequential requests
for (const file of files) {
  await api.jobs.create({ agent_id: 'taylor', file });
}

// ✅ Good: Batch API
await api.jobs.createBatch(
  files.map(f => ({ agent_id: 'taylor', file: f }))
);
```

### 6. Cache Agent Configurations

```javascript
// Cache agent configs to reduce API calls
const agentCache = new Map();

async function getAgentConfig(agentId) {
  if (!agentCache.has(agentId)) {
    const config = await api.agents.getConfig(agentId);
    agentCache.set(agentId, config);
    // TTL of 1 hour
    setTimeout(() => agentCache.delete(agentId), 3600000);
  }
  return agentCache.get(agentId);
}
```

---

## Troubleshooting

### Common Issues

#### 401 Unauthorized

```
Problem: Invalid API key
Solution: 
- Verify key is copied correctly
- Check for extra spaces
- Ensure key hasn't been revoked
- Verify Authorization header format: "Bearer {key}"
```

#### 429 Rate Limit

```
Problem: Too many requests
Solution:
- Implement exponential backoff
- Check X-RateLimit-Remaining header
- Upgrade plan for higher limits
- Use batch operations
```

#### Job Stuck in QUEUED

```
Problem: Job not processing
Solution:
- Check if at concurrent job limit
- Verify job priority (higher = faster)
- Check for agent maintenance mode
- Contact support if >30 minutes
```

#### Webhook Not Received

```
Problem: Webhooks not arriving
Solution:
- Verify URL is publicly accessible
- Check SSL certificate is valid
- Ensure returning 200 status quickly
- Check firewall/security group rules
- Review webhook delivery logs in dashboard
```

#### Large File Uploads Fail

```
Problem: Upload times out
Solution:
- Use pre-signed URLs for files >100MB
- Implement resumable uploads
- Check file size against plan limits
- Use chunked upload for very large files
```

### Debugging Tools

```bash
# Test API connectivity
curl -v https://api.coexai.com/v1/health

# Check rate limit status
curl -I https://api.coexai.com/v1/users/me \
  -H "Authorization: Bearer $API_KEY" | grep -i ratelimit

# Verify webhook signature locally
python3 -c "
import hmac, hashlib
secret = 'whsec_test'
payload = '{\"event\":\"test\"}'
sig = hmac.new(secret.encode(), payload.encode(), hashlib.sha256).hexdigest()
print(f'sha256={sig}')
"
```

### Support

- **Documentation:** https://docs.coexai.com
- **Status Page:** https://status.coexai.com
- **Support Email:** support@coexai.com
- **Community:** https://community.coexai.com

---

## Changelog

### v1.0.0 (2024-01-15)
- Initial API release
- Maya, Jordan, Sam, Taylor agents
- Webhook support
- Stripe billing integration

### Migration Notes

When upgrading between versions:
- Check deprecation notices in API responses
- Review changelog before major updates
- Test in staging environment first
- Update SDK to latest version
