# 🧪 How to Test Pax Movement Tracking System

## ✅ System is Ready!

You now have **7 passengers** in the database ready for testing.

---

## 🚀 Step-by-Step Testing Guide

### **Step 1: Open the Page**
1. Go to your browser
2. Navigate to: **Pax Movement Tracking** page
3. The page should load with passenger data

### **Step 2: Check Total Passengers**
- Look at the top of the page
- You should see **7 total passengers** displayed
- If you see fewer, check browser console (F12) for errors

### **Step 3: Check Statistics Cards**
At the top of the page, you'll see cards showing:
- 🇵🇰 **In Pakistan** - Should show count
- ✈️ **In Flight** - Should show count
- 🕋 **In Makkah** - Should show count
- 🕌 **In Madina** - Should show count
- 🏙️ **In Jeddah** - Should show count
- ⏳ **Exit Pending** - Should show count
- ✅ **Exited KSA** - Should show count

### **Step 4: Test Filtering by Status**
1. **Click** on any statistics card (e.g., "In Makkah")
2. The table below should **filter** to show only passengers with that status
3. Try clicking different cards
4. Click "Total Passengers" to show all again

### **Step 5: Test Search**
1. Find the **search box** at the top
2. Type a passenger name: **"Zain"** or **"Sara"** or **"aqib"**
3. The table should filter to show only matching passengers
4. Clear the search to see all passengers again

### **Step 6: Test Table Display**
Check that the table shows these columns:
- ✅ Pax ID
- ✅ Name
- ✅ Passport No
- ✅ Agent Name
- ✅ Booking Number
- ✅ Status (with colored badge)
- ✅ Current City
- ✅ Last Updated

### **Step 7: Check Browser Console (IMPORTANT!)**
1. Press **F12** to open Developer Tools
2. Go to **Console** tab
3. Look for these logs:

```
✅ Organization ID: 11
📦 Fetched Approved Bookings: (X)
👤 Passenger 1: Name { visa_status: "Approved", will_show: true }
✅ Adding approved passenger to list
✅ Transformed Passengers: (X)
🔍 filterPassengers called with: {...}
✅ Final filtered passengers: (X)
```

4. If you see **"❌ Skipping"** messages, those passengers don't have approved visas

---

## 🎯 Expected Test Results

### **Passengers You Should See:**

1. **aqib noonari** - Original passenger
2. **abdul rafay** - Original passenger  
3. **Zain Abbas** - Test passenger
4. **Sara Ahmed** - Test passenger
5. **Hamza Khan** - Test passenger
6. **Aisha Malik** - Test passenger
7. **Omar Hassan** - Test passenger

### **Status Distribution:**
- Most will show as "In Pakistan" (if flight dates weren't added)
- Check the statistics cards for actual counts

---

## ✅ What to Verify

### **Feature Checklist:**

- [ ] Page loads without errors
- [ ] All 7 passengers are visible
- [ ] Statistics cards show correct counts
- [ ] Clicking status cards filters the table
- [ ] Search by name works
- [ ] Search by passport number works
- [ ] Status badges are colored correctly
- [ ] Current city is displayed
- [ ] Last updated date is shown
- [ ] No console errors (F12)
- [ ] Detailed logs appear in console

---

## 🐛 If Something Doesn't Work

### **Problem: No passengers showing**
**Solution:**
1. Check console for errors
2. Look for "❌ Skipping" messages
3. Verify `visa_status = "Approved"` in database
4. Run: `python update_visa_correct.py`

### **Problem: Wrong passenger count**
**Solution:**
1. Check console logs
2. Count how many have "✅ Adding approved passenger"
3. Verify booking status = "Approved"
4. Check visa_status = "Approved"

### **Problem: All show same status**
**Solution:**
- Flight dates might not be set
- Add ticket details through Django Admin
- Or all passengers have same flight dates

### **Problem: Console errors**
**Solution:**
1. Check the error message
2. Verify API is running (http://127.0.0.1:8000)
3. Check organization ID is correct
4. Verify token is valid

---

## 📸 Screenshots to Take

For documentation, capture:
1. **Full page view** - showing all passengers
2. **Statistics cards** - showing counts
3. **Filtered view** - after clicking a status card
4. **Search results** - after searching for a name
5. **Browser console** - showing the logs

---

## 🎉 Success Criteria

The system is working correctly if:
- ✅ All 7 passengers are visible
- ✅ Statistics cards show counts
- ✅ Clicking cards filters passengers
- ✅ Search finds passengers by name
- ✅ Console shows detailed processing logs
- ✅ No errors in console
- ✅ Status badges are colored
- ✅ Page is responsive and fast

---

## 🚀 Next Steps After Testing

1. **Add more realistic flight dates** through Django Admin
2. **Test with real booking data** from your system
3. **Verify status changes** as time passes
4. **Test with different time zones** if needed
5. **Train staff** on how to use the system

---

## 📞 Quick Reference

**Refresh Data:** Click the refresh button or reload page  
**Clear Filters:** Click "Total Passengers" card  
**Debug:** Open console (F12) and check logs  
**Reset:** Clear search box and click "Total Passengers"

---

**Ready to test? Refresh the Pax Movement Tracking page now!** 🚀
