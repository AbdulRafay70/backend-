-- Update ALL passengers in approved bookings to have visa_status = "Approved"
-- This handles "No", "Pending", null, and any other status

-- BACKUP FIRST (Optional but recommended)
-- CREATE TABLE booking_booking_backup AS SELECT * FROM booking_booking WHERE status = 'Approved';

-- Method 1: Simple update for organization 11 (your current org)
-- This updates ALL person_details in approved bookings for org 11

-- First, let's see what we're working with
SELECT 
    id,
    booking_number,
    organization_id,
    JSON_LENGTH(person_details) as passenger_count,
    person_details
FROM booking_booking 
WHERE status = 'Approved' 
AND organization_id = 11
LIMIT 5;

-- Now update them all
-- This uses a stored procedure approach to handle any number of passengers

DELIMITER $$

CREATE PROCEDURE update_all_visa_statuses()
BEGIN
    DECLARE done INT DEFAULT FALSE;
    DECLARE booking_id INT;
    DECLARE person_array JSON;
    DECLARE passenger_count INT;
    DECLARE i INT;
    DECLARE updated_array JSON;
    DECLARE current_person JSON;
    
    DECLARE cur CURSOR FOR 
        SELECT id, person_details 
        FROM booking_booking 
        WHERE status = 'Approved' AND organization_id = 11;
    
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;
    
    OPEN cur;
    
    read_loop: LOOP
        FETCH cur INTO booking_id, person_array;
        IF done THEN
            LEAVE read_loop;
        END IF;
        
        SET passenger_count = JSON_LENGTH(person_array);
        SET updated_array = JSON_ARRAY();
        SET i = 0;
        
        WHILE i < passenger_count DO
            SET current_person = JSON_EXTRACT(person_array, CONCAT('$[', i, ']'));
            SET current_person = JSON_SET(current_person, '$.visa_status', 'Approved');
            SET updated_array = JSON_ARRAY_APPEND(updated_array, '$', current_person);
            SET i = i + 1;
        END WHILE;
        
        UPDATE booking_booking 
        SET person_details = updated_array 
        WHERE id = booking_id;
        
    END LOOP;
    
    CLOSE cur;
END$$

DELIMITER ;

-- Run the procedure
CALL update_all_visa_statuses();

-- Drop the procedure after use
DROP PROCEDURE update_all_visa_statuses;

-- Verify the update
SELECT 
    booking_number,
    JSON_LENGTH(person_details) as passenger_count,
    JSON_EXTRACT(person_details, '$[0].first_name') as passenger1_name,
    JSON_EXTRACT(person_details, '$[0].visa_status') as passenger1_visa,
    JSON_EXTRACT(person_details, '$[1].first_name') as passenger2_name,
    JSON_EXTRACT(person_details, '$[1].visa_status') as passenger2_visa
FROM booking_booking 
WHERE status = 'Approved' AND organization_id = 11
LIMIT 10;

-- Count total passengers that will now show
SELECT 
    'Update Complete!' as Status,
    COUNT(*) as 'Total Approved Bookings',
    SUM(JSON_LENGTH(person_details)) as 'Total Passengers (All Now Approved)'
FROM booking_booking 
WHERE status = 'Approved' AND organization_id = 11;
