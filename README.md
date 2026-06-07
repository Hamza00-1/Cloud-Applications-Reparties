# 📚 Travaux Pratiques — Cloud & Applications Réparties

> **Module :** Applications Réparties et Cloud  
> **Formation :** 1ère année Cycle Ingénieur — Cybersécurité (EIDIA)  
> **Année universitaire :** 2025 – 2026

---

## 📑 Structure du Dépôt

```
├── Applications_Reparties/ → TPs d'Applications Réparties uniquement
│   ├── TP5/                → Concepts des Systèmes Distribués
│   ├── TP6/                → Communication, APIs et Fiabilité
│   ├── TP7/                → Sérialisation et Marshalling
│   └── TP10/               → Invocation d'Objets Distants (Pyro5)
├── Cloud/                  → TPs Cloud (Hyperviseurs, vCenter, Proxmox, Veeam)
├── Combines/               → TPs combinant Cloud & App Réparties
│   ├── TP1/                → Docker : Introduction & Conteneurisation
│   └── TP2/                → Kubernetes & Kubeflow
├── Projet/                 → Projet de fin de semestre (CampusOps)
├── Rapport-final/          → Rapport final global
└── README.md               → Ce fichier
```

---

## 🔧 Technologies & Outils Utilisés

| Catégorie | Outils |
|-----------|--------|
| **Virtualisation** | Proxmox VE, VMware ESXi, VMware Workstation |
| **Conteneurisation** | Docker, Docker Compose |
| **Orchestration** | Kubernetes (kubeadm), Kubeflow |
| **Sauvegarde** | Veeam Backup & Replication |
| **Langages** | Python 3 |
| **Frameworks** | Flask, Pyro5, gRPC, Protocol Buffers |
| **Formats** | JSON, XML, Protobuf |
| **Réseau** | vSwitch, Linux Bridge, VLAN |

---

## 📋 Résumé des TPs

### Applications Réparties

| TP | Séance | Thème | Contenu |
|----|--------|-------|---------|
| TP1 | Séance 1 | Docker | Images, conteneurs, Dockerfile, volumes, réseaux |
| TP2 | Séance 2 | Kubernetes & Kubeflow | Cluster K8s, kubectl, déploiement Kubeflow |
| TP5 | Séance 5 | Systèmes Distribués | Architecture, CAP, pannes partielles, transparence |
| TP6 | Séance 6 | APIs & Fiabilité | REST, timeouts, retry, backoff, circuit breaker |
| TP7 | Séance 7 | Sérialisation | JSON, XML, Protobuf, sécurité désérialisation |
| TP10 | Séance 10 | Objets Distants | Pyro5, RMI, Name Server, validation, sécurité |

### Cloud

| TP | Thème | Contenu |
|----|-------|---------|
| TP Cloud 1 | Hyperviseurs | ESXi vs Proxmox VE, VM, snapshots, réseau, RBAC |
| TP Cloud 2 | Datacenter | vCenter, Proxmox Datacenter, RBAC, firewall, backup |
| Veeam | Sauvegarde | Veeam Backup & Replication, stratégies de sauvegarde |

### Projet de Fin de Semestre

| Projet | Description | Lien Original |
|--------|-------------|---------------|
| **CampusOps** | Plateforme de gestion universitaire complète (React, Node.js, Docker). Voir le dossier `Projet/` pour le code complet et le rapport détaillé. | [Hamza00-1/CampusOps-](https://github.com/Hamza00-1/CampusOps-) |

---

## 🚀 Instructions Générales

### Prérequis
- Python 3.10+
- Docker & Docker Compose
- Proxmox VE (installé sur VM ou bare-metal)
- Accès à un cluster Kubernetes (via kubeadm)

### Lancement des TPs Python
```bash
# Installer les dépendances
pip install flask pyro5 grpcio protobuf requests

# Exemple : Lancer le TP10 (Objets Distants)
cd Applications_Reparties/TP10/
python -m Pyro5.nameserver &   # Démarrer le Name Server
python server_docs.py &         # Démarrer le serveur
python client_docs.py            # Lancer le client
```

---

## 👤 Auteur

- **Nom :** Hamza Khchichine
- **Formation :** Ingénieur Cybersécurité — EIDIA
- **Année :** 2025–2026
