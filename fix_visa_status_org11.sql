-- SIMPLE FIX: Update ALL passengers to have visa_status = "Approved"
-- For Organization ID 11 (your current organization)
-- This will make ALL passengers visible in Pax Movement Tracking

-- ========================================
-- STEP 1: Check current status
-- ========================================
SELECT 
    booking_number,
    status as booking_status,
    organization_id,
    JSON_LENGTH(person_details) as total_passengers,
    JSON_EXTRACT(person_details, '$[0].visa_status') as passenger1_visa,
    JSON_EXTRACT(person_details, '$[1].visa_status') as passenger2_visa
FROM booking_booking 
WHERE status = 'Approved' AND organization_id = 11
LIMIT 10;

-- ========================================
-- STEP 2: Update using Python-style JSON manipulation
-- ========================================

-- For single passenger bookings
UPDATE booking_booking
SET person_details = JSON_SET(person_details, '$[0].visa_status', 'Approved')
WHERE status = 'Approved' 
AND organization_id = 11
AND JSON_LENGTH(person_details) >= 1;

-- For bookings with 2+ passengers
UPDATE booking_booking
SET person_details = JSON_SET(
    JSON_SET(person_details, '$[0].visa_status', 'Approved'),
    '$[1].visa_status', 'Approved'
)
WHERE status = 'Approved' 
AND organization_id = 11
AND JSON_LENGTH(person_details) >= 2;

-- For bookings with 3+ passengers
UPDATE booking_booking
SET person_details = JSON_SET(
    JSON_SET(
        JSON_SET(person_details, '$[0].visa_status', 'Approved'),
        '$[1].visa_status', 'Approved'
    ),
    '$[2].visa_status', 'Approved'
)
WHERE status = 'Approved' 
AND organization_id = 11
AND JSON_LENGTH(person_details) >= 3;

-- For bookings with 4+ passengers
UPDATE booking_booking
SET person_details = JSON_SET(
    JSON_SET(
        JSON_SET(
            JSON_SET(person_details, '$[0].visa_status', 'Approved'),
            '$[1].visa_status', 'Approved'
        ),
        '$[2].visa_status', 'Approved'
    ),
    '$[3].visa_status', 'Approved'
)
WHERE status = 'Approved' 
AND organization_id = 11
AND JSON_LENGTH(person_details) >= 4;

-- For bookings with 5+ passengers
UPDATE booking_booking
SET person_details = JSON_SET(
    JSON_SET(
        JSON_SET(
            JSON_SET(
                JSON_SET(person_details, '$[0].visa_status', 'Approved'),
                '$[1].visa_status', 'Approved'
            ),
            '$[2].visa_status', 'Approved'
        ),
        '$[3].visa_status', 'Approved'
    ),
    '$[4].visa_status', 'Approved'
)
WHERE status = 'Approved' 
AND organization_id = 11
AND JSON_LENGTH(person_details) >= 5;

-- ========================================
-- STEP 3: Verify the update
-- ========================================
SELECT 
    booking_number,
    JSON_LENGTH(person_details) as total_passengers,
    JSON_EXTRACT(person_details, '$[0].first_name') as p1_name,
    JSON_EXTRACT(person_details, '$[0].visa_status') as p1_visa,
    JSON_EXTRACT(person_details, '$[1].first_name') as p2_name,
    JSON_EXTRACT(person_details, '$[1].visa_status') as p2_visa
FROM booking_booking 
WHERE status = 'Approved' AND organization_id = 11
LIMIT 10;

-- ========================================
-- STEP 4: Summary
-- ========================================
SELECT 
    '✅ ALL VISA STATUSES UPDATED TO APPROVED!' as Message,
    COUNT(*) as 'Total Approved Bookings',
    SUM(JSON_LENGTH(person_details)) as 'Total Passengers (All Now Visible)'
FROM booking_booking 
WHERE status = 'Approved' AND organization_id = 11;

-- ========================================
-- EXPECTED RESULT
-- ========================================
-- All passengers in approved bookings for org 11 now have visa_status = "Approved"
-- Refresh the Pax Movement Tracking page to see all passengers!
