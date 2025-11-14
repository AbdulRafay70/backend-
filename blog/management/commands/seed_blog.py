from django.core.management.base import BaseCommand
from django.utils import timezone
from blog.models import Blog


class Command(BaseCommand):
    help = "Seed the database with a sample published blog if none exist"

    def handle(self, *args, **options):
        if Blog.objects.filter(status='published', published_at__lte=timezone.now()).exists():
            self.stdout.write(self.style.NOTICE('Published blog(s) already exist — skipping seed.'))
            return

        title = 'Sample Blog — Getting Started'
        slug = 'sample-blog-getting-started'
        summary = 'This is a sample blog post created by seed_blog management command for local development and testing.'

        blog = Blog.objects.create(
            title=title,
            slug=slug,
            summary=summary,
            status='published',
            published_at=timezone.now(),
        )

        self.stdout.write(self.style.SUCCESS(f'Created sample blog id={blog.pk} slug={blog.slug}'))
