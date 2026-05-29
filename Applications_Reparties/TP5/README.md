# TP5 — Concepts des Systèmes Distribués

## 🎯 Objectif
Comprendre les caractéristiques fondamentales des systèmes distribués, les modèles d'architecture, et les implications cybersécurité.

## 📝 Contenu de la séance

### Partie Théorique
- **Définitions clés** : distribution vs parallélisme vs concurrence
- **Propriétés fondamentales** : absence d'horloge globale, pannes partielles, latence variable, transparence
- **Théorème CAP** (Cohérence, Disponibilité, Tolérance aux partitions)
- **Modèles de cohérence** : forte vs éventuelle
- **Modèles d'architecture** :
  - Client–Serveur
  - Peer-to-Peer
  - Microservices
- **Communication inter-composants** : synchrone vs asynchrone
- **Implications cybersécurité** : surface d'attaque étendue, Zero Trust, DDoS, MITM

### Partie Pratique
| TP | Thème | Description |
|----|-------|-------------|
| TP 5.1 | Schématisation | Conception d'une architecture distribuée pour un système de gestion documentaire |
| TP 5.2 | Analyse des défis | Identification des problèmes distribués (CAP, pannes, latence) |
| TP 5.3 | Cartographie sécurité | Cartographie des surfaces d'attaque d'un système distribué |

### Lab Sécurité
- Threat modeling d'une architecture microservices
- Checklist Zero Trust
- Scénario : compromission d'un microservice

## 📂 Fichiers
- `ar cs1(3).html` — Support de cours (Séance 5)
- Code source dans `TP_Architecture_Serveur_Client/`

## ⏱ Durée
4 heures (240 min)
