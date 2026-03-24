from django.urls import path
from . import views

urlpatterns = [
    path('upload/', views.upload_document, name='upload-document'),
    path('<int:doc_id>/', views.delete_document, name='delete_document'),
    path('', views.get_documents, name='document-list'),
]