-- Quick Fix: Update Existing Bookings to Have Approved Visa Status
-- This will make existing passengers visible in Pax Movement Tracking

-- IMPORTANT: This updates ALL passengers in ALL approved bookings to have visa_status = "Approved"
-- Run this if you want to see your existing booking data in the tracking system

-- Step 1: Check current visa statuses
SELECT 
    booking_number,
    status as booking_status,
    JSON_LENGTH(person_details) as total_passengers,
    person_details
FROM booking_booking 
WHERE status = 'Approved'
LIMIT 5;

-- Step 2: Update all person_details to have visa_status = "Approved"
-- This uses MySQL JSON functions to update the visa_status field

UPDATE booking_booking
SET person_details = JSON_ARRAY(
    JSON_SET(
        JSON_EXTRACT(person_details, '$[0]'),
        '$.visa_status', 'Approved'
    )
)
WHERE status = 'Approved'
AND JSON_LENGTH(person_details) = 1;

-- For bookings with 2 passengers
UPDATE booking_booking
SET person_details = JSON_ARRAY(
    JSON_SET(JSON_EXTRACT(person_details, '$[0]'), '$.visa_status', 'Approved'),
    JSON_SET(JSON_EXTRACT(person_details, '$[1]'), '$.visa_status', 'Approved')
)
WHERE status = 'Approved'
AND JSON_LENGTH(person_details) = 2;

-- For bookings with 3 passengers
UPDATE booking_booking
SET person_details = JSON_ARRAY(
    JSON_SET(JSON_EXTRACT(person_details, '$[0]'), '$.visa_status', 'Approved'),
    JSON_SET(JSON_EXTRACT(person_details, '$[1]'), '$.visa_status', 'Approved'),
    JSON_SET(JSON_EXTRACT(person_details, '$[2]'), '$.visa_status', 'Approved')
)
WHERE status = 'Approved'
AND JSON_LENGTH(person_details) = 3;

-- For bookings with 4 passengers
UPDATE booking_booking
SET person_details = JSON_ARRAY(
    JSON_SET(JSON_EXTRACT(person_details, '$[0]'), '$.visa_status', 'Approved'),
    JSON_SET(JSON_EXTRACT(person_details, '$[1]'), '$.visa_status', 'Approved'),
    JSON_SET(JSON_EXTRACT(person_details, '$[2]'), '$.visa_status', 'Approved'),
    JSON_SET(JSON_EXTRACT(person_details, '$[3]'), '$.visa_status', 'Approved')
)
WHERE status = 'Approved'
AND JSON_LENGTH(person_details) = 4;

-- For bookings with 5 passengers
UPDATE booking_booking
SET person_details = JSON_ARRAY(
    JSON_SET(JSON_EXTRACT(person_details, '$[0]'), '$.visa_status', 'Approved'),
    JSON_SET(JSON_EXTRACT(person_details, '$[1]'), '$.visa_status', 'Approved'),
    JSON_SET(JSON_EXTRACT(person_details, '$[2]'), '$.visa_status', 'Approved'),
    JSON_SET(JSON_EXTRACT(person_details, '$[3]'), '$.visa_status', 'Approved'),
    JSON_SET(JSON_EXTRACT(person_details, '$[4]'), '$.visa_status', 'Approved')
)
WHERE status = 'Approved'
AND JSON_LENGTH(person_details) = 5;

-- Verify the update
SELECT 
    booking_number,
    status,
    JSON_LENGTH(person_details) as total_passengers,
    JSON_EXTRACT(person_details, '$[0].visa_status') as passenger1_visa,
    JSON_EXTRACT(person_details, '$[1].visa_status') as passenger2_visa,
    JSON_EXTRACT(person_details, '$[2].visa_status') as passenger3_visa
FROM booking_booking 
WHERE status = 'Approved'
LIMIT 10;

-- Summary
SELECT 
    '✅ Visa statuses updated!' as Message,
    COUNT(*) as 'Total Approved Bookings',
    SUM(JSON_LENGTH(person_details)) as 'Total Passengers with Approved Visa'
FROM booking_booking 
WHERE status = 'Approved';
