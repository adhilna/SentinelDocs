import requests
import logging
from django.conf import settings

logger = logging.getLogger(__name__)

class FastApiService:
    """
    Centralized service to handle all communication with the FastAPI AI server.
    """
    BASE_URL = settings.FASTAPI_URL

    @classmethod
    def _get_headers(cls, request):
        return {'Authorization': request.headers.get('Authorization')}

    @classmethod
    def process_document_audit(cls, file_obj, filename, auth_token):
        """
        Streams a file to FastAPI and returns the AI metadata.
        """
        url = f"{cls.BASE_URL}/upload"
        headers = {"Authorization": auth_token}
        files = {"file": (filename, file_obj, "application/pdf")}

        try:
            # Increased timeout for large PDF processing
            response = requests.post(url, files=files, headers=headers, timeout=90)
            
            if response.status_code == 200:
                return response.json()
            
            logger.error(f"FastAPI Error {response.status_code}: {response.text}")
            return None

        except requests.exceptions.RequestException as e:
            logger.error(f"Failed to connect to FastAPI: {e}")
            return None

    @classmethod
    def delete_vectors(cls, doc_id, auth_token):
        """
        Tells FastAPI to wipe the vector collection for a specific document.
        """
        url = f"{cls.BASE_URL}/api/vector-delete/{doc_id}"
        headers = {"Authorization": auth_token}
        
        try:
            # Short timeout since deleting an index is usually instant
            response = requests.delete(url, headers=headers, timeout=10)
            return response.status_code == 200
        except requests.exceptions.RequestException as e:
            logger.error(f"Vector deletion failed for {doc_id}: {e}")
            return False