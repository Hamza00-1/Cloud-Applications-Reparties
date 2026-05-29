# Rapport TP 10 — Invocation d'Objets Distants (Pyro5)

## 1. Introduction
Ce rapport valide l'ensemble des exercices du TP 10 sur la mise en place d'une architecture d'objets distants sécurisée avec Python et la bibliothèque `Pyro5`. Le système implémente un `DocumentService` publié sur un Name Server avec plusieurs couches de sécurité (Validation, Authentification, Zero Trust).

## 2. TP 10.1 & 10.2 : Service Distant & Politique d'Exposition

Le code source a été séparé en deux entités distinctes :
- **Serveur (`tp10/server_docs.py`)** : Déclare la classe distante `DocumentService`, enregistre l'objet auprès du démon et du Name Server sous l'alias `bank.documents.service`.
- **Client (`tp10/client_docs.py`)** : Se connecte au Name Server, récupère l'URI et effectue des appels transparents via un `Proxy`.

### Tableau de Politique d'Exposition

| Méthode | Exposée ? | Pourquoi | Risque si exposée sans contrôle |
| :--- | :---: | :--- | :--- |
| `list_documents()` | ✅ Oui | Nécessaire pour la navigation client | Fuite potentielle de noms de fichiers internes. Protégé par Token. |
| `get_document_content()` | ✅ Oui | Service métier principal | Risques de Path traversal et accès non autorisé. Protégé par Regex et Token. |
| `_check_token()` | ❌ Non | Méthode de vérification interne | Permettrait de bypasser ou analyser l'authentification. |
| `_reload_index()` | ❌ Non | Opération d'administration critique | Déni de service (DoS), corruption d'état de l'index. |

> **Note de Sécurité** : La politique adoptée repose sur le principe du "Moindre Privilège" via une "Liste Blanche". Seules les méthodes explicitement décorées avec `@Pyro5.api.expose` sont accessibles sur le réseau. L'authentification par Token a été ajoutée pour vérifier chaque appel légitime.

---

## 3. TP 10.3 : Validation Stricte des Entrées et Erreurs Sûres

Les méthodes accessibles via le réseau reçoivent des "Inputs" non fiables. Pour minimiser la surface d'attaque, la méthode `get_document_content(doc_id, token)` valide l'entrée avant tout traitement :

1. **Validation de Type** : `isinstance(doc_id, str)`
2. **Validation de Longueur** : Comprise entre 3 et 32 caractères.
3. **Validation de Format** : Utilisation d'une Regex `^[a-zA-Z0-9_]+$` pour interdire les caractères d'injection (`/`, `\`, `.`, `;`, etc.).

### Erreurs "Sûres" (Safe Exceptions)
Toutes les exceptions sont interceptées par le serveur. Les erreurs renvoyées au client sont **génériques** (`ValueError: Identifiant invalide`), tandis que les traces réelles (Stacktrace) sont **journalisées en local sur le serveur** pour empêcher toute fuite d'informations sur le système de fichiers ou la structure du code.

---

## 4. TP 10.4 & Lab Sécurité : Surface d'Attaque

Le module d'objets distants a été durci contre les 5 scénarios d'attaque principaux de la checklist de sécurité :

1. **Méthode exposée par erreur** : La méthode interne `_reload_index()` n'est pas décorée. Si le client tente de l'invoquer, le proxy refuse l'accès immédiatement avec une erreur `AttributeError` (le serveur cache même l'existence de la méthode).
2. **Client non authentifié** : Un token `secret-tp10-2024` est exigé. En son absence ou s'il est erroné, la requête échoue avec `PermissionError`.
3. **Argument malformé ou Injection** : Les tentatives de Path Traversal (`../../etc`), d'injection (`doc;DROP`) ou de dépassement de tampon (`a` * 100) échouent proprement sur les validations Regex et longueur, sans jamais atteindre la logique métier.
4. **Exception bavarde** : Les messages renvoyés aux clients ont été anonymisés (ex: "Erreur de service interne. Contactez l'administrateur.").
5. **Sérialisation Sûre** : `Pyro5` a été configuré (par défaut) pour utiliser `Serpent` et non `Pickle`, garantissant qu'aucune exécution de code arbitraire (RCE) n'est possible via le payload.

---

## 5. Preuve d'Exécution (Logs)

L'exécution combinée a été réalisée avec succès et a renvoyé :

```text
=== Démarrage du Client RMI ===
✅ Name Server contacté. Service trouvé à l'URI: PYRO:obj_3c6426c7eb05479d87dfb12937658e24@localhost:56340

[TP 10.2] Validation d'Authentification
--- Test: List documents (Valid Token) ---
✅ Succès : 3 éléments trouvés -> ['doc_001', 'doc_002', 'doc_003']

--- Test: List documents (Invalid Token) ---
❌ Erreur interceptée : PermissionError - Accès refusé

[TP 10.3] Validation des Entrées (Type, Format, Injection)
--- Test: Cas normal ('doc_001') ---
✅ Succès : Rapport annuel 2024 — données confidentielles

--- Test: Document inexistant ('doc_999') ---
❌ Erreur interceptée : KeyError - Document introuvable

--- Test: Path traversal ('../../etc') ---
❌ Erreur interceptée : ValueError - Identifiant invalide

--- Test: Type invalide (12345) ---
❌ Erreur interceptée : ValueError - Paramètre invalide

--- Test: Format Invalide ('doc;DROP') ---
❌ Erreur interceptée : ValueError - Identifiant invalide

[TP 10.4] Attaque sur les méthodes non exposées
--- Test: Appel méthode interne _reload_index() ---
❌ Erreur interceptée : AttributeError - remote object has no exposed attribute or method '_reload_index'
```

*Fin du Rapport.*
