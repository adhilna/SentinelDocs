from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import Document
import requests
from django.conf import settings
import os

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
        file_size=uploaded_file.size
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
            doc.is_audited = True
            doc.audit_report = ai_data
            doc.save()
        else:
            # We still saved the file, but we flag that AI failed
            doc.is_audited = False
            doc.save()

    except Exception as e:
        print(f"FastAPI Connection Error: {e}")
        # Log error but don't crash the Django response

    return Response({
        "status": "success",
        "document": {
            "id": doc.id,
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