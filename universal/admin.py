from django.contrib import admin
from django import forms
from .models import PaxMovement, RegistrationRule, UniversalRegistration

@admin.register(PaxMovement)
class PaxMovementAdmin(admin.ModelAdmin):
    list_display = ("id", "pax_id", "flight_no", "status", "verified_exit", "agent_id", "departure_airport", "arrival_airport", "departure_time", "arrival_time", "created_at")
    search_fields = ("pax_id", "flight_no", "agent_id", "departure_airport", "arrival_airport")
    list_filter = ("status", "verified_exit", "departure_airport", "arrival_airport")


# Custom form for UniversalRegistration with dynamic parent filtering
class UniversalRegistrationAdminForm(forms.ModelForm):
    class Meta:
        model = UniversalRegistration
        fields = '__all__'
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        
        # Get the current instance's type
        instance = kwargs.get('instance')
        current_type = instance.type if instance else self.initial.get('type')
        
        # If type is in the form data (during creation), use that
        if 'type' in self.data:
            try:
                current_type = self.data.get('type')
            except (ValueError, TypeError):
                pass
        
        # Filter parent options based on entity type
        if current_type:
            if current_type == UniversalRegistration.TYPE_BRANCH:
                # Branches can only have Organizations as parents
                self.fields['parent'].queryset = UniversalRegistration.objects.filter(
                    type=UniversalRegistration.TYPE_ORGANIZATION,
                    is_active=True
                ).order_by('name')
                self.fields['parent'].help_text = "Select an Organization as parent (REQUIRED for Branch)"
                self.fields['parent'].required = True
                
            elif current_type == UniversalRegistration.TYPE_AGENT:
                # Agents can only have Branches as parents
                self.fields['parent'].queryset = UniversalRegistration.objects.filter(
                    type=UniversalRegistration.TYPE_BRANCH,
                    is_active=True
                ).order_by('name')
                self.fields['parent'].help_text = "Select a Branch as parent (REQUIRED for Agent)"
                self.fields['parent'].required = True
                
            elif current_type == UniversalRegistration.TYPE_EMPLOYEE:
                # Employees can have Organization or Branch as parent
                self.fields['parent'].queryset = UniversalRegistration.objects.filter(
                    type__in=[
                        UniversalRegistration.TYPE_ORGANIZATION,
                        UniversalRegistration.TYPE_BRANCH
                    ],
                    is_active=True
                ).order_by('type', 'name')
                self.fields['parent'].help_text = "Select Organization or Branch as parent (REQUIRED for Employee)"
                self.fields['parent'].required = True
                
            elif current_type == UniversalRegistration.TYPE_ORGANIZATION:
                # Organizations don't need a parent
                self.fields['parent'].queryset = UniversalRegistration.objects.none()
                self.fields['parent'].help_text = "Organizations do not require a parent"
                self.fields['parent'].required = False
        else:
            # No type selected yet - show only valid parent types (exclude Employee and Agent)
            # Only Organizations and Branches can be parents
            self.fields['parent'].queryset = UniversalRegistration.objects.filter(
                type__in=[
                    UniversalRegistration.TYPE_ORGANIZATION,
                    UniversalRegistration.TYPE_BRANCH
                ],
                is_active=True
            ).order_by('type', 'name')
            self.fields['parent'].help_text = "Select type first to see available parent options"
            self.fields['parent'].required = False


@admin.register(UniversalRegistration)
class UniversalRegistrationAdmin(admin.ModelAdmin):
    form = UniversalRegistrationAdminForm
    
    list_display = ("id", "type", "name", "parent", "status", "is_active", "organization_id", "branch_id")
    search_fields = ("id", "name", "email", "contact_no", "organization_id", "branch_id")
    list_filter = ("type", "status", "is_active")
    
    # Make auto-generated IDs read-only in admin
    readonly_fields = ("id", "organization_id", "branch_id", "created_at", "updated_at")
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('type', 'parent', 'name', 'owner_name'),
            'description': '<strong>Hierarchy Rules:</strong> Organization → No parent | Branch → Select Organization | Agent → Select Branch | Employee → Select Organization OR Branch'
        }),
        ('Contact Information', {
            'fields': ('email', 'contact_no', 'address', 'city', 'country')
        }),
        ('Identification', {
            'fields': ('cnic', 'cnic_front', 'cnic_back', 'visiting_card')
        }),
        ('License & Tax', {
            'fields': ('dts_license', 'license_no', 'ntn_no'),
            'classes': ('collapse',)
        }),
        ('Auto-Generated IDs (Read-Only)', {
            'fields': ('id', 'organization_id', 'branch_id'),
            'classes': ('collapse',),
            'description': 'These IDs are automatically generated by the system and cannot be edited.'
        }),
        ('Status & Metadata', {
            'fields': ('status', 'is_active', 'created_by', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        """
        Override to filter parent options based on the entity type being created/edited.
        This filters the parent dropdown to show only valid parent types.
        """
        if db_field.name == "parent":
            # Try to get the object being edited from the URL
            obj_id = request.resolver_match.kwargs.get('object_id')
            
            if obj_id:
                # Editing existing object
                try:
                    obj = UniversalRegistration.objects.get(pk=obj_id)
                    entity_type = obj.type
                except UniversalRegistration.DoesNotExist:
                    entity_type = None
            else:
                # Creating new object - check if type is in GET or POST
                entity_type = request.GET.get('type') or request.POST.get('type')
            
            # Filter based on entity type
            if entity_type == UniversalRegistration.TYPE_ORGANIZATION:
                kwargs["queryset"] = UniversalRegistration.objects.none()
            elif entity_type == UniversalRegistration.TYPE_BRANCH:
                kwargs["queryset"] = UniversalRegistration.objects.filter(
                    type=UniversalRegistration.TYPE_ORGANIZATION,
                    is_active=True
                ).order_by('name')
            elif entity_type == UniversalRegistration.TYPE_AGENT:
                kwargs["queryset"] = UniversalRegistration.objects.filter(
                    type=UniversalRegistration.TYPE_BRANCH,
                    is_active=True
                ).order_by('name')
            elif entity_type == UniversalRegistration.TYPE_EMPLOYEE:
                kwargs["queryset"] = UniversalRegistration.objects.filter(
                    type__in=[
                        UniversalRegistration.TYPE_ORGANIZATION,
                        UniversalRegistration.TYPE_BRANCH
                    ],
                    is_active=True
                ).order_by('type', 'name')
            else:
                # Default: Only show Organizations and Branches as potential parents
                # Never show Agents or Employees as they cannot be parents
                kwargs["queryset"] = UniversalRegistration.objects.filter(
                    type__in=[
                        UniversalRegistration.TYPE_ORGANIZATION,
                        UniversalRegistration.TYPE_BRANCH
                    ],
                    is_active=True
                ).order_by('type', 'name')
        
        return super().formfield_for_foreignkey(db_field, request, **kwargs)
    
    def save_model(self, request, obj, form, change):
        # Generate ID if creating new object
        if not change:  # Creating new object
            from .utils import generate_prefixed_id
            
            # Generate primary ID
            if not obj.id:
                obj.id = generate_prefixed_id(obj.type)
            
            # Auto-generate organization_id for organizations
            if obj.type == UniversalRegistration.TYPE_ORGANIZATION:
                if not obj.organization_id:
                    obj.organization_id = generate_prefixed_id("organization")
            
            # Auto-generate branch_id for branches and inherit organization_id
            elif obj.type == UniversalRegistration.TYPE_BRANCH:
                if not obj.branch_id:
                    obj.branch_id = generate_prefixed_id("branch")
                if obj.parent and obj.parent.type == UniversalRegistration.TYPE_ORGANIZATION:
                    obj.organization_id = obj.parent.organization_id or obj.parent.id
            
            # For agents, inherit from parent branch
            elif obj.type == UniversalRegistration.TYPE_AGENT:
                if obj.parent and obj.parent.type == UniversalRegistration.TYPE_BRANCH:
                    obj.branch_id = obj.parent.branch_id or obj.parent.id
                    if obj.parent.parent and obj.parent.parent.type == UniversalRegistration.TYPE_ORGANIZATION:
                        obj.organization_id = obj.parent.parent.organization_id or obj.parent.parent.id
                    elif obj.parent.organization_id:
                        obj.organization_id = obj.parent.organization_id
            
            # For employees, inherit from parent
            elif obj.type == UniversalRegistration.TYPE_EMPLOYEE:
                if obj.parent:
                    if obj.parent.branch_id:
                        obj.branch_id = obj.parent.branch_id
                    if obj.parent.organization_id:
                        obj.organization_id = obj.parent.organization_id
            
            # Set created_by
            if request.user and not obj.created_by:
                obj.created_by = request.user.username
        
        super().save_model(request, obj, form, change)


@admin.register(RegistrationRule)
class RegistrationRuleAdmin(admin.ModelAdmin):
    list_display = ("id", "type", "requirement_text", "benefit_text", "city_needed", "service_allowed", "post_available", "created_at", "updated_at")
    search_fields = ("type", "requirement_text", "benefit_text", "city_needed", "service_allowed", "post_available")
    list_filter = ("type", "city_needed")
