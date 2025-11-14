/**
 * Dynamic Booking Item Fields
 * Show/hide inventory dropdowns based on selected inventory_type
 * Auto-fill item_name and unit_price from selected inventory
 */

(function($) {
    'use strict';

    function setupBookingItemDynamicFields() {
        // Find all booking item rows
        const tableSelector = '#bookingitem_set-group';
        
        function autoFillPrice(row, inventoryType, inventoryId) {
            if (!inventoryId) return;
            
            const unitPriceInput = row.find('input[name$="-unit_price"]');
            if (!unitPriceInput.length) return;
            
            // Call AJAX to get price from backend
            $.ajax({
                url: '/booking/admin/booking/get-inventory-price/',
                method: 'GET',
                data: {
                    type: inventoryType,
                    id: inventoryId
                },
                success: function(response) {
                    if (response.success && response.price !== undefined) {
                        // Remove readonly temporarily to set value
                        unitPriceInput.prop('readonly', false);
                        unitPriceInput.val(response.price.toFixed(2));
                        unitPriceInput.trigger('change');
                        // Make it readonly again
                        unitPriceInput.prop('readonly', true);
                    }
                },
                error: function(xhr, status, error) {
                    console.error('Error fetching price:', error);
                }
            });
        }
        
        function autoFillItemName(row, inventoryType, selectedElement) {
            const itemNameInput = row.find('input[name$="-item_name"]');
            if (!itemNameInput.length || !selectedElement) return;
            
            const selectedOption = selectedElement.find('option:selected');
            if (selectedOption.length && selectedOption.val()) {
                // Get the text of the selected option
                let itemName = selectedOption.text().trim();
                
                // Clean up the text (remove leading dashes, numbers, etc.)
                itemName = itemName.replace(/^-+\s*/, '');
                
                // Remove readonly temporarily to set value
                itemNameInput.prop('readonly', false);
                itemNameInput.val(itemName);
                itemNameInput.trigger('change');
                // Make it readonly again
                itemNameInput.prop('readonly', true);
                
                // Also auto-fill price
                const inventoryId = selectedOption.val();
                autoFillPrice(row, inventoryType, inventoryId);
            }
        }
        
        function updateInventoryFields(row) {
            const inventoryTypeSelect = row.find('select[name$="-inventory_type"]');
            if (!inventoryTypeSelect.length) return;
            
            const selectedType = inventoryTypeSelect.val();
            
            // Get all inventory field containers
            const hotelField = row.find('select[name$="-hotel"]').closest('td');
            const transportField = row.find('select[name$="-transport"]').closest('td');
            const packageField = row.find('select[name$="-package"]').closest('td');
            const visaField = row.find('select[name$="-visa"]').closest('td');
            const ticketField = row.find('select[name$="-ticket"]').closest('td');
            
            const hotelSelect = row.find('select[name$="-hotel"]');
            const transportSelect = row.find('select[name$="-transport"]');
            const packageSelect = row.find('select[name$="-package"]');
            const visaSelect = row.find('select[name$="-visa"]');
            const ticketSelect = row.find('select[name$="-ticket"]');
            
            // Hide all inventory fields first
            hotelField.hide();
            transportField.hide();
            packageField.hide();
            visaField.hide();
            ticketField.hide();
            
            // Clear values of hidden fields
            hotelSelect.val('');
            transportSelect.val('');
            packageSelect.val('');
            visaSelect.val('');
            ticketSelect.val('');
            
            // Show only the relevant field based on inventory_type
            switch(selectedType) {
                case 'hotel':
                    hotelField.show();
                    autoFillItemName(row, 'hotel', hotelSelect);
                    break;
                case 'transport':
                    transportField.show();
                    autoFillItemName(row, 'transport', transportSelect);
                    break;
                case 'package':
                    packageField.show();
                    autoFillItemName(row, 'package', packageSelect);
                    break;
                case 'visa':
                    visaField.show();
                    autoFillItemName(row, 'visa', visaSelect);
                    break;
                case 'ticket':
                    ticketField.show();
                    autoFillItemName(row, 'ticket', ticketSelect);
                    break;
                case 'ziyarat':
                case 'food':
                case 'other':
                    // For these types, allow manual item_name entry
                    const itemNameInput = row.find('input[name$="-item_name"]');
                    itemNameInput.attr('readonly', false);
                    itemNameInput.attr('placeholder', 'Enter item name manually');
                    break;
            }
        }
        
        function attachChangeListeners(row) {
            // Listen for changes on inventory selections
            row.find('select[name$="-hotel"]').on('change', function() {
                autoFillItemName(row, 'hotel', $(this));
            });
            
            row.find('select[name$="-transport"]').on('change', function() {
                autoFillItemName(row, 'transport', $(this));
            });
            
            row.find('select[name$="-package"]').on('change', function() {
                autoFillItemName(row, 'package', $(this));
            });
            
            row.find('select[name$="-visa"]').on('change', function() {
                autoFillItemName(row, 'visa', $(this));
            });
            
            row.find('select[name$="-ticket"]').on('change', function() {
                autoFillItemName(row, 'ticket', $(this));
            });
        }
        
        function initializeRow(row) {
            updateInventoryFields(row);
            attachChangeListeners(row);
            
            // Add change event listener for inventory type
            row.find('select[name$="-inventory_type"]').on('change', function() {
                updateInventoryFields(row);
            });
        }
        
        // Initialize existing rows
        $(tableSelector + ' .form-row:not(.empty-form)').each(function() {
            initializeRow($(this));
        });
        
        // Watch for new rows being added
        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                mutation.addedNodes.forEach(function(node) {
                    if (node.nodeType === 1 && $(node).hasClass('form-row')) {
                        initializeRow($(node));
                    }
                });
            });
        });
        
        const targetNode = document.querySelector(tableSelector);
        if (targetNode) {
            observer.observe(targetNode, {
                childList: true,
                subtree: true
            });
        }
    }
    
    // Initialize when DOM is ready
    $(document).ready(function() {
        setupBookingItemDynamicFields();
    });
    
    // Re-initialize when Django admin adds new inline forms
    if (typeof django !== 'undefined' && django.jQuery) {
        django.jQuery(document).on('formset:added', function(event, $row, formsetName) {
            if (formsetName === 'bookingitem_set') {
                setupBookingItemDynamicFields();
            }
        });
    }
    
})(django.jQuery || jQuery);
