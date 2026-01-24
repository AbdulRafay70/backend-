-- Create the missing PassengerActivityStatus table
CREATE TABLE IF NOT EXISTS `booking_passengeractivitystatus` (
    `id` bigint NOT NULL AUTO_INCREMENT,
    `object_id` int unsigned NOT NULL,
    `status` varchar(20) NOT NULL DEFAULT 'Pending',
    `content_type_id` int NOT NULL,
    `passenger_id` bigint NOT NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `booking_passengeracti_passenger_id_content_ty_7da9f3ab_uniq` (`passenger_id`, `content_type_id`, `object_id`),
    KEY `booking_passengeract_content_type_id_c6a89f6f_fk_django_co` (`content_type_id`),
    KEY `booking_passengeract_passenger_id_7da9f3ab_fk_booking_b` (`passenger_id`),
    CONSTRAINT `booking_passengeract_content_type_id_c6a89f6f_fk_django_co` FOREIGN KEY (`content_type_id`) REFERENCES `django_content_type` (`id`),
    CONSTRAINT `booking_passengeract_passenger_id_7da9f3ab_fk_booking_b` FOREIGN KEY (`passenger_id`) REFERENCES `booking_bookingpersondetail` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
