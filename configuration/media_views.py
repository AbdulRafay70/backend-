import os
from django.conf import settings
from django.http import HttpResponse, Http404
from django.views.static import serve as static_serve


def serve_media_with_fallback(request, path):
    """
    Serve files from MEDIA_ROOT during DEBUG. If the requested file does not exist,
    return a small SVG placeholder (inline) so clients see a friendly image instead of 404.

    This keeps external clients from logging large 404 traces and provides a visible
    fallback while development or when a file is missing.
    """
    media_root = settings.MEDIA_ROOT
    full_path = os.path.join(media_root, path)
    if os.path.exists(full_path) and os.path.isfile(full_path):
        # Delegate to Django's static file serving view (suitable for DEBUG/dev)
        return static_serve(request, path, document_root=media_root)

    # Return a simple SVG placeholder image (200 OK). This avoids extra file assets.
    svg = (
        '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300">'
        '<rect width="100%" height="100%" fill="#f3f4f6"/>'
        '<text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" '
        'font-family="Arial, Helvetica, sans-serif" font-size="20" fill="#9ca3af">Image not found</text>'
        '</svg>'
    )
    return HttpResponse(svg, content_type="image/svg+xml")
