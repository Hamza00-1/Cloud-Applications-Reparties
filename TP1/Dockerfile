# TP1 — Dockerfile multi-étapes
# Description : Construction d'une image Docker optimisée pour l'application Flask
# Séance 1 : Introduction à Docker

# ============================================================
# ÉTAPE 1 : Image de base Python (slim pour réduire la taille)
# ============================================================
FROM python:3.11-slim AS base

# Métadonnées de l'image
LABEL maintainer="Hamza - ENSA Cybersécurité"
LABEL description="TP1 Docker - Application Flask conteneurisée"
LABEL version="1.0"

# ============================================================
# ÉTAPE 2 : Installation des dépendances
# ============================================================
# Définir le répertoire de travail dans le conteneur
WORKDIR /app

# Copier le fichier des dépendances en premier (optimisation du cache Docker)
COPY requirements.txt .

# Installer les dépendances Python
RUN pip install --no-cache-dir -r requirements.txt

# ============================================================
# ÉTAPE 3 : Copier le code source
# ============================================================
COPY app.py .

# ============================================================
# ÉTAPE 4 : Configuration
# ============================================================
# Variables d'environnement par défaut (TP 1.10)
ENV APP_NAME="MonApp-Docker"
ENV APP_VERSION="1.0"
ENV APP_ENV="production"
ENV PORT=5000

# Exposer le port de l'application
EXPOSE ${PORT}

# Créer un répertoire pour les volumes persistants (TP 1.11)
RUN mkdir -p /app/data

# Volume pour la persistance des données
VOLUME ["/app/data"]

# ============================================================
# ÉTAPE 5 : Healthcheck (TP 1.5)
# ============================================================
HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:${PORT}/sante')" || exit 1

# ============================================================
# ÉTAPE 6 : Sécurité — Exécuter en tant qu'utilisateur non-root
# ============================================================
RUN useradd --create-home appuser && chown -R appuser:appuser /app
USER appuser

# ============================================================
# ÉTAPE 7 : Commande de démarrage
# ============================================================
CMD ["python", "app.py"]
