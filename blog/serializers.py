from rest_framework import serializers
from . import models


class BlogSectionSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(read_only=True)
    
    class Meta:
        model = models.BlogSection
        fields = ("id", "order", "section_type", "content")


class BlogSerializer(serializers.ModelSerializer):
    # allow writing sections as a nested array on create/update, and reading them
    sections = BlogSectionSerializer(many=True, required=False)
    # expose meta so frontend can store tags/seo/etc without DB changes
    meta = serializers.JSONField(required=False)
    # support image upload for cover image
    cover_image = serializers.ImageField(required=False, allow_null=True, use_url=True)
    # include likes count on list/summary serializer (includes anonymous likes from meta)
    likes_count = serializers.SerializerMethodField(read_only=True)
    # include total comments count so list endpoints can show comment totals without a separate query
    comments_count = serializers.SerializerMethodField(read_only=True)
    # include author details (name and profile image)
    author_details = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = models.Blog
        # include comments_count so list endpoints can show totals without extra queries on the client
        fields = ("id", "title", "slug", "summary", "status", "published_at", "reading_time_minutes", "cover_image", "meta", "sections", "likes_count", "comments_count", "author_details")

    def validate(self, attrs):
        # normalize meta.tags and meta.hashtags if present
        meta = attrs.get("meta")
        if meta and isinstance(meta, dict):
            tags = meta.get("tags")
            if tags is not None:
                # accept comma-separated string or list
                if isinstance(tags, str):
                    tags_list = [t.strip() for t in tags.split(",") if t.strip()]
                elif isinstance(tags, list):
                    tags_list = [str(t).strip() for t in tags if str(t).strip()]
                else:
                    raise serializers.ValidationError({"meta": "tags must be a list or comma-separated string"})
                meta["tags"] = tags_list

            hashtags = meta.get("hashtags")
            if hashtags is not None:
                if isinstance(hashtags, str):
                    hs = [h.strip().lstrip("#") for h in hashtags.split(",") if h.strip()]
                elif isinstance(hashtags, list):
                    hs = [str(h).strip().lstrip("#") for h in hashtags if str(h).strip()]
                else:
                    raise serializers.ValidationError({"meta": "hashtags must be a list or comma-separated string"})
                meta["hashtags"] = hs

        # require content when publishing
        status = attrs.get("status")
        summary = attrs.get("summary")
        sections = attrs.get("sections")
        if status == "published":
            has_summary = bool(summary and str(summary).strip())
            has_sections = bool(sections)
            if not (has_summary or has_sections):
                raise serializers.ValidationError("Published posts must have a non-empty summary or at least one section")

        return attrs

    def get_likes_count(self, obj):
        base = obj.likes.count() if hasattr(obj, 'likes') else 0
        try:
            anon = int((obj.meta or {}).get('anonymous_likes', 0) or 0)
        except Exception:
            anon = 0
        return base + anon

    def get_comments_count(self, obj):
        try:
            return obj.comments.count() if hasattr(obj, 'comments') else 0
        except Exception:
            return 0

    def get_author_details(self, obj):
        if not obj.author:
            return None
        return {
            "id": obj.author.id,
            "name": obj.author.get_full_name() or obj.author.username,
            "username": obj.author.username,
            "profile_image": getattr(obj.author, 'profile_image', None)
        }

    def create(self, validated_data):
        sections_data = validated_data.pop("sections", None)
        blog = models.Blog.objects.create(**validated_data)
        if sections_data:
            sections_objs = [
                models.BlogSection(
                    blog=blog, 
                    order=s.get("order", 0), 
                    section_type=s.get("section_type"), 
                    content=s.get("content", {})
                ) for s in sections_data
            ]
            models.BlogSection.objects.bulk_create(sections_objs)
        return blog

    def update(self, instance, validated_data):
        sections_data = validated_data.pop("sections", None)
        # update simple fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if sections_data is not None:
            # replace existing sections with provided ones
            instance.sections.all().delete()
            sections_objs = [
                models.BlogSection(
                    blog=instance, 
                    order=s.get("order", 0), 
                    section_type=s.get("section_type"), 
                    content=s.get("content", {})
                ) for s in sections_data
            ]
            models.BlogSection.objects.bulk_create(sections_objs)

        return instance


class BlogDetailSerializer(BlogSerializer):
    sections = BlogSectionSerializer(many=True, read_only=True)
    comments_count = serializers.IntegerField(source="comments.count", read_only=True)
    # compute likes_count including anonymous likes stored in meta
    likes_count = serializers.SerializerMethodField()
    comments = serializers.SerializerMethodField()

    class Meta(BlogSerializer.Meta):
        fields = BlogSerializer.Meta.fields + ("sections", "comments_count", "likes_count", "comments")

    def get_comments(self, obj):
        qs = obj.comments.filter(is_public=True).select_related("author")
        return build_comment_tree(qs)

    def get_likes_count(self, obj):
        base = obj.likes.count() if hasattr(obj, 'likes') else 0
        anon = 0
        try:
            anon = int((obj.meta or {}).get('anonymous_likes', 0) or 0)
        except Exception:
            anon = 0
        return base + anon

    # override create/update to handle nested sections
    def create(self, validated_data):
        sections_data = validated_data.pop("sections", None)
        meta = validated_data.get("meta")
        blog = models.Blog.objects.create(**validated_data)
        if sections_data:
            sections_objs = [models.BlogSection(blog=blog, order=s.get("order", 0), section_type=s.get("section_type"), content=s.get("content", {})) for s in sections_data]
            models.BlogSection.objects.bulk_create(sections_objs)
        return blog

    def update(self, instance, validated_data):
        sections_data = validated_data.pop("sections", None)
        # update simple fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if sections_data is not None:
            # replace existing sections with provided ones
            instance.sections.all().delete()
            sections_objs = [models.BlogSection(blog=instance, order=s.get("order", 0), section_type=s.get("section_type"), content=s.get("content", {})) for s in sections_data]
            models.BlogSection.objects.bulk_create(sections_objs)

        return instance


class BlogCommentSerializer(serializers.ModelSerializer):
    # accept commenter email as write-only so we don't need a DB migration
    author_email = serializers.CharField(write_only=True, required=False)
    class Meta:
        model = models.BlogComment
        # include write-only author_email so anonymous commenters can provide an email
        # without requiring a DB migration to add a column
        fields = ("id", "blog", "parent", "author", "author_name", "body", "is_public", "created_at", "author_email")
        read_only_fields = ("author", "created_at")

    def validate(self, data):
        parent = data.get("parent")
        if parent:
            # enforce max depth 3
            depth = 0
            p = parent
            while p:
                depth += 1
                p = p.parent
                if depth >= 3:
                    raise serializers.ValidationError("Maximum comment nesting depth (3) exceeded")
        return data

    def create(self, validated_data):
        # extract optional author_email (write-only) and embed it into the body to avoid DB changes
        author_email = validated_data.pop('author_email', None)
        body = validated_data.get('body', '') or ''
        if author_email:
            # prepend the email for admin/reference; keep original body intact
            body = f"[email: {author_email}]\n" + body
            validated_data['body'] = body
        return super().create(validated_data)


def build_comment_tree(comments_qs):
    # build a nested comment tree up to depth 3
    nodes = {}
    roots = []
    for c in comments_qs.order_by("created_at"):
        nodes[c.id] = {"id": c.id, "blog": c.blog_id, "parent": c.parent_id, "author": c.author_id, "author_name": c.author_name, "body": c.body, "is_public": c.is_public, "created_at": c.created_at, "replies": []}
    for nid, node in nodes.items():
        parent = node["parent"]
        if parent and parent in nodes:
            # attach as child if depth < 3
            # compute depth by walking parents up to root (cheap for small trees)
            depth = 0
            p = parent
            while p and p in nodes and depth < 4:
                depth += 1
                p = nodes[p]["parent"]
            if depth <= 3:
                nodes[parent]["replies"].append(node)
            else:
                roots.append(node)
        else:
            roots.append(node)
    return roots


class BlogLikeSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.BlogLike
        fields = ("id", "blog", "user", "created_at")
        read_only_fields = ("created_at",)


class LeadFormSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.LeadForm
        fields = ("id", "name", "slug", "form_unique_id", "form_page_url", "description", "schema", "form_settings", "active")


class FormSubmissionSerializer(serializers.ModelSerializer):
    # Explicitly declare submitter_ip to avoid DRF schema generation issues with GenericIPAddressField
    submitter_ip = serializers.CharField(allow_null=True, required=False, allow_blank=True)
    
    class Meta:
        model = models.FormSubmission
        fields = ("id", "form", "payload", "submitter_ip", "user_agent", "status", "lead_ref", "forwarded_at", "forwarded_response", "created_at")
        read_only_fields = ("status", "lead_ref", "forwarded_at", "forwarded_response", "created_at")

    def validate(self, data):
        # Basic validation: if form has schema, and jsonschema is available, validate payload
        form = data.get("form")
        payload = data.get("payload")
        schema = getattr(form, "schema", None)
        if schema:
            try:
                import jsonschema

                jsonschema.validate(instance=payload, schema=schema)
            except ImportError:
                # jsonschema not installed — skip strict validation
                pass
            except jsonschema.ValidationError as exc:
                raise serializers.ValidationError({"payload": str(exc)})
        return data
