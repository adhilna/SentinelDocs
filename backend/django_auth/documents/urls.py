from django.urls import path
from . import views

urlpatterns = [
    path('upload/', views.upload_document, name='upload-document'),
    path('<int:doc_id>/', views.delete_document, name='delete_document'),
    path('<int:doc_id>/score/', views.update_document_score),
    path('health/', views.health_check, name='health_check'),
    path('keys/', views.api_key_list_create, name='api_keys'),
    path('keys/<int:pk>/revoke/', views.revoke_api_key, name='revoke_key'),
    path('keys/verify_key_internal/', views.verify_key_internal, name='api_keys'),
    path('', views.get_documents, name='document-list'),
]