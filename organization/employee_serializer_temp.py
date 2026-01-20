# Employee Serializer and ViewSet

class EmployeeSerializer(serializers.ModelSerializer):
    """Serializer for Employee model"""
    agency_name = serializers.CharField(source="agency.name", read_only=True)
    branch_name = serializers.CharField(source="agency.branch.name", read_only=True)
    organization_name = serializers.CharField(source="agency.branch.organization.name", read_only=True)
    full_name = serializers.CharField(read_only=True)
    
    class Meta:
        model = Employee
        fields = '__all__'
        read_only_fields = ['employee_code', 'created_at', 'updated_at', 'created_by']
        extra_kwargs = {
            'user': {'required': False, 'allow_null': True},
            'date_of_birth': {'required': False, 'allow_null': True},
            'phone_number': {'required': False, 'allow_blank': True},
            'address': {'required': False, 'allow_blank': True},
            'position': {'required': False, 'allow_blank': True},
            'department': {'required': False, 'allow_blank': True},
            'salary': {'required': False, 'allow_null': True},
            'commission_rate': {'required': False, 'allow_null': True},
            'profile_photo': {'required': False, 'allow_null': True},
            'notes': {'required': False, 'allow_blank': True},
        }
    
    def create(self, validated_data):
        # Set created_by from request user if available
        request = self.context.get('request')
        if request and hasattr(request, 'user') and request.user.is_authenticated:
            validated_data['created_by'] = request.user
        return super().create(validated_data)


