# Smart Home Platform - Melbourne Market Revamp Plan

**Date:** January 2026
**Target Market:** Aged Care & Disability Support - Melbourne, Australia
**Funding Pathways:** NDIS, My Aged Care

---

## Key Market Insights

| Current Prototype | Melbourne Market Reality |
|-------------------|-------------------------|
| Tech-focused messaging | Safety/Dignity/Anxiety Relief focused |
| General households | Elderly & disabled individuals |
| Complex multi-portal system | Simple, non-intimidating interface |
| Reseller-driven model | **OT (Occupational Therapist) driven** |
| "Smart home automation" | "Independent living support" |

### The Critical Insight

> "One enthusiastic OT endorsement can bring you 50 clients"

**OTs are the gateway, not resellers.** Family members are decision-makers, but OTs are trusted influencers who recommend solutions.

---

## Revamp Strategy: 3 Portals, 1 Mission

### Mission Statement (New)
**"Helping loved ones live independently, safely, with dignity"**

### Portal Restructure

| Old Structure | New Structure | Primary User |
|---------------|---------------|--------------|
| Household Dashboard | **Independence Dashboard** | Elderly/Disabled person |
| Consultant Portal | **Family Circle** | Adult children, carers |
| Reseller Hub | **Professional Portal** | OTs, care workers, installers |

---

## Phase 1: Core Revamp (4-6 weeks)

### 1.1 Rebrand Landing Page

**Remove:**
- "One Platform, Multiple Portals" architecture talk
- Complex journey steps
- Technical jargon (Hub, MQTT, protocols)
- Reseller/Consultant role explanations

**Add:**
- Emotional messaging: "Sleep peacefully knowing Mum is safe"
- Real scenarios: Fall detection, medication reminders, emergency alerts
- Family testimonials (even mock ones initially)
- NDIS/My Aged Care logo placeholders with "Registration in progress"
- OT endorsement section

**Hero Section (New Copy):**
```
"Independence for them. Peace of mind for you."

Help your loved ones live safely at home with gentle monitoring
that respects their dignity and eases your worry.

[See How It Works] [Talk to a Care Specialist]
```

### 1.2 Independence Dashboard (formerly Household)

**Design Principles:**
- Large buttons, high contrast, simple icons
- Voice control integration (critical for disability)
- NO complex automations on main screen
- Emergency button always visible
- Minimal text, maximum clarity

**Core Features Only:**
1. **Emergency Alert** - One big button
2. **I'm Okay** - Daily check-in button
3. **Call Family** - Video/voice call
4. **My Reminders** - Medication, appointments
5. **Home Status** - Simple icons (doors, lights)

**Remove/Hide:**
- Device management complexity
- Automation rules
- Room configuration
- Settings overload

### 1.3 Family Circle (formerly Consultant Portal)

**Purpose:** Let adult children monitor without being intrusive

**Features:**
1. **Activity Timeline** - "Mum opened fridge at 8am" (not surveillance, activity)
2. **Check-in Status** - Did they press "I'm Okay" today?
3. **Alerts** - Fall detected, door open too long, no movement
4. **Care Notes** - Share observations with siblings
5. **OT Reports** - View professional assessments

**Critical UX Decision:**
- Frame as "staying connected" NOT "monitoring"
- Use language: "Activity" not "Tracking"
- Show positive events: "Dad took his morning walk"

### 1.4 Professional Portal (formerly Reseller Hub)

**Primary Users:** Occupational Therapists, Care Coordinators, Installers

**Features:**
1. **Client Management** - List of assigned clients
2. **Assessment Tools** - Home safety checklists
3. **Recommendation Builder** - Generate device recommendations
4. **NDIS Quoting** - Create NDIS-compliant quotes
5. **Installation Scheduler** - Coordinate with installers
6. **Progress Tracking** - Client independence metrics

**Key Addition: OT Onboarding Flow**
```
"Partner with us to help your clients live independently"

[Register as OT] [Learn About Our Approach] [See Case Studies]
```

---

## Phase 2: Trust Building (6-12 weeks)

### 2.1 NDIS Registration Pathway

Add visible progress indicator:
```
[✓] Business registered
[✓] Insurance obtained
[○] NDIS application submitted
[○] NDIS approval pending
[○] Listed on NDIS provider portal
```

Even showing "in progress" builds credibility.

### 2.2 Privacy-First Messaging

**Address the "surveillance" concern directly:**

```
"Monitoring, not watching"

We track activity patterns, not video feeds.
- No cameras required
- No audio recording
- Motion sensors only detect presence, not actions
- Your loved one controls what family can see
```

### 2.3 OT Partnership Program

1. **Free trial for OTs** - Let them test with one client
2. **CPD points** - Partner with OT associations
3. **Case study co-creation** - Document successes together
4. **Referral incentives** - Commission per successful placement

---

## Phase 3: Validate & Scale (3-6 months)

### 3.1 Minimum Viable Devices

Start with 3-4 devices that solve real problems:

| Device | Problem Solved | NDIS Category |
|--------|----------------|---------------|
| Motion sensors | Fall detection, activity monitoring | Assistive Tech |
| Door/window sensors | Wandering alerts (dementia) | Assistive Tech |
| Smart plugs | Appliance safety, usage patterns | Home Modification |
| Emergency pendant | Panic button, fall detection | Personal Alert |

**Don't build:** Fancy lighting, entertainment systems, climate control (yet)

### 3.2 Pilot Program

1. Partner with 2-3 OTs in Melbourne
2. Deploy to 10-15 families (free or subsidized)
3. Collect testimonials and case studies
4. Iterate based on real feedback
5. Use success stories for NDIS application

### 3.3 Pricing for NDIS

NDIS has specific pricing structures. Research:
- Assistive Technology pricing caps
- Home Modification funding rules
- Support Coordination billing

---

## Technical Changes Required

### Backend
- [ ] Add `user_type: 'family_member'` role
- [ ] Create activity timeline API (aggregated, not raw)
- [ ] Build NDIS quote generator
- [ ] Add OT verification system
- [ ] Implement check-in/alert system

### Frontend - Independence Dashboard
- [ ] Complete UI redesign for accessibility
- [ ] WCAG 2.1 AA compliance (minimum)
- [ ] Large touch targets (48px minimum)
- [ ] High contrast mode
- [ ] Screen reader support
- [ ] Voice control integration

### Frontend - Family Circle
- [ ] New portal from scratch
- [ ] Activity timeline component
- [ ] Alert notification system
- [ ] Family group management
- [ ] Care notes/journal

### Frontend - Professional Portal
- [ ] Rebrand Reseller Hub
- [ ] Add OT-specific features
- [ ] NDIS quote builder
- [ ] Client assessment forms
- [ ] Remove inventory/wholesale features (for now)

---

## Messaging Transformation

### Old (Tech-Focused)
- "Smart Home Platform"
- "Device Control"
- "Automations"
- "Multi-Protocol Support"
- "Reseller Network"

### New (Care-Focused)
- "Independent Living Technology"
- "Peace of Mind"
- "Daily Check-ins"
- "Gentle Monitoring"
- "Care Professional Network"

---

## Success Metrics

### Phase 1 (Launch)
- 5 OTs registered on platform
- 20 families in pilot
- 1 NDIS quote submitted

### Phase 2 (Validation)
- 50 active families
- NDIS registration approved
- 3 case studies published
- 15+ OT partners

### Phase 3 (Scale)
- 200+ families
- My Aged Care listing
- Profitable unit economics
- Expand beyond Melbourne

---

## Immediate Next Steps

1. **This week:** Rewrite landing page copy (care-focused)
2. **Next week:** Redesign Independence Dashboard wireframes
3. **Week 3:** Build Family Circle MVP
4. **Week 4:** Create OT onboarding flow
5. **Month 2:** Pilot with 2 OTs, 10 families

---

## Summary

| Aspect | Before | After |
|--------|--------|-------|
| Target | General households | Elderly/disabled + families |
| Channel | Resellers | Occupational Therapists |
| Message | Tech features | Safety & peace of mind |
| Complexity | High (5 portals) | Focused (3 portals) |
| Funding | Self-pay | NDIS/My Aged Care |
| UI | Standard | Accessibility-first |

**The prototype is a good foundation. The market pivot requires a complete messaging overhaul and UX simplification, but the technical architecture can support it.**
