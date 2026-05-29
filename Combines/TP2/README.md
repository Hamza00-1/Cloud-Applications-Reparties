# TP2 — Kubernetes et Démarrage de l'Installation de Kubeflow

## 🎯 Objectif
Comprendre l'architecture de Kubernetes (K8s), maîtriser les commandes kubectl fondamentales, et installer Kubeflow sur un cluster de laboratoire.

## 📝 Contenu de la séance

### Partie Théorique
- Pourquoi Kubernetes après Docker ? (orchestration vs conteneurisation)
- Architecture d'un cluster K8s : Control Plane + Worker Nodes
- Composants essentiels : kube-apiserver, etcd, kube-scheduler, controller-manager, kubelet, kube-proxy
- Objets Kubernetes : Pod, Deployment, Service, Namespace, ConfigMap, Secret, PersistentVolume
- Introduction à Kubeflow comme plateforme MLOps

### Partie Pratique (TPs guidés)
| TP | Thème | Description |
|----|-------|-------------|
| TP 1 | Infrastructure | Mise en place de l'infra de labo (VMs sur Proxmox) |
| TP 2 | Cluster K8s | Installation du cluster avec kubeadm (master + worker) |
| TP 3 | Ressource simple | Déploiement d'un Pod et d'un Service |
| TP 4 | Préparation Kubeflow | Préparation de l'environnement pour Kubeflow |
| TP 5 | Installation Kubeflow | Déploiement de Kubeflow sur le cluster |
| TP 6 | Observation | Observation des ressources déployées |
| TP 7 | Vérification | Vérification du bon fonctionnement |
| TP 8 | Accès initial | Premier accès au dashboard Kubeflow |
| TP 9 | Comprendre l'installé | Analyse des composants installés |
| TP 10 | Nettoyage | Conservation ou nettoyage de l'environnement |

## 🔧 Configuration du Cluster

### Nœud Master
```bash
# Installation des prérequis
sudo apt update && sudo apt upgrade -y
sudo apt install -y docker-ce docker-ce-cli containerd.io
sudo swapoff -a

# Configuration réseau Kubernetes
sudo modprobe overlay && sudo modprobe br_netfilter
sudo sysctl --system

# Installation kubeadm, kubelet, kubectl
sudo apt install -y kubelet kubeadm kubectl
sudo apt-mark hold kubelet kubeadm kubectl

# Initialisation du cluster
sudo kubeadm init
mkdir -p $HOME/.kube
sudo cp -i /etc/kubernetes/admin.conf $HOME/.kube/config

# Installation du réseau (Calico)
kubectl apply -f https://raw.githubusercontent.com/projectcalico/calico/v3.25.0/manifests/calico.yaml
```

### Nœud Worker
```bash
# Mêmes prérequis que le master, puis joindre le cluster :
kubeadm join <MASTER_IP>:6443 --token <TOKEN> \
    --discovery-token-ca-cert-hash sha256:<HASH>
```

## 📂 Fichiers
- `seance2-kubernetes-kubeflow.html` — Support de cours complet
- `master.txt` — Script d'installation du nœud master
- `worker.txt` — Script d'installation du nœud worker

## ⏱ Durée
4 heures (240 min)

## 📌 Environnement
- 2 VMs Ubuntu sur Proxmox VE (master + worker)
- Kubernetes v1.30 via kubeadm
- Réseau : Calico CNI
