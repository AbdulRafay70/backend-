from rest_framework import serializers
from .models import DynamicForm, FormSubmission
from blog.models import Blog
from leads.models import Lead


class DynamicFormSerializer(serializers.ModelSerializer):
    """Serializer for creating and managing dynamic forms"""
    
    # Read-only fields for response
    linked_blog_title = serializers.SerializerMethodField()
    organization_name = serializers.SerializerMethodField()
    branch_name = serializers.SerializerMethodField()
    created_by_name = serializers.SerializerMethodField()
    
    # Write-only field for blog linkage
    linked_blog_id = serializers.IntegerField(
        write_only=True,
        required=False,
        allow_null=True,
        help_text="ID of the blog to link this form to"
    )
    
    class Meta:
        model = DynamicForm
        fields = [
            'id',
            'form_unique_id',
            'form_title',
            'linked_blog',
            'linked_blog_id',
            'linked_blog_title',
            'is_linked_with_blog',
            'form_page_url',
            'display_position',
            'fields',
            'buttons',
            'notes',
            'form_header_image',
            'custom_css',
            'meta',
            'organization',
            'organization_name',
            'branch',
            'branch_name',
            'created_by',
            'created_by_name',
            'status',
            'submission_count',
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'id',
            'form_unique_id',  # Auto-generated
            'form_page_url',   # Auto-generated
            'submission_count',
            'created_at',
            'updated_at',
        ]
    
    def get_linked_blog_title(self, obj):
        return obj.linked_blog.title if obj.linked_blog else None
    
    def get_organization_name(self, obj):
        return obj.organization.name if obj.organization else None
    
    def get_branch_name(self, obj):
        return obj.branch.name if obj.branch else None
    
    def get_created_by_name(self, obj):
        if obj.created_by:
            return f"{obj.created_by.first_name} {obj.created_by.last_name}".strip() or obj.created_by.username
        return None
    
    def validate_linked_blog_id(self, value):
        """Validate that the blog exists if provided"""
        if value:
            try:
                Blog.objects.get(pk=value)
            except Blog.DoesNotExist:
                raise serializers.ValidationError(f"Blog with ID {value} does not exist")
        return value
    
    def validate_fields(self, value):
        """Validate that fields is a list of properly structured field objects"""
        if not isinstance(value, list):
            raise serializers.ValidationError("Fields must be an array")
        
        required_keys = ['label', 'type']
        valid_types = ['text', 'textarea', 'dropdown', 'checkbox', 'radio', 'email', 'tel', 'number', 'date', 'file']
        valid_widths = ['full', 'half', 'third', 'quarter']
        
        for idx, field in enumerate(value):
            if not isinstance(field, dict):
                raise serializers.ValidationError(f"Field at index {idx} must be an object")
            
            # Check required keys
            for key in required_keys:
                if key not in field:
                    raise serializers.ValidationError(f"Field at index {idx} missing required key: {key}")
            
            # Validate type
            if field['type'] not in valid_types:
                raise serializers.ValidationError(f"Field at index {idx} has invalid type. Must be one of: {', '.join(valid_types)}")
            
            # Validate width if provided
            if 'width' in field and field['width'] not in valid_widths:
                raise serializers.ValidationError(f"Field at index {idx} has invalid width. Must be one of: {', '.join(valid_widths)}")
            
            # Validate options for dropdown/radio/checkbox
            if field['type'] in ['dropdown', 'radio', 'checkbox']:
                if 'options' not in field or not isinstance(field['options'], list):
                    raise serializers.ValidationError(f"Field at index {idx} of type '{field['type']}' must have an 'options' array")
        
        return value
    
    def validate_buttons(self, value):
        """Validate buttons structure"""
        if not isinstance(value, list):
            raise serializers.ValidationError("Buttons must be an array")
        
        valid_actions = ['submit', 'redirect', 'call']
        
        for idx, button in enumerate(value):
            if not isinstance(button, dict):
                raise serializers.ValidationError(f"Button at index {idx} must be an object")
            
            if 'label' not in button:
                raise serializers.ValidationError(f"Button at index {idx} missing required key: label")
            
            if 'action' not in button:
                raise serializers.ValidationError(f"Button at index {idx} missing required key: action")
            
            if button['action'] not in valid_actions:
                raise serializers.ValidationError(f"Button at index {idx} has invalid action. Must be one of: {', '.join(valid_actions)}")
            
            # Redirect and call actions require URL
            if button['action'] in ['redirect', 'call'] and 'url' not in button:
                raise serializers.ValidationError(f"Button at index {idx} with action '{button['action']}' must have a 'url' field")
        
        return value
    
    def create(self, validated_data):
        """Create form and link to blog if specified"""
        linked_blog_id = validated_data.pop('linked_blog_id', None)
        
        if linked_blog_id:
            try:
                blog = Blog.objects.get(pk=linked_blog_id)
                validated_data['linked_blog'] = blog
            except Blog.DoesNotExist:
                pass
        
        return super().create(validated_data)
    
    def update(self, instance, validated_data):
        """Update form and handle blog linkage"""
        linked_blog_id = validated_data.pop('linked_blog_id', None)
        
        if linked_blog_id is not None:
            if linked_blog_id:
                try:
                    blog = Blog.objects.get(pk=linked_blog_id)
                    validated_data['linked_blog'] = blog
                except Blog.DoesNotExist:
                    pass
            else:
                validated_data['linked_blog'] = None
        
        return super().update(instance, validated_data)


class DynamicFormSubmissionSerializer(serializers.Serializer):
    """
    Serializer for dynamic form submissions.
    This handles the submission data and forwards it to the Leads API.
    """
    
    # Dynamic fields - will be validated against form structure
    submission_data = serializers.JSONField(
        help_text="Form field values as key-value pairs"
    )
    
    # Optional metadata
    ip_address = serializers.CharField(required=False, allow_blank=True, allow_null=True, max_length=45)
    user_agent = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    referrer = serializers.CharField(required=False, allow_blank=True, allow_null=True, max_length=512)
    
    def validate(self, data):
        """Validate submission data against form field structure"""
        form = self.context.get('form')
        if not form:
            raise serializers.ValidationError("Form context is required for validation")
        
        submission_data = data.get('submission_data', {})
        
        # Validate required fields
        form_fields = form.fields
        missing_required = []
        
        for field in form_fields:
            if field.get('required', False):
                field_key = field['label'].lower().replace(' ', '_')
                if field_key not in submission_data or not submission_data[field_key]:
                    missing_required.append(field['label'])
        
        if missing_required:
            raise serializers.ValidationError({
                'submission_data': f"Missing required fields: {', '.join(missing_required)}"
            })
        
        return data
    
    def create_lead_from_submission(self, form, submission_data, request=None):
        """
        Map form submission data to Lead model and create Lead record.
        This is the auto-forward logic to existing Leads API.
        """
        from leads.serializers import LeadSerializer
        
        # Map common field names to Lead model fields
        field_mapping = {
            'full_name': 'customer_full_name',
            'name': 'customer_full_name',
            'customer_name': 'customer_full_name',
            'contact_number': 'contact_number',
            'phone': 'contact_number',
            'mobile': 'contact_number',
            'email': 'email',
            'passport_number': 'passport_number',
            'passport': 'passport_number',
            'cnic': 'cnic_number',
            'cnic_number': 'cnic_number',
            'address': 'address',
            'message': 'remarks',
            'remarks': 'remarks',
            'notes': 'remarks',
            'preferred_package_type': 'interested_in',
            'package_type': 'interested_in',
            'travel_date': 'interested_travel_date',
        }
        
        # Build Lead data
        lead_data = {
            'lead_source': 'form',  # Mark as form submission
            'lead_status': 'new',
            'organization': form.organization_id,
            'branch': form.branch_id if form.branch else form.organization.branches.first().id if form.organization.branches.exists() else None,
        }
        
        # Map submitted fields to lead fields
        for submitted_key, submitted_value in submission_data.items():
            # Normalize key
            normalized_key = submitted_key.lower().replace(' ', '_')
            
            # Check if it maps to a Lead field
            if normalized_key in field_mapping:
                lead_field = field_mapping[normalized_key]
                lead_data[lead_field] = submitted_value
            elif normalized_key in ['customer_full_name', 'contact_number', 'email', 'passport_number', 
                                    'cnic_number', 'address', 'remarks', 'interested_in', 'interested_travel_date']:
                lead_data[normalized_key] = submitted_value
        
        # Add form metadata to remarks
        form_info = f"\n\n[Form Submission: {form.form_title} (ID: {form.form_unique_id})]"
        if form.linked_blog:
            form_info += f"\n[Submitted via blog: {form.linked_blog.title}]"
        
        existing_remarks = lead_data.get('remarks', '')
        lead_data['remarks'] = f"{existing_remarks}{form_info}".strip()
        
        # Create Lead using existing Leads serializer
        lead_serializer = LeadSerializer(data=lead_data, context={'request': request})
        
        if lead_serializer.is_valid():
            lead = lead_serializer.save()
            return lead
        else:
            # Log errors but don't fail submission
            print(f"Lead creation errors: {lead_serializer.errors}")
            # Create a minimal lead record as fallback
            try:
                lead = Lead.objects.create(
                    customer_full_name=submission_data.get('name', submission_data.get('full_name', 'Unknown')),
                    contact_number=submission_data.get('contact_number', submission_data.get('phone', '')),
                    email=submission_data.get('email', ''),
                    remarks=lead_data.get('remarks', ''),
                    lead_source='form',
                    lead_status='new',
                    organization_id=form.organization_id,
                    branch_id=lead_data.get('branch'),
                )
                return lead
            except Exception as e:
                print(f"Fallback lead creation failed: {str(e)}")
                return None


class FormSubmissionRecordSerializer(serializers.ModelSerializer):
    """Serializer for viewing form submission records"""
    
    form_title = serializers.CharField(source='form.form_title', read_only=True)
    form_unique_id = serializers.CharField(source='form.form_unique_id', read_only=True)
    lead_id = serializers.IntegerField(source='lead.id', read_only=True, allow_null=True)
    lead_name = serializers.CharField(source='lead.customer_full_name', read_only=True, allow_null=True)
    
    # Explicitly declare ip_address to avoid DRF schema generation issues with GenericIPAddressField
    ip_address = serializers.CharField(max_length=45, allow_null=True, allow_blank=True, required=False)
    
    class Meta:
        model = FormSubmission
        fields = [
            'id',
            'form',
            'form_title',
            'form_unique_id',
            'lead',
            'lead_id',
            'lead_name',
            'submission_data',
            'ip_address',
            'user_agent',
            'referrer',
            'created_at',
        ]
        read_only_fields = ['id', 'created_at']
