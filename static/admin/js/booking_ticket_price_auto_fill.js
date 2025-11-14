/**
 * Dynamic Ticket Price Update for Booking Passenger Details
 * Automatically updates ticket_price when ticket is selected
 */

(function($) {
    'use strict';
    
    $(document).ready(function() {
        console.log('Booking passenger ticket price auto-fill loaded');
        
        // Function to update ticket price based on selected ticket and age group
        function updateTicketPrice($row) {
            var ticketId = $row.find('select[name*="-ticket"]').val();
            var ageGroup = $row.find('select[name*="-age_group"]').val();
            var $priceInput = $row.find('input[name*="-ticket_price"]');
            var $priceDisplay = $row.find('.ticket-price-display');
            
            console.log('Updating price for ticket:', ticketId, 'age group:', ageGroup);
            
            if (!ticketId || !ageGroup) {
                console.log('Missing ticket or age group');
                return;
            }
            
            // Fetch ticket price via AJAX
            $.ajax({
                url: '/admin/booking/get-ticket-price/',
                method: 'GET',
                data: {
                    ticket_id: ticketId,
                    age_group: ageGroup
                },
                success: function(data) {
                    if (data.price !== undefined) {
                        console.log('Received price:', data.price);
                        
                        // Update the ticket_price input field
                        $priceInput.val(data.price);
                        
                        // Update price display if exists
                        if ($priceDisplay.length) {
                            $priceDisplay.html('<span style="color: green; font-weight: bold;">PKR ' + parseFloat(data.price).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2}) + '</span>');
                        } else {
                            // Create price display next to ticket field
                            var $ticketField = $row.find('select[name*="-ticket"]').closest('td');
                            if ($ticketField.find('.ticket-price-display').length === 0) {
                                $ticketField.append('<div class="ticket-price-display" style="margin-top: 5px;"><span style="color: green; font-weight: bold;">PKR ' + parseFloat(data.price).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2}) + '</span></div>');
                            }
                        }
                        
                        // Flash the price field to show it updated
                        $priceInput.css('background-color', '#d4edda');
                        setTimeout(function() {
                            $priceInput.css('background-color', '');
                        }, 1000);
                    }
                },
                error: function(xhr, status, error) {
                    console.error('Error fetching ticket price:', error);
                }
            });
        }
        
        // Bind to ticket selection change
        $(document).on('change', 'select[name*="-ticket"]', function() {
            var $row = $(this).closest('tr');
            updateTicketPrice($row);
        });
        
        // Bind to age group selection change
        $(document).on('change', 'select[name*="-age_group"]', function() {
            var $row = $(this).closest('tr');
            updateTicketPrice($row);
        });
        
        // Update existing rows on page load
        $('select[name*="-ticket"]').each(function() {
            var $row = $(this).closest('tr');
            var ticketId = $(this).val();
            var ageGroup = $row.find('select[name*="-age_group"]').val();
            
            if (ticketId && ageGroup) {
                updateTicketPrice($row);
            }
        });
        
        // Handle dynamically added inline rows
        $('.add-row a').on('click', function() {
            setTimeout(function() {
                // Bind events to newly added row
                console.log('New row added, binding events');
            }, 100);
        });
    });
})(django.jQuery || jQuery);
