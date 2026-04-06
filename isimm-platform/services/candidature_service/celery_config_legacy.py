from celery import Celery
import os

try:
    from celery.schedules import crontab
except ImportError:
    crontab = None

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'candidature_service.settings')

app = Celery('candidature_service')
app.config_from_object('django.conf:settings', namespace='CELERY')
app.autodiscover_tasks()

# Tâches périodiques
if crontab:
    app.conf.beat_schedule = {
        'verifier-dossiers-quotidien': {
            'task': 'candidature_app.tasks.verifier_dossiers_non_deposes',
            'schedule': crontab(hour=2, minute=0),  # Tous les jours à 2h
    },
    'purge-rgpd-mensuel': {
        'task': 'candidature_app.tasks.purger_donnees_candidats_non_admis',
        'schedule': crontab(hour=3, minute=10),  # Tous les jours à 03:10
    },
    'verifier-paiements-quotidien': {
        'task': 'candidature_app.tasks.verifier_paiements_listes_actives',
        'schedule': crontab(hour=4, minute=0),  # Tous les jours à 4h
    },
}