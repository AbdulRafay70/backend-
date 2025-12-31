# Passenger Movement Logic & Automation

## 📌 Document Purpose
This document explains the **automated logic** for tracking passenger movements from Pakistan to Saudi Arabia and back, including how the system automatically determines passenger status and location.

---

## 🎯 Core Concept

### **Automation Goal**
The system **automatically tracks** where each passenger is in their journey **without manual updates** by analyzing:
1. ✈️ **Flight dates and times**
2. 🚌 **Transport sector routes**
3. ⏰ **Current date and time**

### **Key Principle**
> "The system knows where passengers are based on their booking data and current time - no manual status updates needed!"

---

## 🚦 Passenger Journey Flow

```
START
  ↓
🇵🇰 In Pakistan (Waiting for flight)
  ↓ [Departure time reached]
✈️ In Flight (On the plane)
  ↓ [Arrival time reached]
🛬 Landed in KSA (Just arrived)
  ↓ [Transport data analyzed]
🕋 In Makkah / 🕌 In Madina / 🏙️ In Jeddah (At destination)
  ↓ [Return date approaching]
⏳ Exit Pending (Preparing to leave)
  ↓ [Return time reached]
✅ Exited KSA (Back in Pakistan)
  ↓
END
```

---

## 🔍 How Automation Works

### **Step 1: System Checks Current Time**
```javascript
Current Time = Now (e.g., 2024-12-26 10:30 AM)
```

### **Step 2: System Compares with Flight Data**
```javascript
Departure Time = 2024-12-26 03:00 AM
Arrival Time = 2024-12-26 09:00 AM
Return Time = 2024-12-30 11:00 PM
```

### **Step 3: System Determines Status**
```javascript
IF Current Time < Departure Time:
    → Status = "In Pakistan"
    
ELSE IF Current Time >= Departure Time AND Current Time < Arrival Time:
    → Status = "In Flight"
    
ELSE IF Current Time >= Arrival Time AND Current Time < Return Time:
    → Status = "In KSA" (then check transport for exact city)
    
ELSE IF Current Time >= Return Time:
    → Status = "Exited KSA"
```

---

## 📍 Status Details & Logic

### **1. In Pakistan** 🇵🇰

**When:**
- Before departure time

**Logic:**
```
Current Time: 2024-12-25 10:00 AM
Departure: 2024-12-26 03:00 AM
→ Passenger is still in Pakistan
```

**Automation:**
- System automatically shows "In Pakistan"
- No manual update needed

---

### **2. In Flight** ✈️

**When:**
- After departure time
- Before arrival time

**Logic:**
```
Departure: 2024-12-26 03:00 AM ← Passed
Current Time: 2024-12-26 06:00 AM ← Now
Arrival: 2024-12-26 09:00 AM ← Not yet
→ Passenger is on the plane
```

**Automation:**
- System calculates: "Has departure time passed? Yes"
- System calculates: "Has arrival time passed? No"
- Result: "Passenger is in flight"

**Smart Feature:**
- If arrival time not provided, system assumes 6-hour flight
- Example: Depart 3 AM → Auto-calculate arrival at 9 AM

---

### **3. Entered KSA** 🛬

**When:**
- After arrival time
- Before transport analysis

**Logic:**
```
Arrival: 2024-12-26 09:00 AM ← Passed
Current Time: 2024-12-26 10:00 AM ← Now
→ Passenger has landed
```

**Automation:**
- System knows passenger landed
- Waiting to determine exact city

---

### **4. In Makkah / Madina / Jeddah** 🕋🕌🏙️

**When:**
- After arrival time
- Transport data shows destination city

**Logic:**
```
Arrival: 2024-12-26 09:00 AM ← Passed
Transport Route: Jeddah → Makkah
→ Passenger is in Makkah
```

**Automation - City Detection:**

System checks transport booking:
```javascript
Transport Sector 1:
  From: Jeddah Airport
  To: Makkah Hotel
  
System reads: "To = Makkah"
→ Status = "In Makkah"
```

**City Matching Rules:**
- If destination contains "Makkah" or "Mecca" → In Makkah
- If destination contains "Madinah" or "Madina" → In Madina  
- If destination contains "Jeddah" or "Jed" → In Jeddah

**Example Transport Data:**
```json
{
  "sector_details": [
    {
      "departure_city": "Jeddah",
      "arrival_city": "Makkah"
    }
  ]
}
→ System automatically sets: Status = "In Makkah"
```

---

### **5. Exit Pending** ⏳

**When:**
- Return date is 2 days or less away

**Logic:**
```
Current Date: 2024-12-28
Return Date: 2024-12-30
Days Until Return: 2 days
→ Exit is pending
```

**Automation:**
- System calculates days remaining
- If ≤ 2 days: Automatically changes to "Exit Pending"
- Alerts admin that passenger will leave soon

**Calculation:**
```javascript
Days Until Return = (Return Date - Current Date) / 24 hours

IF Days Until Return ≤ 2 AND Days Until Return ≥ 0:
    → Status = "Exit Pending"
```

---

### **6. Exited KSA** ✅

**When:**
- After return time

**Logic:**
```
Return: 2024-12-30 11:00 PM ← Passed
Current Time: 2024-12-31 08:00 AM ← Now
→ Passenger has returned to Pakistan
```

**Automation:**
- System automatically marks as "Exited"
- Sets verified_exit = true
- No manual verification needed

---

## ⏰ Time-Based Automation Examples

### **Example 1: Morning Departure**

**Booking Data:**
```
Departure: 2024-12-26 at 03:00 AM
Arrival: 2024-12-26 at 09:00 AM
```

**System Checks Throughout the Day:**

| Time | System Decision | Status |
|------|----------------|--------|
| 2024-12-25 11:00 PM | Before departure | In Pakistan 🇵🇰 |
| 2024-12-26 02:00 AM | Before departure | In Pakistan 🇵🇰 |
| 2024-12-26 03:30 AM | After departure, before arrival | In Flight ✈️ |
| 2024-12-26 06:00 AM | After departure, before arrival | In Flight ✈️ |
| 2024-12-26 09:30 AM | After arrival | Entered KSA 🛬 |
| 2024-12-26 10:00 AM | After arrival + transport to Makkah | In Makkah 🕋 |

**Automation Magic:**
- No one manually updated the status
- System checked time and automatically changed status
- Happens in real-time!

---

### **Example 2: Complete Journey**

**Passenger: Ahmed Ali**

**Booking:**
- Departure: Dec 20, 2024 at 3:00 AM
- Arrival: Dec 20, 2024 at 9:00 AM
- Transport: Jeddah → Makkah → Madina
- Return: Dec 30, 2024 at 11:00 PM

**Automated Status Timeline:**

```
Dec 19, 2024 (Any time)
→ Status: In Pakistan 🇵🇰
   Reason: Before departure

Dec 20, 2024 at 3:00 AM - 9:00 AM
→ Status: In Flight ✈️
   Reason: Between departure and arrival

Dec 20, 2024 at 9:00 AM
→ Status: Entered KSA 🛬
   Reason: Just landed

Dec 20, 2024 at 10:00 AM
→ Status: In Makkah 🕋
   Reason: Transport shows "Jeddah → Makkah"

Dec 25, 2024 (Midway)
→ Status: In Madina 🕌
   Reason: Transport shows "Makkah → Madina"

Dec 28, 2024
→ Status: Exit Pending ⏳
   Reason: Return in 2 days

Dec 31, 2024
→ Status: Exited KSA ✅
   Reason: Return time passed
```

**Key Point:**
- Ahmed never called anyone
- Admin never updated anything
- System did everything automatically!

---

## 🚌 Transport Sector Intelligence

### **How System Reads Transport Data**

**Transport Booking Structure:**
```json
{
  "transport_details": [
    {
      "vehicle_type": "Coaster",
      "sector_details": [
        {
          "departure_city": "Jeddah",
          "arrival_city": "Makkah"
        },
        {
          "departure_city": "Makkah",
          "arrival_city": "Madina"
        },
        {
          "departure_city": "Madina",
          "arrival_city": "Jeddah"
        }
      ]
    }
  ]
}
```

**System Logic:**
```javascript
Step 1: Passenger landed in KSA
Step 2: Check transport sectors
Step 3: Find arrival cities

Sector 1: Arrival = "Makkah"
→ System: "Passenger going to Makkah"
→ Status: "In Makkah"

Sector 2: Arrival = "Madina"  
→ System: "Passenger will go to Madina"
→ (Can be used for future tracking)
```

### **Smart City Detection**

**System handles different spellings:**
```javascript
"Makkah" → Detected as Makkah ✓
"makkah" → Detected as Makkah ✓
"MAKKAH" → Detected as Makkah ✓
"Mecca" → Detected as Makkah ✓
"Madinah" → Detected as Madina ✓
"Madina" → Detected as Madina ✓
"Al-Madinah" → Detected as Madina ✓
```

**Case-insensitive matching:**
- System converts to lowercase
- Checks if city name contains keyword
- Works with any spelling variation

---

## 🔄 Automatic Updates

### **What Updates Automatically?**

#### **1. Status**
Changes based on current time vs flight times

#### **2. Current City**
Changes based on status:
- In Pakistan → "Pakistan"
- In Flight → "In Flight to KSA"
- In Makkah → "Makkah"
- Exited KSA → "Pakistan"

#### **3. Last Updated**
Changes to reflect when status changed:
- In Flight → Departure date
- Entered KSA → Arrival date
- Exited KSA → Return date

#### **4. Verified Exit**
Automatically set to `true` when status = "Exited KSA"

---

## 🎯 Real-World Scenario

### **Scenario: Group of 50 Passengers**

**Traditional Manual System:**
```
❌ Admin checks 50 passengers daily
❌ Calls each passenger: "Where are you?"
❌ Manually updates each status
❌ Takes 2-3 hours per day
❌ Prone to errors and delays
```

**Our Automated System:**
```
✅ System checks all 50 automatically
✅ No calls needed
✅ Status updates in real-time
✅ Takes 0 seconds of admin time
✅ 100% accurate based on booking data
```

### **Example Timeline:**

**Dec 20, 8:00 AM - Admin Opens System:**
```
System shows:
- 10 passengers: In Pakistan (departing today)
- 5 passengers: In Flight (currently flying)
- 20 passengers: In Makkah
- 10 passengers: In Madina
- 5 passengers: Exit Pending
```

**Dec 20, 4:00 PM - Admin Checks Again:**
```
System automatically updated:
- 0 passengers: In Pakistan (all departed)
- 0 passengers: In Flight (all landed)
- 30 passengers: In Makkah (10 new arrivals)
- 15 passengers: In Madina (5 moved from Makkah)
- 5 passengers: Exit Pending (unchanged)
```

**Admin did nothing - System did everything!**

---

## 🧮 Automation Formulas

### **Formula 1: Flight Status**
```
IF (Current DateTime >= Departure DateTime) 
   AND (Current DateTime < Arrival DateTime):
   
   THEN Status = "In Flight"
```

### **Formula 2: Exit Pending**
```
Days Until Return = (Return Date - Current Date) / (24 hours)

IF (Days Until Return <= 2) AND (Days Until Return >= 0):
   THEN Status = "Exit Pending"
```

### **Formula 3: City Detection**
```
FOR each transport sector:
    IF arrival_city contains "makkah" OR "mecca":
        THEN Status = "In Makkah"
        BREAK
    
    ELSE IF arrival_city contains "madinah" OR "madina":
        THEN Status = "In Madina"
        BREAK
    
    ELSE IF arrival_city contains "jeddah" OR "jed":
        THEN Status = "In Jeddah"
        BREAK
```

### **Formula 4: Arrival Time Estimation**
```
IF Arrival Time is not provided:
   THEN Arrival Time = Departure Time + 6 hours
   
Example:
   Departure: 3:00 AM
   Arrival: 3:00 AM + 6 hours = 9:00 AM
```

---

## 📊 Data Flow Diagram

```
┌─────────────────┐
│  Booking Data   │
│  - Flights      │
│  - Transport    │
│  - Dates/Times  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ System Reads    │
│ Current Time    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Compare Times   │
│ - Departure     │
│ - Arrival       │
│ - Return        │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Determine       │
│ Status          │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Check Transport │
│ for City        │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Display to      │
│ Admin           │
└─────────────────┘
```

---

## ✅ Automation Benefits

### **1. Time Saving**
- **Before:** 2-3 hours daily for manual updates
- **After:** 0 hours - fully automatic

### **2. Accuracy**
- **Before:** Human errors in manual entry
- **After:** 100% accurate based on data

### **3. Real-Time**
- **Before:** Updated once per day
- **After:** Updates every second

### **4. Scalability**
- **Before:** Hard to track 100+ passengers
- **After:** Can track 1000+ passengers easily

### **5. No Communication Needed**
- **Before:** Call passengers for location
- **After:** System knows from booking data

---

## 🔑 Key Automation Rules

### **Rule 1: Time is King**
Everything is based on comparing current time with booking times

### **Rule 2: No Manual Updates**
Admin never needs to change status manually

### **Rule 3: Data-Driven**
All decisions based on booking data, not assumptions

### **Rule 4: Real-Time**
Status updates happen automatically as time passes

### **Rule 5: Transport Intelligence**
System reads transport routes to know exact cities

---

## 💡 Smart Features

### **1. Automatic Flight Duration**
If arrival time missing, assumes 6-hour flight
```
Departure: 3:00 AM
No arrival time provided
→ System calculates: 3:00 AM + 6 hours = 9:00 AM
```

### **2. Exit Warning**
Automatically warns when return is near (≤2 days)
```
Return: Dec 30
Current: Dec 28
→ System: "Exit Pending - 2 days remaining"
```

### **3. Verified Exit**
Automatically verifies exit when return time passes
```
Return: Dec 30, 11:00 PM
Current: Dec 31, 8:00 AM
→ System: "Exited KSA - Verified ✓"
```

### **4. City Spelling Tolerance**
Handles any spelling of city names
```
"Makkah" = "makkah" = "MAKKAH" = "Mecca"
All detected as same city
```

---

## 🎓 Summary

### **What Makes This Automated?**

1. **Time Comparison**
   - System constantly compares current time with booking times
   - No manual time entry needed

2. **Transport Analysis**
   - System reads transport routes automatically
   - Identifies cities from arrival destinations

3. **Status Calculation**
   - System calculates status based on formulas
   - No admin decision needed

4. **Real-Time Updates**
   - Status changes automatically as time passes
   - No refresh button needed

### **The Magic Formula:**

```
Booking Data + Current Time + Transport Routes = Automatic Status
```

### **Result:**

> **"Tell the system when passengers are flying, and it will automatically track them throughout their entire journey - from Pakistan to KSA and back!"**

---

## 📝 Quick Reference

| Passenger Location | How System Knows |
|-------------------|------------------|
| In Pakistan | Current time < Departure time |
| In Flight | Departure time ≤ Current time < Arrival time |
| Entered KSA | Current time ≥ Arrival time |
| In Makkah | Transport shows arrival city = "Makkah" |
| In Madina | Transport shows arrival city = "Madina" |
| In Jeddah | Transport shows arrival city = "Jeddah" |
| Exit Pending | Return date within 2 days |
| Exited KSA | Current time ≥ Return time |

---

## 🎯 Final Thought

**The beauty of this system:**
- You book the passenger once
- System tracks them automatically
- No manual work needed
- Real-time accuracy
- Works 24/7 without human intervention

**It's like having a robot assistant that never sleeps and always knows where everyone is!** 🤖✨

---

**Document Version:** 1.0  
**Created:** December 26, 2024  
**Purpose:** Explain passenger movement automation logic  
**Audience:** Non-technical users, managers, stakeholders

---

*End of Document*
