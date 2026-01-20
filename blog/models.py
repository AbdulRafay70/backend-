from django.db import models
from django.conf import settings
from django.utils import timezone
from django.utils.text import slugify
from django.db import transaction
import uuid


class Blog(models.Model):
    STATUS_CHOICES = [
        ("draft", "Draft"),
        ("published", "Published"),
        ("archived", "Archived"),
    ]
    
    LANGUAGE_CHOICES = [
        ("en", "English"),
        ("ur", "Urdu"),
        ("ar", "Arabic"),
    ]

    organization = models.ForeignKey(
        "organization.Organization",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="blogs",
    )
    title = models.CharField(max_length=255)
    slug = models.SlugField(max_length=255, db_index=True)
    summary = models.TextField(blank=True)
    language = models.CharField(max_length=5, choices=LANGUAGE_CHOICES, default="en")
    status = models.CharField(max_length=16, choices=STATUS_CHOICES, default="draft")
    is_featured = models.BooleanField(default=False)
    published_at = models.DateTimeField(null=True, blank=True)
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL
    )
    # switch from storing a URL string to an uploaded image file
    # media files are served under MEDIA_URL (configuration.settings MEDIA_URL/ROOT exist)
    cover_image = models.ImageField(upload_to='blog/covers/', max_length=512, null=True, blank=True)
    reading_time_minutes = models.PositiveIntegerField(null=True, blank=True)
    
    # Custom styling configuration
    custom_styles = models.JSONField(default=dict, blank=True)
    # Structure:
    # {
    #   "colors": {
    #     "primary": "#3498db",
    #     "secondary": "#2ecc71",
    #     "accent": "#e74c3c",
    #     "background": "#ffffff",
    #     "text": "#333333",
    #     "link": "#3498db"
    #   },
    #   "typography": {
    #     "headingFont": "Playfair Display",
    #     "bodyFont": "Open Sans",
    #     "fontSize": {"h1": "2.5rem", "h2": "2rem", "body": "1rem"},
    #     "lineHeight": "1.6",
    #     "fontWeight": {"heading": "700", "body": "400"}
    #   },
    #   "layout": {
    #     "containerWidth": "1200px",
    #     "sectionSpacing": "3rem",
    #     "contentAlignment": "left"
    #   },
    #   "customCSS": ""
    # }
    
    meta = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["organization", "slug"], name="uniq_org_slug")
        ]
        indexes = [models.Index(fields=["status", "published_at"])]

    def __str__(self):
        return f"{self.title}"

    def save(self, *args, **kwargs):
        if not self.slug:
            base = slugify(self.title)[:200]
            slug = base
            ix = 1
            while Blog.objects.filter(organization=self.organization, slug=slug).exclude(pk=self.pk).exists():
                ix += 1
                slug = f"{base}-{ix}"
            self.slug = slug
        if self.status == "published" and not self.published_at:
            self.published_at = timezone.now()
        super().save(*args, **kwargs)


class BlogSection(models.Model):
    SECTION_TYPES = [
        ("text", "Text"),
        ("markdown", "Markdown"),
        ("image", "Image"),
        ("gallery", "Gallery"),
        ("cta", "CTA"),
        ("embed", "Embed"),
        ("html", "HTML"),
    ]

    blog = models.ForeignKey(Blog, related_name="sections", on_delete=models.CASCADE)
    order = models.PositiveSmallIntegerField(default=0, db_index=True)
    section_type = models.CharField(max_length=32, choices=SECTION_TYPES)
    content = models.JSONField(default=dict)
    
    # Section-specific styling
    section_styles = models.JSONField(default=dict, blank=True)
    # Structure:
    # {
    #   "background": "#f8f9fa",
    #   "padding": "2rem",
    #   "margin": "1rem 0",
    #   "borderRadius": "8px",
    #   "shadow": "0 2px 4px rgba(0,0,0,0.1)",
    #   "textAlign": "left"
    # }
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["order", "id"]

    def __str__(self):
        return f"{self.blog.title} - section {self.order} ({self.section_type})"


class BlogComment(models.Model):
    blog = models.ForeignKey(Blog, related_name="comments", on_delete=models.CASCADE)
    parent = models.ForeignKey(
        "self", null=True, blank=True, related_name="replies", on_delete=models.CASCADE
    )
    author = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL)
    author_name = models.CharField(max_length=150, null=True, blank=True)
    body = models.TextField()
    is_public = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Comment on {self.blog.title} by {self.author or self.author_name}"

    def depth(self):
        d = 0
        p = self.parent
        while p:
            d += 1
            p = p.parent
            if d > 10:
                break
        return d


class BlogLike(models.Model):
    blog = models.ForeignKey(Blog, related_name="likes", on_delete=models.CASCADE)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [models.UniqueConstraint(fields=["blog", "user"], name="uniq_blog_user_like")]

    def __str__(self):
        return f"Like: {self.blog.title} by {self.user_id}"


class LeadForm(models.Model):
    organization = models.ForeignKey(
        "organization.Organization",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="forms",
    )
    name = models.CharField(max_length=150)
    slug = models.SlugField(max_length=150, db_index=True)
    form_unique_id = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    form_page_url = models.SlugField(max_length=200, null=True, blank=True, db_index=True)
    description = models.TextField(blank=True)
    schema = models.JSONField(default=dict)
    form_settings = models.JSONField(default=dict, blank=True)
    active = models.BooleanField(default=True)
    
    # Blog linking fields
    is_linked_with_blog = models.BooleanField(default=False)
    linked_blog_id = models.IntegerField(null=True, blank=True)
    display_position = models.CharField(
        max_length=50,
        default='end_of_blog',
        choices=[
            ('end_of_blog', 'End of Blog'),
            ('sidebar', 'Sidebar'),
            ('popup', 'Popup Modal'),
            ('standalone', 'Standalone Page'),
        ]
    )
    
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [models.UniqueConstraint(fields=["organization", "slug"], name="uniq_form_org_slug")]

    def __str__(self):
        return f"{self.name}"

    def save(self, *args, **kwargs):
        if not self.form_unique_id:
            self.form_unique_id = uuid.uuid4()
        if not self.form_page_url:
            # create a slugified page url based on name
            base = slugify(self.name)[:180]
            slug = base
            ix = 1
            while LeadForm.objects.filter(organization=self.organization, form_page_url=slug).exclude(pk=self.pk).exists():
                ix += 1
                slug = f"{base}-{ix}"
            self.form_page_url = slug
        super().save(*args, **kwargs)


class FormSubmission(models.Model):
    STATUS_CHOICES = [
        ("received", "Received"),
        ("forwarded", "Forwarded"),
        ("error", "Error"),
    ]

    form = models.ForeignKey(LeadForm, related_name="submissions", on_delete=models.CASCADE)
    payload = models.JSONField()
    submitter_ip = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.CharField(max_length=1024, null=True, blank=True)
    is_forwarded = models.BooleanField(default=False)
    lead_ref = models.CharField(max_length=255, null=True, blank=True)
    forwarded_at = models.DateTimeField(null=True, blank=True)
    forwarded_response = models.JSONField(null=True, blank=True)
    status = models.CharField(max_length=16, choices=STATUS_CHOICES, default="received")
    error_details = models.JSONField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Submission {self.pk} -> {self.form.name}"


class FormSubmissionTask(models.Model):
    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("processing", "Processing"),
        ("done", "Done"),
        ("failed", "Failed"),
    ]

    submission = models.ForeignKey(FormSubmission, related_name="forward_tasks", on_delete=models.CASCADE)
    attempts = models.PositiveSmallIntegerField(default=0)
    max_attempts = models.PositiveSmallIntegerField(default=5)
    next_try_at = models.DateTimeField(default=timezone.now, db_index=True)
    locked = models.BooleanField(default=False, db_index=True)
    status = models.CharField(max_length=16, choices=STATUS_CHOICES, default="pending")
    last_error = models.JSONField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [models.Index(fields=["status", "next_try_at"])]

    def __str__(self):
        return f"ForwardTask(submission={self.submission_id}, attempts={self.attempts}, status={self.status})"
