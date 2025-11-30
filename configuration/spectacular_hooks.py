def add_packages_example(result, generator, request=None):
    """Postprocessing hook for drf-spectacular to inject a POST /api/packages/ example.

    This runs after the OpenAPI schema is generated and mutates the schema dict in-place.
    """
    try:
        paths = result.setdefault('paths', {})
        pkg_path = paths.setdefault('/api/packages/', {})
        def add_packages_example(result, generator, request=None, public=None, **kwargs):
            """Postprocessing hook for drf-spectacular to inject a POST /api/packages/ example.

            This runs after the OpenAPI schema is generated and mutates the schema dict in-place.
            The hook accepts extra kwargs (such as `public`) that drf-spectacular may pass.
            """
            try:
                paths = result.setdefault('paths', {})
                post_op = paths.setdefault('/api/packages/', {}).setdefault('post', {})

                example = {
                    "hotel_details": [
                        {
                            "check_in_date": "2025-11-28",
                            "check_out_date": "2025-11-28",
                            "number_of_nights": 2147483647,
                            "quaint_bed_selling_price": 0,
                            "quaint_bed_purchase_price": 0,
                            "sharing_bed_selling_price": 0,
                            "sharing_bed_purchase_price": 0,
                            "quad_bed_selling_price": 0,
                            "quad_bed_purchase_price": 0,
                            "triple_bed_selling_price": 0,
                            "triple_bed_purchase_price": 0,
                            "double_bed_selling_price": 0,
                            "double_bed_purchase_price": 0,
                            "hotel": 0
                        }
                    ],
                    "bed_price_calculation": {
                        "currency": "Rs.",
                        "unit": "per adult",
                        "rates": {
                            "sharing": {"label": "SHARING", "price": 36200},
                            "quint": {"label": "QUINT", "price": 46200},
                            "quad": {"label": "QUAD", "price": 56200},
                            "triple": {"label": "TRIPLE", "price": 66200},
                            "double": {"label": "DOUBLE", "price": 76200},
                            "infant": {"label": "INFANT", "price": 20000}
                        },
                        "notes": "Schema-only calculation example; no backend changes."
                    }
                }

                rb = post_op.setdefault('requestBody', {}).setdefault('content', {}).setdefault('application/json', {})
                rb['example'] = example
            except Exception:
                pass
                                            "number_of_nights": 2147483647,
                                            "quaint_bed_selling_price": 0,
                                            "quaint_bed_purchase_price": 0,
                                            "sharing_bed_selling_price": 0,
                                            "sharing_bed_purchase_price": 0,
                                            "quad_bed_selling_price": 0,
                                            "quad_bed_purchase_price": 0,
                                            "triple_bed_selling_price": 0,
                                            "triple_bed_purchase_price": 0,
                                            "double_bed_selling_price": 0,
                                            "double_bed_purchase_price": 0,
                                            "hotel": 0
                                        }
                                    ],
                                    "transport_details": [
                                        {
                                            "vehicle_type": "sedan",
                                            "transport_type": "private",
                                            "transport_selling_price": 0,
                                            "transport_purchase_price": 0,
                                            "transport_sector": 0
                                        }
                                    ],
                                    "ticket_details": [{"ticket": 0}],
                                    "discount_details": [{"adault_from": 2147483647, "adault_to": 2147483647, "max_discount": 0}],
                                    "title": "string",
                                    "description": "string",
                                    "package_type": "umrah",
                                    "status": "active",
                                    "start_date": "2025-11-28",
                                    "end_date": "2025-11-28",
                                    "max_capacity": 2147483647,
                                    "total_seats": 9223372036854776000,
                                    "booked_seats": 9223372036854776000,
                                    "confirmed_seats": 9223372036854776000,
                                    "price_per_person": "-459",
                                    "rules": "string",
                                    "adault_visa_selling_price": 0,
                                    "adault_visa_purchase_price": 0,
                                    "child_visa_selling_price": 0,
                                    "child_visa_purchase_price": 0,
                                    "infant_visa_selling_price": 0,
                                    "infant_visa_purchase_price": 0,
                                    "food_selling_price": 0,
                                    "food_purchase_price": 0,
                                    "makkah_ziyarat_selling_price": 0,
                                    "makkah_ziyarat_purchase_price": 0,
                                    "madinah_ziyarat_selling_price": 0,
                                    "madinah_ziyarat_purchase_price": 0,
                                    "transport_selling_price": 0,
                                    "transport_purchase_price": 0,
                                    "food_price_id": 2147483647,
                                    "makkah_ziyarat_id": 2147483647,
                                    "madinah_ziyarat_id": 2147483647,
                                    "reselling_allowed": True,
                                    "is_public": True,
                                    "available_start_date": "2025-11-28",
                                    "available_end_date": "2025-11-28",
                                    "area_agent_commission_adult": 0,
                                    "area_agent_commission_child": 0,
                                    "area_agent_commission_infant": 0,
                                    "branch_commission_adult": 0,
                                    "branch_commission_child": 0,
                                    "branch_commission_infant": 0,
                                    "profit_percent": "-41.7",
                                    "organization": 0,
                                    "created_by": 0,
                                    # schema-only calculation object
                                    "bed_price_calculation": {
                                        "currency": "Rs.",
                                        "unit": "per adult",
                                        "rates": {
                                            "sharing": {"label": "SHARING", "price": 36200, "formatted": "Rs. 36,200/.", "note": "per adult"},
                                            "quint": {"label": "QUINT", "price": 46200, "formatted": "Rs. 46,200/.", "note": "per adult"},
                                            "quad": {"label": "QUAD BED", "price": 56200, "formatted": "Rs. 56,200/.", "note": "per adult"},
                                            "triple": {"label": "TRIPLE BED", "price": 66200, "formatted": "Rs. 66,200/.", "note": "per adult"},
                                            "double": {"label": "DOUBLE BED", "price": 76200, "formatted": "Rs. 76,200/.", "note": "per adult"},
                                            "infant": {"label": "PER INFANT", "price": 20000, "formatted": "Rs. 20,000/.", "note": "per infant"}
                                        },
                                        "calculation_examples": [
                                            {"description": "Per-adult price for each bed type", "per_adult_prices": {"sharing": 36200, "quint": 46200, "quad": 56200, "triple": 66200, "double": 76200}},
                                            {"description": "Total price for N adults (example)", "example": {"bed_type": "double", "adults": 3, "total_price": 228600}}
                                        ],
                                        "notes": "Schema-only calculation example; no backend changes."
                                    }
                                }

                                # Attach the example under requestBody -> content -> application/json -> example
                                rb = post_op.setdefault('requestBody', {}).setdefault('content', {}).setdefault('application/json', {})
                                rb['example'] = example
                            except Exception:
                                # Don't fail schema generation for hook errors
                                pass
