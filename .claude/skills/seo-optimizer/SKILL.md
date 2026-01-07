---
name: seo-optimizer
description: Optimize content for search engines with meta tags, keyword placement, heading structure, and schema markup. Use for blog posts, landing pages, documentation, or any content that needs organic visibility.
allowed-tools: Read, Write, Edit, WebSearch
---

# SEO Optimizer Skill

## When to Use
- Optimizing blog posts for search
- Creating SEO-friendly landing pages
- Writing meta titles and descriptions
- Structuring content for featured snippets
- Adding schema markup

## SEO Checklist

### 1. Keyword Research & Placement

```markdown
## Primary Keyword Selection
- Choose ONE primary keyword per page
- Long-tail keywords (3-5 words) rank easier
- Check search volume and competition

## Keyword Placement
- [ ] Title tag (first 60 characters)
- [ ] Meta description (first 155 characters)
- [ ] H1 heading (exact match)
- [ ] First paragraph (within 100 words)
- [ ] H2/H3 subheadings (variations)
- [ ] Image alt text (natural usage)
- [ ] URL slug (hyphenated, lowercase)

## Keyword Density
- Target: 1-2% of total word count
- Natural usage > forced insertion
- Use semantic variations
```

### 2. Title Tag Optimization

```html
<!-- Format: Primary Keyword | Brand (50-60 chars) -->
<title>Driver Performance Tracking for Amazon DSPs | DSPilot</title>

<!-- Formulas that work -->
"[Primary Keyword]: [Benefit] | Brand"
"How to [Action] [Keyword] in [Timeframe]"
"[Number] Best [Keyword] Tips for [Audience]"
"[Keyword] - [Unique Value Prop] | Brand"
```

### 3. Meta Description

```html
<!-- 155 characters max, include CTA -->
<meta name="description" content="Track Amazon driver DWC/IADC performance in real-time. Import reports, coach drivers, improve scores. Start your free trial today.">

<!-- Formula -->
"[What it is] + [Key benefit] + [CTA]"
```

### 4. Heading Structure

```markdown
# H1: One per page, contains primary keyword
Only one H1 per page. Clear topic signal.

## H2: Main sections (3-7 per page)
Break content into scannable sections.
Include keyword variations.

### H3: Subsections
Support H2 content.
Good for featured snippet bullets.

#### H4: Rarely needed
Only for complex nested content.
```

### 5. Content Structure for SEO

```markdown
## Ideal Blog Post Structure

### Introduction (100-150 words)
- Hook with problem/question
- Include primary keyword
- Preview what reader will learn

### Table of Contents
- Jump links for long content
- Helps featured snippets

### Main Body (H2 sections)
- 300-500 words per section
- Include related keywords
- Use bullet points for scannability

### FAQ Section
- Schema-ready format
- Voice search optimization

### Conclusion + CTA
- Summarize key points
- Clear next step
```

### 6. URL Optimization

```markdown
## URL Best Practices

# Good
/driver-performance-tracking
/how-to-improve-dwc-scores
/amazon-dsp-coaching-guide

# Bad
/page?id=123
/2024/01/15/post-title-here-very-long
/driver_performance_TRACKING
```

### 7. Image SEO

```html
<!-- Filename -->
driver-performance-dashboard.png (not IMG_1234.png)

<!-- Alt text -->
<img
  src="driver-performance-dashboard.png"
  alt="DSPilot driver performance dashboard showing DWC scores and tier distribution"
/>

<!-- Compression -->
- WebP format preferred
- Under 100KB for web
- Lazy loading for below-fold images
```

### 8. Internal Linking

```markdown
## Strategy
- Link related content (3-5 internal links per post)
- Use descriptive anchor text (not "click here")
- Link to high-value pages from new content
- Create pillar → cluster content architecture

## Example
"Learn more about [coaching best practices](/coaching-guide)
for improving driver performance."
```

### 9. Schema Markup

```json
// FAQ Schema (for FAQ sections)
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [{
    "@type": "Question",
    "name": "What is DWC in Amazon delivery?",
    "acceptedAnswer": {
      "@type": "Answer",
      "text": "DWC (Delivered With Care) measures..."
    }
  }]
}

// Product Schema (for DSPilot)
{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "DSPilot",
  "applicationCategory": "BusinessApplication",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD"
  }
}

// Article Schema (for blog posts)
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "How to Improve Amazon DWC Scores",
  "author": {
    "@type": "Organization",
    "name": "DSPilot"
  }
}
```

### 10. Technical SEO Checklist

```markdown
- [ ] Page loads in under 3 seconds
- [ ] Mobile-responsive design
- [ ] HTTPS enabled
- [ ] Canonical URL set
- [ ] No duplicate content
- [ ] XML sitemap updated
- [ ] robots.txt allows crawling
- [ ] No broken links (404s)
```

## DSPilot SEO Keywords

### Primary Keywords
- "amazon driver performance tracking"
- "dwc performance management"
- "delivery driver coaching software"
- "amazon dsp management tool"

### Long-Tail Keywords
- "how to improve amazon dwc scores"
- "amazon delivery driver performance dashboard"
- "dsp driver coaching best practices"
- "amazon iadc compliance tracking"

### Competitor Keywords
- "amazon flex driver management"
- "delivery performance software"
- "fleet driver tracking"

## Featured Snippet Optimization

```markdown
## For Definition Snippets
Start with: "[Term] is [definition]..."

## For List Snippets
Use H2 + bullet points or numbered lists

## For Table Snippets
Use proper HTML tables with headers

## For How-To Snippets
Use "How to [X]" as H2
Follow with numbered steps
```

## DO NOT
- Keyword stuff (unnatural repetition)
- Duplicate meta descriptions across pages
- Use the same H1 on multiple pages
- Hide text for SEO purposes
- Buy backlinks or use link farms
- Ignore mobile SEO
