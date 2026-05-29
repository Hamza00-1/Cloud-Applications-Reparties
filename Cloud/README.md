# ☁️ TPs Cloud — Virtualisation, Hyperviseurs & Sauvegarde

## 🎯 Objectif Général
Maîtriser l'administration d'hyperviseurs de type 1 (ESXi et Proxmox VE), la gestion centralisée d'infrastructure (vCenter, Datacenter Proxmox), et les stratégies de sauvegarde avec Veeam.

---

## 📋 TP Cloud 1 — Hyperviseurs : ESXi vs Proxmox VE

### Objectifs
- Comprendre l'architecture interne de ESXi et Proxmox VE
- Administrer les ressources (CPU, RAM, stockage, réseau)
- Créer, configurer et gérer des machines virtuelles
- Appliquer des mesures de durcissement sécurité (hardening)
- Gérer les utilisateurs, rôles et permissions (RBAC)

### Contenu
| Section | Thème | Description |
|---------|-------|-------------|
| Partie A | VMware ESXi | Interface web, dashboard, vSwitch, Port Groups, VM, snapshots, logs, RBAC, CLI |
| Partie B | Proxmox VE | Interface web, bridges Linux, stockage (local/LVM), VM, LXC, snapshots, RBAC, CLI |
| Partie C | Comparaison | Tableau comparatif ESXi vs Proxmox sous l'angle cybersécurité |
| Partie D | Lab sécurité | Mini-lab guidé : segmentation réseau, durcissement |
| Partie E | Troubleshooting | Résolution de problèmes courants |

### Concepts Clés
- **Hyperviseur Type 1 (bare-metal)** vs **Type 2 (hosted)**
- **VM, Template, Snapshot** — différences et usages
- **Stockage** : Datastore (VMFS), local-lvm, thin/thick provisioning
- **Réseau** : vSwitch (ESXi) vs Bridge Linux (Proxmox), VLAN, segmentation
- **Sécurité** : isolation, moindre privilège, journalisation, NTP, certificats

### Environnement
- VMware Workstation (nested virtualization)
- ESXi + Proxmox VE en VMs imbriquées
- Durée : 4-6 heures

---

## 📋 TP Cloud 2 — Administration Centralisée : vCenter & Proxmox Datacenter

### Objectifs
- Expliquer le rôle de vCenter par rapport à un ESXi autonome
- Maîtriser la hiérarchie Datacenter / Cluster / Host / VM / Folder
- Maîtriser la vue Datacenter de Proxmox : Node, Storage, Pools, Permissions, Firewall
- Mettre en place une administration sécurisée : RBAC, comptes, logs, NTP, certificats
- Comparer vCenter et Proxmox sous l'angle cybersécurité

### Contenu

#### Partie VMware vCenter
| Thème | Description |
|-------|-------------|
| Déploiement VCSA | Installation de vCenter Server Appliance |
| Modèle objet | Datacenter → Cluster → Host → VM + Folders, Resource Pools |
| Réseau vSphere | vSwitch standard, Port Groups, VMkernel |
| Stockage | Datastore, thin/thick provisioning |
| RBAC | Utilisateurs, rôles, permissions avec propagation |

#### Partie Proxmox Datacenter
| Thème | Description |
|-------|-------------|
| Vue Datacenter | Configuration centralisée (même avec un seul nœud) |
| Stockage | local (directory), local-lvm (LVM-thin), NFS, Ceph |
| Réseau | Bridges Linux (vmbr0, vmbr1), VLAN |
| Permissions | Realms (PAM, PVE, LDAP), rôles, ACL, tokens API |
| Firewall | Pare-feu intégré à 3 niveaux (DC, Node, VM) |
| Backup | Sauvegardes planifiées, vzdump |

### Environnement
- Nested virtualization sur VMware Workstation
- Durée : 6-8 heures (2 séances)

---

## 📋 Veeam — Sauvegarde et Réplication

### Objectifs
- Comprendre les principes de sauvegarde en environnement virtualisé
- Installer et configurer Veeam Backup & Replication
- Mettre en place des stratégies de sauvegarde (complète, incrémentale, différentielle)
- Effectuer des restaurations (VM complète, fichiers individuels)

### Contenu
| Thème | Description |
|-------|-------------|
| Principes | Règle 3-2-1, RPO, RTO, fenêtre de sauvegarde |
| Installation | Déploiement de Veeam Backup & Replication |
| Configuration | Ajout d'hyperviseurs, création de repositories |
| Jobs de sauvegarde | Sauvegarde complète, incrémentale, reverse incremental |
| Réplication | Réplication de VMs pour la haute disponibilité |
| Restauration | Restauration de VM complète, restauration granulaire de fichiers |
| Vérification | SureBackup — vérification automatique des sauvegardes |

### Points Clés
- **Règle 3-2-1** : 3 copies, 2 supports différents, 1 copie hors site
- **RPO** (Recovery Point Objective) : perte de données acceptable
- **RTO** (Recovery Time Objective) : temps de restauration acceptable
- **Sauvegarde incrémentale** : seuls les blocs modifiés sont sauvegardés
- **SureBackup** : vérification automatique que les sauvegardes sont restaurables

---

## 📂 Fichiers du dossier Cloud
- `TP - HYPERVISEUR(1).html` — Support de cours TP1 (ESXi vs Proxmox)
- `TP2_vCenter_Proxmox_Datacenter.html` — Support de cours TP2 (vCenter & Datacenter)
- `master.txt` — Script d'installation Kubernetes (nœud master)
- `worker.txt` — Script d'installation Kubernetes (nœud worker)
- `server.py` — Serveur de test pour Hyperledger Fabric Explorer

---

## 📌 Résumé des Commandes Essentielles

### Proxmox (CLI)
```bash
# Gestion des VMs
qm list                          # Lister les VMs
qm create <vmid> --name <nom>    # Créer une VM
qm start <vmid>                  # Démarrer une VM
qm stop <vmid>                   # Arrêter une VM
qm snapshot <vmid> <snap_name>   # Créer un snapshot

# Stockage
pvesm status                     # État du stockage
pvesm list local                 # Contenu du stockage local

# Réseau
cat /etc/network/interfaces      # Configuration réseau
pvesh get /nodes/<node>/network   # Interfaces réseau

# Sauvegarde
vzdump <vmid> --storage local    # Sauvegarde manuelle
```

### ESXi (CLI via SSH)
```bash
# Gestion des VMs
vim-cmd vmsvc/getallvms           # Lister les VMs
vim-cmd vmsvc/power.on <vmid>     # Démarrer une VM
vim-cmd vmsvc/power.off <vmid>    # Arrêter une VM

# Réseau
esxcli network vswitch standard list   # Lister les vSwitchs
esxcli network ip interface list       # Interfaces VMkernel

# Stockage
esxcli storage filesystem list         # Datastores
```
