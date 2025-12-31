# Debugging Steps - Data Not Displaying

## 🔧 What I Added

I've added detailed console logging to help debug why data isn't showing:

### **1. Visa Status Logging**
Shows which passengers are being filtered:
```javascript
👤 Passenger 1: Ahmed Khan { visa_status: "Approved", will_show: true }
✅ Adding approved passenger to list

👤 Passenger 2: Fatima Khan { visa_status: null, will_show: false }
❌ Skipping - Visa status is "null", not "Approved"
```

### **2. Filter Logging**
Shows what filters are being applied:
```javascript
🔍 filterPassengers called with: {
  total_passengers: 1,
  activeTab: "all",
  statusFilter: "all",
  cityFilter: "all",
  searchQuery: ""
}
✅ Final filtered passengers: 1
```

---

## 📋 Next Steps for You

### **1. Refresh the Page**
- Open Pax Movement Tracking
- Open Browser Console (F12)
- Look for the detailed logs

### **2. Check the Logs**

You should see:
```
✅ Organization ID: 11
📦 Fetched Approved Bookings: (15) [...]
   👤 Passenger 1: aqib noonari { visa_status: "Approved", will_show: true }
   ✅ Adding approved passenger to list
✅ Transformed Passengers: 1
🔍 filterPassengers called with: { total_passengers: 1, ... }
✅ Final filtered passengers: 1
```

### **3. Check What You See**

**If you see logs but NO data on page:**
- Check if there are any React errors in console
- Check if `filteredPassengers` array has data
- The issue is in the UI rendering

**If you see "❌ Skipping" for most passengers:**
- Those passengers don't have `visa_status: "Approved"`
- Run the SQL script: `update_visa_status_to_approved.sql`

**If filteredPassengers is 0:**
- Check the filter values (activeTab, statusFilter, etc.)
- One of the filters is removing all passengers

---

## 🐛 Common Issues

### **Issue 1: Passengers filtered by visa status**
**Symptom:** Only 1-2 passengers showing from 15 bookings  
**Solution:** Run `update_visa_status_to_approved.sql`

### **Issue 2: Passengers filtered by activeTab**
**Symptom:** Logs show passengers but filtered to 0  
**Check:** Is activeTab set to a specific status?  
**Solution:** Click "Total Passengers" card to reset to "all"

### **Issue 3: React rendering issue**
**Symptom:** filteredPassengers has data but nothing shows  
**Check:** Look for React errors in console  
**Solution:** Check if Table component is rendering correctly

---

## 📊 What to Share

If still not working, share these logs:
1. The visa status logs (👤 Passenger...)
2. The filter logs (🔍 filterPassengers...)
3. The final filtered count
4. Any React errors in console

---

## ✅ Expected Working State

When everything works, you should see:
```
✅ Organization ID: 11
📦 Fetched Approved Bookings: (15) [...]
   👤 Passenger 1: Ahmed Khan { visa_status: "Approved", will_show: true }
   ✅ Adding approved passenger to list
   👤 Passenger 2: Fatima Khan { visa_status: "Approved", will_show: true }
   ✅ Adding approved passenger to list
   ... (more passengers)
✅ Transformed Passengers: 15+
🔍 filterPassengers called with: { total_passengers: 15, activeTab: "all", ... }
✅ Final filtered passengers: 15
```

And on the page:
- Statistics cards showing counts
- Table showing all passengers
- All data visible and interactive

---

**Refresh the page now and check the console!** 🔍
