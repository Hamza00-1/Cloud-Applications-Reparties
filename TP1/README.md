# TP1 — Introduction à Docker comme base de Kubernetes

## 🎯 Objectif
Comprendre les fondamentaux de Docker : images, conteneurs, Dockerfile, volumes et réseaux. Préparer le terrain pour l'orchestration avec Kubernetes.

## 📝 Contenu de la séance

### Partie Théorique
- Pourquoi Docker ? De la virtualisation à la conteneurisation
- Comparaison VM vs Conteneur (isolation, performances, portabilité)
- Concepts fondamentaux : Image, Conteneur, Registry, Dockerfile
- Cycle de vie d'un conteneur (create → start → stop → remove)
- Limites de Docker seul face à la production

### Partie Pratique (TPs guidés)
| TP | Thème | Description |
|----|-------|-------------|
| TP 1 | Environnement | Vérification de l'environnement de travail |
| TP 2 | Installation | Installation de Docker sur Ubuntu (VM Proxmox) |
| TP 3 | hello-world | Premier conteneur, vérification du fonctionnement |
| TP 4 | Images/Conteneurs | Manipulation d'images et conteneurs (pull, run, ps, rm) |
| TP 5 | Serveur web | Déploiement d'un serveur Nginx conteneurisé |
| TP 6 | Application | Conteneurisation d'une application Python |
| TP 7 | Dockerfile | Écriture d'un Dockerfile multi-étapes |
| TP 8 | Build | Construction d'images personnalisées |
| TP 9 | Exécution | Exécution et gestion des conteneurs |
| TP 10 | Variables ENV | Configuration par variables d'environnement |
| TP 11 | Volumes | Persistance des données avec volumes Docker |
| TP 12 | Réseau | Réseaux Docker (bridge, host, overlay) |
| TP 13 | Nettoyage | Nettoyage des ressources Docker |

## 🔧 Commandes Essentielles

```bash
# Gestion des images
docker pull <image>
docker images
docker rmi <image>

# Gestion des conteneurs
docker run -d --name <nom> -p <host>:<container> <image>
docker ps -a
docker stop <conteneur>
docker rm <conteneur>

# Construction
docker build -t <nom>:<tag> .
docker push <nom>:<tag>

# Volumes et Réseaux
docker volume create <nom>
docker network create <nom>
```

## 📂 Fichiers
- `seance1_introduction_docker.html` — Support de cours complet

## ⏱ Durée
4 heures (240 min)

## 📌 Environnement
- VM Ubuntu sur Proxmox VE
- Docker Engine installé via le script officiel
