#!/bin/bash
# TP Cloud — Configuration réseau Proxmox VE
# Description : Création de bridges pour la segmentation réseau

echo "============================================="
echo "  TP Cloud — Configuration Réseau Proxmox"
echo "============================================="

# Configuration réseau Proxmox (/etc/network/interfaces)
cat > /etc/network/interfaces << 'EOF'
# Interface physique (ne pas toucher)
auto lo
iface lo inet loopback

# Interface physique principale
auto ens18
iface ens18 inet manual

# ====================================================
# Bridge 1 : Réseau de Management
# ====================================================
auto vmbr0
iface vmbr0 inet static
    address 10.0.0.10/24
    gateway 10.0.0.1
    bridge-ports ens18
    bridge-stp off
    bridge-fd 0
    # Description : Réseau de management Proxmox

# ====================================================
# Bridge 2 : Réseau des VMs (Production)
# ====================================================
auto vmbr1
iface vmbr1 inet manual
    bridge-ports none
    bridge-stp off
    bridge-fd 0
    # Description : Réseau isolé pour les VMs de production
    # Les VMs communiquent entre elles mais pas avec le management

# ====================================================
# Bridge 3 : Réseau DMZ
# ====================================================
auto vmbr2
iface vmbr2 inet manual
    bridge-ports none
    bridge-stp off
    bridge-fd 0
    # Description : Zone démilitarisée pour les services exposés

# ====================================================
# Bridge 4 : Réseau de sauvegarde (Veeam)
# ====================================================
auto vmbr3
iface vmbr3 inet manual
    bridge-ports none
    bridge-stp off
    bridge-fd 0
    # Description : Réseau dédié aux sauvegardes (isolé)
EOF

echo "✅ Configuration réseau appliquée"
echo ""
echo "Bridges configurés :"
echo "  vmbr0 — Management (10.0.0.0/24)"
echo "  vmbr1 — VMs Production (isolé)"
echo "  vmbr2 — DMZ (services exposés)"
echo "  vmbr3 — Sauvegarde Veeam (isolé)"
echo ""
echo "Appliquer avec : ifreload -a"
