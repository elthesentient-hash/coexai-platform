# CoExAI Design System

**Apple-inspired, Galaxy-feel UI Design System**

> Think Apple.com meets SpaceX meets Notion. Minimal but powerful.

## Overview

CoExAI Design System is a comprehensive, dark-mode-first design language that combines the polish and precision of Apple's interface design with the cosmic, futuristic aesthetic of deep space exploration.

### Key Features

- 🌌 **Dark Mode First** - Cosmic/galaxy feel with deep space blues and purple gradients
- 💎 **Glassmorphism** - Frosted glass effects with backdrop blur
- ✨ **Apple-Level Polish** - Smooth animations, precise spacing, premium feel
- 🎨 **Thoughtful Color Palette** - Deep space blues, nebula purples, starlight whites
- 🔤 **Clean Typography** - Highly readable, modern type scale
- ⚡ **Micro-interactions** - Purposeful, delightful animations

## Quick Start

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CoExAI App</title>
  <!-- Import the design system -->
  <link rel="stylesheet" href="./design-system/components.css">
  <link rel="stylesheet" href="./design-system/animations.css">
</head>
<body>
  <!-- Your content here -->
</body>
</html>
```

## File Structure

```
design-system/
├── tokens.css      # Colors, typography, spacing, shadows
├── components.css  # All UI components
├── animations.css  # Micro-interactions & animations
└── README.md       # This file
```

## Design Tokens

### Import Tokens Only

```html
<link rel="stylesheet" href="./design-system/tokens.css">
```

### Color Palette

| Token | Value | Usage |
|-------|-------|-------|
| `--color-bg-primary` | `#0a0a0f` | Main background |
| `--color-bg-secondary` | `#12121a` | Secondary surfaces |
| `--color-bg-glass` | `rgba(18, 18, 26, 0.6)` | Glassmorphism base |
| `--color-accent-purple` | `#a855f7` | Primary accent |
| `--color-accent-cyan` | `#06b6d4` | Secondary accent |
| `--color-text-primary` | `#ffffff` | Primary text |
| `--color-text-secondary` | `rgba(255,255,255,0.87)` | Secondary text |

### Gradients

```css
/* Cosmic background */
background: var(--gradient-cosmic);

/* Aurora gradient for text */
background: var(--gradient-aurora);
-webkit-background-clip: text;
-webkit-text-fill-color: transparent;

/* Sunset gradient for buttons */
background: var(--gradient-sunset);
```

### Typography

| Class | Size | Usage |
|-------|------|-------|
| `.coex-heading-1` | 48px | Hero titles |
| `.coex-heading-2` | 36px | Page titles |
| `.coex-heading-3` | 30px | Section headers |
| `.coex-text-large` | 18px | Lead paragraphs |
| `.coex-text-body` | 16px | Body text |
| `.coex-text-small` | 14px | Captions |
| `.coex-text-xs` | 12px | Labels |

### Spacing Scale

Based on 8px grid: `--space-1` (4px) to `--space-32` (128px)

```css
padding: var(--space-4);      /* 16px */
margin-bottom: var(--space-6); /* 24px */
gap: var(--space-3);           /* 12px */
```

## Components

### Buttons

```html
<!-- Primary - Cosmic glow effect -->
<button class="coex-btn coex-btn--primary">Get Started</button>

<!-- Secondary - Glass effect -->
<button class="coex-btn coex-btn--secondary">Learn More</button>

<!-- Ghost - Minimal -->
<button class="coex-btn coex-btn--ghost">Cancel</button>

<!-- Sizes -->
<button class="coex-btn coex-btn--primary coex-btn--sm">Small</button>
<button class="coex-btn coex-btn--primary coex-btn--lg">Large</button>

<!-- With icon -->
<button class="coex-btn coex-btn--primary">
  <svg><!-- icon --></svg>
  <span>Download</span>
</button>

<!-- Loading state -->
<button class="coex-btn coex-btn--primary coex-btn--loading" disabled>
  <span class="coex-btn__text">Loading...</span>
  <span class="coex-btn__spinner"></span>
</button>
```

### Cards

```html
<!-- Basic card -->
<div class="coex-card">
  <div class="coex-card__header">
    <h3 class="coex-card__title">Card Title</h3>
    <p class="coex-card__subtitle">Subtitle text</p>
  </div>
  <div class="coex-card__body">
    <!-- Card content -->
  </div>
  <div class="coex-card__footer">
    <button class="coex-btn coex-btn--ghost">Cancel</button>
    <button class="coex-btn coex-btn--primary">Save</button>
  </div>
</div>

<!-- Elevated card with hover lift -->
<div class="coex-card coex-card--elevated coex-hover-lift">
  <!-- Content -->
</div>

<!-- Gradient card -->
<div class="coex-card coex-card--gradient">
  <!-- Content -->
</div>

<!-- Interactive card -->
<div class="coex-card coex-card--interactive" onclick="handleClick()">
  <!-- Content -->
</div>
```

### Form Inputs

```html
<!-- Basic input -->
<div class="coex-form-group">
  <label class="coex-label">Email</label>
  <input type="email" class="coex-input" placeholder="you@example.com">
  <span class="coex-form-helper">We'll never share your email.</span>
</div>

<!-- Input with icon -->
<div class="coex-form-group">
  <label class="coex-label">Search</label>
  <div class="coex-input-wrapper">
    <input type="text" class="coex-input" placeholder="Search...">
    <svg class="coex-input__icon"><!-- search icon --></svg>
  </div>
</div>

<!-- Textarea -->
<div class="coex-form-group">
  <label class="coex-label coex-label--required">Description</label>
  <textarea class="coex-textarea" placeholder="Enter description..."></textarea>
</div>

<!-- Select -->
<div class="coex-form-group">
  <label class="coex-label">Country</label>
  <select class="coex-select">
    <option>United States</option>
    <option>Canada</option>
  </select>
</div>

<!-- Checkbox -->
<label class="coex-checkbox">
  <input type="checkbox" checked>
  <span>Remember me</span>
</label>

<!-- Radio -->
<label class="coex-radio">
  <input type="radio" name="plan" value="pro">
  <span>Pro Plan</span>
</label>

<!-- Toggle switch -->
<label class="coex-toggle">
  <input type="checkbox">
  <span class="coex-toggle__switch"></span>
  <span>Notifications</span>
</label>

<!-- Validation states -->
<input class="coex-input coex-input--error" placeholder="Error state">
<span class="coex-form-error">This field is required</span>

<input class="coex-input coex-input--success" placeholder="Success state">
```

### Modals

```html
<!-- Modal overlay -->
<div class="coex-modal-overlay coex-modal-overlay--open">
  <div class="coex-modal">
    <div class="coex-modal__header">
      <h2 class="coex-modal__title">Modal Title</h2>
      <button class="coex-modal__close">
        <svg><!-- close icon --></svg>
      </button>
    </div>
    <div class="coex-modal__body">
      <!-- Modal content -->
    </div>
    <div class="coex-modal__footer">
      <button class="coex-btn coex-btn--ghost">Cancel</button>
      <button class="coex-btn coex-btn--primary">Confirm</button>
    </div>
  </div>
</div>

<!-- Sizes -->
<div class="coex-modal coex-modal--sm"><!-- Small --></div>
<div class="coex-modal coex-modal--lg"><!-- Large --></div>
<div class="coex-modal coex-modal--xl"><!-- Extra large --></div>
```

### Navigation

```html
<!-- Top Navigation -->
<nav class="coex-navbar">
  <div class="coex-navbar__container">
    <a href="#" class="coex-navbar__brand">
      <div class="coex-navbar__logo">C</div>
      <span class="coex-navbar__brand-text">CoExAI</span>
    </a>
    <div class="coex-navbar__nav">
      <a href="#" class="coex-navbar__link coex-navbar__link--active">Dashboard</a>
      <a href="#" class="coex-navbar__link">Projects</a>
      <a href="#" class="coex-navbar__link">Settings</a>
    </div>
    <div class="coex-navbar__actions">
      <button class="coex-btn coex-btn--secondary coex-btn--icon">
        <svg><!-- bell icon --></svg>
      </button>
      <div class="coex-avatar coex-avatar--sm">JD</div>
    </div>
  </div>
</nav>

<!-- Sidebar -->
<aside class="coex-sidebar">
  <div class="coex-sidebar__section">
    <span class="coex-sidebar__label">Main</span>
    <nav class="coex-sidebar__nav">
      <a href="#" class="coex-sidebar__link coex-sidebar__link--active">
        <svg class="coex-sidebar__link-icon"><!-- icon --></svg>
        Dashboard
      </a>
      <a href="#" class="coex-sidebar__link">
        <svg class="coex-sidebar__link-icon"><!-- icon --></svg>
        Analytics
      </a>
    </nav>
  </div>
</aside>
```

### Tabs

```html
<!-- Standard tabs -->
<div class="coex-tabs">
  <button class="coex-tab coex-tab--active">Overview</button>
  <button class="coex-tab">Features</button>
  <button class="coex-tab">Settings</button>
</div>

<!-- Pill tabs -->
<div class="coex-tabs coex-tabs--pills">
  <button class="coex-tab coex-tab--active">Day</button>
  <button class="coex-tab">Week</button>
  <button class="coex-tab">Month</button>
</div>
```

### Dropdowns

```html
<div class="coex-dropdown coex-dropdown--open">
  <button class="coex-btn coex-btn--secondary">
    Actions
    <svg><!-- chevron down --></svg>
  </button>
  <div class="coex-dropdown__menu">
    <button class="coex-dropdown__item">
      <svg><!-- icon --></svg>
      Edit
    </button>
    <button class="coex-dropdown__item">
      <svg><!-- icon --></svg>
      Duplicate
    </button>
    <div class="coex-dropdown__divider"></div>
    <button class="coex-dropdown__item coex-dropdown__item--danger">
      <svg><!-- icon --></svg>
      Delete
    </button>
  </div>
</div>
```

### Badges

```html
<span class="coex-badge coex-badge--default">Default</span>
<span class="coex-badge coex-badge--primary">Primary</span>
<span class="coex-badge coex-badge--success">Success</span>
<span class="coex-badge coex-badge--warning">Warning</span>
<span class="coex-badge coex-badge--error">Error</span>

<!-- With dot -->
<span class="coex-badge coex-badge--success coex-badge--dot">Online</span>
```

### Avatars

```html
<!-- Text avatar -->
<div class="coex-avatar coex-avatar--md">JD</div>

<!-- Image avatar -->
<div class="coex-avatar coex-avatar--lg">
  <img src="avatar.jpg" alt="User">
</div>

<!-- Sizes -->
<div class="coex-avatar coex-avatar--xs">XS</div>
<div class="coex-avatar coex-avatar--sm">SM</div>
<div class="coex-avatar coex-avatar--md">MD</div>
<div class="coex-avatar coex-avatar--lg">LG</div>
<div class="coex-avatar coex-avatar--xl">XL</div>

<!-- Avatar group -->
<div class="coex-avatar-group">
  <div class="coex-avatar coex-avatar--sm">A</div>
  <div class="coex-avatar coex-avatar--sm">B</div>
  <div class="coex-avatar coex-avatar--sm">C</div>
</div>
```

### Toast Notifications

```html
<div class="coex-toast-container">
  <div class="coex-toast coex-toast--success">
    <svg class="coex-toast__icon"><!-- check icon --></svg>
    <div class="coex-toast__content">
      <div class="coex-toast__title">Success!</div>
      <div class="coex-toast__message">Your changes have been saved.</div>
    </div>
    <button class="coex-toast__close">
      <svg><!-- x icon --></svg>
    </button>
  </div>
</div>
```

### Progress & Loading

```html
<!-- Progress bar -->
<div class="coex-progress">
  <div class="coex-progress__bar" style="width: 60%;"></div>
</div>

<!-- Indeterminate progress -->
<div class="coex-progress coex-progress--indeterminate">
  <div class="coex-progress__bar"></div>
</div>

<!-- Spinner -->
<div class="coex-spinner"></div>
<div class="coex-spinner coex-spinner--sm"></div>
<div class="coex-spinner coex-spinner--lg"></div>

<!-- Skeleton loading -->
<div class="coex-skeleton coex-skeleton--text" style="width: 200px;"></div>
<div class="coex-skeleton coex-skeleton--circle" style="width: 40px; height: 40px;"></div>
<div class="coex-skeleton coex-skeleton--card"></div>
```

## Animations

### Import Animations

```html
<link rel="stylesheet" href="./design-system/animations.css">
```

### Entrance Animations

```html
<!-- Fade in -->
<div class="coex-animate-fade-in">Content</div>

<!-- Fade in with direction -->
<div class="coex-animate-fade-in-up">Slide up</div>
<div class="coex-animate-fade-in-down">Slide down</div>
<div class="coex-animate-fade-in-left">Slide left</div>
<div class="coex-animate-fade-in-right">Slide right</div>

<!-- Scale in -->
<div class="coex-animate-scale-in">Scale animation</div>

<!-- Flip in -->
<div class="coex-animate-flip-y">Flip Y</div>
```

### Continuous Animations

```html
<!-- Pulse effects -->
<div class="coex-animate-pulse">Pulsing content</div>
<div class="coex-animate-glow-pulse">Glowing pulse</div>

<!-- Float -->
<div class="coex-animate-float">Floating element</div>

<!-- Spin -->
<div class="coex-animate-spin">Spinning</div>
<div class="coex-animate-spin-slow">Slow spin</div>

<!-- Cosmic effects -->
<div class="coex-animate-twinkle">Twinkling star</div>
<div class="coex-animate-nebula">Nebula pulse</div>
<div class="coex-animate-aurora">Aurora gradient</div>
```

### Micro-interactions

```html
<!-- Hover effects -->
<div class="coex-hover-lift">Lifts on hover</div>
<div class="coex-hover-glow">Glows on hover</div>
<div class="coex-hover-scale">Scales on hover</div>

<!-- Focus ring -->
<button class="coex-btn coex-focus-ring">Focus visible ring</button>

<!-- Ripple effect -->
<button class="coex-btn coex-btn--primary coex-ripple">Ripple on click</button>
```

### Staggered Animations

```html
<!-- Parent with stagger -->
<div class="coex-animate-stagger">
  <div>Item 1</div>  <!-- 0ms delay -->
  <div>Item 2</div>  <!-- 50ms delay -->
  <div>Item 3</div>  <!-- 100ms delay -->
  <div>Item 4</div>  <!-- 150ms delay -->
  <!-- etc. -->
</div>
```

### Animation Timing

```html
<!-- Custom delays -->
<div class="coex-animate-fade-in-up coex-delay-3">150ms delay</div>

<!-- Custom duration -->
<div class="coex-animate-fade-in coex-duration-slow">Slow animation</div>
```

### Reduced Motion

All animations respect `prefers-reduced-motion`:

```css
@media (prefers-reduced-motion: reduce) {
  /* Animations are disabled for accessibility */
}
```

## Customization

### CSS Variables

Override tokens to customize:

```css
:root {
  /* Change primary accent color */
  --color-accent-purple: #8b5cf6;
  
  /* Adjust border radius */
  --radius-xl: 1.5rem;
  
  /* Custom shadow */
  --shadow-glow-md: 0 0 50px rgba(139, 92, 246, 0.3);
}
```

### Component Variants

Create custom variants using the base classes:

```css
/* Custom button variant */
.coex-btn--cosmic {
  background: linear-gradient(135deg, #6366f1 0%, #a855f7 50%, #ec4899 100%);
  box-shadow: 0 0 30px rgba(168, 85, 247, 0.4);
}

.coex-btn--cosmic:hover {
  box-shadow: 0 0 50px rgba(168, 85, 247, 0.6);
  transform: translateY(-2px);
}
```

## Browser Support

- Chrome 88+
- Firefox 78+
- Safari 14+
- Edge 88+

Requires CSS custom properties and backdrop-filter support.

## Accessibility

- All interactive elements have focus states
- Reduced motion support built-in
- Semantic HTML encouraged
- Color contrast meets WCAG 2.1 AA standards
- Keyboard navigation supported

## Examples

### Login Page

```html
<div class="coex-card coex-card--elevated" style="max-width: 400px; margin: 100px auto;">
  <div class="coex-card__header" style="text-align: center;">
    <h2 class="coex-heading-4">Welcome Back</h2>
    <p class="coex-card__subtitle">Sign in to your account</p>
  </div>
  <div class="coex-card__body">
    <div class="coex-form-group">
      <label class="coex-label coex-label--required">Email</label>
      <input type="email" class="coex-input" placeholder="you@example.com">
    </div>
    <div class="coex-form-group">
      <label class="coex-label coex-label--required">Password</label>
      <input type="password" class="coex-input" placeholder="••••••••">
    </div>
    <label class="coex-checkbox" style="margin-top: 16px;">
      <input type="checkbox">
      <span>Remember me</span>
    </label>
  </div>
  <div class="coex-card__footer" style="flex-direction: column;">
    <button class="coex-btn coex-btn--primary" style="width: 100%;">
      Sign In
    </button>
    <a href="#" class="coex-text-small" style="color: var(--color-accent-purple);">
      Forgot password?
    </a>
  </div>
</div>
```

### Dashboard Card

```html
<div class="coex-card coex-card--elevated coex-hover-lift coex-animate-fade-in-up">
  <div class="coex-card__header">
    <div>
      <p class="coex-text-xs">Total Revenue</p>
      <h3 class="coex-heading-4" style="margin-top: 4px;">$48,294</h3>
    </div>
    <span class="coex-badge coex-badge--success coex-badge--dot">+12%</span>
  </div>
  <div class="coex-card__body">
    <div class="coex-progress" style="margin-bottom: 12px;">
      <div class="coex-progress__bar" style="width: 75%;"></div>
    </div>
    <p class="coex-text-small">75% of monthly target reached</p>
  </div>
</div>
```

## License

MIT License - CoExAI Design System
