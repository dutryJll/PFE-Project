from django.contrib import admin
from django.urls import path, include
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView
from candidature_app import views_depot_dossier

urlpatterns = [
    path('admin/', admin.site.urls),
   path('api/candidatures/', include('candidature_app.urls')),
    # Dossier endpoints are declared in the app to avoid duplication.
    path('api/dossier/', include('candidature_app.dossier_urls')),
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
]