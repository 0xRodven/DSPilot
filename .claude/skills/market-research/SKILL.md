---
name: market-research
description: Conduct market research - TAM/SAM/SOM analysis, market sizing, segment identification, trend analysis, and competitive landscape mapping.
allowed-tools: Read, Write, Edit, WebSearch, WebFetch
---

# Market Research Skill

## When to Use
- Sizing market opportunities
- Identifying target segments
- Analyzing market trends
- Building investor decks
- Planning go-to-market strategy

## Market Sizing (TAM/SAM/SOM)

### Framework

```markdown
## TAM/SAM/SOM Framework

### TAM (Total Addressable Market)
The TOTAL market demand for a product/service.
"If we had 100% market share globally"

### SAM (Serviceable Addressable Market)
The portion of TAM we can realistically reach.
"Our target geography + segment"

### SOM (Serviceable Obtainable Market)
The realistic market share we can capture.
"What we can actually win in 3-5 years"

## Calculation Methods

### Top-Down
Start with industry reports, narrow to your segment.
TAM = Industry size × Relevant %

### Bottom-Up
Start with unit economics, scale to market.
TAM = # of customers × Average revenue per customer

### Value Theory
Start with value delivered, calculate willingness to pay.
TAM = Value created × Capture rate
```

### DSPilot Market Sizing Example

```markdown
## DSPilot TAM/SAM/SOM Analysis

### TAM: Global Fleet Management Software
**Method**: Top-down from industry reports

- Global fleet management market: $34B (2024)
- Last-mile delivery segment: ~15% = $5.1B
- Driver performance tools: ~10% = $510M

**TAM = $510M**

---

### SAM: Amazon DSP Management Tools
**Method**: Bottom-up calculation

**US Amazon DSP Market:**
- Amazon DSP partners in US: ~3,500
- Average stations per DSP: 1.5
- Total stations: ~5,250
- Average spend on tools: $2,000/year

**SAM = 5,250 × $2,000 = $10.5M (US)**

**Global:**
- US + Canada + UK + EU
- Multiplier: ~2.5x US

**SAM = $26M (Global)**

---

### SOM: Realistic 5-Year Target
**Method**: Competitive analysis + growth rate

**Assumptions:**
- Year 1: 100 stations × $1,200/yr = $120K ARR
- Year 2: 300 stations × $1,500/yr = $450K ARR
- Year 3: 700 stations × $1,800/yr = $1.26M ARR
- Year 4: 1,200 stations × $2,000/yr = $2.4M ARR
- Year 5: 2,000 stations × $2,200/yr = $4.4M ARR

**SOM (Year 5) = $4.4M ARR**
**Market Share = 17% of SAM**

---

### Summary

| Metric | Value | Description |
|--------|-------|-------------|
| TAM | $510M | Global driver performance tools |
| SAM | $26M | Amazon DSP market (global) |
| SOM | $4.4M | 5-year target (2,000 stations) |
```

## Market Segmentation

### Segmentation Framework

```markdown
## Segmentation Criteria

### Geographic
- Country/region
- Urban vs. suburban vs. rural
- Climate considerations

### Demographic
- Company size
- Years in business
- Revenue/funding stage

### Behavioral
- Tool adoption patterns
- Purchase decision process
- Pain point intensity

### Psychographic
- Innovation appetite
- Growth mindset
- Price sensitivity
```

### DSPilot Segment Analysis

```markdown
## DSPilot Market Segments

### Segment 1: Growing DSPs (Primary Target)
**Size**: ~1,500 DSPs (40% of market)

**Characteristics**:
- 1-3 stations
- 30-100 drivers
- 2-5 years in operation
- Actively investing in growth

**Pain Points**:
- Scaling coaching processes
- Maintaining DWC as they grow
- Manager burnout

**Willingness to Pay**: High ($99-199/mo)
**Competition**: Spreadsheets

**Why Target First**:
- Most pain, most willing to change
- Word-of-mouth in DSP community
- Can grow with us

---

### Segment 2: Enterprise DSPs (Future Target)
**Size**: ~300 DSPs (8% of market)

**Characteristics**:
- 4+ stations
- 100+ drivers
- 5+ years in operation
- Dedicated operations team

**Pain Points**:
- Cross-station visibility
- Standardizing processes
- Reporting for stakeholders

**Willingness to Pay**: Very High ($500+/mo)
**Competition**: Enterprise fleet software

**Why Target Later**:
- Longer sales cycle
- More feature requirements
- Need credibility first

---

### Segment 3: New DSPs (Nurture)
**Size**: ~800 DSPs (22% of market)

**Characteristics**:
- Single station
- <30 drivers
- <2 years in operation
- Survival mode

**Pain Points**:
- Just keeping up
- Learning Amazon processes
- Cash flow constraints

**Willingness to Pay**: Low ($49-99/mo)
**Competition**: Doing nothing

**Why Nurture**:
- High churn risk
- But if they survive, become Segment 1
- Brand awareness

---

### Segment 4: Struggling DSPs (Avoid)
**Size**: ~1,000 DSPs (27% of market)

**Characteristics**:
- Chronic low DWC
- High driver turnover
- Owner disengaged

**Why Avoid**:
- Tool won't fix fundamental issues
- High churn, low LTV
- Support burden
```

## Trend Analysis

### Trend Research Template

```markdown
## Market Trend Analysis

### Trend: [Name]

**What's Happening**:
[Description of the trend]

**Evidence**:
- Data point 1 (source)
- Data point 2 (source)
- Data point 3 (source)

**Timeline**:
- Started: [When]
- Peak expected: [When]

**Impact on DSPilot**:
- Opportunity: [How we can benefit]
- Threat: [What to watch out for]

**Strategic Response**:
[What we should do]
```

### DSPilot Trend Analysis

```markdown
## Key Market Trends Affecting DSPilot

### Trend 1: Amazon's Last-Mile Expansion
**What's Happening**:
Amazon continues to expand DSP network to meet same-day/next-day delivery demand.

**Evidence**:
- Amazon added 500+ new DSP partners in 2024
- Same-day delivery coverage expanded to 90% of US
- DSP contract values increased 15% YoY

**Impact on DSPilot**:
- ✅ Larger addressable market
- ✅ More stations needing tools
- ⚠️ Amazon may build native tools

**Strategic Response**:
Focus on features Amazon won't build (coaching, WhatsApp)

---

### Trend 2: Driver Shortage & Retention Focus
**What's Happening**:
Driver shortage forcing DSPs to focus on retention over replacement.

**Evidence**:
- Driver turnover rates >100% annually
- Hiring costs $3-5K per driver
- DSPs offering sign-on bonuses

**Impact on DSPilot**:
- ✅ Coaching becomes more valuable
- ✅ Fair process = better retention
- ✅ Cost justification easier

**Strategic Response**:
Add retention-focused features (recognition, improvement tracking)

---

### Trend 3: Automation & AI in Logistics
**What's Happening**:
AI/ML tools entering logistics for route optimization, demand prediction.

**Evidence**:
- Route optimization market growing 15% CAGR
- Amazon testing AI for dispatch
- Competitors adding "AI" features

**Impact on DSPilot**:
- ⚠️ Expectations for AI features
- ✅ Opportunity for predictive coaching
- ⚠️ Price pressure from automation

**Strategic Response**:
Add AI-powered coaching recommendations (predict who needs help)

---

### Trend 4: Gig Economy Regulation
**What's Happening**:
Increasing regulation around gig worker classification (AB5, PRO Act).

**Evidence**:
- California AB5 reclassified some drivers
- EU proposing gig worker protections
- DOL updates to contractor rules

**Impact on DSPilot**:
- ⚠️ Some DSPs may exit market
- ✅ Compliance documentation more valuable
- ✅ Fair coaching = legal protection

**Strategic Response**:
Emphasize documentation and fair process in marketing
```

## Competitive Landscape

### Competitive Map Template

```markdown
## Competitive Landscape Map

### Direct Competitors
Products solving the same problem for the same customer.

| Competitor | Position | Strengths | Weaknesses |
|------------|----------|-----------|------------|
| [Name] | [Description] | [List] | [List] |

### Indirect Competitors
Different solutions to the same underlying need.

| Alternative | When Chosen | Advantages | Disadvantages |
|-------------|-------------|------------|---------------|
| [Solution] | [Scenario] | [List] | [List] |

### Future Threats
Who might enter this market?

| Threat | Likelihood | Impact | Timeline |
|--------|------------|--------|----------|
| [Company] | [H/M/L] | [H/M/L] | [Timeframe] |
```

### Competitive Intelligence Sources

```markdown
## Where to Find Competitor Intel

### Public Sources
1. **Website**: Pricing, features, messaging
2. **LinkedIn**: Team size, hiring, posts
3. **Crunchbase**: Funding, investors
4. **G2/Capterra**: Reviews, ratings
5. **Social Media**: Product updates
6. **Job Postings**: Tech stack, priorities
7. **Press Releases**: Partnerships, milestones

### Semi-Public Sources
1. **Industry Events**: Conference talks
2. **Webinars**: Feature demos
3. **Case Studies**: Customer results
4. **Content**: Blog posts, whitepapers

### Ethical Intelligence
1. **Customer Feedback**: Why they switched
2. **Win/Loss Analysis**: Why we won/lost
3. **Demo Requests**: Sign up and explore
4. **Community**: Forums, Reddit, Slack
```

## Market Research Report

### Report Template

```markdown
## Market Research Report
### [Market Name] | [Date]

---

## Executive Summary
[2-3 paragraphs covering key findings and recommendations]

---

## Market Overview

### Market Definition
[What market are we analyzing?]

### Market Size
| Metric | Value | Source |
|--------|-------|--------|
| TAM | $X | [Source] |
| SAM | $X | [Source] |
| SOM | $X | [Analysis] |

### Growth Rate
- Historical: X% CAGR (20XX-20XX)
- Projected: X% CAGR (20XX-20XX)

---

## Market Segmentation

### Segment Overview
[Description of how market is segmented]

### Target Segment Deep-Dive
[Detailed analysis of primary target]

---

## Competitive Landscape

### Key Players
[Overview of main competitors]

### Competitive Positioning
[How we differentiate]

---

## Market Trends

### Current Trends
[What's happening now]

### Emerging Trends
[What's coming]

---

## Opportunities & Threats

### Opportunities
1. [Opportunity 1]
2. [Opportunity 2]

### Threats
1. [Threat 1]
2. [Threat 2]

---

## Recommendations

### Strategic Recommendations
1. [Recommendation 1]
2. [Recommendation 2]

### Tactical Next Steps
1. [Action 1]
2. [Action 2]

---

## Appendix
- Data sources
- Methodology notes
- Detailed calculations
```

## Research Methods

### Primary Research
```markdown
- Customer interviews
- Surveys
- Focus groups
- Observation
- Win/loss analysis
```

### Secondary Research
```markdown
- Industry reports (Gartner, Forrester, IBISWorld)
- Government data (Census, BLS)
- Academic papers
- News articles
- Company filings (10-K, S-1)
- Analyst reports
```

### Data Triangulation
```markdown
Always verify findings with 3+ sources:
1. Industry report says X
2. Customer interviews confirm X
3. Public data supports X

If sources conflict, investigate why.
```

## DO NOT
- Cite outdated data (>2 years old)
- Use single source for key claims
- Confuse TAM with SAM
- Ignore emerging competitors
- Present assumptions as facts
- Skip primary research
