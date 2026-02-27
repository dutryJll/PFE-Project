from django.urls import path
from .views import (
    CreateCandidatureView, 
    CandidatureListView, 
    CandidatureDetailView,
    MesCandidaturesView
)

urlpatterns = [
    path('create/', CreateCandidatureView.as_view(), name='create-candidature'),
    path('list/', CandidatureListView.as_view(), name='list-candidatures'),
    path('mes-candidatures/', MesCandidaturesView.as_view(), name='mes-candidatures'),
    path('<int:pk>/', CandidatureDetailView.as_view(), name='detail-candidature'),
]