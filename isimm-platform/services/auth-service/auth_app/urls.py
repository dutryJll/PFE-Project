from django.urls import path
from . import views

urlpatterns = [
    path('register/', views.register, name='register'),
    path('login/', views.login, name='login'),
    path('verify-email/<uuid:token>/', views.verify_email, name='verify_email'),
    path('profile/', views.get_profile, name='get_profile'),
    path('profile/update/', views.update_profile, name='update_profile'),
    
    # Admin
    path('users/', views.list_users, name='list_users'),
    path('users/create/', views.create_user, name='create_user'),
    path('users/<int:user_id>/delete/', views.delete_user, name='delete_user'),

     path('create-commission-member/', views.create_commission_member),
    path('set-password/<uuid:token>/', views.set_password_with_token),
    path('commission-members/', views.list_commission_members),
]