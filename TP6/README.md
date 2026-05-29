# TP6 — Communication, APIs et Fiabilité

## 🎯 Objectif
Maîtriser la conception d'APIs REST, les patterns de fiabilité (timeout, retry, backoff exponentiel), et analyser les risques cybersécurité liés aux APIs.

## 📝 Contenu de la séance

### Partie Théorique
- **Communication distribuée** : synchrone (Request/Response) vs asynchrone (Messaging)
- **Conception d'API** : contrat d'interface, méthodes HTTP, codes d'erreur, idempotence, pagination
- **Patterns de fiabilité** :
  - Timeouts (read timeout, connect timeout)
  - Retries avec backoff exponentiel + jitter
  - Circuit Breaker (concept)
  - Rate Limiting
- **Cybersécurité des APIs** : authentification, autorisation, MITM, injection, SSRF

### Partie Pratique
| TP | Thème | Description |
|----|-------|-------------|
| TP 6.1 | Spécification d'API | Conception d'un contrat API REST pour le système documentaire |
| TP 6.2 | Fiabilité client | Implémentation de timeout, retry et backoff exponentiel en Python |
| TP 6.3 | Sécurité API | Matrice de sécurité et checklist de durcissement |

### Code Source
- `Server.py` — Serveur HTTP avec Flask (gestion documentaire)
- `client.py` — Client HTTP basique
- `client_retry.py` — Client avec retry et backoff exponentiel
- `client_async.py` — Client asynchrone
- `main_api.py` — API REST complète avec validation
- `live_coding_2_client.py` — Démonstration live coding client
- `live_coding_3_retry.py` — Démonstration retry/backoff

## 🔧 Lancement

```bash
# Démarrer le serveur
cd TP6/
python Server.py

# Dans un autre terminal, lancer le client
python client_retry.py
```

## 📂 Fichiers
- `A.R CS.html` — Support de cours (Séance 6)
- `TP 6.1 — Spécification d'API.md` — Livrable TP 6.1
- `TP 6.2 — Fiabilité côté client.md` — Livrable TP 6.2
- `TP 6.3 — Sécurité API.md` — Livrable TP 6.3

## ⏱ Durée
4 heures (240 min)
