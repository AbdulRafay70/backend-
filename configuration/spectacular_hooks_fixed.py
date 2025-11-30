def add_packages_example(result, generator, request=None, public=None, **kwargs):
    """Postprocessing hook for drf-spectacular to inject a POST /api/packages/ example.

    This hook inserts the user's exact JSON-array example (as a nested Python list)
    into the generated schema under POST /api/packages/ -> requestBody ->
    content -> application/json -> example. Returning the modified `result`
    ensures drf-spectacular writes the example into the final YAML/JSON.
    """
    try:
        paths = result.setdefault('paths', {})
        post_op = paths.setdefault('/api/packages/', {}).setdefault('post', {})

        example = [
            [
                {
                    "id": 0,
                    "organization_name": "string",
                    "created_by_name": "string",
                    "package_code": "string",
                    "title": "string",
                    "description": "string",
                    "package_type": "umrah",
                    "status": "active",
                    "price_per_person": "-.8",
                    "adult_price": "string",
                    "infant_price": "string",
                    "child_discount": "string",
                    "profit_percent": "-36",
                    "rules": "string",
                    "start_date": "2025-11-18",
                    "end_date": "2025-11-18",
                    "available_start_date": "2025-11-18",
                    "available_end_date": "2025-11-18",
                    "max_capacity": 2147483647,
                    "total_seats": 9223372036854776000,
                    "left_seats": 0,
                    "booked_seats": 9223372036854776000,
                    "confirmed_seats": 9223372036854776000,
                    "available_slots": 0,
                    "is_public": True,
                    "reselling_allowed": True,
                    "status_display": "string",
                    "package_type_display": "string",
                    "excluded_tickets": "string",
                    "total_price_breakdown": "string",
                    "created_at": "2025-11-18T18:32:07.206Z",
                    "updated_at": "2025-11-18T18:32:07.206Z",
                    "hotel_details": [
                        {
                            "id": 0,
                            "hotel_info": {
                                "id": 0,
                                "name": "string",
                                "address": "string",
                                "category": "economy",
                                "google_location": "string",
                                "contact_number": "string",
                                "distance": 0,
                                "photos_data": "string",
                                "video": "string",
                                "is_active": True,
                                "reselling_allowed": True,
                            },
                            "check_in_date": "2025-11-18",
                            "check_out_date": "2025-11-18",
                            "number_of_nights": 2147483647,
                            "hotel": 0,
                        }
                    ],
                    "transport_details": [
                        {
                            "id": 0,
                            "transport_type": "private",
                            "vehicle_type": "sedan",
                            "transport_selling_price": 0,
                            "transport_purchase_price": 0,
                        }
                    ],
                    "ticket_details": [
                        {
                            "id": 0,
                            "ticket_info": {
                                "id": 0,
                                "flight_number": "string",
                                "departure_date": "2025-11-18",
                                "arrival_date": "2025-11-18",
                                "seat_type": "economy",
                                "adult_fare": 0,
                                "child_fare": 0,
                                "infant_fare": 0,
                                "baggage_weight": 0,
                                "refund_rule": "non_refundable",
                                "is_refundable": True,
                                "is_meal_included": True,
                                "pnr": "string",
                                "ticket_number": "string",
                                "total_seats": 2147483647,
                                "left_seats": 2147483647,
                            },
                        }
                    ],
                    "discount_details": [
                        {
                            "id": 0,
                            "adult_from": 2147483647,
                            "adult_to": 2147483647,
                            "max_discount": 0,
                        }
                    ],
                    "visas": {
                        "adult_selling_price": 0,
                        "adult_purchase_price": 0,
                        "child_selling_price": 0,
                        "child_purchase_price": 0,
                        "infant_selling_price": 0,
                        "infant_purchase_price": 0,
                    },
                    "food_prices": {"selling_price": 0, "purchase_price": 0},
                    "ziyarat_prices": {
                        "makkah_selling": 0,
                        "makkah_purchase": 0,
                        "madinah_selling": 0,
                        "madinah_purchase": 0,
                    },
                    "bed_price_calculation": {
                        "currency": "Rs.",
                        "unit": "per adult",
                        "rates": {
                            "sharing": {"label": "SHARING", "price": 36200},
                            "quint": {"label": "QUINT", "price": 46200},
                            "quad": {"label": "QUAD", "price": 56200},
                            "triple": {"label": "TRIPLE", "price": 66200},
                            "double": {"label": "DOUBLE", "price": 76200},
                            "infant": {"label": "INFANT", "price": 20000},
                        },
                        
                    },
                }
            ]
        ]

        rb = post_op.setdefault('requestBody', {}).setdefault('content', {}).setdefault('application/json', {})
        rb['example'] = example
    except Exception:
        # On any failure, return the schema unmodified so generation won't break.
        return result

    return result
