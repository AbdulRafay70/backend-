"""
Verify blog posts were created successfully.
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from blog.models import Blog, BlogSection

print("=" * 80)
print("VERIFYING BLOG POSTS")
print("=" * 80)

blogs = Blog.objects.all().order_by('-created_at')

print(f"\nTotal blogs in database: {blogs.count()}")
print("\n" + "=" * 80)

for i, blog in enumerate(blogs[:3], 1):
    print(f"\n📝 Blog {i}: {blog.title}")
    print(f"   ID: {blog.id}")
    print(f"   Slug: {blog.slug}")
    print(f"   Status: {blog.status}")
    print(f"   Featured: {blog.is_featured}")
    print(f"   Published: {blog.published_at}")
    print(f"   Reading Time: {blog.reading_time_minutes} minutes")
    print(f"   Author: {blog.author.username if blog.author else 'None'}")
    print(f"   Organization: {blog.organization.name if blog.organization else 'None'}")
    print(f"   Summary: {blog.summary[:100]}...")
    print(f"   Sections: {blog.sections.count()}")
    
    # Show section titles
    sections = blog.sections.all()
    if sections:
        print(f"   Section Headings:")
        for section in sections:
            heading = section.content.get('heading', 'No heading')
            print(f"      {section.order}. {heading}")

print("\n" + "=" * 80)
print("✅ VERIFICATION COMPLETE!")
print("=" * 80)
