from django.urls import path
from .views import UserListView, UserProfileView, UserProfileUpdateView, UserDeleteView

urlpatterns = [
    path('users/', UserListView.as_view(), name='user-list'),
    path('profile/', UserProfileView.as_view(), name='user-profile'),
    path('profile/update/', UserProfileUpdateView.as_view(), name='user-profile-update'),
    path('users/<int:pk>/', UserDeleteView.as_view(), name='user-delete'),
]