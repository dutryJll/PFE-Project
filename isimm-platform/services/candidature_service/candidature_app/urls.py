from django.urls import path
from . import views

urlpatterns = [
    path('create/', views.create_candidature, name='create_candidature'),
    path('mes-candidatures/', views.mes_candidatures, name='mes_candidatures'),
]