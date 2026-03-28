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

@api_view(['POST'])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser])
def upload_document(request):
    if 'file' not in request.FILES:
        return Response({"error": "No file uploaded"}, status=400)

    uploaded_file = request.FILES['file']

    # Create the document record
    doc = Document.objects.create(
        user=request.user,
        file=uploaded_file,
        filename=uploaded_file.name,
        file_size=uploaded_file.size,
        status='indexing'
    )

    # Forward to FastAPI for AI Processing
    fastapi_url = "http://localhost:8001/upload"
    auth_header = request.headers.get('Authorization')

    try:
        # We open the file from the disk (media folder) to stream it
        with doc.file.open('rb') as f:
            files = {'file': (doc.filename, f, 'application/pdf')}
            headers = {'Authorization': auth_header}

            # Send to FastAPI
            fastapi_res = requests.post(fastapi_url, files=files, headers=headers, timeout=60)

        if fastapi_res.status_code == 200:
            ai_data = fastapi_res.json()
            # 3. Update Django with AI metadata (chunks, preview, etc.)
            doc.status = 'completed'
            doc.is_audited = True
            doc.audit_report = ai_data
            doc.save()
        else:
            # We still saved the file, but we flag that AI failed
            doc.status = 'failed'
            doc.is_audited = False
            doc.save()

    except Exception as e:
        print(f"FastAPI Connection Error: {e}")
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
    try:
        # 1. Find the doc in Django
        doc = Document.objects.get(id=doc_id, user=request.user)
        file_path = doc.file.path

        # 2. 🔥 Tell FastAPI to delete the Vectors
        fastapi_del_url = f"http://localhost:8001/api/vector-delete/{doc_id}"
        auth_header = request.headers.get('Authorization')

        try:
            # We use a small timeout because deleting vectors is fast
            requests.delete(fastapi_del_url, headers={'Authorization': auth_header}, timeout=5)
        except Exception as e:
            # We log this but don't stop the Django delete 
            # (We don't want a FastAPI crash to break the whole app)
            print(f"Warning: Vector cleanup failed for {doc_id}: {e}")

        # 3. Delete from Django and remove physical file
        doc.delete()
        if os.path.exists(file_path):
            os.remove(file_path)

        return Response({"status": "success", "message": "Document and Vectors wiped."}, status=200)

    except Document.DoesNotExist:
        return Response({"error": "File not found"}, status=404)

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