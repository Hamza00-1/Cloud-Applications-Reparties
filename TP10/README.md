# TP10 — Invocation d'Objets Distants en Python (Pyro5)

## 🎯 Objectif
Mettre en œuvre un service distant basé sur des objets avec Pyro5 (équivalent Python de Java RMI), avec validation stricte des entrées et sécurisation.

## 📝 Contenu de la séance

### Partie Théorique
- De RPC aux objets distants : comparaison conceptuelle
- Modèle RMI adapté Python : objet, daemon, name server, proxy
- Pyro5 comme équivalent Python de Java RMI
- Publication et découverte de services
- Cybersécurité des objets distants : surface d'attaque

### Partie Pratique
| TP | Thème | Description |
|----|-------|-------------|
| TP 10.1 | DocumentService | Création du service orienté objet distant |
| TP 10.2 | Politique d'exposition | Contrôle des méthodes accessibles (whitelist) |
| TP 10.3 | Validation stricte | Validation des entrées et messages d'erreur sûrs |
| TP 10.4 | Surface d'attaque | Analyse de sécurité et checklist de durcissement |

### Lab Sécurité
- Méthode exposée par erreur → test d'accès `_reload_index()`
- Client non authentifié → vérification par token
- Injection et Path Traversal → validation Regex
- Exception bavarde → anonymisation des erreurs
- Sérialisation sûre → Serpent au lieu de Pickle

## 🔧 Lancement

```bash
cd TP10/

# Terminal 1 : Démarrer le Name Server Pyro5
python -m Pyro5.nameserver

# Terminal 2 : Démarrer le serveur
python server_docs.py

# Terminal 3 : Lancer le client
python client_docs.py
```

## 📂 Fichiers
- `server_docs.py` — Serveur DocumentService avec Pyro5
- `client_docs.py` — Client de test avec scénarios de sécurité
- `Rapport_TP10.md` — Rapport complet du TP
- `seance10_objets_distants_python.html` — Support de cours

## ✅ Résultats d'exécution

```
=== Démarrage du Client RMI ===
✅ Name Server contacté. Service trouvé.

[TP 10.2] Validation d'Authentification
✅ List documents (Valid Token) : 3 éléments trouvés
❌ List documents (Invalid Token) : PermissionError - Accès refusé

[TP 10.3] Validation des Entrées
✅ Cas normal ('doc_001') : Rapport annuel 2024
❌ Path traversal ('../../etc') : ValueError - Identifiant invalide
❌ Type invalide (12345) : ValueError - Paramètre invalide
❌ Format invalide ('doc;DROP') : ValueError - Identifiant invalide

[TP 10.4] Méthodes non exposées
❌ _reload_index() : AttributeError - no exposed attribute
```

## ⏱ Durée
4 heures (240 min)
