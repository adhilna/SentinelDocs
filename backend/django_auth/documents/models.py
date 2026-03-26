from django.db import models
from django.conf import settings
import uuid
import secrets
import hashlib
from django.db import models
from django.conf import settings

def user_directory_path(instance, filename):
    # File will be uploaded to MEDIA_ROOT/user_<id>/<uuid>_<filename>
    ext = filename.split('.')[-1]
    filename = f"{uuid.uuid4()}.{ext}"
    return f'user_{instance.user.id}/documents/{filename}'

class Document(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='documents'
    )
    file = models.FileField(upload_to=user_directory_path)
    filename = models.CharField(max_length=255)
    file_size = models.IntegerField()  # in bytes
    uploaded_at = models.DateTimeField(auto_now_add=True)

    # Placeholder for future AI audit results
    is_audited = models.BooleanField(default=False)
    audit_report = models.JSONField(null=True, blank=True)

    def __str__(self):
        return self.filename

class ApiKey(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='api_keys')
    name = models.CharField(max_length=100)
    key_prefix = models.CharField(max_length=16, editable=False) # sk-sentinel-xxxx
    key_hash = models.CharField(max_length=255, editable=False, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    last_used = models.DateTimeField(null=True, blank=True)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.name} ({self.key_prefix}...)"

    @staticmethod
    def generate_key():
        """Generates a raw key for the user and a hash for the DB."""
        raw_key = f"sk-sentinel-{secrets.token_urlsafe(32)}"
        prefix = raw_key[:16]
        h = hashlib.sha256(raw_key.encode()).hexdigest()
        return raw_key, prefix, h