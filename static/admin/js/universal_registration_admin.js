(function($) {
    'use strict';
    
    $(document).ready(function() {
        var typeField = $('#id_type');
        var parentField = $('#id_parent');
        
        if (typeField.length && parentField.length) {
            
            // Store all options
            var allOptions = parentField.find('option').clone();
            
            function filterParentOptions() {
                var selectedType = typeField.val();
                
                // Clear current options except the empty one
                parentField.find('option').not(':first').remove();
                
                if (selectedType === 'organization') {
                    // Organizations don't need a parent - disable the field
                    parentField.prop('disabled', true);
                    parentField.after('<p class="help" style="color: #666;">Organizations do not require a parent</p>');
                    
                } else if (selectedType === 'branch') {
                    // Branches can only select Organizations
                    parentField.prop('disabled', false);
                    parentField.next('.help').remove();
                    
                    allOptions.each(function() {
                        var option = $(this);
                        var optionText = option.text();
                        // Check if option contains "organization" type indicator
                        // Django admin usually shows the __str__ representation
                        if (optionText.toLowerCase().includes('organization:') || 
                            option.data('type') === 'organization') {
                            parentField.append(option.clone());
                        }
                    });
                    
                    if (parentField.find('option').length === 1) {
                        parentField.after('<p class="help" style="color: #d63031;">No organizations available. Please create an organization first.</p>');
                    } else {
                        parentField.after('<p class="help" style="color: #0984e3;">Select an Organization as parent (REQUIRED)</p>');
                    }
                    
                } else if (selectedType === 'agent') {
                    // Agents can only select Branches
                    parentField.prop('disabled', false);
                    parentField.next('.help').remove();
                    
                    allOptions.each(function() {
                        var option = $(this);
                        var optionText = option.text();
                        // Check if option contains "branch" type indicator
                        if (optionText.toLowerCase().includes('branch:') || 
                            option.data('type') === 'branch') {
                            parentField.append(option.clone());
                        }
                    });
                    
                    if (parentField.find('option').length === 1) {
                        parentField.after('<p class="help" style="color: #d63031;">No branches available. Please create a branch first.</p>');
                    } else {
                        parentField.after('<p class="help" style="color: #0984e3;">Select a Branch as parent (REQUIRED)</p>');
                    }
                    
                } else if (selectedType === 'employee') {
                    // Employees can only select Agents
                    parentField.prop('disabled', false);
                    parentField.next('.help').remove();
                    
                    allOptions.each(function() {
                        var option = $(this);
                        var optionText = option.text();
                        // Check if option contains "agent" type indicator
                        if (optionText.toLowerCase().includes('agent:') || 
                            option.data('type') === 'agent') {
                            parentField.append(option.clone());
                        }
                    });
                    
                    if (parentField.find('option').length === 1) {
                        parentField.after('<p class="help" style="color: #d63031;">No agents available. Please create an agent first.</p>');
                    } else {
                        parentField.after('<p class="help" style="color: #0984e3;">Select an Agent as parent (REQUIRED)</p>');
                    }
                }
            }
            
            // Filter on page load
            filterParentOptions();
            
            // Filter when type changes
            typeField.on('change', function() {
                filterParentOptions();
            });
        }
    });
})(django.jQuery);
