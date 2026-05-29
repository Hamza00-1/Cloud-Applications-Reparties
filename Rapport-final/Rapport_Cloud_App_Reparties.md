# 📄 Rapport Final — Cloud & Applications Réparties

> **Module :** Applications Réparties et Cloud  
> **Formation :** 1ère année Cycle Ingénieur — Cybersécurité (ENSA)  
> **Année universitaire :** 2025 – 2026  
> **Auteur :** Hamza

---

## Table des matières

1. [Introduction](#1-introduction)
2. [Environnement de Travail](#2-environnement-de-travail)
3. [TP1 — Docker : Introduction & Conteneurisation](#3-tp1--docker)
4. [TP2 — Kubernetes & Kubeflow](#4-tp2--kubernetes--kubeflow)
5. [TP5 — Concepts des Systèmes Distribués](#5-tp5--concepts-des-systèmes-distribués)
6. [TP6 — Communication, APIs et Fiabilité](#6-tp6--communication-apis-et-fiabilité)
7. [TP7 — Sérialisation et Marshalling](#7-tp7--sérialisation-et-marshalling)
8. [TP10 — Invocation d'Objets Distants (Pyro5)](#8-tp10--invocation-dobjets-distants)
9. [TP Cloud 1 — Hyperviseurs : ESXi vs Proxmox VE](#9-tp-cloud-1--hyperviseurs)
10. [TP Cloud 2 — Administration Centralisée : vCenter & Proxmox Datacenter](#10-tp-cloud-2--administration-centralisée)
11. [Veeam — Sauvegarde et Réplication](#11-veeam--sauvegarde-et-réplication)
12. [Synthèse et Compétences Acquises](#12-synthèse-et-compétences-acquises)
13. [Conclusion](#13-conclusion)

---

## 1. Introduction

Ce rapport présente l'ensemble des travaux pratiques réalisés dans le cadre du module **Cloud & Applications Réparties** durant l'année universitaire 2025-2026. Le module couvre deux axes complémentaires :

- **Applications Réparties** : conception et sécurisation de systèmes distribués (APIs REST, objets distants, sérialisation, patterns de fiabilité)
- **Cloud** : administration d'hyperviseurs (ESXi, Proxmox VE), gestion centralisée d'infrastructure, et solutions de sauvegarde (Veeam)

L'approche adoptée tout au long du module est orientée **cybersécurité**, avec une attention particulière portée à la surface d'attaque, au modèle Zero Trust, et aux bonnes pratiques de durcissement.

---

## 2. Environnement de Travail

### Infrastructure Physique
L'ensemble des TPs repose sur une infrastructure de **virtualisation imbriquée** (nested virtualization) :

| Composant | Détail |
|-----------|--------|
| **Hôte** | PC avec VMware Workstation |
| **Hyperviseur Type 1** | Proxmox VE 8.x + VMware ESXi 8.x (en VMs imbriquées) |
| **VMs de travail** | Ubuntu 22.04 LTS |
| **Réseau** | Bridges Linux (Proxmox), vSwitch (ESXi), NAT/Bridged (Workstation) |

### Stack Logicielle

| Outil | Version | Usage |
|-------|---------|-------|
| Docker | 24.x | Conteneurisation |
| Kubernetes | v1.30 | Orchestration |
| Kubeflow | Latest | Plateforme MLOps |
| Python | 3.10+ | Développement des TPs |
| Flask | 3.x | API REST |
| Pyro5 | 5.x | Objets distants (RMI) |
| Veeam B&R | 12.x | Sauvegarde |

---

## 3. TP1 — Docker : Introduction & Conteneurisation

### Objectifs
- Comprendre les fondamentaux de Docker et la différence entre VM et conteneur
- Maîtriser le cycle de vie d'un conteneur
- Écrire des Dockerfiles, gérer volumes et réseaux

### Travail Réalisé

#### Comparaison VM vs Conteneur
| Critère | Machine Virtuelle | Conteneur |
|---------|-------------------|-----------|
| Isolation | Complète (hyperviseur) | Processus (kernel partagé) |
| Taille | Go (OS complet) | Mo (application uniquement) |
| Démarrage | Minutes | Secondes |
| Performance | Overhead hyperviseur | Quasi-native |
| Sécurité | Forte (isolation matérielle) | Modérée (namespaces/cgroups) |

#### Exercices Pratiques
- **TP 1-3** : Installation de Docker sur Ubuntu, premier conteneur `hello-world`
- **TP 4-5** : Manipulation d'images et déploiement Nginx
- **TP 6-9** : Conteneurisation d'une application Python, Dockerfile multi-étapes
- **TP 10-12** : Variables d'environnement, volumes persistants, réseaux Docker (bridge, host)
- **TP 13** : Nettoyage des ressources

### Points Clés Retenus
- Docker isole les applications via les **namespaces** (PID, NET, MNT) et les **cgroups** (limitation CPU/RAM)
- Les volumes permettent la persistance des données au-delà du cycle de vie d'un conteneur
- Le réseau `bridge` est le mode par défaut ; le mode `host` offre de meilleures performances réseau mais réduit l'isolation
- Docker seul ne suffit pas en production → nécessité d'un orchestrateur (Kubernetes)

---

## 4. TP2 — Kubernetes & Kubeflow

### Objectifs
- Déployer un cluster Kubernetes multi-nœuds avec kubeadm
- Comprendre l'architecture K8s (control plane + workers)
- Installer et accéder à Kubeflow

### Travail Réalisé

#### Architecture du Cluster Déployé
```
┌─────────────────────────────────────────┐
│            PROXMOX VE HOST              │
│                                         │
│  ┌──────────────┐  ┌──────────────┐     │
│  │  Master Node │  │ Worker Node  │     │
│  │  10.11.4.18  │  │  10.11.4.x   │     │
│  │              │  │              │     │
│  │ kube-apiserver│  │   kubelet    │     │
│  │ etcd         │  │   kube-proxy │     │
│  │ scheduler    │  │   container  │     │
│  │ controller   │  │   runtime    │     │
│  └──────────────┘  └──────────────┘     │
│         ↕               ↕               │
│     [Calico CNI Network]                │
└─────────────────────────────────────────┘
```

#### Étapes Clés d'Installation
1. **Préparation** : installation de containerd, désactivation du swap, configuration réseau (`br_netfilter`, `ip_forward`)
2. **Master** : `kubeadm init`, configuration de kubectl, déploiement de Calico CNI
3. **Worker** : `kubeadm join` avec le token généré par le master
4. **Kubeflow** : déploiement via les manifests officiels, accès au dashboard

#### Objets Kubernetes Manipulés
| Objet | Rôle |
|-------|------|
| **Pod** | Unité atomique de déploiement (1+ conteneurs) |
| **Deployment** | Gestion déclarative des réplicas |
| **Service** | Point d'accès réseau stable (ClusterIP, NodePort, LoadBalancer) |
| **Namespace** | Isolation logique des ressources |
| **ConfigMap/Secret** | Configuration et données sensibles |
| **PersistentVolume** | Stockage persistant |

### Points Clés Retenus
- Kubernetes résout les problèmes de **scaling**, **self-healing**, et **rolling updates** que Docker seul ne peut pas gérer
- Le CNI (Container Network Interface) — ici Calico — est essentiel pour la communication inter-pods
- Kubeflow s'appuie sur Kubernetes pour fournir une plateforme MLOps complète (Notebooks, Pipelines, Serving)

---

## 5. TP5 — Concepts des Systèmes Distribués

### Objectifs
- Comprendre les propriétés fondamentales des systèmes distribués
- Maîtriser le théorème CAP et les modèles de cohérence
- Identifier les implications cybersécurité

### Travail Réalisé

#### Propriétés Fondamentales
| Propriété | Description |
|-----------|-------------|
| **Absence d'horloge globale** | Chaque machine a sa propre horloge → impossibilité d'ordonner les événements par timestamp |
| **Pannes partielles** | Un composant peut tomber indépendamment des autres → ambiguïté (mort ou lent ?) |
| **Latence variable** | Le réseau introduit un délai variable et imprévisible (jitter) |
| **Transparence** | Objectif de cacher la complexité distribuée (localisation, réplication, panne) |

#### Théorème CAP
En cas de partition réseau (P — inévitable), il faut choisir entre :
- **C (Cohérence)** : toute lecture retourne la dernière écriture
- **A (Disponibilité)** : toute requête reçoit une réponse

| Type | Choix | Exemple |
|------|-------|---------|
| CP | Cohérence + Partition | MongoDB (mode strict), HBase |
| AP | Disponibilité + Partition | Cassandra, DynamoDB |
| CA | Cohérence + Disponibilité | SGBD classique mono-nœud (pas distribué) |

#### Modèles d'Architecture Analysés
- **Client–Serveur** : simple, centralisé, SPOF potentiel
- **Peer-to-Peer** : décentralisé, résilient, complexe à sécuriser
- **Microservices** : modulaire, scalable, complexité opérationnelle accrue

#### Implications Cybersécurité
- Surface d'attaque étendue (chaque service = point d'entrée potentiel)
- Communication inter-services à protéger (mTLS, chiffrement)
- Modèle **Zero Trust** : ne jamais faire confiance implicitement, toujours vérifier
- Risques : DDoS, MITM, SSRF, injection via APIs

---

## 6. TP6 — Communication, APIs et Fiabilité

### Objectifs
- Concevoir une API REST professionnelle
- Implémenter les patterns de fiabilité (timeout, retry, backoff)
- Analyser les risques cybersécurité des APIs

### Travail Réalisé

#### Spécification d'API REST (TP 6.1)
API conçue pour un Système de Gestion Documentaire Distribué :

| Endpoint | Méthode | Description | Idempotent |
|----------|---------|-------------|------------|
| `/api/v1/documents` | GET | Lister les documents (paginé) | ✅ |
| `/api/v1/documents` | POST | Créer un document | ❌ |
| `/api/v1/documents/{id}` | GET | Récupérer un document | ✅ |
| `/api/v1/documents/{id}` | PUT | Remplacer un document | ✅ |
| `/api/v1/documents/{id}` | DELETE | Supprimer un document | ✅ |

#### Patterns de Fiabilité Implémentés (TP 6.2)
```python
# Backoff exponentiel avec jitter
import time, random

def requete_avec_retry(url, max_retries=3, base_delay=1.0):
    for tentative in range(max_retries):
        try:
            response = requests.get(url, timeout=5)
            response.raise_for_status()
            return response
        except requests.RequestException as e:
            if tentative == max_retries - 1:
                raise
            delai = base_delay * (2 ** tentative)
            jitter = random.uniform(0, delai * 0.1)
            time.sleep(delai + jitter)
```

#### Matrice de Sécurité API (TP 6.3)
| Risque | Mesure de Protection |
|--------|---------------------|
| Authentification manquante | Token Bearer / JWT obligatoire |
| Injection SQL/NoSQL | Validation stricte des entrées, ORM |
| MITM | HTTPS/TLS obligatoire |
| Rate limiting | 429 Too Many Requests, quota par utilisateur |
| Données sensibles exposées | Filtrage des champs dans les réponses |
| SSRF | Validation des URLs, whitelist de domaines |

### Code Source Développé
- `Server.py` : serveur Flask avec API REST complète
- `client.py`, `client_retry.py`, `client_async.py` : clients avec patterns de fiabilité
- `main_api.py` : API avec validation et gestion d'erreurs

---

## 7. TP7 — Sérialisation et Marshalling

### Objectifs
- Comprendre les mécanismes de sérialisation/désérialisation
- Comparer JSON, XML et Protocol Buffers
- Identifier les vulnérabilités de désérialisation non sécurisée

### Travail Réalisé

#### Comparaison des Formats
| Critère | JSON | XML | Protocol Buffers |
|---------|------|-----|------------------|
| Lisibilité humaine | ✅ Excellente | ✅ Bonne | ❌ Binaire |
| Taille | Moyenne | Grande (balises) | Petite (binaire) |
| Performance | Bonne | Moyenne | Excellente |
| Schéma | Optionnel (JSON Schema) | DTD/XSD | Obligatoire (.proto) |
| Typage | Faible (6 types) | Aucun natif | Fort |
| Sécurité | ✅ Bonne (pas d'exécution) | ⚠️ XXE, Bombe XML | ✅ Bonne |

#### Vulnérabilités de Sérialisation Identifiées
1. **XXE (XML External Entity)** : injection d'entités externes pour lire des fichiers système
2. **Bombe XML** : expansion exponentielle d'entités pour un déni de service
3. **Pickle (Python)** : exécution de code arbitraire lors de la désérialisation → **INTERDIT** en entrées non fiables
4. **Désérialisation non sécurisée** : risque RCE si le format permet l'exécution de code

#### Politique de Sécurité Adoptée
- JSON pour les APIs REST (pas d'exécution, bien supporté)
- Protobuf pour les communications hautes performances (gRPC)
- XML avec parseur sécurisé (`defusedxml`) si nécessaire
- **Jamais** `pickle` pour des données provenant du réseau

---

## 8. TP10 — Invocation d'Objets Distants (Pyro5)

### Objectifs
- Implémenter un service distant orienté objet avec Pyro5
- Appliquer les principes de moindre privilège et de validation stricte
- Tester les scénarios d'attaque

### Travail Réalisé

#### Architecture Déployée
```
┌───────────────┐     ┌──────────────────┐     ┌────────────────┐
│    Client     │────▶│   Name Server    │     │    Serveur     │
│  (Proxy)      │     │  (Pyro5 NS)     │     │ DocumentService │
│               │     │                  │     │                │
│ client_docs.py│     │ Registre d'URIs  │◀───│ server_docs.py │
└───────┬───────┘     └──────────────────┘     └────────────────┘
        │                                              ▲
        │         Appels RMI (Serpent)                  │
        └──────────────────────────────────────────────┘
```

#### Politique d'Exposition des Méthodes (TP 10.2)
| Méthode | Exposée | Justification | Risque si exposée |
|---------|---------|---------------|-------------------|
| `list_documents()` | ✅ Oui | Navigation client | Fuite de noms de fichiers |
| `get_document_content()` | ✅ Oui | Service métier principal | Path traversal |
| `_check_token()` | ❌ Non | Vérification interne | Bypass d'authentification |
| `_reload_index()` | ❌ Non | Administration critique | DoS, corruption d'état |

#### Validation des Entrées (TP 10.3)
1. **Validation de type** : `isinstance(doc_id, str)`
2. **Validation de longueur** : entre 3 et 32 caractères
3. **Validation de format** : Regex `^[a-zA-Z0-9_]+$` (interdiction des `/ \ . ;`)
4. **Erreurs sûres** : messages génériques côté client, logs détaillés côté serveur

#### Tests de Sécurité (TP 10.4)
| Scénario | Résultat | Détail |
|----------|----------|--------|
| Méthode `_reload_index()` non exposée | ❌ Bloqué | `AttributeError` — Pyro5 cache l'existence de la méthode |
| Client sans token | ❌ Bloqué | `PermissionError` — Accès refusé |
| Path traversal (`../../etc`) | ❌ Bloqué | `ValueError` — Identifiant invalide |
| Injection (`doc;DROP`) | ❌ Bloqué | `ValueError` — Identifiant invalide |
| Sérialisation sûre | ✅ Sécurisé | Serpent utilisé (pas Pickle) |

---

## 9. TP Cloud 1 — Hyperviseurs : ESXi vs Proxmox VE

### Objectifs
- Administrer les hyperviseurs de type 1 : ESXi et Proxmox VE
- Gérer les VMs, le réseau et le stockage
- Appliquer les mesures de durcissement sécurité

### Travail Réalisé

#### Comparaison des Hyperviseurs
| Critère | VMware ESXi | Proxmox VE |
|---------|-------------|------------|
| **Type** | Bare-metal propriétaire | Bare-metal open-source |
| **OS de base** | VMkernel propriétaire | Debian Linux |
| **Interface** | vSphere Client (web) | Web GUI (port 8006) |
| **Virtualisation** | VMware vmx | KVM + QEMU |
| **Conteneurs** | Non (natif) | LXC intégré |
| **Réseau** | vSwitch, Port Groups | Linux Bridge, OVS |
| **Stockage** | VMFS, vSAN | LVM, ZFS, Ceph, NFS |
| **RBAC** | Rôles/Permissions via vCenter | Realms (PAM, PVE, LDAP) + ACL |
| **Licence** | Propriétaire (payante) | GPL (gratuit) |
| **API** | REST API | REST API + CLI (pvesh) |

#### Gestion Réseau
- **ESXi** : vSwitch standard avec Port Groups pour segmenter le trafic (management, VM, vMotion)
- **Proxmox** : bridges Linux (`vmbr0`, `vmbr1`) avec support VLAN natif

#### Mesures de Sécurité Appliquées
- Accès SSH restreint et désactivé par défaut
- RBAC avec principe du moindre privilège
- Segmentation réseau (management vs VM traffic)
- Mise à jour régulière des patches de sécurité
- Journalisation et audit des actions administratives
- Synchronisation NTP pour la corrélation des logs

---

## 10. TP Cloud 2 — Administration Centralisée : vCenter & Proxmox Datacenter

### Objectifs
- Maîtriser la gestion centralisée d'infrastructure virtuelle
- Comprendre la hiérarchie des objets (Datacenter/Cluster/Host/VM)
- Configurer le RBAC, le firewall et les sauvegardes

### Travail Réalisé

#### VMware vCenter
- **Hiérarchie** : Datacenter → Cluster → Host → VM + Folders, Resource Pools
- **RBAC** : rôles prédéfinis (Administrator, ReadOnly, etc.) + rôles personnalisés
- **Réseau** : vSwitch standard, Port Groups, VMkernel adapters
- **Stockage** : Datastore VMFS, thin/thick provisioning

#### Proxmox Datacenter
- **Vue centralisée** : gestion de plusieurs nœuds depuis une interface unique
- **Stockage multi-backend** : local (directory), local-lvm (LVM-thin), NFS, Ceph
- **Permissions granulaires** :
  - Realms : PAM (comptes locaux Linux), PVE (comptes Proxmox), LDAP/AD
  - Rôles : Administrator, PVEAdmin, PVEVMUser, etc.
  - ACL : permissions assignées par chemin (/, /vms/100, /pool/dev)
  - Tokens API : authentification programmatique avec permissions limitées
- **Firewall intégré** : 3 niveaux (Datacenter, Node, VM/CT) avec règles par défaut "deny"
- **Sauvegardes** : vzdump intégré avec planification

---

## 11. Veeam — Sauvegarde et Réplication

### Objectifs
- Comprendre les principes de sauvegarde en environnement virtualisé
- Mettre en place des stratégies de sauvegarde avec Veeam
- Maîtriser les mécanismes de restauration

### Concepts Clés

#### La Règle 3-2-1
| Règle | Description |
|-------|-------------|
| **3** copies | Au moins 3 copies des données |
| **2** supports | Sur au moins 2 types de supports différents |
| **1** hors site | Au moins 1 copie stockée hors site |

#### RPO et RTO
| Métrique | Description | Impact |
|----------|-------------|--------|
| **RPO** (Recovery Point Objective) | Perte de données maximale acceptable | Détermine la fréquence des sauvegardes |
| **RTO** (Recovery Time Objective) | Temps de restauration maximal acceptable | Détermine la stratégie de restauration |

#### Types de Sauvegarde
| Type | Description | Avantage | Inconvénient |
|------|-------------|----------|--------------|
| **Complète** | Copie intégrale de toutes les données | Restauration simple | Espace et temps importants |
| **Incrémentale** | Blocs modifiés depuis la dernière sauvegarde | Rapide, peu d'espace | Restauration plus complexe |
| **Différentielle** | Blocs modifiés depuis la dernière complète | Compromis équilibré | Plus d'espace que l'incrémentale |

#### Fonctionnalités Veeam Utilisées
- **Backup Job** : sauvegarde planifiée de VMs
- **Backup Copy** : copie de sauvegardes vers un site distant
- **Réplication** : réplication de VMs pour la haute disponibilité (basculement instantané)
- **SureBackup** : vérification automatique de la restaurabilité des sauvegardes
- **Restauration granulaire** : restauration de fichiers individuels sans restaurer la VM complète
- **Instant Recovery** : démarrage d'une VM directement depuis la sauvegarde

---

## 12. Synthèse et Compétences Acquises

### Tableau Récapitulatif des Compétences

| Domaine | Compétence | TPs Concernés |
|---------|------------|---------------|
| **Conteneurisation** | Docker (build, run, volumes, réseaux) | TP1 |
| **Orchestration** | Kubernetes (kubeadm, kubectl, deployments) | TP2 |
| **Architecture distribuée** | CAP, cohérence, microservices | TP5 |
| **APIs REST** | Conception, fiabilité, sécurité | TP6 |
| **Sérialisation** | JSON, XML, Protobuf, sécurité | TP7 |
| **Objets distants** | Pyro5, RMI, validation, durcissement | TP10 |
| **Virtualisation** | ESXi, Proxmox VE, VMs, LXC | Cloud TP1 |
| **Gestion centralisée** | vCenter, Datacenter, RBAC, firewall | Cloud TP2 |
| **Sauvegarde** | Veeam, stratégies 3-2-1, RPO/RTO | Veeam |

### Fil Rouge : La Cybersécurité
Un thème transversal relie tous les TPs — la **cybersécurité appliquée** :

- **TP1 (Docker)** : isolation des conteneurs, sécurité des images, moindre privilège
- **TP2 (K8s)** : RBAC Kubernetes, Network Policies, Secrets
- **TP5 (Distribué)** : surface d'attaque, Zero Trust, DDoS
- **TP6 (APIs)** : authentification, injection, rate limiting
- **TP7 (Sérialisation)** : XXE, pickle RCE, désérialisation sûre
- **TP10 (Pyro5)** : whitelist de méthodes, validation, erreurs sûres
- **Cloud TPs** : RBAC, segmentation réseau, firewall, hardening
- **Veeam** : intégrité des sauvegardes, restauration, règle 3-2-1

---

## 13. Conclusion

Ce module a permis de couvrir l'ensemble de la chaîne de déploiement d'applications modernes, depuis la **conteneurisation** (Docker) jusqu'à l'**orchestration** (Kubernetes), en passant par la **conception d'APIs fiables et sécurisées**, les **systèmes d'objets distants**, et l'**administration d'infrastructures Cloud** (Proxmox, ESXi, Veeam).

L'accent mis sur la **cybersécurité** à chaque niveau — réseau, application, données, infrastructure — constitue un atout essentiel pour la formation d'ingénieurs en cybersécurité capables de concevoir des systèmes distribués **résilients, performants et sécurisés**.

Les compétences acquises sont directement applicables en environnement professionnel, que ce soit pour :
- Le déploiement d'applications cloud-native sur Kubernetes
- L'administration d'infrastructures virtualisées
- La sécurisation d'APIs et de communications inter-services
- La mise en place de stratégies de sauvegarde et de reprise d'activité

---

*Rapport rédigé dans le cadre du module Cloud & Applications Réparties — 2025-2026*
