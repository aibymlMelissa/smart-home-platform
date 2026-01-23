# SafeHome Hub & Device Architecture

## Overview

The SafeHome system consists of three layers:
1. **Hub** - Physical device installed in the home (the "brain")
2. **Sensors & Devices** - Connected devices throughout the home
3. **Cloud Platform** - Backend that processes data and alerts family

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLOUD PLATFORM                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ Independence │  │   Family     │  │ Professional │          │
│  │  Dashboard   │  │   Circle     │  │   Portal     │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
                              ▲
                              │ MQTT/WebSocket (encrypted)
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         SAFEHOME HUB                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐        │
│  │  Zigbee  │  │  Z-Wave  │  │   WiFi   │  │Bluetooth │        │
│  │  Radio   │  │  Radio   │  │  Module  │  │   BLE    │        │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘        │
│                    Local Processing & Rules Engine              │
└─────────────────────────────────────────────────────────────────┘
        │              │              │              │
        ▼              ▼              ▼              ▼
┌──────────────────────────────────────────────────────────────────┐
│                       DEVICES & SENSORS                          │
│                                                                  │
│  Motion    Door/Window   Emergency    Bed        Smart    Smoke  │
│  Sensors   Sensors       Button       Sensor     Plugs    Alarm  │
└──────────────────────────────────────────────────────────────────┘
```

---

## The SafeHome Hub

### Hardware Specifications

| Component | Specification | Purpose |
|-----------|--------------|---------|
| Processor | ARM Cortex-A53 Quad-core | Local processing, rule execution |
| RAM | 1GB DDR4 | Event buffering, local cache |
| Storage | 8GB eMMC + microSD | Firmware, logs, offline queue |
| Zigbee | Silicon Labs EFR32 | Low-power sensors |
| Z-Wave | 700 series chip | Security devices |
| WiFi | 802.11ac dual-band | Cloud connection, IP cameras |
| Bluetooth | BLE 5.0 | Wearables, beacons |
| Ethernet | Gigabit RJ45 | Reliable connection |
| Backup Battery | 4-hour UPS | Power outage protection |
| Physical Button | Large red button | Emergency (no app needed) |

### Key Features

1. **Local Processing** - Rules execute locally even without internet
2. **Offline Queue** - Events stored and synced when connection returns
3. **Battery Backup** - Continues operating during power outages
4. **Physical Emergency Button** - Press on hub to trigger alert
5. **Voice Speaker** - Announces reminders, confirms check-ins
6. **LED Indicators** - Simple status lights (green = okay, red = alert)

---

## Device Ecosystem for Aged Care

### 1. Motion Sensors (Zigbee)

**Purpose:** Track activity patterns, detect falls, notice unusual stillness

| Placement | Detection Logic |
|-----------|-----------------|
| Bedroom | Morning activity check - did they get up? |
| Bathroom | Extended time = potential fall |
| Kitchen | Meal preparation activity |
| Hallway | Movement between rooms |
| Living Room | Daytime activity baseline |

**Care Functions:**
- No motion for 12+ hours → Alert family
- Bathroom > 30 minutes → Check-in prompt, then alert
- No morning activity by 10am → Alert family
- Unusual nighttime activity → Log for pattern analysis

**Recommended Device:** Aqara Motion Sensor P1 (Zigbee 3.0, 7-year battery)

---

### 2. Door/Window Sensors (Zigbee)

**Purpose:** Security, wandering detection, routine monitoring

| Placement | Detection Logic |
|-----------|-----------------|
| Front Door | Entry/exit logging, security |
| Back Door | Secondary exit monitoring |
| Bedroom Door | Sleep pattern tracking |
| Medicine Cabinet | Medication compliance |
| Refrigerator | Eating pattern monitoring |

**Care Functions:**
- Front door open after 10pm → Alert (potential wandering)
- No fridge open for 24+ hours → Alert (not eating)
- Medicine cabinet not opened by scheduled time → Reminder
- Door open for extended period → Alert (left open?)

**Recommended Device:** Aqara Door Sensor (Zigbee 3.0, 5-year battery)

---

### 3. Emergency Button/Pendant (Zigbee/BLE)

**Purpose:** One-touch emergency alert

**Types:**
1. **Wearable Pendant** - Worn around neck
2. **Wrist Button** - Watch-style
3. **Wall-mounted Button** - By bed, in bathroom
4. **Hub Button** - Built into the hub

**Care Functions:**
- Single press → "Are you okay?" voice prompt
- No response in 30 seconds → Alert family
- Double press → Immediate emergency alert
- Fall detection (wearable) → Automatic alert

**Recommended Devices:**
- Aqara Wireless Mini Switch (wall/table)
- SOS pendant with fall detection (BLE)

---

### 4. Bed Sensor (WiFi/Zigbee)

**Purpose:** Sleep monitoring, bed exit detection, vital signs

**Placement:** Under mattress (non-invasive)

**Care Functions:**
- Bed exit detected → Start bathroom timer
- No return to bed for 30+ minutes at night → Alert
- Unusual sleep patterns → Log for doctor review
- Optional: Heart rate, breathing rate monitoring

**Recommended Device:** Withings Sleep Analyzer or pressure mat

---

### 5. Smart Plugs with Energy Monitoring (Zigbee)

**Purpose:** Appliance usage tracking, safety shutoff

| Appliance | Detection Logic |
|-----------|-----------------|
| Kettle | Morning routine indicator |
| TV | Activity/engagement indicator |
| Lamp | Evening routine indicator |
| Heater | Safety auto-shutoff |
| Stove (smart) | Left on too long → shutoff |

**Care Functions:**
- Kettle used = morning activity confirmed
- TV on during usual sleep hours = potential issue
- No appliance use for 24 hours = alert
- Auto-shutoff heaters/appliances after timeout

**Recommended Device:** Aqara Smart Plug (with energy monitoring)

---

### 6. Smoke/CO Detector (Z-Wave)

**Purpose:** Fire and carbon monoxide safety

**Care Functions:**
- Smoke detected → Alert family AND emergency services
- CO detected → Alert and voice warning
- Battery low → Notify family to replace
- Test reminder → Monthly prompt

**Recommended Device:** First Alert Z-Wave Smoke/CO Detector

---

### 7. Water Leak Sensor (Zigbee)

**Purpose:** Flood prevention, left tap detection

**Placement:** Bathroom floor, under sink, near washing machine

**Care Functions:**
- Water detected → Alert and voice warning
- Potential tap left running → Reminder

**Recommended Device:** Aqara Water Leak Sensor

---

### 8. Video Doorbell (WiFi)

**Purpose:** Visitor identification, delivery confirmation

**Care Functions:**
- Doorbell pressed → Notification to family if elderly person doesn't answer
- Motion at door → Log for security
- Two-way audio → Family can speak to visitors
- NO indoor cameras (privacy)

**Recommended Device:** Ring Video Doorbell (WiFi)

---

### 9. Voice Assistant Integration (WiFi)

**Purpose:** Hands-free control, reminders, emergency calls

**Care Functions:**
- "Hey SafeHome, I'm okay" → Complete daily check-in
- "Hey SafeHome, call my daughter" → Initiate call
- "Hey SafeHome, help!" → Emergency alert
- Medication reminders via voice
- Weather and calendar announcements

**Recommended:** Amazon Echo Dot or Google Nest Mini (integrated)

---

## How Dashboard Features Map to Devices

| Dashboard Feature | Devices Used | Logic |
|-------------------|--------------|-------|
| **Emergency Button** | Pendant, Hub button, Wall buttons | Any press → 10s countdown → Alert |
| **I'm Okay Check-in** | Voice, Motion sensors, App button | Manual or auto-detected activity |
| **Front Door Status** | Door sensor | Open/closed state |
| **Temperature** | Smart thermostat or temp sensor | Current reading |
| **Lights On** | Smart plugs, smart bulbs | Count of active lights |
| **Last Activity** | All motion sensors | Most recent motion event |
| **Medication Reminders** | Medicine cabinet sensor, voice | Cabinet opened = completed |
| **Fall Detection** | Bathroom motion, bed sensor, wearable | Extended stillness or impact detected |

---

## Activity Pattern Detection

The hub builds a baseline of normal activity over 2-4 weeks:

```
Normal Day Pattern (Example):
├── 7:00 AM  - Bedroom motion detected
├── 7:05 AM  - Bathroom visit (8 min)
├── 7:15 AM  - Kitchen motion, kettle used
├── 8:00 AM  - Medicine cabinet opened
├── 8:30 AM  - Living room, TV on
├── 12:00 PM - Kitchen motion (lunch)
├── 3:00 PM  - Front door opened (walk)
├── 3:45 PM  - Front door closed (returned)
├── 6:00 PM  - Kitchen motion (dinner)
├── 9:00 PM  - Bathroom visit
├── 10:00 PM - Bedroom, TV off
└── 10:30 PM - No motion (sleep)
```

**Anomaly Detection:**
- No morning activity by 10am → Alert
- Bathroom visit > 30 min → Check-in prompt
- No kitchen activity all day → Alert
- Front door open but no return in 2 hours → Alert
- Nighttime activity unusual for this person → Log

---

## Family Circle Data Flow

What family members see (privacy-respecting):

```
Family Dashboard:
┌─────────────────────────────────────────────────────┐
│  Mum's Status: ✓ All Okay                          │
├─────────────────────────────────────────────────────┤
│  Today's Activity:                                  │
│  • 8:42 AM - Checked in "I'm Okay" ✓               │
│  • 8:15 AM - Morning activity normal               │
│  • 9:30 AM - Front door opened (going out?)        │
│  • 10:15 AM - Front door closed (returned)         │
├─────────────────────────────────────────────────────┤
│  Home Status:                                       │
│  • Front door: Locked                              │
│  • Temperature: 22°C                               │
│  • Last motion: 15 minutes ago (Living Room)       │
├─────────────────────────────────────────────────────┤
│  This Week:                                         │
│  • Checked in: 7/7 days ✓                          │
│  • Medication: 6/7 days (missed Thursday PM)       │
│  • Unusual events: None                            │
└─────────────────────────────────────────────────────┘
```

**What family CANNOT see:**
- Video or audio from inside the home
- Specific room locations (just "active" or "resting")
- Conversations or TV content
- Detailed movement tracking

---

## Starter Kit Recommendation

### Essential Kit (NDIS Assistive Technology eligible)

| Device | Qty | Purpose | Est. Cost |
|--------|-----|---------|-----------|
| SafeHome Hub | 1 | Central controller | $299 |
| Motion Sensors | 3 | Bedroom, bathroom, living | $90 |
| Door Sensors | 2 | Front door, medicine cabinet | $50 |
| Emergency Pendant | 1 | Wearable alert | $79 |
| Smart Plug | 2 | Kettle, TV monitoring | $50 |
| **Total** | | | **$568** |

### Enhanced Kit (additional safety)

| Device | Qty | Purpose | Est. Cost |
|--------|-----|---------|-----------|
| Essential Kit | 1 | Base system | $568 |
| Bed Sensor | 1 | Sleep/exit monitoring | $149 |
| Additional Motion | 2 | Kitchen, hallway | $60 |
| Smoke/CO Detector | 1 | Fire safety | $89 |
| Water Leak Sensor | 1 | Bathroom floor | $25 |
| Video Doorbell | 1 | Visitor identification | $149 |
| **Total** | | | **$1,040** |

---

## Installation Process

1. **Pre-visit Assessment** (OT or care coordinator)
   - Home layout review
   - Identify key monitoring points
   - Discuss privacy preferences
   - Determine device placement

2. **Installation Day** (2-3 hours)
   - Install hub (near router, central location)
   - Place sensors (no drilling for most)
   - Configure motion baselines
   - Set up family circle accounts
   - Test emergency button

3. **Training Session** (30 minutes)
   - Show "I'm Okay" button
   - Practice emergency button (with cancel)
   - Explain what family can see
   - Set reminder preferences

4. **2-Week Learning Period**
   - System learns normal patterns
   - Alerts are suppressed initially
   - Fine-tune sensitivity
   - Family receives test alerts

5. **Go Live**
   - Full monitoring active
   - Weekly check-in from care team
   - Adjust as needed

---

## Privacy Controls

The elderly person controls:
- Which rooms have motion sensors
- Whether to share medication compliance
- Who is in their Family Circle
- Alert sensitivity (more/fewer notifications)
- "Privacy mode" for visitors (pauses monitoring)

Family members cannot:
- Add devices without consent
- Access video/audio
- Track precise movements
- Share data with others
