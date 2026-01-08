"""
Create 3 comprehensive blog posts about Umrah and save them to the database.
"""
import os
import django
from datetime import datetime, timedelta

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configuration.settings')
django.setup()

from blog.models import Blog, BlogSection
from organization.models import Organization
from django.contrib.auth.models import User

print("=" * 80)
print("CREATING UMRAH BLOG POSTS")
print("=" * 80)

# Get organization
try:
    org = Organization.objects.first()
    print(f"\nUsing organization: {org.name if org else 'None'}")
except:
    org = None
    print("\nNo organization found, creating blogs without organization")

# Get or create author
try:
    author = User.objects.filter(is_staff=True).first()
    if not author:
        author = User.objects.first()
    print(f"Using author: {author.username if author else 'None'}")
except:
    author = None
    print("No author found")

# Blog 1: Complete Guide to Umrah
print("\n" + "=" * 80)
print("Creating Blog 1: Complete Guide to Performing Umrah")
print("=" * 80)

blog1 = Blog.objects.create(
    organization=org,
    title="Complete Guide to Performing Umrah: Everything You Need to Know",
    summary="A comprehensive guide covering all aspects of Umrah, from preparation to completion. Learn about the rituals, requirements, and spiritual significance of this sacred journey.",
    status="published",
    is_featured=True,
    published_at=datetime.now(),
    author=author,
    reading_time_minutes=12,
    meta={
        "tags": ["Umrah", "Guide", "Islamic Pilgrimage", "Makkah", "Madinah"],
        "category": "Guides",
        "seo_description": "Complete guide to performing Umrah with step-by-step instructions, requirements, and spiritual insights."
    }
)

# Add sections to Blog 1
BlogSection.objects.create(
    blog=blog1,
    order=1,
    section_type="text",
    content={
        "heading": "Introduction to Umrah",
        "text": "Umrah, often called the 'lesser pilgrimage,' is a sacred journey to Makkah that Muslims can perform at any time of the year. Unlike Hajj, which has specific dates, Umrah offers flexibility and is highly recommended in Islam. The Prophet Muhammad (peace be upon him) said, 'Umrah to Umrah is an expiation for what is between them.' This guide will walk you through everything you need to know to perform Umrah properly and spiritually."
    }
)

BlogSection.objects.create(
    blog=blog1,
    order=2,
    section_type="text",
    content={
        "heading": "Requirements and Preparation",
        "text": "Before embarking on your Umrah journey, ensure you have: 1) A valid passport with at least 6 months validity, 2) An Umrah visa obtained through an authorized agent, 3) Proof of vaccination (Meningitis and COVID-19), 4) Travel insurance, and 5) Sufficient funds for your trip. Spiritual preparation is equally important - learn the rituals, make sincere intentions, and seek forgiveness from those you may have wronged."
    }
)

BlogSection.objects.create(
    blog=blog1,
    order=3,
    section_type="text",
    content={
        "heading": "The Rituals of Umrah",
        "text": "Umrah consists of four main rituals: 1) Ihram - entering the state of consecration at the Miqat, 2) Tawaf - circling the Kaaba seven times counterclockwise, 3) Sa'i - walking between Safa and Marwah seven times, and 4) Halq or Taqsir - shaving or trimming the hair. Each ritual has specific rules and supplications that should be learned beforehand."
    }
)

BlogSection.objects.create(
    blog=blog1,
    order=4,
    section_type="text",
    content={
        "heading": "Visiting Madinah",
        "text": "While not part of Umrah itself, visiting Madinah is highly recommended. The Prophet's Mosque (Masjid an-Nabawi) is the second holiest site in Islam. Pray in the Rawdah (the garden between the Prophet's house and pulpit), visit the Prophet's grave to send salutations, and explore historical sites like Quba Mosque and Mount Uhud. Remember, visiting Madinah is a blessing but not obligatory for Umrah."
    }
)

BlogSection.objects.create(
    blog=blog1,
    order=5,
    section_type="text",
    content={
        "heading": "Tips for a Successful Umrah",
        "text": "To make your Umrah more meaningful: Go with the right intention, be patient with crowds, maintain your prayers, make abundant dua, read Quran regularly, give charity, and maintain good character. Remember, Umrah is not just about completing rituals but about spiritual transformation. May Allah accept your Umrah and grant you the opportunity to visit His House."
    }
)

print(f"✅ Created: {blog1.title}")
print(f"   Slug: {blog1.slug}")
print(f"   Sections: {blog1.sections.count()}")

# Blog 2: Best Time to Perform Umrah
print("\n" + "=" * 80)
print("Creating Blog 2: Best Time to Perform Umrah")
print("=" * 80)

blog2 = Blog.objects.create(
    organization=org,
    title="Best Time to Perform Umrah: A Seasonal Guide for Pilgrims",
    summary="Discover the best times to perform Umrah throughout the year, considering weather, crowds, and spiritual significance. Make an informed decision for your sacred journey.",
    status="published",
    is_featured=True,
    published_at=datetime.now() - timedelta(days=7),
    author=author,
    reading_time_minutes=8,
    meta={
        "tags": ["Umrah", "Travel Planning", "Ramadan", "Seasons"],
        "category": "Planning",
        "seo_description": "Learn about the best times to perform Umrah based on weather, crowds, and spiritual benefits."
    }
)

# Add sections to Blog 2
BlogSection.objects.create(
    blog=blog2,
    order=1,
    section_type="text",
    content={
        "heading": "Umrah in Ramadan: The Most Rewarding Time",
        "text": "Performing Umrah during Ramadan is considered highly meritorious. The Prophet (peace be upon him) said, 'Umrah in Ramadan is equivalent to Hajj.' The spiritual atmosphere is unparalleled, with millions of Muslims fasting and praying together. However, expect very large crowds, especially during the last ten nights. Book well in advance and be prepared for higher costs. The reward, however, is immeasurable."
    }
)

BlogSection.objects.create(
    blog=blog2,
    order=2,
    section_type="text",
    content={
        "heading": "Winter Months (November to February): Comfortable Weather",
        "text": "Winter is ideal for those who struggle with heat. Temperatures range from 20-30°C (68-86°F), making it comfortable to perform rituals. This period sees moderate crowds, except during school holidays. Prices are generally reasonable, and you can perform Tawaf and Sa'i without excessive heat exhaustion. Perfect for elderly pilgrims and families with children."
    }
)

BlogSection.objects.create(
    blog=blog2,
    order=3,
    section_type="text",
    content={
        "heading": "Summer Months (June to August): Fewer Crowds, Intense Heat",
        "text": "Summer offers the advantage of fewer crowds and lower package prices. However, temperatures can exceed 45°C (113°F), making outdoor rituals challenging. If you choose this time, stay hydrated, use umbrellas, perform rituals during cooler hours (early morning or late evening), and take frequent breaks. Not recommended for those with health conditions or young children."
    }
)

BlogSection.objects.create(
    blog=blog2,
    order=4,
    section_type="text",
    content={
        "heading": "School Holiday Periods: Family-Friendly but Crowded",
        "text": "School holidays (December-January, March-April, June-August) are popular for families. While convenient for those with children, expect larger crowds and higher prices. Book 3-4 months in advance to secure good accommodation near Haram. The advantage is the family-friendly atmosphere and the opportunity to introduce children to this sacred journey."
    }
)

BlogSection.objects.create(
    blog=blog2,
    order=5,
    section_type="text",
    content={
        "heading": "Off-Peak Times: The Hidden Gem",
        "text": "Consider visiting during off-peak months like September, October, or May. You'll enjoy moderate weather, smaller crowds, better hotel rates, and more peaceful worship. These months offer the best balance between comfort, cost, and spiritual experience. You can perform Tawaf with ease and spend quality time in prayer without rushing."
    }
)

print(f"✅ Created: {blog2.title}")
print(f"   Slug: {blog2.slug}")
print(f"   Sections: {blog2.sections.count()}")

# Blog 3: Umrah Package Selection Guide
print("\n" + "=" * 80)
print("Creating Blog 3: How to Choose the Right Umrah Package")
print("=" * 80)

blog3 = Blog.objects.create(
    organization=org,
    title="How to Choose the Right Umrah Package: A Complete Buyer's Guide",
    summary="Navigate the world of Umrah packages with confidence. Learn what to look for, what to avoid, and how to get the best value for your sacred journey.",
    status="published",
    is_featured=False,
    published_at=datetime.now() - timedelta(days=14),
    author=author,
    reading_time_minutes=10,
    meta={
        "tags": ["Umrah Packages", "Travel Tips", "Budget", "Hotels"],
        "category": "Travel Planning",
        "seo_description": "Expert guide to choosing the perfect Umrah package that fits your budget and needs."
    }
)

# Add sections to Blog 3
BlogSection.objects.create(
    blog=blog3,
    order=1,
    section_type="text",
    content={
        "heading": "Understanding Package Categories",
        "text": "Umrah packages typically fall into four categories: Economy (budget-friendly, hotels 500-1000m from Haram), Standard (comfortable, hotels 300-500m from Haram), Premium (luxury, hotels 100-300m from Haram), and VIP (5-star, hotels within 100m of Haram). Your choice depends on your budget, mobility, and comfort preferences. Remember, proximity to Haram significantly affects price but saves time and energy."
    }
)

BlogSection.objects.create(
    blog=blog3,
    order=2,
    section_type="text",
    content={
        "heading": "What Should Be Included in Your Package",
        "text": "A comprehensive Umrah package should include: 1) Umrah visa processing, 2) Round-trip airfare, 3) Hotel accommodation in Makkah and Madinah, 4) Airport transfers, 5) Ziyarat (city tours), 6) Basic meals, and 7) Ground transportation between cities. Verify what's included and what's extra. Hidden costs can significantly increase your total expense. Always read the fine print and ask questions."
    }
)

BlogSection.objects.create(
    blog=blog3,
    order=3,
    section_type="text",
    content={
        "heading": "Hotel Location: The Most Important Factor",
        "text": "Hotel proximity to Haram is crucial. Walking 100 meters vs. 1000 meters makes a huge difference, especially if you want to pray all five prayers in Haram or perform multiple Umrahs. For elderly or those with mobility issues, invest in closer accommodation. Check actual walking distance (not 'as the crow flies'), availability of shuttle services, and hotel reviews from recent pilgrims."
    }
)

BlogSection.objects.create(
    blog=blog3,
    order=4,
    section_type="text",
    content={
        "heading": "Group vs. Individual Packages",
        "text": "Group packages offer lower costs, organized tours, and companionship but have fixed schedules and less flexibility. Individual packages cost more but provide freedom to worship at your own pace, choose your companions, and customize your itinerary. First-time pilgrims often benefit from group packages for guidance, while experienced pilgrims prefer individual packages for flexibility."
    }
)

BlogSection.objects.create(
    blog=blog3,
    order=5,
    section_type="text",
    content={
        "heading": "Red Flags to Watch Out For",
        "text": "Beware of: 1) Prices significantly below market rate (too good to be true), 2) Agents without proper licensing, 3) Vague package details, 4) No clear cancellation policy, 5) Hotels not verified on booking platforms, 6) Pressure to book immediately, and 7) No customer reviews or testimonials. Always book through registered travel agencies, verify hotel locations on Google Maps, and read recent reviews from other pilgrims."
    }
)

BlogSection.objects.create(
    blog=blog3,
    order=6,
    section_type="text",
    content={
        "heading": "Getting the Best Value",
        "text": "To maximize value: Book 2-3 months in advance for better rates, travel during off-peak seasons, compare multiple packages, negotiate for group bookings, check if meals are included, verify visa processing time, ask about free services (Ziyarat, airport transfers), and read cancellation policies carefully. Remember, the cheapest package isn't always the best value - balance cost with comfort and convenience."
    }
)

print(f"✅ Created: {blog3.title}")
print(f"   Slug: {blog3.slug}")
print(f"   Sections: {blog3.sections.count()}")

print("\n" + "=" * 80)
print("✅ ALL 3 BLOG POSTS CREATED SUCCESSFULLY!")
print("=" * 80)

# Summary
print("\n📊 SUMMARY:")
print(f"Total blogs created: 3")
print(f"Total sections created: {BlogSection.objects.count()}")
print(f"\nBlog Details:")
print(f"1. {blog1.title}")
print(f"   - Status: {blog1.status}")
print(f"   - Featured: {blog1.is_featured}")
print(f"   - Reading time: {blog1.reading_time_minutes} minutes")
print(f"   - Sections: {blog1.sections.count()}")
print(f"\n2. {blog2.title}")
print(f"   - Status: {blog2.status}")
print(f"   - Featured: {blog2.is_featured}")
print(f"   - Reading time: {blog2.reading_time_minutes} minutes")
print(f"   - Sections: {blog2.sections.count()}")
print(f"\n3. {blog3.title}")
print(f"   - Status: {blog3.status}")
print(f"   - Featured: {blog3.is_featured}")
print(f"   - Reading time: {blog3.reading_time_minutes} minutes")
print(f"   - Sections: {blog3.sections.count()}")

print("\n" + "=" * 80)
print("🎉 DONE!")
print("=" * 80)
