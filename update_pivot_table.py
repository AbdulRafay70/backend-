# -*- coding: utf-8 -*-
"""
Script to update Show Prices modal with proper pivot table
Shows all bed types with purchase prices only
"""

import re

# File path
file_path = r"c:\Users\Abdul Rafay\Downloads\All\All\src\pages\admin\HotelAvailabilityManager.jsx"

# Read the file
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# New modal body content with proper pivot table
new_modal_body = '''            <Modal.Body>
              {priceModalHotel && (() => {
                const prices = priceModalHotel.prices || priceModalHotel.price_sections || [];

                // Helper to get bed type name from slug/type (case-insensitive)
                const getBedTypeName = (type) => {
                  if (!type) return 'room';
                  const typeStr = String(type).toLowerCase().trim();
                  
                  // Map to standardized names
                  const typeMap = {
                    'single': 'single',
                    'sharing': 'sharing',
                    'double': 'double',
                    'triple': 'triple',
                    'quad': 'quad',
                    'quint': 'quint',
                    'room': 'room',
                    '6': '6',
                    '7': '7',
                    '8': '8',
                    '9': '9',
                    '10': '10',
                  };
                  
                  if (typeMap[typeStr]) return typeMap[typeStr];
                  
                  // Check if it's a bed type from the list
                  const foundBedType = bedTypesList.find(bt =>
                    String(bt.slug).toLowerCase() === typeStr ||
                    String(bt.name).toLowerCase() === typeStr
                  );
                  
                  if (foundBedType) {
                    const name = foundBedType.name.toLowerCase();
                    return typeMap[name] || name;
                  }
                  
                  return typeStr;
                };

                // Group prices by date range
                const dateRangeMap = {};
                prices.forEach(p => {
                  const key = `${p.start_date || 'N/A'}_${p.end_date || 'N/A'}`;
                  if (!dateRangeMap[key]) {
                    dateRangeMap[key] = {
                      start_date: p.start_date || 'N/A',
                      end_date: p.end_date || 'N/A',
                      prices: {}
                    };
                  }
                  const bedType = getBedTypeName(p.room_type);
                  const purchasePrice = p.purchase_price || 0;
                  dateRangeMap[key].prices[bedType] = purchasePrice;
                });

                // Define fixed column order: Room, Sharing, Double, Triple, Quad, Quint, 6, 7, 8, 9, 10
                const bedTypeColumns = ['room', 'sharing', 'double', 'triple', 'quad', 'quint', '6', '7', '8', '9', '10'];
                
                // Column display names
                const columnNames = {
                  'room': 'Room',
                  'sharing': 'Sharing',
                  'double': 'Double',
                  'triple': 'Triple',
                  'quad': 'Quad',
                  'quint': 'Quint',
                  '6': '6 Bed',
                  '7': '7 Bed',
                  '8': '8 Bed',
                  '9': '9 Bed',
                  '10': '10 Bed'
                };

                // Convert map to array
                const dateRanges = Object.values(dateRangeMap);

                return (
                  <div>
                    <h6 className="mb-3">Hotel Prices by Date Range (Purchase Prices)</h6>
                    {prices.length === 0 ? (
                      <div className="text-center text-muted py-3">
                        No prices available for this hotel
                      </div>
                    ) : (
                      <div style={{ overflowX: 'auto' }}>
                        <Table striped bordered hover size="sm">
                          <thead>
                            <tr>
                              <th>Start Date</th>
                              <th>End Date</th>
                              {bedTypeColumns.map((bedType, idx) => (
                                <th key={idx}>{columnNames[bedType]}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {dateRanges.map((range, idx) => (
                              <tr key={idx}>
                                <td>{range.start_date}</td>
                                <td>{range.end_date}</td>
                                {bedTypeColumns.map((bedType, bidx) => {
                                  const price = range.prices[bedType];
                                  return (
                                    <td key={bidx}>
                                      {price != null && price !== 0 ? `${Number(price).toLocaleString()} SAR` : 'N/A'}
                                    </td>
                                  );
                                })}
                              </tr>
                            ))}
                          </tbody>
                        </Table>
                      </div>
                    )}
                  </div>
                );
              })()}
            </Modal.Body>'''

# Find and replace the modal body using regex
# Pattern to match from <Modal.Body> to </Modal.Body>
pattern = r'<Modal\.Body>.*?</Modal\.Body>'
replacement = new_modal_body

# Replace (using DOTALL flag to match across newlines)
new_content = re.sub(pattern, replacement, content, flags=re.DOTALL, count=1)

# Write back to file
with open(file_path, 'w', encoding='utf-8') as f:
    f.write(new_content)

print("[SUCCESS] Updated HotelAvailabilityManager.jsx with proper pivot table!")
print("\nChanges made:")
print("- Column order: Start Date, End Date, Room, Sharing, Double, Triple, Quad, Quint, 6, 7, 8, 9, 10")
print("- Shows purchase prices only (removed selling price and profit)")
print("- All bed types (1-10) now display correctly")
print("\nGo to Hotel Availability Manager and click 'Show Prices' to see the updated table!")
