# TP5.3 — Cartographie des Surfaces d'Attaque
# Module : Applications Réparties et Cybersécurité
# Description : Analyse de sécurité d'une architecture microservices
#               Identification des vecteurs d'attaque et contre-mesures

import json
from datetime import datetime

# =====================================================
# DÉFINITION DE L'ARCHITECTURE CIBLE
# =====================================================
architecture = {
    "nom": "Système de Gestion Documentaire Distribué",
    "composants": [
        {
            "nom": "API Gateway",
            "type": "point_entree",
            "port": 443,
            "protocole": "HTTPS",
            "description": "Point d'entrée unique pour tous les clients"
        },
        {
            "nom": "Service Authentification",
            "type": "microservice",
            "port": 8001,
            "protocole": "HTTP interne",
            "description": "Gestion des tokens JWT et des sessions"
        },
        {
            "nom": "Service Documents",
            "type": "microservice",
            "port": 8002,
            "protocole": "HTTP interne",
            "description": "CRUD sur les documents"
        },
        {
            "nom": "Service Recherche",
            "type": "microservice",
            "port": 8003,
            "protocole": "HTTP interne",
            "description": "Indexation et recherche full-text"
        },
        {
            "nom": "Base de Données",
            "type": "stockage",
            "port": 5432,
            "protocole": "TCP PostgreSQL",
            "description": "Stockage persistant des métadonnées"
        },
        {
            "nom": "File de Messages (RabbitMQ)",
            "type": "middleware",
            "port": 5672,
            "protocole": "AMQP",
            "description": "Communication asynchrone entre services"
        }
    ]
}

# =====================================================
# MATRICE DES MENACES (STRIDE)
# =====================================================
menaces_stride = {
    "Spoofing (Usurpation)": {
        "description": "Un attaquant se fait passer pour un utilisateur ou un service légitime",
        "composants_cibles": ["API Gateway", "Service Authentification"],
        "scenarios": [
            "Vol de token JWT et réutilisation",
            "Usurpation d'identité d'un microservice interne",
            "Attaque par rejeu (replay attack)"
        ],
        "contre_mesures": [
            "Authentification mutuelle (mTLS) entre services",
            "Tokens JWT avec expiration courte (15 min)",
            "Rotation régulière des clés de signature",
            "Vérification de l'origine des requêtes (nonce)"
        ],
        "severite": "CRITIQUE"
    },
    "Tampering (Altération)": {
        "description": "Modification non autorisée des données en transit ou au repos",
        "composants_cibles": ["Service Documents", "Base de Données", "File de Messages"],
        "scenarios": [
            "Modification d'un document en transit (MITM)",
            "Injection SQL dans la base de données",
            "Altération des messages dans la file RabbitMQ"
        ],
        "contre_mesures": [
            "Chiffrement TLS pour toutes les communications",
            "Utilisation d'un ORM avec requêtes paramétrées",
            "Signature HMAC des messages dans la file",
            "Checksums pour vérifier l'intégrité des documents"
        ],
        "severite": "HAUTE"
    },
    "Repudiation (Répudiation)": {
        "description": "Un acteur nie avoir effectué une action",
        "composants_cibles": ["API Gateway", "Service Documents"],
        "scenarios": [
            "Utilisateur nie avoir supprimé un document",
            "Service nie avoir traité une requête"
        ],
        "contre_mesures": [
            "Journalisation exhaustive (audit trail)",
            "Horodatage cryptographique des actions",
            "Logs immuables stockés séparément"
        ],
        "severite": "MOYENNE"
    },
    "Information Disclosure (Fuite)": {
        "description": "Exposition de données sensibles",
        "composants_cibles": ["API Gateway", "Base de Données", "Service Documents"],
        "scenarios": [
            "Messages d'erreur trop détaillés (stack trace)",
            "Accès non autorisé à la base de données",
            "Logs contenant des données personnelles"
        ],
        "contre_mesures": [
            "Messages d'erreur génériques côté client",
            "Chiffrement des données au repos (AES-256)",
            "Politique de rétention des logs (RGPD)",
            "Network policies Kubernetes (isolation réseau)"
        ],
        "severite": "HAUTE"
    },
    "Denial of Service (Déni de service)": {
        "description": "Rendre le système indisponible",
        "composants_cibles": ["API Gateway", "Service Recherche", "File de Messages"],
        "scenarios": [
            "Flood HTTP sur l'API Gateway",
            "Requêtes de recherche coûteuses (regex bomb)",
            "Saturation de la file de messages"
        ],
        "contre_mesures": [
            "Rate limiting (429 Too Many Requests)",
            "Circuit breaker entre services",
            "Pagination obligatoire (max 100 résultats)",
            "Quotas par utilisateur et par service"
        ],
        "severite": "HAUTE"
    },
    "Elevation of Privilege (Élévation)": {
        "description": "Un utilisateur obtient des droits supérieurs à son rôle",
        "composants_cibles": ["Service Authentification", "API Gateway"],
        "scenarios": [
            "Manipulation du token JWT (modification du rôle)",
            "IDOR — accès aux documents d'un autre utilisateur",
            "Exploitation d'une faille dans la vérification des permissions"
        ],
        "contre_mesures": [
            "Validation côté serveur à chaque requête",
            "Principe du moindre privilège (RBAC)",
            "Vérification de propriété pour chaque ressource",
            "Tests d'intrusion réguliers"
        ],
        "severite": "CRITIQUE"
    }
}

# =====================================================
# CHECKLIST ZERO TRUST
# =====================================================
checklist_zero_trust = [
    {"principe": "Ne jamais faire confiance, toujours vérifier",
     "application": "Chaque requête inter-service est authentifiée (mTLS)"},
    {"principe": "Moindre privilège",
     "application": "Chaque service n'a accès qu'aux ressources nécessaires"},
    {"principe": "Supposer la compromission",
     "application": "Circuit breakers, isolation réseau, blast radius limité"},
    {"principe": "Vérification explicite",
     "application": "Validation des entrées à chaque couche (API Gateway + Service)"},
    {"principe": "Micro-segmentation réseau",
     "application": "Network Policies K8s : seuls les flux autorisés passent"},
    {"principe": "Journalisation exhaustive",
     "application": "Tous les accès sont loggés pour audit et détection d'anomalies"},
    {"principe": "Chiffrement partout",
     "application": "TLS en transit, AES-256 au repos, secrets dans Vault"},
]

# =====================================================
# GÉNÉRATION DU RAPPORT
# =====================================================
def generer_rapport():
    """Génère le rapport d'analyse de sécurité"""

    print("=" * 70)
    print("  TP 5.3 — CARTOGRAPHIE DES SURFACES D'ATTAQUE")
    print("  Système de Gestion Documentaire Distribué")
    print("=" * 70)

    # 1. Architecture
    print(f"\n📐 ARCHITECTURE : {architecture['nom']}")
    print(f"   Composants : {len(architecture['composants'])}")
    print("-" * 50)
    for composant in architecture["composants"]:
        print(f"   [{composant['type'].upper()}] {composant['nom']}")
        print(f"     Port: {composant['port']} | Protocole: {composant['protocole']}")
        print(f"     {composant['description']}")
        print()

    # 2. Analyse STRIDE
    print("\n🔍 ANALYSE DES MENACES (STRIDE)")
    print("=" * 50)
    stats = {"CRITIQUE": 0, "HAUTE": 0, "MOYENNE": 0}
    for categorie, details in menaces_stride.items():
        severite = details["severite"]
        stats[severite] += 1
        icone = "🔴" if severite == "CRITIQUE" else "🟠" if severite == "HAUTE" else "🟡"
        print(f"\n{icone} {categorie} [{severite}]")
        print(f"   {details['description']}")
        print(f"   Cibles : {', '.join(details['composants_cibles'])}")
        print(f"   Scénarios :")
        for s in details["scenarios"]:
            print(f"     • {s}")
        print(f"   Contre-mesures :")
        for c in details["contre_mesures"]:
            print(f"     ✅ {c}")

    # 3. Résumé des risques
    print(f"\n\n📊 RÉSUMÉ DES RISQUES")
    print(f"   🔴 Critiques : {stats['CRITIQUE']}")
    print(f"   🟠 Hauts     : {stats['HAUTE']}")
    print(f"   🟡 Moyens    : {stats['MOYENNE']}")

    # 4. Checklist Zero Trust
    print(f"\n\n🛡️ CHECKLIST ZERO TRUST")
    print("-" * 50)
    for i, item in enumerate(checklist_zero_trust, 1):
        print(f"   [{i}] {item['principe']}")
        print(f"       → {item['application']}")

    print(f"\n{'=' * 70}")
    print(f"  Rapport généré le {datetime.now().strftime('%d/%m/%Y à %H:%M')}")
    print(f"{'=' * 70}")

    # 5. Export JSON
    rapport = {
        "date": datetime.now().isoformat(),
        "architecture": architecture,
        "menaces_stride": menaces_stride,
        "checklist_zero_trust": checklist_zero_trust,
        "statistiques": stats
    }
    with open("rapport_securite_tp5.json", "w", encoding="utf-8") as f:
        json.dump(rapport, f, indent=2, ensure_ascii=False)
    print(f"\n📄 Rapport JSON exporté : rapport_securite_tp5.json")


if __name__ == "__main__":
    generer_rapport()
