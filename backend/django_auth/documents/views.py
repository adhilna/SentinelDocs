from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from .models import Document, ApiKey
import requests
import os
from django.shortcuts import get_object_or_404
from django.utils import timezone
from datetime import timedelta
from django.db.models import Sum
from services.fastapi_client import FastApiService

@api_view(['POST'])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser])
def upload_document(request):
    if 'file' not in request.FILES:
        return Response({"error": "No file uploaded"}, status=400)

    uploaded_file = request.FILES['file']

    # 1. Immediate Database Entry
    doc = Document.objects.create(
        user=request.user,
        file=uploaded_file,
        filename=uploaded_file.name,
        file_size=uploaded_file.size,
        status='indexing'
    )

    # 2. 🎯 Centralized Service Call
    # We open the file stream directly from the saved doc
    ai_data = FastApiService.process_document_audit(
        file_obj=doc.file.open('rb'),
        filename=doc.filename,
        auth_token=request.headers.get('Authorization')
    )

    # 3. Update Status based on Service Result
    if ai_data:
        doc.status = 'completed'
        doc.is_audited = True
        doc.audit_report = ai_data
    else:
        doc.status = 'failed'
    
    doc.save()

    return Response({
        "status": "success",
        "document": {
            "id": doc.id,
            "status": doc.status,
            "filename": doc.filename,
            "url": request.build_absolute_uri(doc.file.url),
            "ai_processed": doc.is_audited
        }
    })

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_documents(request):
    # Only return documents belonging to the logged-in user (e.g., adhil_test)
    docs = Document.objects.filter(user=request.user).order_by('-uploaded_at')
    
    data = []
    for doc in docs:
        data.append({
            "id": str(doc.id),
            "name": doc.filename,
            "date": doc.uploaded_at.strftime("%b %d"),
            "status": "success", # Assuming they are already uploaded
            "url": request.build_absolute_uri(doc.file.url),
            "score": doc.audit_report.get('score') if doc.audit_report else None
        })
    
    return Response(data)

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_document(request, doc_id):
    # 1. Securely fetch the document
    doc = get_object_or_404(Document, id=doc_id, user=request.user)
    file_path = doc.file.path

    # 2. 🎯 Centralized Vector Cleanup
    # We call the service but don't let a failure here stop the Django deletion
    FastApiService.delete_vectors(
        doc_id=doc_id, 
        auth_token=request.headers.get('Authorization')
    )

    # 3. Local Cleanup (Database record & Physical PDF)
    try:
        doc.delete()
        if os.path.exists(file_path):
            os.remove(file_path)
            
        return Response({
            "status": "success",
            "message": "Document and associated vectors have been removed."
        }, status=200)
        
    except Exception as e:
        return Response({
            "error": f"Failed to complete local deletion: {str(e)}"
        }, status=500)

@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def update_document_score(request, doc_id):
    # Find the document for the specific user
    doc = get_object_or_404(Document, id=doc_id, user=request.user)
    new_score = request.data.get('score')

    if new_score is not None:
        # Initialize the JSON field if it's empty
        if not doc.audit_report:
            doc.audit_report = {}

        # Save the numerical score (e.g., 85) into the JSON
        doc.audit_report['score'] = new_score
        doc.is_audited = True
        doc.save()

        return Response({"status": "success", "score": new_score})

    return Response({"error": "No score provided"}, status=400)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_document_status(request, doc_id):
    doc = get_object_or_404(Document, id=doc_id, user=request.user)
    return Response({
        "id": doc.id,
        "status": doc.status,
        "is_audited": doc.is_audited,
        "score": doc.audit_report.get('score') if doc.audit_report else None
    })

@api_view(['GET'])
@permission_classes([AllowAny]) # Allows the dashboard to ping without a token check for speed
def health_check(request):
    return Response({"status": "healthy"}, status=200)

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def api_key_list_create(request):
    if request.method == 'GET':
        keys = ApiKey.objects.filter(user=request.user) # List both active/revoked
        return Response([{
            "id": k.id, # 👈 This is the ID React needs for the Delete URL
            "name": k.name,
            "key": f"{k.key_prefix}****************",
            "created": k.created_at.strftime("%Y-%m-%d"),
            "lastUsed": k.last_used.isoformat() if k.last_used else None,
            "status": "active" if k.is_active else "revoked"
        } for k in keys])

    if request.method == 'POST':
        name = request.data.get('name', 'Default Key')
        raw_key, prefix, key_hash = ApiKey.generate_key()

        # 1. Create the object and capture the instance
        new_key = ApiKey.objects.create(
            user=request.user,
            name=name,
            key_prefix=prefix,
            key_hash=key_hash
        )

        # 2. RETURN THE ID HERE!
        return Response({
            "id": new_key.id, # 👈 CRITICAL: React needs this to delete it later
            "name": name,
            "key": raw_key,
            "message": "Copy this key now. You won't see it again!"
        })

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def revoke_api_key(request, pk): 
    try:
        key = ApiKey.objects.get(id=pk, user=request.user)
        key.is_active = False
        key.save()
        return Response({"status": "revoked"})
    except ApiKey.DoesNotExist:
        return Response({"error": "Key not found"}, status=404)

@api_view(['POST'])
@permission_classes([AllowAny])
def verify_key_internal(request):
    key_hash = request.data.get('key_hash')
    key = ApiKey.objects.filter(key_hash=key_hash, is_active=True).first()

    if key:
        # Update last used timestamp
        key.last_used = timezone.now()
        key.total_usage += 1
        key.save()
        return Response({
            "valid": True,
            "user_id": key.user.id,
            "username": key.user.username
        })

    return Response({"valid": False}, status=401)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def workspace_summary(request):
    # 1. Total Documents for this user
    # doc_count = Document.objects.filter(user=request.user).count()
    total_docs = Document.objects.filter(user=request.user).count()
    user_docs = Document.objects.filter(user=request.user)
    
    # 2. Active API Keys
    active_keys = ApiKey.objects.filter(user=request.user, is_active=True).count()
    
    # 3. Calculate API Usage (optional: based on a Logs model if you have one)
    usage_stats = ApiKey.objects.filter(user=request.user).aggregate(Sum('total_usage'))
    total_usage = usage_stats['total_usage__sum'] or 0

    # 4. Audits Logic
    audits_done = Document.objects.filter(user=request.user, is_audited=True).count()
    percent = int((audits_done / total_docs) * 100) if total_docs > 0 else 0

    # 5. Dynamic "This Week" Count (using uploaded_at)
    one_week_ago = timezone.now() - timedelta(days=7)
    docs_this_week = user_docs.filter(uploaded_at__gte=one_week_ago).count()

    return Response({
        "total_documents": total_docs,
        "active_keys": active_keys,
        "api_usage": f"{total_usage:,}",
        "audits_completed": audits_done,
        "key_change_label": f"{percent}% completion rate",
        "docs_this_week_label": f"+{docs_this_week} this week",
    })