from django.urls import path

from . import views

urlpatterns = [
    path('create/', views.create_candidature, name='create_candidature'),
    path('soumettre/', views.soumettre_candidature, name='soumettre_candidature'),
    path('mes-candidatures/', views.mes_candidatures, name='mes_candidatures'),
    path('offres-inscription/', views.offres_inscription, name='offres_inscription'),
    path('mes-dossiers/', views.mes_dossiers, name='mes_dossiers'),
    path('<int:candidature_id>/modifier/', views.modifier_candidature, name='modifier_candidature'),
    path('<int:candidature_id>/changer-statut/', views.changer_statut_candidature, name='changer_statut'),
    path('<int:candidature_id>/annuler/', views.annuler_candidature, name='annuler_candidature'),
    path('corbeille/', views.corbeille_candidatures, name='corbeille_candidatures'),
    path('configuration/<int:master_id>/', views.gerer_configuration_appel, name='gerer_configuration'),
    path('configuration/', views.gerer_configuration_appel, name='creer_configuration'),
    path('<int:candidature_id>/calculer-score/', views.calculer_score_candidature, name='calculer_score'),
    path('master/<int:master_id>/generer-listes/', views.generer_listes_admission, name='generer_listes'),
    path('listes/<int:liste_id>/publier/', views.publier_liste, name='publier_liste'),
    path('importer-paiements/', views.importer_paiements, name='importer_paiements'),
    path('listes/<int:liste_id>/export/pdf/', views.exporter_liste_pdf, name='exporter_liste_pdf'),
    path('listes/<int:liste_id>/export/excel/', views.exporter_liste_excel, name='exporter_liste_excel'),
    path('send-member-credentials/', views.send_member_credentials, name='send_member_credentials'),
]
