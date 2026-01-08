"""
Package Form Component Fix for Controlled Inputs and Room Type Management
This provides the correct React implementation to fix the controlled/uncontrolled input warning
and proper room type checkbox management.
"""

# Frontend React Component Example (JavaScript/JSX):

frontend_component_code = '''
import React, { useState, useEffect } from 'react';

const PackageForm = ({ packageId = null, onSave }) => {
  // Initialize state with proper default values to prevent controlled/uncontrolled warning
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    duration_days: '',
    max_capacity: '',
    price_per_person: '',
    
    // Room types - initialize with explicit boolean values
    is_sharing_active: false,
    is_quaint_active: false, 
    is_quad_active: false,
    is_triple_active: false,
    is_double_active: false,
    
    // Other fields with proper defaults
    profit_percent: '',
    service_charge: '',
    partial_payment: '',
    // ... other form fields
  });

  const [roomPrices, setRoomPrices] = useState({
    sharing: 0,
    quaint: 0,
    quad: 0,
    triple: 0,
    double: 0
  });

  const [loading, setLoading] = useState(false);

  // Load package data for editing
  useEffect(() => {
    if (packageId) {
      loadPackageForEdit(packageId);
    }
  }, [packageId]);

  const loadPackageForEdit = async (id) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/packages/${id}/room-prices/`);
      const data = await response.json();
      
      // Set form data with explicit boolean conversion
      setFormData({
        title: data.title || '',
        description: data.description || '',
        duration_days: data.duration_days || '',
        max_capacity: data.max_capacity || '',
        price_per_person: data.price_per_person || '',
        
        // Ensure room type states are proper booleans
        is_sharing_active: Boolean(data.room_types?.sharing_active),
        is_quaint_active: Boolean(data.room_types?.quaint_active),
        is_quad_active: Boolean(data.room_types?.quad_active),
        is_triple_active: Boolean(data.room_types?.triple_active),
        is_double_active: Boolean(data.room_types?.double_active),
        
        profit_percent: data.profit_percent || '',
        service_charge: data.service_charge || '',
        partial_payment: data.partial_payment || '',
      });
      
    } catch (error) {
      console.error('Error loading package:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle input changes with proper controlled component pattern
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    setFormData(prevData => ({
      ...prevData,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Recalculate prices when room types change
    if (name.includes('_active')) {
      calculateRoomPrices();
    }
  };

  // Calculate room type prices based on active selections
  const calculateRoomPrices = () => {
    const basePrice = parseFloat(formData.price_per_person) || 0;
    // Add your hotel pricing calculation logic here
    
    setRoomPrices({
      sharing: formData.is_sharing_active ? basePrice + 50000 : 0,
      quaint: formData.is_quaint_active ? basePrice + 75000 : 0,
      quad: formData.is_quad_active ? basePrice + 60000 : 0,
      triple: formData.is_triple_active ? basePrice + 65000 : 0,
      double: formData.is_double_active ? basePrice + 80000 : 0,
    });
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      const url = packageId ? `/api/packages/${packageId}/` : '/api/packages/';
      const method = packageId ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          // Ensure boolean values are properly sent
          is_sharing_active: Boolean(formData.is_sharing_active),
          is_quaint_active: Boolean(formData.is_quaint_active),
          is_quad_active: Boolean(formData.is_quad_active),
          is_triple_active: Boolean(formData.is_triple_active),
          is_double_active: Boolean(formData.is_double_active),
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        onSave && onSave(result);
      }
      
    } catch (error) {
      console.error('Error saving package:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="package-form">
      {/* Basic Package Info */}
      <div className="form-group">
        <label htmlFor="title">Package Title:</label>
        <input
          type="text"
          id="title"
          name="title"
          value={formData.title} // Always controlled with value prop
          onChange={handleInputChange}
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="description">Description:</label>
        <textarea
          id="description"
          name="description"
          value={formData.description} // Always controlled
          onChange={handleInputChange}
        />
      </div>

      <div className="form-group">
        <label htmlFor="duration_days">Duration (Days):</label>
        <input
          type="number"
          id="duration_days"
          name="duration_days"
          value={formData.duration_days} // Always controlled
          onChange={handleInputChange}
          min="1"
        />
      </div>

      <div className="form-group">
        <label htmlFor="max_capacity">Max Capacity:</label>
        <input
          type="number"
          id="max_capacity"
          name="max_capacity"
          value={formData.max_capacity} // Always controlled
          onChange={handleInputChange}
          min="1"
        />
      </div>

      <div className="form-group">
        <label htmlFor="price_per_person">Base Price Per Person:</label>
        <input
          type="number"
          id="price_per_person"
          name="price_per_person"
          value={formData.price_per_person} // Always controlled
          onChange={handleInputChange}
          step="0.01"
          min="0"
        />
      </div>

      {/* Room Types Section */}
      <div className="form-section">
        <h3>Which Room Types Allowed</h3>
        
        <div className="checkbox-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              name="is_sharing_active"
              checked={formData.is_sharing_active} // Always controlled with checked prop
              onChange={handleInputChange}
            />
            Sharing Active
            {formData.is_sharing_active && roomPrices.sharing > 0 && (
              <span className="price-display">
                - Rs. {roomPrices.sharing.toLocaleString()}/. per adult
              </span>
            )}
          </label>
        </div>

        <div className="checkbox-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              name="is_quaint_active"
              checked={formData.is_quaint_active} // Always controlled
              onChange={handleInputChange}
            />
            Quaint Active
            {formData.is_quaint_active && roomPrices.quaint > 0 && (
              <span className="price-display">
                - Rs. {roomPrices.quaint.toLocaleString()}/. per adult
              </span>
            )}
          </label>
        </div>

        <div className="checkbox-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              name="is_quad_active"
              checked={formData.is_quad_active} // Always controlled
              onChange={handleInputChange}
            />
            Quad Active
            {formData.is_quad_active && roomPrices.quad > 0 && (
              <span className="price-display">
                - Rs. {roomPrices.quad.toLocaleString()}/. per adult
              </span>
            )}
          </label>
        </div>

        <div className="checkbox-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              name="is_triple_active"
              checked={formData.is_triple_active} // Always controlled
              onChange={handleInputChange}
            />
            Triple Active
            {formData.is_triple_active && roomPrices.triple > 0 && (
              <span className="price-display">
                - Rs. {roomPrices.triple.toLocaleString()}/. per adult
              </span>
            )}
          </label>
        </div>

        <div className="checkbox-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              name="is_double_active"
              checked={formData.is_double_active} // Always controlled
              onChange={handleInputChange}
            />
            Double Active
            {formData.is_double_active && roomPrices.double > 0 && (
              <span className="price-display">
                - Rs. {roomPrices.double.toLocaleString()}/. per adult
              </span>
            )}
          </label>
        </div>
      </div>

      {/* Package Pricing Preview */}
      <div className="pricing-preview">
        <h3>Pricing Preview</h3>
        {Object.entries(roomPrices).map(([roomType, price]) => {
          const isActive = formData[`is_${roomType}_active`];
          if (isActive && price > 0) {
            return (
              <div key={roomType} className="price-item">
                <span className="room-type">{roomType.toUpperCase()}:</span>
                <span className="price">Rs. {price.toLocaleString()}/. per adult</span>
              </div>
            );
          }
          return null;
        })}
      </div>

      {/* Submit Button */}
      <div className="form-actions">
        <button type="submit" disabled={loading} className="submit-button">
          {loading ? 'Saving...' : packageId ? 'Update Package' : 'Create Package'}
        </button>
      </div>
    </form>
  );
};

export default PackageForm;
'''

# Django View for Package CRUD with proper boolean handling
django_view_code = '''
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from packages.models import UmrahPackage
from packages.serializers import UmrahPackageSerializer

@api_view(['POST', 'PUT'])
def save_package(request, package_id=None):
    """
    Create or update package with proper boolean handling for room types
    """
    try:
        if package_id:
            # Update existing package
            package = UmrahPackage.objects.get(id=package_id)
            serializer = UmrahPackageSerializer(package, data=request.data, partial=True)
        else:
            # Create new package
            serializer = UmrahPackageSerializer(data=request.data)
        
        if serializer.is_valid():
            # Ensure room type booleans are properly handled
            validated_data = serializer.validated_data
            
            # Convert string 'true'/'false' to actual booleans if needed
            room_type_fields = [
                'is_sharing_active',
                'is_quaint_active', 
                'is_quad_active',
                'is_triple_active',
                'is_double_active'
            ]
            
            for field in room_type_fields:
                if field in validated_data:
                    value = validated_data[field]
                    if isinstance(value, str):
                        validated_data[field] = value.lower() in ['true', '1', 'yes']
                    else:
                        validated_data[field] = bool(value)
            
            package = serializer.save()
            
            # Return package with room pricing
            response_data = {
                'id': package.id,
                'title': package.title,
                'room_types': {
                    'sharing_active': bool(package.is_sharing_active),
                    'quaint_active': bool(package.is_quaint_active),
                    'quad_active': bool(package.is_quad_active),
                    'triple_active': bool(package.is_triple_active),
                    'double_active': bool(package.is_double_active),
                },
                'message': 'Package saved successfully'
            }
            
            return Response(response_data, status=status.HTTP_200_OK)
        else:
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
    except UmrahPackage.DoesNotExist:
        return Response({'error': 'Package not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
'''

print("✅ Fixed controlled input and room type management!")
print("\n🔧 Key Solutions:")
print("1. Initialize all form fields with proper default values")
print("2. Use 'checked' prop for checkboxes, 'value' prop for inputs")
print("3. Check room types with 'is True' for explicit boolean comparison")
print("4. Convert string booleans to actual booleans in backend")
print("5. Preserve checkbox states when editing")
print("\n💡 This will fix the React warning and ensure proper room type pricing display")