# TP7.1 — Contrat de données JSON avec validation
# Module : Applications Réparties et Cybersécurité
# Description : Définition et validation d'un contrat JSON strict
#               pour le Système de Gestion Documentaire Distribué

import json
import re
from datetime import datetime

# =====================================================
# DÉFINITION DU CONTRAT (JSON Schema simplifié)
# =====================================================
SCHEMA_DOCUMENT = {
    "champs_requis": ["titre", "contenu", "auteur", "visibilite"],
    "champs_optionnels": ["tags", "categorie", "date_expiration"],
    "regles": {
        "titre": {"type": "str", "min": 1, "max": 200},
        "contenu": {"type": "str", "min": 1, "max": 50000},
        "auteur": {"type": "str", "min": 2, "max": 50, "pattern": r"^[a-zA-ZÀ-ÿ\s\-]+$"},
        "visibilite": {"type": "str", "valeurs_autorisees": ["public", "prive", "equipe"]},
        "tags": {"type": "list", "max_elements": 10, "element_type": "str", "element_max": 30},
        "categorie": {"type": "str", "valeurs_autorisees": ["rapport", "note", "presentation", "autre"]},
        "date_expiration": {"type": "str", "format": "date_iso"}
    }
}


def valider_type(valeur, type_attendu):
    """Vérifie le type d'une valeur"""
    types = {"str": str, "int": int, "float": float, "bool": bool, "list": list}
    return isinstance(valeur, types.get(type_attendu, str))


def valider_document(document):
    """
    TP 7.1 — Validation complète d'un document selon le contrat.
    Retourne (True, None) si valide, (False, message_erreur) sinon.
    """
    erreurs = []

    # 1. Vérifier que c'est un dictionnaire
    if not isinstance(document, dict):
        return False, ["Le document doit être un objet JSON (dictionnaire)"]

    # 2. Vérifier les champs requis
    for champ in SCHEMA_DOCUMENT["champs_requis"]:
        if champ not in document:
            erreurs.append(f"Champ requis manquant : '{champ}'")

    # 3. Rejeter les champs inconnus (sécurité — pas d'injection de champs)
    champs_autorises = SCHEMA_DOCUMENT["champs_requis"] + SCHEMA_DOCUMENT["champs_optionnels"]
    for champ in document:
        if champ not in champs_autorises:
            erreurs.append(f"Champ inconnu rejeté : '{champ}' (possible tentative d'injection)")

    if erreurs:
        return False, erreurs

    # 4. Valider chaque champ selon les règles
    for champ, valeur in document.items():
        if champ not in SCHEMA_DOCUMENT["regles"]:
            continue

        regles = SCHEMA_DOCUMENT["regles"][champ]

        # Vérification de type
        if not valider_type(valeur, regles["type"]):
            erreurs.append(f"'{champ}' : type invalide (attendu: {regles['type']}, reçu: {type(valeur).__name__})")
            continue

        # Vérification de longueur (string)
        if regles["type"] == "str":
            if "min" in regles and len(valeur) < regles["min"]:
                erreurs.append(f"'{champ}' : trop court (min: {regles['min']}, reçu: {len(valeur)})")
            if "max" in regles and len(valeur) > regles["max"]:
                erreurs.append(f"'{champ}' : trop long (max: {regles['max']}, reçu: {len(valeur)})")

            # Vérification de pattern (regex)
            if "pattern" in regles and not re.match(regles["pattern"], valeur):
                erreurs.append(f"'{champ}' : format invalide (ne correspond pas au pattern)")

            # Vérification de valeurs autorisées (enum)
            if "valeurs_autorisees" in regles and valeur not in regles["valeurs_autorisees"]:
                erreurs.append(f"'{champ}' : valeur '{valeur}' non autorisée "
                               f"(attendu: {regles['valeurs_autorisees']})")

            # Vérification de format date
            if regles.get("format") == "date_iso":
                try:
                    datetime.fromisoformat(valeur)
                except ValueError:
                    erreurs.append(f"'{champ}' : format de date invalide (attendu: ISO 8601)")

        # Vérification de liste
        if regles["type"] == "list":
            if "max_elements" in regles and len(valeur) > regles["max_elements"]:
                erreurs.append(f"'{champ}' : trop d'éléments (max: {regles['max_elements']})")
            for i, elem in enumerate(valeur):
                if not isinstance(elem, str):
                    erreurs.append(f"'{champ}[{i}]' : type invalide (attendu: str)")
                elif "element_max" in regles and len(elem) > regles["element_max"]:
                    erreurs.append(f"'{champ}[{i}]' : élément trop long (max: {regles['element_max']})")

    return (True, None) if not erreurs else (False, erreurs)


def serialiser_document(document):
    """Sérialise un document Python en JSON avec des options sécurisées"""
    return json.dumps(document, ensure_ascii=False, indent=2, default=str)


def deserialiser_document(json_str):
    """Désérialise du JSON en Python avec gestion d'erreurs"""
    try:
        document = json.loads(json_str)
        return True, document
    except json.JSONDecodeError as e:
        return False, f"JSON invalide : {str(e)}"


# =====================================================
# DÉMONSTRATION
# =====================================================
if __name__ == "__main__":
    print("=" * 60)
    print("  TP 7.1 — Validation de Contrat JSON")
    print("=" * 60)

    # Cas 1 : Document valide
    print("\n--- Test 1 : Document valide ---")
    doc_valide = {
        "titre": "Rapport de sécurité Q4 2024",
        "contenu": "Analyse complète des vulnérabilités détectées au quatrième trimestre.",
        "auteur": "Hamza",
        "visibilite": "equipe",
        "tags": ["sécurité", "rapport", "Q4"],
        "categorie": "rapport"
    }
    valide, erreurs = valider_document(doc_valide)
    print(f"  Résultat : {'✅ Valide' if valide else '❌ Invalide'}")
    if valide:
        print(f"  JSON sérialisé :\n{serialiser_document(doc_valide)}")

    # Cas 2 : Champ requis manquant
    print("\n--- Test 2 : Champ requis manquant ---")
    doc_incomplet = {"titre": "Test", "contenu": "Hello"}
    valide, erreurs = valider_document(doc_incomplet)
    print(f"  Résultat : {'✅ Valide' if valide else '❌ Invalide'}")
    if erreurs:
        for e in erreurs:
            print(f"  ⚠️ {e}")

    # Cas 3 : Champ inconnu (tentative d'injection)
    print("\n--- Test 3 : Champ inconnu (injection) ---")
    doc_injection = {
        "titre": "Test",
        "contenu": "Hello",
        "auteur": "Hamza",
        "visibilite": "public",
        "admin": True,  # 🔴 Champ injecté !
        "__proto__": {"isAdmin": True}  # 🔴 Prototype pollution !
    }
    valide, erreurs = valider_document(doc_injection)
    print(f"  Résultat : {'✅ Valide' if valide else '❌ Invalide'}")
    if erreurs:
        for e in erreurs:
            print(f"  ⚠️ {e}")

    # Cas 4 : Valeur hors limites
    print("\n--- Test 4 : Valeurs hors limites ---")
    doc_hors_limites = {
        "titre": "",  # Trop court
        "contenu": "x" * 60000,  # Trop long
        "auteur": "H4ck3r;DROP TABLE",  # Pattern invalide
        "visibilite": "admin_override"  # Valeur non autorisée
    }
    valide, erreurs = valider_document(doc_hors_limites)
    print(f"  Résultat : {'✅ Valide' if valide else '❌ Invalide'}")
    if erreurs:
        for e in erreurs:
            print(f"  ⚠️ {e}")

    # Cas 5 : Désérialisation de JSON malformé
    print("\n--- Test 5 : JSON malformé ---")
    json_invalide = '{"titre": "Test", contenu: "oops"}'  # Manque les guillemets
    succes, resultat = deserialiser_document(json_invalide)
    print(f"  Résultat : {'✅' if succes else '❌'} {resultat}")

    print(f"\n{'=' * 60}")
    print("  ✅ Tests de validation terminés")
    print(f"{'=' * 60}")
