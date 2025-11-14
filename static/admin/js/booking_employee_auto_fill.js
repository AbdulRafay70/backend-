(function($) {
    'use strict';
    
    $(document).ready(function() {
        console.log('Booking employee auto-fill script loaded');
        
        // Store employee data: employeeId -> {organization_id, branch_id, agency_id}
        var employeeDataMap = {};
        
        // Parse employee data from the form when page loads
        function parseEmployeeData() {
            // We'll get this data via AJAX or parse from hidden fields
            // For now, let's use a simpler approach: get data when employee changes
            console.log('Employee data mapping ready');
        }
        
        // Update organization/branch/agency fields when employee changes
        function updateFromEmployee() {
            var employeeId = $('#id_employee').val();
            console.log('Employee selected:', employeeId);
            
            if (!employeeId) {
                // Clear fields if no employee selected
                $('#id_organization').val('');
                $('#id_branch').val('');
                $('#id_agency').val('');
                return;
            }
            
            // Get employee data via AJAX
            $.ajax({
                url: '/api/get-employee-org-data/' + employeeId + '/',
                method: 'GET',
                success: function(data) {
                    console.log('Employee data received:', data);
                    
                    if (data.organization_id) {
                        $('#id_organization').val(data.organization_id);
                    }
                    if (data.branch_id) {
                        $('#id_branch').val(data.branch_id);
                    }
                    if (data.agency_id) {
                        $('#id_agency').val(data.agency_id);
                    }
                },
                error: function(xhr, status, error) {
                    console.log('Could not fetch employee data via AJAX, data will be set on form submit');
                }
            });
        }
        
        // Bind change event to employee field
        $('#id_employee').on('change', updateFromEmployee);
        
        // If employee is already selected (edit mode), trigger update
        if ($('#id_employee').val()) {
            updateFromEmployee();
        }
        
        // Initialize
        parseEmployeeData();
        
        // Update passenger counts dynamically
        function updatePassengerCounts() {
            var totalPax = 0;
            var totalAdult = 0;
            var totalChild = 0;
            var totalInfant = 0;
            
            // Count from inline formset
            $('[id^="bookingpersondetail_set-"]').each(function() {
                var $row = $(this);
                var ageGroup = $row.find('select[name$="-age_group"]').val();
                var isDeleted = $row.find('input[name$="-DELETE"]').is(':checked');
                
                // Skip if marked for deletion or empty row
                if (isDeleted || !ageGroup) {
                    return;
                }
                
                totalPax++;
                if (ageGroup === 'Adult') totalAdult++;
                else if (ageGroup === 'Child') totalChild++;
                else if (ageGroup === 'Infant') totalInfant++;
            });
            
            console.log('Passenger counts:', { totalPax, totalAdult, totalChild, totalInfant });
        }
        
        // Bind to age_group changes
        $(document).on('change', 'select[name$="-age_group"]', updatePassengerCounts);
        $(document).on('change', 'input[name$="-DELETE"]', updatePassengerCounts);
        
        // Initial count
        updatePassengerCounts();
    });
})(django.jQuery || jQuery);
