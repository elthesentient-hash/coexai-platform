// ============================================
// SUPPORT - AI Admin Assistant for Creators
// Manages inbox, calendar, invoicing, taxes, contracts
// ============================================

require('dotenv').config();
const OpenAI = require('openai');

class SupportAgent {
  constructor(config) {
    this.openai = new OpenAI({ apiKey: config.openaiKey });
    this.creatorId = config.creatorId;
    this.emailIntegration = config.emailIntegration || null;
    this.calendarIntegration = config.calendarIntegration || null;
    this.creatorProfile = null;
  }

  // Initialize with creator business profile
  async initialize(creatorProfile) {
    this.creatorProfile = {
      name: creatorProfile.name,
      businessName: creatorProfile.businessName,
      email: creatorProfile.email,
      taxId: creatorProfile.taxId,
      address: creatorProfile.address,
      paymentMethods: creatorProfile.paymentMethods || [],
      rateCard: creatorProfile.rateCard || {},
      businessType: creatorProfile.businessType || 'sole proprietorship'
    };
    
    console.log(`✅ Support initialized for ${creatorProfile.businessName}`);
    return this;
  }

  // ============================================
  // EMAIL MANAGEMENT
  // ============================================

  // Process and categorize emails
  async processInbox(emails) {
    console.log('[Support] Processing inbox...');
    
    const categorized = {
      brandDeals: [],
      fanMail: [],
      business: [],
      urgent: [],
      spam: [],
      needsReply: []
    };
    
    for (const email of emails) {
      const category = await this.categorizeEmail(email);
      categorized[category].push(email);
      
      if (category !== 'spam' && category !== 'fanMail') {
        categorized.needsReply.push(email);
      }
    }
    
    // Auto-reply to appropriate emails
    for (const email of categorized.brandDeals.slice(0, 5)) {
      await this.autoReplyBrandEmail(email);
    }
    
    return categorized;
  }

  // Categorize incoming email
  async categorizeEmail(email) {
    const prompt = `Categorize this email for a content creator.

FROM: ${email.from}
SUBJECT: ${email.subject}
PREVIEW: ${email.preview}

Categories:
- brandDeals: Brand partnerships, sponsorships, collaborations
- fanMail: Fan messages, general support
- business: Legal, financial, platform notifications
- urgent: Time-sensitive, requires immediate attention
- spam: Unwanted, promotional, irrelevant
- general: Everything else

Respond with just the category name.`;

    const completion = await this.openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2
    });

    return completion.choices[0].message.content.trim();
  }

  // Auto-reply to brand emails
  async autoReplyBrandEmail(email) {
    const prompt = `Draft a professional response to this brand inquiry.

BRAND EMAIL:
From: ${email.from}
Subject: ${email.subject}
Body: ${email.body}

CREATOR INFO:
- Name: ${this.creatorProfile.name}
- Niche: ${this.creatorProfile.niche}
- Rate Card: ${JSON.stringify(this.creatorProfile.rateCard)}

Draft a response that:
1. Thanks them for reaching out
2. Expresses interest (if appropriate)
3. Asks for campaign details (budget, timeline, deliverables)
4. Mentions rate card or asks for their budget
5. Requests media kit or campaign brief
6. Professional but warm tone

Include signature with contact info.`;

    const completion = await this.openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.6
    });

    const reply = completion.choices[0].message.content;
    
    // Would send via email integration
    console.log(`[Support] Auto-reply drafted for ${email.from}`);
    
    return reply;
  }

  // Summarize long email threads
  async summarizeThread(emails) {
    const threadText = emails.map(e => `From: ${e.from}\nSubject: ${e.subject}\nBody: ${e.body}`).join('\n\n---\n\n');
    
    const prompt = `Summarize this email thread for a busy content creator.

THREAD:
${threadText}

Provide:
1. One-sentence summary
2. Key points/decisions needed
3. Action items with deadlines
4. People involved and their positions
5. Recommended next step`;

    const completion = await this.openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.4
    });

    return completion.choices[0].message.content;
  }

  // ============================================
  // INVOICING & PAYMENTS
  // ============================================

  // Generate invoice for brand deal
  async generateInvoice(dealDetails) {
    console.log(`[Support] Generating invoice for ${dealDetails.brand}...`);
    
    const invoice = {
      invoiceNumber: this.generateInvoiceNumber(),
      date: new Date().toISOString(),
      dueDate: this.calculateDueDate(dealDetails.terms),
      from: {
        name: this.creatorProfile.businessName || this.creatorProfile.name,
        email: this.creatorProfile.email,
        address: this.creatorProfile.address,
        taxId: this.creatorProfile.taxId
      },
      to: {
        name: dealDetails.brand,
        contact: dealDetails.contactEmail,
        address: dealDetails.brandAddress
      },
      items: dealDetails.deliverables.map(d => ({
        description: d.description,
        quantity: d.quantity,
        rate: d.rate,
        amount: d.quantity * d.rate
      })),
      subtotal: 0,
      tax: 0,
      total: 0,
      paymentTerms: dealDetails.terms || 'Net 30',
      paymentMethods: this.creatorProfile.paymentMethods,
      notes: dealDetails.notes || ''
    };
    
    // Calculate totals
    invoice.subtotal = invoice.items.reduce((sum, item) => sum + item.amount, 0);
    invoice.tax = this.calculateTax(invoice.subtotal);
    invoice.total = invoice.subtotal + invoice.tax;
    
    return invoice;
  }

  // Track payment status
  async trackPayments(invoices) {
    const status = {
      paid: [],
      pending: [],
      overdue: [],
      totalOutstanding: 0,
      totalPaid: 0
    };
    
    for (const invoice of invoices) {
      if (invoice.status === 'paid') {
        status.paid.push(invoice);
        status.totalPaid += invoice.total;
      } else if (this.isOverdue(invoice.dueDate)) {
        status.overdue.push(invoice);
        status.totalOutstanding += invoice.total;
      } else {
        status.pending.push(invoice);
        status.totalOutstanding += invoice.total;
      }
    }
    
    return status;
  }

  // Send payment reminder
  async sendPaymentReminder(invoice) {
    const prompt = `Draft a polite payment reminder email.

INVOICE DETAILS:
- Invoice #: ${invoice.invoiceNumber}
- Brand: ${invoice.to.name}
- Amount: $${invoice.total}
- Due Date: ${invoice.dueDate}
- Days Overdue: ${this.daysOverdue(invoice.dueDate)}

Tone: Professional but firm. Mention late fees if applicable.`;

    const completion = await this.openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.5
    });

    return completion.choices[0].message.content;
  }

  // ============================================
  // TAX & FINANCIAL DOCUMENTATION
  // ============================================

  // Organize tax documents
  async organizeTaxDocuments(year, transactions) {
    console.log(`[Support] Organizing tax docs for ${year}...`);
    
    const organized = {
      year,
      income: {
        brandDeals: [],
        platformRevenue: [],
        affiliateIncome: [],
        merchandise: [],
        total: 0
      },
      expenses: {
        equipment: [],
        software: [],
        contractors: [],
        travel: [],
        homeOffice: [],
        total: 0
      },
      deductions: [],
      documents: {
        '1099s': [],
        invoices: [],
        receipts: [],
        mileage: []
      }
    };
    
    // Categorize transactions
    for (const transaction of transactions) {
      if (transaction.amount > 0) {
        organized.income[this.categorizeIncome(transaction)].push(transaction);
        organized.income.total += transaction.amount;
      } else {
        organized.expenses[this.categorizeExpense(transaction)].push(transaction);
        organized.expenses.total += Math.abs(transaction.amount);
      }
    }
    
    // Calculate potential deductions
    organized.deductions = this.calculateDeductions(organized.expenses);
    
    return organized;
  }

  // Generate tax summary report
  async generateTaxSummary(year) {
    const taxData = await this.organizeTaxDocuments(year, []);
    
    return {
      year,
      generatedAt: new Date().toISOString(),
      summary: {
        grossIncome: taxData.income.total,
        totalExpenses: taxData.expenses.total,
        netIncome: taxData.income.total - taxData.expenses.total,
        estimatedTaxes: this.estimateTaxes(taxData.income.total - taxData.expenses.total),
        deductions: taxData.deductions
      },
      quarterlyPayments: this.calculateQuarterlies(taxData),
      documentsNeeded: this.listMissingDocuments(taxData)
    };
  }

  // Track business expenses
  async trackExpense(expense) {
    const categorized = {
      ...expense,
      category: this.categorizeExpense(expense),
      deductible: this.isDeductible(expense),
      taxCategory: this.getTaxCategory(expense)
    };
    
    return categorized;
  }

  // ============================================
  // CALENDAR & SCHEDULING
  // ============================================

  // Manage content calendar
  async manageContentCalendar(contentPlan) {
    const calendar = {
      upcoming: [],
      inProduction: [],
      scheduled: [],
      published: [],
      needsAction: []
    };
    
    for (const content of contentPlan) {
      if (content.status === 'idea') {
        calendar.upcoming.push(content);
      } else if (content.status === 'filming') {
        calendar.inProduction.push(content);
      } else if (content.status === 'scheduled') {
        calendar.scheduled.push(content);
      } else if (content.status === 'published') {
        calendar.published.push(content);
      }
      
      // Check for missing pieces
      if (content.publishDate && !content.thumbnail) {
        calendar.needsAction.push({
          content: content.title,
          action: 'Create thumbnail',
          deadline: content.publishDate
        });
      }
    }
    
    return calendar;
  }

  // Schedule brand collaboration calls
  async scheduleBrandCall(brandContact, proposedTimes) {
    const prompt = `Draft an email to schedule a call with a brand.

BRAND: ${brandContact.brandName}
CONTACT: ${brandContact.name}
PROPOSED TIMES: ${proposedTimes.join(', ')}
CREATOR TIMEZONE: ${this.creatorProfile.timezone || 'EST'}

Draft a professional email proposing these times for a collaboration discussion.`;

    const completion = await this.openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.6
    });

    return completion.choices[0].message.content;
  }

  // ============================================
  // CONTRACT MANAGEMENT
  // ============================================

  // Review brand contract
  async reviewContract(contractText) {
    console.log('[Support] Reviewing contract...');
    
    const prompt = `Review this brand collaboration contract and flag important clauses.

CONTRACT:
${contractText}

Identify:
1. Red flags (exclusivity, rights grabs, unreasonable terms)
2. Payment terms (amount, timeline, late fees)
3. Deliverables required
4. Usage rights and licensing
5. Cancellation clauses
6. Renewal terms
7. What to negotiate

Provide a summary with recommended actions.`;

    const completion = await this.openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.4
    });

    return this.parseContractReview(completion.choices[0].message.content);
  }

  // Generate simple contract
  async generateContract(dealTerms) {
    const template = `CONTENT CREATOR AGREEMENT

Date: ${new Date().toLocaleDateString()}

CREATOR: ${this.creatorProfile.name}
BRAND: ${dealTerms.brand}

SCOPE OF WORK:
${dealTerms.deliverables.map(d => `- ${d.description}: $${d.rate}`).join('\n')}

PAYMENT:
- Total Amount: $${dealTerms.total}
- Payment Terms: ${dealTerms.paymentTerms}
- Method: ${dealTerms.paymentMethod}

USAGE RIGHTS:
${dealTerms.usageRights}

APPROVAL PROCESS:
${dealTerms.approvalProcess}

TERMS:
- Content must be approved before posting
- Payment due within ${dealTerms.paymentDays} days of content going live
- Either party may cancel with ${dealTerms.cancelNotice} notice

SIGNATURES:
_____________________
${this.creatorProfile.name}

_____________________
${dealTerms.brandContact}`;

    return template;
  }

  // ============================================
  // HELPER METHODS
  // ============================================

  generateInvoiceNumber() {
    return `INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  }

  calculateDueDate(terms) {
    const days = terms === 'Net 15' ? 15 : terms === 'Net 30' ? 30 : 30;
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toISOString();
  }

  calculateTax(subtotal) {
    // Simple tax calculation (would use actual tax rules)
    return Math.round(subtotal * 0.0); // No tax for services in many cases
  }

  isOverdue(dueDate) {
    return new Date() > new Date(dueDate);
  }

  daysOverdue(dueDate) {
    const diff = new Date() - new Date(dueDate);
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  }

  categorizeIncome(transaction) {
    const desc = transaction.description.toLowerCase();
    if (desc.includes('youtube')) return 'platformRevenue';
    if (desc.includes('brand') || desc.includes('sponsor')) return 'brandDeals';
    if (desc.includes('affiliate')) return 'affiliateIncome';
    if (desc.includes('merch')) return 'merchandise';
    return 'other';
  }

  categorizeExpense(expense) {
    const desc = (expense.description || expense.merchant || '').toLowerCase();
    if (desc.includes('camera') || desc.includes('microphone') || desc.includes('light')) return 'equipment';
    if (desc.includes('adobe') || desc.includes('software') || desc.includes('subscription')) return 'software';
    if (desc.includes('editor') || desc.includes('assistant')) return 'contractors';
    if (desc.includes('hotel') || desc.includes('flight') || desc.includes('uber')) return 'travel';
    return 'other';
  }

  isDeductible(expense) {
    const businessCategories = ['equipment', 'software', 'contractors', 'travel', 'homeOffice'];
    return businessCategories.includes(expense.category);
  }

  getTaxCategory(expense) {
    // Map to tax form categories
    const map = {
      'equipment': 'Equipment/Depreciation',
      'software': 'Software/Subscriptions',
      'contractors': 'Contract Labor',
      'travel': 'Travel',
      'homeOffice': 'Home Office'
    };
    return map[expense.category] || 'Other Expenses';
  }

  calculateDeductions(expenses) {
    return Object.values(expenses).flat().filter(e => e.deductible);
  }

  estimateTaxes(netIncome) {
    // Simplified tax estimation
    const brackets = [
      { limit: 11000, rate: 0.10 },
      { limit: 44725, rate: 0.12 },
      { limit: 95375, rate: 0.22 },
      { limit: 182100, rate: 0.24 }
    ];
    
    let tax = 0;
    let remaining = netIncome;
    let previousLimit = 0;
    
    for (const bracket of brackets) {
      if (remaining <= 0) break;
      const taxable = Math.min(remaining, bracket.limit - previousLimit);
      tax += taxable * bracket.rate;
      remaining -= taxable;
      previousLimit = bracket.limit;
    }
    
    // Add self-employment tax (15.3%)
    tax += netIncome * 0.153;
    
    return Math.round(tax);
  }

  calculateQuarterlies(taxData) {
    const annualTax = this.estimateTaxes(taxData.income.total - taxData.expenses.total);
    return {
      q1: Math.round(annualTax * 0.25),
      q2: Math.round(annualTax * 0.25),
      q3: Math.round(annualTax * 0.25),
      q4: Math.round(annualTax * 0.25),
      total: annualTax
    };
  }

  listMissingDocuments(taxData) {
    const needed = [];
    if (taxData.documents['1099s'].length === 0) needed.push('1099 forms from platforms/brands');
    if (taxData.expenses.equipment.length > 0 && !taxData.documents.receipts.some(r => r.includes('equipment'))) {
      needed.push('Equipment receipts');
    }
    return needed;
  }

  parseContractReview(content) {
    return {
      summary: content,
      redFlags: [],
      recommendations: []
    };
  }
}

module.exports = SupportAgent;
