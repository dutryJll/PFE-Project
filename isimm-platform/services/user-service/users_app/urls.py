from django.urls import path
from .views import (
    UserListView, UserProfileView, UserProfileUpdateView, UserDeleteView,
    AdminCreateResponsableView, AdminDeleteResponsableView, AdminListResponsablesView
)

urlpatterns = [
    path('users/', UserListView.as_view(), name='user-list'),
    path('profile/', UserProfileView.as_view(), name='user-profile'),
    path('profile/update/', UserProfileUpdateView.as_view(), name='user-profile-update'),
    path('users/<int:pk>/', UserDeleteView.as_view(), name='user-delete'),
    # Admin: Responsable management
    path('admin/responsables/', AdminListResponsablesView.as_view(), name='admin-list-responsables'),
    path('admin/responsables/create/', AdminCreateResponsableView.as_view(), name='admin-create-responsable'),
    path('admin/responsables/<int:pk>/delete/', AdminDeleteResponsableView.as_view(), name='admin-delete-responsable'),
]