from django.db import models
from django.utils.text import slugify
from django.conf import settings
import uuid


class DynamicForm(models.Model):
    """
    Model for creating dynamic forms that can be linked to blogs or standalone pages.
    Submissions are automatically forwarded to the Leads API.
    """
    
    DISPLAY_POSITIONS = [
        ('end_of_blog', 'End of Blog'),
        ('sidebar', 'Sidebar'),
        ('popup', 'Popup'),
        ('standalone', 'Standalone Page'),
    ]
    
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('inactive', 'Inactive'),
        ('draft', 'Draft'),
    ]
    
    # Identification
    form_unique_id = models.CharField(
        max_length=100,
        unique=True,
        db_index=True,
        help_text="Unique identifier for the form (auto-generated if not provided)"
    )
    form_title = models.CharField(
        max_length=255,
        help_text="Title of the form"
    )
    
    # Blog Integration
    linked_blog = models.ForeignKey(
        'blog.Blog',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='forms',
        help_text="Optional: Link this form to a specific blog post"
    )
    is_linked_with_blog = models.BooleanField(
        default=False,
        help_text="If true, form appears below linked blog"
    )
    
    # Page Configuration
    form_page_url = models.CharField(
        max_length=255,
        unique=True,
        db_index=True,
        help_text="URL path for standalone form page (auto-generated from title if not provided)"
    )
    display_position = models.CharField(
        max_length=50,
        choices=DISPLAY_POSITIONS,
        default='end_of_blog',
        help_text="Where to display the form"
    )
    
    # Form Structure (JSON fields)
    fields = models.JSONField(
        default=list,
        help_text="""
        Array of field objects. Each field should have:
        {
            "label": "Field Name",
            "type": "text|textarea|dropdown|checkbox|radio|email|tel|number|date",
            "placeholder": "Enter value",
            "required": true|false,
            "width": "full|half|third",
            "options": ["option1", "option2"] (for dropdown/radio/checkbox)
        }
        """
    )
    
    buttons = models.JSONField(
        default=list,
        help_text="""
        Array of button objects:
        {
            "label": "Submit",
            "action": "submit|redirect|call",
            "url": "optional URL for redirect/call actions",
            "style": "primary|secondary|success|danger"
        }
        """
    )
    
    notes = models.JSONField(
        default=list,
        help_text="""
        Array of note objects:
        {
            "text": "Note text (HTML allowed)",
            "position": "above_field_name|below_field_name|above_submit_button|below_submit_button|top|bottom"
        }
        """
    )
    
    # Styling & Metadata
    form_header_image = models.CharField(
        max_length=512,
        null=True,
        blank=True,
        help_text="Optional header image URL"
    )
    
    custom_css = models.TextField(
        blank=True,
        null=True,
        help_text="Custom CSS for form styling"
    )
    
    meta = models.JSONField(
        default=dict,
        blank=True,
        help_text="Additional metadata (analytics tracking, custom configs, etc.)"
    )
    
    # Organization & Ownership
    organization = models.ForeignKey(
        'organization.Organization',
        on_delete=models.CASCADE,
        related_name='dynamic_forms',
        db_constraint=False,  # Avoid FK constraint issues during migrations
        help_text="Organization that owns this form"
    )
    
    branch = models.ForeignKey(
        'organization.Branch',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='dynamic_forms',
        db_constraint=False,  # Avoid FK constraint issues during migrations
        help_text="Optional: Branch associated with this form"
    )
    
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='created_forms',
        db_constraint=False,  # Avoid FK constraint issues
    )
    
    # Status & Tracking
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='active'
    )
    
    submission_count = models.IntegerField(
        default=0,
        help_text="Total number of submissions received"
    )
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'forms_dynamicform'
        verbose_name = 'Dynamic Form'
        verbose_name_plural = 'Dynamic Forms'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['form_unique_id']),
            models.Index(fields=['status', 'created_at']),
            models.Index(fields=['organization', 'status']),
        ]
    
    def __str__(self):
        return f"{self.form_title} ({self.form_unique_id})"
    
    def save(self, *args, **kwargs):
        # Auto-generate form_unique_id if not provided
        if not self.form_unique_id:
            base_id = slugify(self.form_title).upper().replace('-', '')[:20]
            unique_suffix = str(uuid.uuid4())[:8].upper()
            self.form_unique_id = f"{base_id}-{unique_suffix}"
        
        # Auto-generate form_page_url if not provided
        if not self.form_page_url:
            base_url = slugify(self.form_title)
            url_path = f"/forms/{base_url}"
            
            # Ensure uniqueness
            counter = 1
            test_url = url_path
            while DynamicForm.objects.filter(form_page_url=test_url).exclude(pk=self.pk).exists():
                test_url = f"{url_path}-{counter}"
                counter += 1
            
            self.form_page_url = test_url
        
        super().save(*args, **kwargs)
    
    def increment_submission_count(self):
        """Increment submission counter"""
        self.submission_count += 1
        self.save(update_fields=['submission_count', 'updated_at'])


class FormSubmission(models.Model):
    """
    Optional model to track form submissions separately
    (in addition to creating Lead records)
    """
    
    form = models.ForeignKey(
        DynamicForm,
        on_delete=models.CASCADE,
        related_name='submissions',
        db_constraint=False  # Avoid FK constraint issues
    )
    
    lead = models.ForeignKey(
        'leads.Lead',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='form_submissions',
        db_constraint=False,  # Avoid FK constraint issues
        help_text="Associated lead record created from this submission"
    )
    
    submission_data = models.JSONField(
        default=dict,
        help_text="Raw submission data from the form"
    )
    
    ip_address = models.GenericIPAddressField(
        null=True,
        blank=True,
        help_text="IP address of submitter"
    )
    
    user_agent = models.TextField(
        blank=True,
        null=True,
        help_text="Browser user agent string"
    )
    
    referrer = models.CharField(
        max_length=512,
        blank=True,
        null=True,
        help_text="HTTP referrer URL"
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'forms_submission'
        verbose_name = 'Form Submission'
        verbose_name_plural = 'Form Submissions'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['form', 'created_at']),
            models.Index(fields=['lead']),
        ]
    
    def __str__(self):
        return f"Submission for {self.form.form_title} at {self.created_at}"
