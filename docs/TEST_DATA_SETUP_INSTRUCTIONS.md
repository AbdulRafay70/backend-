# Test Data Setup Instructions for Pax Movement Tracking

## 📋 Overview
This guide helps you add test data to your database to verify the Pax Movement Tracking system is working correctly.

---

## 🎯 What Test Data Will Be Created?

### **8 Test Bookings Covering All Statuses:**

1. **🇵🇰 In Pakistan** - 2 passengers (Ahmed & Fatima Khan)
   - Departure in 5 days
   
2. **✈️ In Flight** - 1 passenger (Usman Ali)
   - Currently flying (departed 2 hours ago, arrives in 4 hours)
   
3. **🕋 In Makkah** - 3 passengers (Hassan, Ayesha, Ali Raza)
   - Arrived 3 days ago
   - Transport shows: Jeddah → Makkah
   
4. **🕌 In Madina** - 2 passengers (Bilal & Zainab Ahmed)
   - Arrived 5 days ago
   - Transport shows: Jeddah → Madina
   
5. **🏙️ In Jeddah** - 1 passenger (Imran Malik)
   - Arrived 1 day ago
   - Transport shows: Jeddah Airport → Jeddah Hotel
   
6. **⏳ Exit Pending** - 2 passengers (Tariq & Nadia Hussain)
   - Arrived 13 days ago
   - Return in 2 days
   
7. **✅ Exited KSA** - 4 passengers (Rashid, Sana, Omar, Maryam Mahmood)
   - Arrived 20 days ago
   - Returned 2 days ago
   
8. **❌ Mixed Status** - 3 passengers (1 Approved, 1 Pending, 1 Rejected)
   - Tests filtering: Only approved passenger should show

---

## 🚀 How to Add Test Data

### **Option 1: Using SQL Script (Recommended)**

1. **Find Your Organization and Agency IDs:**
   ```sql
   -- Run this in your MySQL database
   SELECT id, name FROM organization_organization LIMIT 1;
   SELECT id, ageny_name FROM organization_agency LIMIT 1;
   ```

2. **Edit the SQL File:**
   - Open `pax_movement_test_data.sql`
   - Change line 8: `SET @org_id = 1;` (use your organization ID)
   - Change line 9: `SET @agency_id = 1;` (use your agency ID)

3. **Run the SQL Script:**
   ```bash
   # In MySQL command line or phpMyAdmin
   mysql -u your_username -p your_database < pax_movement_test_data.sql
   ```

   OR in phpMyAdmin:
   - Go to your database
   - Click "SQL" tab
   - Copy and paste the entire SQL file
   - Click "Go"

---

### **Option 2: Using Python Script**

1. **Activate Virtual Environment:**
   ```bash
   .venv\Scripts\activate
   ```

2. **Run the Script:**
   ```bash
   python create_pax_movement_test_data.py
   ```

---

## ✅ Verify Test Data

### **1. Check Database:**
```sql
SELECT booking_number, status, total_pax 
FROM booking_booking 
WHERE booking_number LIKE 'TEST-%';
```

You should see 8 bookings with names like:
- TEST-PAK-...
- TEST-FLT-...
- TEST-MKH-...
- TEST-MDN-...
- TEST-JED-...
- TEST-EXP-...
- TEST-EXT-...
- TEST-MIX-...

### **2. Check Frontend:**

1. **Login to your system**
2. **Navigate to:** Pax Movement Tracking page
3. **You should see:**
   - Total Passengers: 19 (20 total, but 1 pending and 1 rejected are filtered out)
   - Statistics cards showing counts for each status
   - Passenger table with all details

### **3. Expected Frontend Display:**

**Statistics Dashboard:**
```
Total Passengers: 19
🇵🇰 In Pakistan: 3
✈️ In Flight: 1
🕋 In Makkah: 3
🕌 In Madina: 2
🏙️ In Jeddah: 1
⏳ Exit Pending: 2
✅ Exited KSA: 4
```

---

## 🧪 Test Scenarios

### **Test 1: Search Functionality**
- Search for "Ahmed" → Should find Ahmed Khan and Bilal Ahmed
- Search for "AB1234567" → Should find Ahmed Khan by passport

### **Test 2: Status Filter**
- Filter by "In Makkah" → Should show 3 passengers
- Filter by "In Flight" → Should show 1 passenger (Usman Ali)

### **Test 3: City Filter**
- Filter by "Makkah" → Should show passengers in Makkah
- Filter by "Pakistan" → Should show passengers who haven't left or have returned

### **Test 4: Click Statistics Cards**
- Click "In Madina" card → Should filter to show only Madina passengers
- Click "Total Passengers" → Should show all passengers

### **Test 5: Visa Status Filtering**
- Check that "Pending Passenger" and "Rejected Passenger" are NOT shown
- Only "Approved Passenger" from TEST-MIX booking should appear

---

## 🔍 Troubleshooting

### **Issue: No data showing**
**Solution:**
- Check organization ID and agency ID in SQL script
- Verify booking status is "Approved"
- Check person_details have visa_status = "Approved"

### **Issue: Wrong status displayed**
**Solution:**
- Check your system time is correct
- Verify flight dates and times in database
- Check transport sector data has correct city names

### **Issue: SQL script fails**
**Solution:**
- Make sure you're using MySQL (not SQLite)
- Check JSON functions are supported (MySQL 5.7+)
- Verify table name is `booking_booking`

---

## 🗑️ Clean Up Test Data

When you're done testing, remove test data:

```sql
-- Delete all test bookings
DELETE FROM booking_booking 
WHERE booking_number LIKE 'TEST-%';
```

---

## 📊 Test Data Summary

| Booking Number | Passengers | Status | Purpose |
|---------------|------------|--------|---------|
| TEST-PAK-* | 2 | In Pakistan | Test future departure |
| TEST-FLT-* | 1 | In Flight | Test in-flight detection |
| TEST-MKH-* | 3 | In Makkah | Test city detection (Makkah) |
| TEST-MDN-* | 2 | In Madina | Test city detection (Madina) |
| TEST-JED-* | 1 | In Jeddah | Test city detection (Jeddah) |
| TEST-EXP-* | 2 | Exit Pending | Test return warning |
| TEST-EXT-* | 4 | Exited KSA | Test completed journey |
| TEST-MIX-* | 3 (1 shown) | Mixed | Test visa filtering |

---

## ✨ Next Steps

After adding test data:

1. ✅ Open Pax Movement Tracking page
2. ✅ Verify all statistics are correct
3. ✅ Test search and filters
4. ✅ Click on different status cards
5. ✅ Check passenger details modal
6. ✅ Verify agent names are displayed
7. ✅ Test the "Refresh Data" button

---

**Good luck with testing! 🚀**

If you encounter any issues, check:
- Database connection
- Organization and agency IDs
- System time settings
- JSON data format in database
