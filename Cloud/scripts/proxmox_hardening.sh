#!/bin/bash
# TP Cloud — Configuration de sécurité Proxmox VE
# Description : Script de durcissement (hardening) d'un nœud Proxmox

echo "============================================="
echo "  TP Cloud — Durcissement Proxmox VE"
echo "============================================="

# 1. Mise à jour du système
echo "[1/8] Mise à jour du système..."
apt update && apt full-upgrade -y

# 2. Configuration SSH sécurisée
echo "[2/8] Durcissement SSH..."
cat > /etc/ssh/sshd_config.d/hardening.conf << 'EOF'
# Interdire la connexion root par mot de passe
PermitRootLogin prohibit-password

# Utiliser uniquement le protocole SSH v2
Protocol 2

# Timeout de session (5 min)
ClientAliveInterval 300
ClientAliveCountMax 0

# Limiter les tentatives de connexion
MaxAuthTries 3
MaxSessions 2

# Désactiver les méthodes d'auth faibles
PasswordAuthentication no
ChallengeResponseAuthentication no

# Journalisation verbose
LogLevel VERBOSE
EOF
systemctl restart sshd

# 3. Configuration du pare-feu Proxmox (niveau Datacenter)
echo "[3/8] Configuration du pare-feu..."
# Activer le firewall
pvesh set /cluster/firewall/options -enable 1

# Règle : Autoriser SSH (port 22) depuis le réseau de management uniquement
pvesh create /cluster/firewall/rules -action ACCEPT -type in \
    -proto tcp -dport 22 -source 10.0.0.0/8 -comment "SSH management"

# Règle : Autoriser l'interface web Proxmox (port 8006)
pvesh create /cluster/firewall/rules -action ACCEPT -type in \
    -proto tcp -dport 8006 -source 10.0.0.0/8 -comment "Proxmox Web GUI"

# Règle : Bloquer tout le reste (politique par défaut)
pvesh set /cluster/firewall/options -policy_in DROP

# 4. Configuration NTP (synchronisation horaire)
echo "[4/8] Configuration NTP..."
apt install -y chrony
cat > /etc/chrony/chrony.conf << 'EOF'
server ntp.ubuntu.com iburst
server pool.ntp.org iburst
driftfile /var/lib/chrony/chrony.drift
makestep 1 3
rtcsync
logdir /var/log/chrony
EOF
systemctl restart chronyd

# 5. Création des rôles RBAC
echo "[5/8] Configuration RBAC..."
# Créer un rôle d'opérateur VM (sans accès admin)
pveum role add VMOperator -privs "VM.Audit VM.Console VM.PowerMgmt"

# Créer un rôle d'auditeur (lecture seule)
pveum role add Auditeur -privs "Sys.Audit VM.Audit Datastore.Audit"

# Créer un utilisateur opérateur
pveum user add operateur@pve -comment "Opérateur VM"
pveum aclmod / -user operateur@pve -role VMOperator

# 6. Configuration des sauvegardes automatiques
echo "[6/8] Configuration des sauvegardes vzdump..."
cat > /etc/vzdump.conf << 'EOF'
# Sauvegarde quotidienne à 2h du matin
# Mode snapshot pour ne pas arrêter les VMs
tmpdir: /var/tmp
dumpdir: /var/lib/vz/dump
mode: snapshot
compress: zstd
mailnotification: always
EOF

# 7. Journalisation et audit
echo "[7/8] Configuration de l'audit..."
# Activer la journalisation détaillée
cat >> /etc/rsyslog.d/proxmox-audit.conf << 'EOF'
# Log toutes les actions d'authentification
auth,authpriv.* /var/log/auth.log
# Log les actions Proxmox
local0.* /var/log/proxmox-audit.log
EOF
systemctl restart rsyslog

# 8. Vérification finale
echo "[8/8] Vérification..."
echo ""
echo "--- État du pare-feu ---"
pvesh get /cluster/firewall/options
echo ""
echo "--- Rôles RBAC ---"
pveum role list
echo ""
echo "--- Utilisateurs ---"
pveum user list
echo ""
echo "--- État NTP ---"
chronyc tracking

echo ""
echo "============================================="
echo "  ✅ Durcissement Proxmox VE terminé !"
echo "============================================="
