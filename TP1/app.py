# TP1 — Application Flask conteneurisée
# Fichier : app.py
# Description : Application web simple pour démontrer la conteneurisation Docker

from flask import Flask, jsonify, request
import os
import socket
import datetime

app = Flask(__name__)

# TP 1.6 — Variables d'environnement pour la configuration
APP_NAME = os.getenv("APP_NAME", "MonApp-Docker")
APP_VERSION = os.getenv("APP_VERSION", "1.0")
APP_ENV = os.getenv("APP_ENV", "development")

@app.route("/")
def index():
    """Page d'accueil — affiche les infos du conteneur"""
    return jsonify({
        "application": APP_NAME,
        "version": APP_VERSION,
        "environnement": APP_ENV,
        "hostname": socket.gethostname(),
        "ip": socket.gethostbyname(socket.gethostname()),
        "date": datetime.datetime.now().isoformat(),
        "message": "🐳 Bienvenue sur l'application conteneurisée Docker !"
    })

@app.route("/sante")
def health():
    """TP 1.5 — Endpoint de vérification de santé (healthcheck)"""
    return jsonify({
        "statut": "OK",
        "service": APP_NAME,
        "uptime": "actif"
    }), 200

@app.route("/info")
def info():
    """Informations système du conteneur"""
    return jsonify({
        "hostname": socket.gethostname(),
        "plateforme": os.uname().sysname if hasattr(os, 'uname') else os.name,
        "python_version": os.sys.version,
        "repertoire_travail": os.getcwd(),
        "variables_env": {
            "APP_NAME": APP_NAME,
            "APP_VERSION": APP_VERSION,
            "APP_ENV": APP_ENV
        }
    })

@app.route("/documents", methods=["GET"])
def lister_documents():
    """TP 1.7 — Lecture depuis un volume monté"""
    dossier_data = "/app/data"
    if os.path.exists(dossier_data):
        fichiers = os.listdir(dossier_data)
        return jsonify({
            "dossier": dossier_data,
            "fichiers": fichiers,
            "total": len(fichiers)
        })
    return jsonify({"erreur": "Dossier de données non monté"}), 404

@app.route("/documents", methods=["POST"])
def creer_document():
    """TP 1.7 — Écriture dans un volume persistant"""
    data = request.get_json()
    if not data or "nom" not in data or "contenu" not in data:
        return jsonify({"erreur": "Champs 'nom' et 'contenu' requis"}), 400

    dossier_data = "/app/data"
    os.makedirs(dossier_data, exist_ok=True)
    chemin = os.path.join(dossier_data, data["nom"])

    with open(chemin, "w", encoding="utf-8") as f:
        f.write(data["contenu"])

    return jsonify({
        "message": f"Document '{data['nom']}' créé avec succès",
        "chemin": chemin
    }), 201

if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    print(f"🚀 Démarrage de {APP_NAME} v{APP_VERSION} sur le port {port}")
    app.run(host="0.0.0.0", port=port, debug=(APP_ENV == "development"))
