from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import Document

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

    return Response({
        "status": "success",
        "document": {
            "id": doc.id,
            "filename": doc.filename,
            "url": request.build_absolute_uri(doc.file.url)
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