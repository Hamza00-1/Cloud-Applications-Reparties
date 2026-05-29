# 📄 Rapport Dédié — Module Cloud

> **Module :** Cloud & Applications Réparties  
> **Partie :** Cloud (Hyperviseurs, Gestion Centralisée, Sauvegarde)  
> **Formation :** 1ère année Cycle Ingénieur — Cybersécurité (ENSA)  
> **Année universitaire :** 2025 – 2026  
> **Auteur :** Hamza

---

## 1. Introduction

Ce rapport détaille les travaux pratiques réalisés dans la partie **Cloud** du module. L'objectif principal est de maîtriser l'administration d'hyperviseurs de type 1, la gestion centralisée d'infrastructure, et les stratégies de sauvegarde en environnement virtualisé.

Toute l'infrastructure a été déployée en mode **nested virtualization** sur VMware Workstation, permettant de simuler un environnement datacenter complet avec ESXi et Proxmox VE.

---

## 2. TP Cloud 1 — Hyperviseurs : ESXi vs Proxmox VE

### 2.1 Contexte et Objectifs
Ce TP introduit les hyperviseurs bare-metal et compare les deux plateformes leaders : VMware ESXi (propriétaire) et Proxmox VE (open-source).

### 2.2 VMware ESXi

#### Architecture
ESXi utilise un noyau propriétaire (**VMkernel**) qui gère directement le matériel. L'interface d'administration se fait via le **vSphere Client** (interface web).

#### Réseau — vSwitch
- **vSwitch standard** : commutateur virtuel géré localement par chaque hôte
- **Port Groups** : regroupement logique des ports pour segmenter le trafic
  - Management Network : accès à l'interface d'administration
  - VM Network : réseau pour les machines virtuelles
  - vMotion : migration à chaud (si vCenter disponible)

#### Stockage — Datastore
- **VMFS** (Virtual Machine File System) : système de fichiers propriétaire haute performance
- **Thin provisioning** : allocation à la demande (économie d'espace)
- **Thick provisioning** : allocation immédiate (meilleures performances I/O)

#### Sécurité et Durcissement
- Accès SSH désactivé par défaut
- Mode lockdown pour restreindre les accès
- Journalisation via syslog
- Gestion des certificats SSL

### 2.3 Proxmox VE

#### Architecture
Proxmox VE est basé sur **Debian Linux** et utilise **KVM** pour la virtualisation complète et **LXC** pour les conteneurs légers. Interface d'administration web sur le port 8006.

#### Réseau — Linux Bridges
- **vmbr0** : bridge par défaut lié à l'interface physique
- **vmbr1+** : bridges supplémentaires pour la segmentation
- Support natif des VLANs
- Possibilité d'utiliser Open vSwitch (OVS) pour des topologies avancées

#### Stockage
| Type | Backend | Usage |
|------|---------|-------|
| local | Directory | ISO, templates, backups |
| local-lvm | LVM-thin | Disques VM (allocation dynamique) |
| NFS | NFS share | Stockage réseau partagé |
| Ceph | RBD | Stockage distribué haute disponibilité |
| ZFS | ZFS pool | Déduplication, compression, snapshots |

#### Sécurité
- Pare-feu intégré (iptables/nftables) à 3 niveaux
- RBAC avec realms multiples (PAM, PVE, LDAP/AD)
- Tokens API avec permissions granulaires
- 2FA (Two-Factor Authentication) disponible

### 2.4 Tableau Comparatif — Angle Cybersécurité

| Critère | ESXi | Proxmox VE |
|---------|------|------------|
| **Isolation VM** | VMkernel dédié | KVM + SELinux/AppArmor |
| **Surface d'attaque OS** | Réduite (noyau minimal) | Plus large (Debian complet) |
| **Firewall** | Intégré (basique) | Intégré (3 niveaux, avancé) |
| **RBAC** | Via vCenter (granulaire) | ACL + Realms + Tokens API |
| **Audit/Logs** | Syslog, vRealize | Syslog, journald |
| **Chiffrement VM** | Oui (avec KMS) | Oui (LUKS) |
| **Patches** | VMware Update Manager | apt update (Debian) |
| **2FA** | Via vCenter SSO | TOTP, Yubikey |

---

## 3. TP Cloud 2 — Administration Centralisée

### 3.1 VMware vCenter

#### Rôle de vCenter
vCenter est le point central d'administration pour plusieurs hôtes ESXi. Il ajoute des fonctionnalités impossibles sur un ESXi autonome :
- **vMotion** : migration à chaud de VMs entre hôtes
- **DRS** (Distributed Resource Scheduler) : équilibrage automatique de charge
- **HA** (High Availability) : redémarrage automatique des VMs en cas de panne d'un hôte
- **RBAC centralisé** : gestion unifiée des permissions

#### Hiérarchie des Objets
```
vCenter Server
└── Datacenter
    ├── Cluster
    │   ├── Host ESXi 1
    │   │   ├── VM-1
    │   │   └── VM-2
    │   └── Host ESXi 2
    │       ├── VM-3
    │       └── VM-4
    ├── Folders
    │   ├── Production/
    │   └── Développement/
    └── Resource Pools
        ├── Pool-Critique (haute priorité CPU/RAM)
        └── Pool-Test (basse priorité)
```

### 3.2 Proxmox Datacenter View

#### Fonctionnalités Centralisées
Même avec un seul nœud, la vue Datacenter offre :
- **Configuration globale** : réseau, stockage, backup
- **Gestion des permissions** : centralisée pour tous les nœuds
- **Firewall** : règles au niveau Datacenter (appliquées à tous)
- **Backup** : planification centralisée avec vzdump

#### Système de Permissions Proxmox
```
Realm (PAM, PVE, LDAP)
    └── Utilisateur (user@realm)
        └── Rôle (Administrator, PVEVMUser, ...)
            └── ACL (assignée à un chemin : /, /vms/100, /pool/dev)
```

| Rôle | Droits |
|------|--------|
| Administrator | Tous les droits |
| PVEAdmin | Administration sans gestion des utilisateurs |
| PVEVMAdmin | Gestion complète des VMs |
| PVEVMUser | Utilisation des VMs (console, start/stop) |
| PVEAuditor | Lecture seule |

#### Firewall Intégré (3 niveaux)
1. **Niveau Datacenter** : règles globales (ex : interdire tout sauf SSH et HTTPS vers les nœuds)
2. **Niveau Node** : règles spécifiques à un nœud physique
3. **Niveau VM/CT** : règles par machine virtuelle ou conteneur

---

## 4. Veeam — Sauvegarde et Réplication

### 4.1 Principes Fondamentaux

La sauvegarde est un pilier de la sécurité informatique. En cas de ransomware, panne matérielle, ou erreur humaine, c'est souvent la **dernière ligne de défense**.

#### Stratégie 3-2-1
- **3** copies des données (original + 2 sauvegardes)
- **2** supports différents (disque local + NAS/bande/cloud)
- **1** copie hors site (datacenter distant, cloud)

#### Métriques Clés
| Métrique | Question à poser | Exemple |
|----------|-------------------|---------|
| **RPO** | Combien de données peut-on perdre ? | RPO = 1h → sauvegarde toutes les heures |
| **RTO** | Combien de temps pour restaurer ? | RTO = 15 min → Instant Recovery nécessaire |

### 4.2 Fonctionnalités Veeam

| Fonctionnalité | Description |
|----------------|-------------|
| **Backup Job** | Sauvegarde planifiée (complète + incrémentale) |
| **Backup Copy** | Copie vers un repository secondaire (règle 3-2-1) |
| **Réplication** | Copie de VM prête à démarrer sur un autre hôte |
| **Instant Recovery** | Démarrage d'une VM depuis la sauvegarde (RTO ~2 min) |
| **SureBackup** | Vérification automatique de la restaurabilité |
| **File-Level Restore** | Restauration de fichiers individuels |
| **Application-Aware** | Sauvegarde cohérente pour SQL, Exchange, AD |

### 4.3 Types de Sauvegarde Veeam

```
Jour 1 : [==========] Sauvegarde complète (Full)
Jour 2 : [==]          Incrémentale (blocs modifiés depuis J1)
Jour 3 : [=]           Incrémentale (blocs modifiés depuis J2)
Jour 4 : [===]         Incrémentale (blocs modifiés depuis J3)
Jour 5 : [==========] Nouvelle complète (Active Full)
...
```

### 4.4 Bonnes Pratiques de Sécurité pour les Sauvegardes
- **Chiffrement** des sauvegardes au repos et en transit
- **Immutabilité** : empêcher la suppression/modification des sauvegardes (anti-ransomware)
- **Test régulier** de restauration (SureBackup)
- **Séparation des droits** : l'administrateur de sauvegarde ≠ l'administrateur système
- **Monitoring** : alertes en cas d'échec de sauvegarde

---

## 5. Conclusion

Les TPs Cloud ont permis de construire une compréhension complète de la **gestion d'infrastructure virtualisée**, depuis le niveau hyperviseur (ESXi, Proxmox) jusqu'à la gestion centralisée (vCenter, Datacenter View) et la protection des données (Veeam).

Les compétences clés acquises :
- Administration d'hyperviseurs de type 1 (ESXi et Proxmox VE)
- Segmentation réseau et durcissement sécurité
- Gestion RBAC granulaire et audit
- Mise en place de stratégies de sauvegarde conformes à la règle 3-2-1
- Restauration rapide avec Veeam (Instant Recovery, SureBackup)

Ces compétences sont directement applicables dans un contexte professionnel d'ingénieur en cybersécurité, où la maîtrise de l'infrastructure Cloud est essentielle pour garantir la **disponibilité**, l'**intégrité** et la **confidentialité** des systèmes d'information.

---

*Rapport Cloud rédigé dans le cadre du module Cloud & Applications Réparties — 2025-2026*
