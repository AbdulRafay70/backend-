-- Test Data for Pax Movement Tracking System
-- This script creates comprehensive test bookings covering all passenger statuses
-- Run this in your MySQL database

-- Note: Replace {ORG_ID} and {AGENCY_ID} with your actual organization and agency IDs
-- You can find these by running: SELECT id FROM organization_organization LIMIT 1;
--                          and: SELECT id FROM organization_agency LIMIT 1;

SET @org_id = 1;  -- CHANGE THIS to your organization ID
SET @agency_id = 1;  -- CHANGE THIS to your agency ID
SET @now = NOW();

-- Test Case 1: In Pakistan (Future Departure - 5 days from now)
INSERT INTO booking_booking (
    organization_id, agency_id, booking_number, status, 
    total_pax, total_adult, total_child, total_infant,
    person_details, ticket_details, transport_details,
    created_at, updated_at
) VALUES (
    @org_id, @agency_id, CONCAT('TEST-PAK-', DATE_FORMAT(@now, '%Y%m%d%H%i%s')), 'Approved',
    2, 2, 0, 0,
    JSON_ARRAY(
        JSON_OBJECT(
            'first_name', 'Ahmed',
            'last_name', 'Khan',
            'passport_number', 'AB1234567',
            'visa_status', 'Approved',
            'age_group', 'Adult',
            'date_of_birth', '1990-01-15'
        ),
        JSON_OBJECT(
            'first_name', 'Fatima',
            'last_name', 'Khan',
            'passport_number', 'AB1234568',
            'visa_status', 'Approved',
            'age_group', 'Adult',
            'date_of_birth', '1992-03-20'
        )
    ),
    JSON_ARRAY(
        JSON_OBJECT(
            'flight_number', 'PK-740',
            'departure_airport', 'Islamabad (ISB)',
            'arrival_airport', 'Jeddah (JED)',
            'departure_date', DATE_FORMAT(DATE_ADD(@now, INTERVAL 5 DAY), '%Y-%m-%d'),
            'departure_time', '03:00',
            'arrival_date', DATE_FORMAT(DATE_ADD(@now, INTERVAL 5 DAY), '%Y-%m-%d'),
            'arrival_time', '09:00',
            'return_date', DATE_FORMAT(DATE_ADD(@now, INTERVAL 20 DAY), '%Y-%m-%d'),
            'return_time', '23:00',
            'return_flight_number', 'PK-741'
        )
    ),
    JSON_ARRAY(
        JSON_OBJECT(
            'vehicle_type_display', 'Coaster',
            'sector_details', JSON_ARRAY(
                JSON_OBJECT(
                    'departure_city', 'Jeddah',
                    'arrival_city', 'Makkah',
                    'is_airport_pickup', TRUE,
                    'is_airport_drop', FALSE
                )
            )
        )
    ),
    @now, @now
);

-- Test Case 2: In Flight (Departed 2 hours ago, arrives in 4 hours)
INSERT INTO booking_booking (
    organization_id, agency_id, booking_number, status,
    total_pax, total_adult, total_child, total_infant,
    person_details, ticket_details, transport_details,
    created_at, updated_at
) VALUES (
    @org_id, @agency_id, CONCAT('TEST-FLT-', DATE_FORMAT(@now, '%Y%m%d%H%i%s')), 'Approved',
    1, 1, 0, 0,
    JSON_ARRAY(
        JSON_OBJECT(
            'first_name', 'Usman',
            'last_name', 'Ali',
            'passport_number', 'CD7654321',
            'visa_status', 'Approved',
            'age_group', 'Adult',
            'date_of_birth', '1988-05-10'
        )
    ),
    JSON_ARRAY(
        JSON_OBJECT(
            'flight_number', 'SV-722',
            'departure_airport', 'Karachi (KHI)',
            'arrival_airport', 'Jeddah (JED)',
            'departure_date', DATE_FORMAT(DATE_SUB(@now, INTERVAL 2 HOUR), '%Y-%m-%d'),
            'departure_time', DATE_FORMAT(DATE_SUB(@now, INTERVAL 2 HOUR), '%H:%i'),
            'arrival_date', DATE_FORMAT(DATE_ADD(@now, INTERVAL 4 HOUR), '%Y-%m-%d'),
            'arrival_time', DATE_FORMAT(DATE_ADD(@now, INTERVAL 4 HOUR), '%H:%i'),
            'return_date', DATE_FORMAT(DATE_ADD(@now, INTERVAL 15 DAY), '%Y-%m-%d'),
            'return_time', '22:00',
            'return_flight_number', 'SV-723'
        )
    ),
    JSON_ARRAY(
        JSON_OBJECT(
            'vehicle_type_display', 'Coaster',
            'sector_details', JSON_ARRAY(
                JSON_OBJECT(
                    'departure_city', 'Jeddah',
                    'arrival_city', 'Madina',
                    'is_airport_pickup', TRUE,
                    'is_airport_drop', FALSE
                )
            )
        )
    ),
    @now, @now
);

-- Test Case 3: In Makkah (Arrived 3 days ago)
INSERT INTO booking_booking (
    organization_id, agency_id, booking_number, status,
    total_pax, total_adult, total_child, total_infant,
    person_details, ticket_details, transport_details,
    created_at, updated_at
) VALUES (
    @org_id, @agency_id, CONCAT('TEST-MKH-', DATE_FORMAT(@now, '%Y%m%d%H%i%s')), 'Approved',
    3, 2, 1, 0,
    JSON_ARRAY(
        JSON_OBJECT(
            'first_name', 'Hassan',
            'last_name', 'Raza',
            'passport_number', 'EF9876543',
            'visa_status', 'Approved',
            'age_group', 'Adult',
            'date_of_birth', '1985-07-22'
        ),
        JSON_OBJECT(
            'first_name', 'Ayesha',
            'last_name', 'Raza',
            'passport_number', 'EF9876544',
            'visa_status', 'Approved',
            'age_group', 'Adult',
            'date_of_birth', '1987-09-15'
        ),
        JSON_OBJECT(
            'first_name', 'Ali',
            'last_name', 'Raza',
            'passport_number', 'EF9876545',
            'visa_status', 'Approved',
            'age_group', 'Child',
            'date_of_birth', '2015-12-10'
        )
    ),
    JSON_ARRAY(
        JSON_OBJECT(
            'flight_number', 'PK-750',
            'departure_airport', 'Lahore (LHE)',
            'arrival_airport', 'Jeddah (JED)',
            'departure_date', DATE_FORMAT(DATE_SUB(@now, INTERVAL 3 DAY), '%Y-%m-%d'),
            'departure_time', '04:00',
            'arrival_date', DATE_FORMAT(DATE_SUB(@now, INTERVAL 3 DAY), '%Y-%m-%d'),
            'arrival_time', '10:00',
            'return_date', DATE_FORMAT(DATE_ADD(@now, INTERVAL 12 DAY), '%Y-%m-%d'),
            'return_time', '23:30',
            'return_flight_number', 'PK-751'
        )
    ),
    JSON_ARRAY(
        JSON_OBJECT(
            'vehicle_type_display', 'Coaster',
            'sector_details', JSON_ARRAY(
                JSON_OBJECT(
                    'departure_city', 'Jeddah',
                    'arrival_city', 'Makkah',
                    'is_airport_pickup', TRUE,
                    'is_airport_drop', FALSE
                )
            )
        )
    ),
    @now, @now
);

-- Test Case 4: In Madina (Arrived 5 days ago)
INSERT INTO booking_booking (
    organization_id, agency_id, booking_number, status,
    total_pax, total_adult, total_child, total_infant,
    person_details, ticket_details, transport_details,
    created_at, updated_at
) VALUES (
    @org_id, @agency_id, CONCAT('TEST-MDN-', DATE_FORMAT(@now, '%Y%m%d%H%i%s')), 'Approved',
    2, 2, 0, 0,
    JSON_ARRAY(
        JSON_OBJECT(
            'first_name', 'Bilal',
            'last_name', 'Ahmed',
            'passport_number', 'GH1122334',
            'visa_status', 'Approved',
            'age_group', 'Adult',
            'date_of_birth', '1980-11-05'
        ),
        JSON_OBJECT(
            'first_name', 'Zainab',
            'last_name', 'Ahmed',
            'passport_number', 'GH1122335',
            'visa_status', 'Approved',
            'age_group', 'Adult',
            'date_of_birth', '1982-02-18'
        )
    ),
    JSON_ARRAY(
        JSON_OBJECT(
            'flight_number', 'SV-724',
            'departure_airport', 'Multan (MUX)',
            'arrival_airport', 'Jeddah (JED)',
            'departure_date', DATE_FORMAT(DATE_SUB(@now, INTERVAL 5 DAY), '%Y-%m-%d'),
            'departure_time', '05:00',
            'arrival_date', DATE_FORMAT(DATE_SUB(@now, INTERVAL 5 DAY), '%Y-%m-%d'),
            'arrival_time', '11:00',
            'return_date', DATE_FORMAT(DATE_ADD(@now, INTERVAL 10 DAY), '%Y-%m-%d'),
            'return_time', '22:00',
            'return_flight_number', 'SV-725'
        )
    ),
    JSON_ARRAY(
        JSON_OBJECT(
            'vehicle_type_display', 'Coaster',
            'sector_details', JSON_ARRAY(
                JSON_OBJECT(
                    'departure_city', 'Jeddah',
                    'arrival_city', 'Madina',
                    'is_airport_pickup', TRUE,
                    'is_airport_drop', FALSE
                )
            )
        )
    ),
    @now, @now
);

-- Test Case 5: In Jeddah (Arrived 1 day ago)
INSERT INTO booking_booking (
    organization_id, agency_id, booking_number, status,
    total_pax, total_adult, total_child, total_infant,
    person_details, ticket_details, transport_details,
    created_at, updated_at
) VALUES (
    @org_id, @agency_id, CONCAT('TEST-JED-', DATE_FORMAT(@now, '%Y%m%d%H%i%s')), 'Approved',
    1, 1, 0, 0,
    JSON_ARRAY(
        JSON_OBJECT(
            'first_name', 'Imran',
            'last_name', 'Malik',
            'passport_number', 'IJ5566778',
            'visa_status', 'Approved',
            'age_group', 'Adult',
            'date_of_birth', '1995-04-30'
        )
    ),
    JSON_ARRAY(
        JSON_OBJECT(
            'flight_number', 'PK-760',
            'departure_airport', 'Faisalabad (LYP)',
            'arrival_airport', 'Jeddah (JED)',
            'departure_date', DATE_FORMAT(DATE_SUB(@now, INTERVAL 1 DAY), '%Y-%m-%d'),
            'departure_time', '02:30',
            'arrival_date', DATE_FORMAT(DATE_SUB(@now, INTERVAL 1 DAY), '%Y-%m-%d'),
            'arrival_time', '08:30',
            'return_date', DATE_FORMAT(DATE_ADD(@now, INTERVAL 7 DAY), '%Y-%m-%d'),
            'return_time', '21:00',
            'return_flight_number', 'PK-761'
        )
    ),
    JSON_ARRAY(
        JSON_OBJECT(
            'vehicle_type_display', 'Sedan',
            'sector_details', JSON_ARRAY(
                JSON_OBJECT(
                    'departure_city', 'Jeddah Airport',
                    'arrival_city', 'Jeddah Hotel',
                    'is_airport_pickup', TRUE,
                    'is_airport_drop', FALSE
                )
            )
        )
    ),
    @now, @now
);

-- Test Case 6: Exit Pending (Return in 2 days)
INSERT INTO booking_booking (
    organization_id, agency_id, booking_number, status,
    total_pax, total_adult, total_child, total_infant,
    person_details, ticket_details, transport_details,
    created_at, updated_at
) VALUES (
    @org_id, @agency_id, CONCAT('TEST-EXP-', DATE_FORMAT(@now, '%Y%m%d%H%i%s')), 'Approved',
    2, 2, 0, 0,
    JSON_ARRAY(
        JSON_OBJECT(
            'first_name', 'Tariq',
            'last_name', 'Hussain',
            'passport_number', 'KL9988776',
            'visa_status', 'Approved',
            'age_group', 'Adult',
            'date_of_birth', '1978-08-12'
        ),
        JSON_OBJECT(
            'first_name', 'Nadia',
            'last_name', 'Hussain',
            'passport_number', 'KL9988777',
            'visa_status', 'Approved',
            'age_group', 'Adult',
            'date_of_birth', '1980-10-25'
        )
    ),
    JSON_ARRAY(
        JSON_OBJECT(
            'flight_number', 'SV-730',
            'departure_airport', 'Peshawar (PEW)',
            'arrival_airport', 'Jeddah (JED)',
            'departure_date', DATE_FORMAT(DATE_SUB(@now, INTERVAL 13 DAY), '%Y-%m-%d'),
            'departure_time', '06:00',
            'arrival_date', DATE_FORMAT(DATE_SUB(@now, INTERVAL 13 DAY), '%Y-%m-%d'),
            'arrival_time', '12:00',
            'return_date', DATE_FORMAT(DATE_ADD(@now, INTERVAL 2 DAY), '%Y-%m-%d'),
            'return_time', '20:00',
            'return_flight_number', 'SV-731'
        )
    ),
    JSON_ARRAY(
        JSON_OBJECT(
            'vehicle_type_display', 'Coaster',
            'sector_details', JSON_ARRAY(
                JSON_OBJECT(
                    'departure_city', 'Jeddah',
                    'arrival_city', 'Makkah',
                    'is_airport_pickup', TRUE,
                    'is_airport_drop', FALSE
                )
            )
        )
    ),
    @now, @now
);

-- Test Case 7: Exited KSA (Returned 2 days ago)
INSERT INTO booking_booking (
    organization_id, agency_id, booking_number, status,
    total_pax, total_adult, total_child, total_infant,
    person_details, ticket_details, transport_details,
    created_at, updated_at
) VALUES (
    @org_id, @agency_id, CONCAT('TEST-EXT-', DATE_FORMAT(@now, '%Y%m%d%H%i%s')), 'Approved',
    4, 2, 2, 0,
    JSON_ARRAY(
        JSON_OBJECT(
            'first_name', 'Rashid',
            'last_name', 'Mahmood',
            'passport_number', 'MN4455667',
            'visa_status', 'Approved',
            'age_group', 'Adult',
            'date_of_birth', '1983-06-18'
        ),
        JSON_OBJECT(
            'first_name', 'Sana',
            'last_name', 'Mahmood',
            'passport_number', 'MN4455668',
            'visa_status', 'Approved',
            'age_group', 'Adult',
            'date_of_birth', '1985-12-22'
        ),
        JSON_OBJECT(
            'first_name', 'Omar',
            'last_name', 'Mahmood',
            'passport_number', 'MN4455669',
            'visa_status', 'Approved',
            'age_group', 'Child',
            'date_of_birth', '2012-03-14'
        ),
        JSON_OBJECT(
            'first_name', 'Maryam',
            'last_name', 'Mahmood',
            'passport_number', 'MN4455670',
            'visa_status', 'Approved',
            'age_group', 'Child',
            'date_of_birth', '2014-07-08'
        )
    ),
    JSON_ARRAY(
        JSON_OBJECT(
            'flight_number', 'PK-770',
            'departure_airport', 'Sialkot (SKT)',
            'arrival_airport', 'Jeddah (JED)',
            'departure_date', DATE_FORMAT(DATE_SUB(@now, INTERVAL 20 DAY), '%Y-%m-%d'),
            'departure_time', '03:30',
            'arrival_date', DATE_FORMAT(DATE_SUB(@now, INTERVAL 20 DAY), '%Y-%m-%d'),
            'arrival_time', '09:30',
            'return_date', DATE_FORMAT(DATE_SUB(@now, INTERVAL 2 DAY), '%Y-%m-%d'),
            'return_time', '23:00',
            'return_flight_number', 'PK-771'
        )
    ),
    JSON_ARRAY(
        JSON_OBJECT(
            'vehicle_type_display', 'Coaster',
            'sector_details', JSON_ARRAY(
                JSON_OBJECT(
                    'departure_city', 'Jeddah',
                    'arrival_city', 'Makkah',
                    'is_airport_pickup', TRUE,
                    'is_airport_drop', FALSE
                ),
                JSON_OBJECT(
                    'departure_city', 'Makkah',
                    'arrival_city', 'Madina',
                    'is_airport_pickup', FALSE,
                    'is_airport_drop', FALSE
                )
            )
        )
    ),
    @now, @now
);

-- Test Case 8: Mixed Visa Status (Only approved should show)
INSERT INTO booking_booking (
    organization_id, agency_id, booking_number, status,
    total_pax, total_adult, total_child, total_infant,
    person_details, ticket_details, transport_details,
    created_at, updated_at
) VALUES (
    @org_id, @agency_id, CONCAT('TEST-MIX-', DATE_FORMAT(@now, '%Y%m%d%H%i%s')), 'Approved',
    3, 3, 0, 0,
    JSON_ARRAY(
        JSON_OBJECT(
            'first_name', 'Approved',
            'last_name', 'Passenger',
            'passport_number', 'AP1111111',
            'visa_status', 'Approved',
            'age_group', 'Adult',
            'date_of_birth', '1990-01-01'
        ),
        JSON_OBJECT(
            'first_name', 'Pending',
            'last_name', 'Passenger',
            'passport_number', 'PE2222222',
            'visa_status', 'Pending',
            'age_group', 'Adult',
            'date_of_birth', '1991-02-02'
        ),
        JSON_OBJECT(
            'first_name', 'Rejected',
            'last_name', 'Passenger',
            'passport_number', 'RE3333333',
            'visa_status', 'Rejected',
            'age_group', 'Adult',
            'date_of_birth', '1992-03-03'
        )
    ),
    JSON_ARRAY(
        JSON_OBJECT(
            'flight_number', 'PK-999',
            'departure_airport', 'Islamabad (ISB)',
            'arrival_airport', 'Jeddah (JED)',
            'departure_date', DATE_FORMAT(DATE_ADD(@now, INTERVAL 3 DAY), '%Y-%m-%d'),
            'departure_time', '04:00',
            'arrival_date', DATE_FORMAT(DATE_ADD(@now, INTERVAL 3 DAY), '%Y-%m-%d'),
            'arrival_time', '10:00',
            'return_date', DATE_FORMAT(DATE_ADD(@now, INTERVAL 18 DAY), '%Y-%m-%d'),
            'return_time', '22:00',
            'return_flight_number', 'PK-998'
        )
    ),
    JSON_ARRAY(
        JSON_OBJECT(
            'vehicle_type_display', 'Coaster',
            'sector_details', JSON_ARRAY(
                JSON_OBJECT(
                    'departure_city', 'Jeddah',
                    'arrival_city', 'Makkah',
                    'is_airport_pickup', TRUE,
                    'is_airport_drop', FALSE
                )
            )
        )
    ),
    @now, @now
);

-- Summary
SELECT 
    '✅ Test Data Created Successfully!' as Message,
    COUNT(*) as 'Total Bookings Created'
FROM booking_booking 
WHERE booking_number LIKE 'TEST-%';

SELECT 
    'Expected Status Distribution:' as Info,
    '🇵🇰 In Pakistan: 3 passengers' as Status1,
    '✈️ In Flight: 1 passenger' as Status2,
    '🕋 In Makkah: 3 passengers' as Status3,
    '🕌 In Madina: 2 passengers' as Status4,
    '🏙️ In Jeddah: 1 passenger' as Status5,
    '⏳ Exit Pending: 2 passengers' as Status6,
    '✅ Exited KSA: 4 passengers' as Status7,
    '❌ Not Shown: 2 passengers (pending/rejected)' as Status8;
