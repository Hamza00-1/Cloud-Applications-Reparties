# TP7 — Sérialisation et Marshalling (Python)

## 🎯 Objectif
Comprendre les concepts de sérialisation/désérialisation, maîtriser les formats JSON, XML et Protocol Buffers, et identifier les vulnérabilités de désérialisation non sécurisée.

## 📝 Contenu de la séance

### Partie Théorique
- **Concepts fondamentaux** : sérialisation, désérialisation, marshalling, unmarshalling
- **Formats texte vs binaire** : JSON, XML vs Protocol Buffers, MessagePack
- **Schema-less vs Schema-based** : compromis et implications
- **JSON en Python** : types, `json.dumps`/`json.loads`, validation, versioning
- **XML en Python** : parsing sûr, vulnérabilités (XXE, Bombe XML)
- **Protocol Buffers** : fichiers `.proto`, compilation, performance
- **Désérialisation non sécurisée** : risques de `pickle`, attaques RCE

### Partie Pratique
| TP | Thème | Description |
|----|-------|-------------|
| TP 7.1 | Contrat JSON | Définition d'un contrat de données JSON avec validation |
| TP 7.2 | Versioning JSON | Gestion de l'évolution du contrat de données |
| TP 7.3 | Protobuf Python | Sérialisation/désérialisation avec Protocol Buffers |
| TP 7.4 | Politique pickle | Analyse des risques de `pickle` et politique de sécurité |

### Lab Sécurité
- Threat modeling des flux de sérialisation
- Checklist « Secure Deserialization Baseline »

## 📂 Fichiers
- `seance7-serialisation-marshalling.html` — Support de cours complet

## ⏱ Durée
4 heures (240 min)
