from django.db import models
from django.conf import settings
import uuid
import os

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