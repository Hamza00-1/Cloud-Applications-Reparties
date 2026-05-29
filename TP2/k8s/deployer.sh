#!/bin/bash
# TP2 — Script de déploiement Kubernetes
# Description : Déploiement complet de l'application sur le cluster K8s
# Prérequis : kubectl configuré et connecté au cluster

echo "============================================="
echo "  TP2 — Déploiement Kubernetes"
echo "  Module : Cloud & Applications Réparties"
echo "============================================="

# Étape 1 : Vérifier la connexion au cluster
echo ""
echo "[1/6] Vérification de la connexion au cluster..."
kubectl cluster-info
if [ $? -ne 0 ]; then
    echo "❌ Erreur : Impossible de se connecter au cluster Kubernetes"
    exit 1
fi
echo "✅ Cluster accessible"

# Étape 2 : Vérifier les nœuds
echo ""
echo "[2/6] Vérification des nœuds du cluster..."
kubectl get nodes -o wide
echo ""

# Étape 3 : Créer le namespace
echo "[3/6] Création du namespace tp2-kubeflow..."
kubectl apply -f namespace.yaml
echo "✅ Namespace créé"

# Étape 4 : Déployer l'application
echo ""
echo "[4/6] Déploiement de l'application (3 réplicas)..."
kubectl apply -f deployment.yaml
echo "✅ Deployment créé"

# Étape 5 : Exposer le service
echo ""
echo "[5/6] Création du service NodePort..."
kubectl apply -f service.yaml
echo "✅ Service créé"

# Étape 6 : Vérification
echo ""
echo "[6/6] Vérification du déploiement..."
echo ""
echo "--- Pods ---"
kubectl get pods -n tp2-kubeflow -o wide
echo ""
echo "--- Services ---"
kubectl get svc -n tp2-kubeflow
echo ""
echo "--- Deployments ---"
kubectl get deployments -n tp2-kubeflow

echo ""
echo "============================================="
echo "  ✅ Déploiement terminé avec succès !"
echo "  Accès : http://<NODE_IP>:30080"
echo "============================================="
