# Pax Movement Tracking - Data Not Showing Issue

## 🔍 Problem Identified

**Symptom:**
- 15 approved bookings fetched from API
- Only 1 passenger showing in the tracking page
- Console shows: "✅ Transformed Passengers: [{…}]" (only 1 passenger)

## ✅ Root Cause

The system filters passengers by **TWO** criteria:
1. ✅ Booking status = "Approved" (already met)
2. ❌ **Individual passenger visa_status = "Approved"** (NOT met for most passengers)

**Your existing bookings have passengers with:**
- `visa_status: null`
- `visa_status: undefined`
- `visa_status: "Pending"`
- `visa_status: "Un-approved"`

**Only passengers with `visa_status: "Approved"` are displayed!**

---

## 🛠️ Solution

### **Option 1: Update Existing Data (Quick Fix)**

Run the SQL script to set all passengers' visa status to "Approved":

```bash
# In MySQL or phpMyAdmin
mysql -u your_username -p your_database < update_visa_status_to_approved.sql
```

**What it does:**
- Updates all passengers in approved bookings
- Sets their `visa_status` to "Approved"
- Makes them visible in tracking system

**File:** `update_visa_status_to_approved.sql`

---

### **Option 2: Use Test Data (Clean Start)**

Use the test data script which has proper visa statuses:

```bash
# Edit the file first to set your org_id and agency_id
mysql -u your_username -p your_database < pax_movement_test_data.sql
```

**File:** `pax_movement_test_data.sql`

---

### **Option 3: Manually Approve Visas**

1. Go to Order Delivery System page
2. Open each booking
3. Click "Approve" on each passenger's visa
4. Return to Pax Movement Tracking

---

## 🔍 How to Verify

### **1. Check Browser Console**

After the fix, you should see logs like:
```
📋 Processing Booking BK001:
   👤 Passenger 1: Ahmed Khan { visa_status: "Approved", will_show: true }
   ✅ Adding approved passenger to list
   👤 Passenger 2: Fatima Khan { visa_status: "Approved", will_show: true }
   ✅ Adding approved passenger to list
```

### **2. Check Database**

```sql
SELECT 
    booking_number,
    JSON_EXTRACT(person_details, '$[0].first_name') as passenger_name,
    JSON_EXTRACT(person_details, '$[0].visa_status') as visa_status
FROM booking_booking 
WHERE status = 'Approved'
LIMIT 10;
```

Should show `visa_status: "Approved"` for all passengers.

### **3. Check Frontend**

- Refresh the Pax Movement Tracking page
- You should see all passengers from approved bookings
- Statistics cards should show correct counts

---

## 📊 Expected Results After Fix

**Before Fix:**
```
Total Passengers: 1
(Only 1 passenger with approved visa showing)
```

**After Fix:**
```
Total Passengers: 15+ 
(All passengers from approved bookings showing)
Statistics cards populated with real data
```

---

## 🎯 Why This Design?

The system requires **BOTH** approvals:

1. **Booking Approval** (Admin approves entire booking)
2. **Visa Approval** (Individual passenger visa approved)

**Rationale:**
- A booking can be approved, but individual visas might still be pending
- Only passengers with fully approved visas should be tracked
- Ensures data accuracy and prevents tracking passengers who can't travel

---

## 🔧 Debugging Commands

### **Check how many passengers have approved visas:**
```sql
SELECT 
    COUNT(*) as total_approved_bookings,
    SUM(JSON_LENGTH(person_details)) as total_passengers
FROM booking_booking 
WHERE status = 'Approved';
```

### **Check visa status distribution:**
```sql
SELECT 
    booking_number,
    person_details
FROM booking_booking 
WHERE status = 'Approved'
LIMIT 5;
```

### **See which passengers will show:**
Open browser console and look for:
- ✅ "Adding approved passenger to list"
- ❌ "Skipping - Visa status is..."

---

## 📝 Summary

**Problem:** Passengers don't have `visa_status: "Approved"`  
**Solution:** Run `update_visa_status_to_approved.sql`  
**Result:** All passengers from approved bookings will be visible  

**Files Created:**
- ✅ `update_visa_status_to_approved.sql` - Fix existing data
- ✅ `pax_movement_test_data.sql` - Test data with correct statuses
- ✅ Enhanced logging in `PaxMovementTracking.jsx` - Debug tool

---

**Next Steps:**
1. Run the SQL update script
2. Refresh the Pax Movement Tracking page
3. Check browser console for detailed logs
4. Verify all passengers are showing

Good luck! 🚀
