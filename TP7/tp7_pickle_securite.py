# TP7.4 — Politique de sécurité Pickle
# Description : Démonstration des risques de pickle et politique de sécurité

import pickle
import json
import os

# =====================================================
# DÉMONSTRATION DU DANGER DE PICKLE
# =====================================================

class DocumentSur:
    """Classe sûre pour la sérialisation"""
    def __init__(self, titre, contenu):
        self.titre = titre
        self.contenu = contenu
    def __repr__(self):
        return f"Document('{self.titre}')"

# ⚠️ Classe malveillante — EXEMPLE ÉDUCATIF
class PayloadMalveillant:
    """
    ATTENTION : Cette classe démontre pourquoi pickle est DANGEREUX.
    En production, un attaquant pourrait envoyer un objet sérialisé
    qui exécute du code arbitraire lors de la désérialisation.
    """
    def __reduce__(self):
        # En vrai, ceci exécuterait : os.system("rm -rf / ou whoami")
        # Ici on retourne juste une commande inoffensive pour la démo
        return (print, ("🔴 CODE ARBITRAIRE EXÉCUTÉ VIA PICKLE !",))


def demo_pickle_danger():
    """Démontre le risque de désérialisation pickle"""
    print("\n--- Démonstration du danger de Pickle ---")
    
    # 1. Sérialisation normale (sûre côté émetteur)
    doc = DocumentSur("Rapport", "Contenu confidentiel")
    pickle_safe = pickle.dumps(doc)
    print(f"  Document sérialisé : {len(pickle_safe)} octets")
    
    doc_recupere = pickle.loads(pickle_safe)
    print(f"  Désérialisé : {doc_recupere} ✅")
    
    # 2. Sérialisation malveillante
    print("\n  ⚠️ Simulation d'un payload malveillant :")
    payload = PayloadMalveillant()
    pickle_malveillant = pickle.dumps(payload)
    print(f"  Payload sérialisé : {len(pickle_malveillant)} octets")
    print(f"  Désérialisation du payload :")
    print(f"  → ", end="")
    pickle.loads(pickle_malveillant)  # Exécute le print
    print(f"  → Un attaquant aurait pu exécuter n'importe quelle commande !")


# =====================================================
# POLITIQUE DE SÉCURITÉ
# =====================================================

POLITIQUE_SERIALISATION = {
    "format_autorise_reseau": "JSON",
    "format_autorise_interne": "JSON ou Protobuf",
    "format_interdit": "Pickle (pour données non fiables)",
    "regles": [
        "JAMAIS utiliser pickle pour des données provenant du réseau",
        "JAMAIS utiliser pickle pour des données d'un utilisateur",
        "Pickle uniquement pour le cache local temporaire",
        "JSON pour toutes les APIs REST",
        "Protobuf pour les communications gRPC hautes performances",
        "XML uniquement avec defusedxml si absolument nécessaire",
        "Valider TOUTES les entrées avant désérialisation",
    ]
}


if __name__ == "__main__":
    print("=" * 60)
    print("  TP 7.4 — Sécurité de la Désérialisation")
    print("=" * 60)
    
    demo_pickle_danger()
    
    print(f"\n\n{'=' * 60}")
    print("  📋 POLITIQUE DE SÉCURITÉ SÉRIALISATION")
    print(f"{'=' * 60}")
    print(f"  Format réseau   : {POLITIQUE_SERIALISATION['format_autorise_reseau']}")
    print(f"  Format interne  : {POLITIQUE_SERIALISATION['format_autorise_interne']}")
    print(f"  Format INTERDIT : {POLITIQUE_SERIALISATION['format_interdit']}")
    print(f"\n  Règles :")
    for i, regle in enumerate(POLITIQUE_SERIALISATION['regles'], 1):
        print(f"    {i}. {regle}")
    
    # Comparaison finale
    print(f"\n  Comparaison de sécurité :")
    print(f"  {'Format':<15} {'Exécution de code':<20} {'Sûr pour réseau':<18} {'Recommandé'}")
    print(f"  {'-'*65}")
    print(f"  {'JSON':<15} {'❌ Non':<20} {'✅ Oui':<18} {'✅ Oui'}")
    print(f"  {'Protobuf':<15} {'❌ Non':<20} {'✅ Oui':<18} {'✅ Oui'}")
    print(f"  {'XML':<15} {'⚠️ XXE possible':<20} {'⚠️ Avec précautions':<18} {'⚠️ Si nécessaire'}")
    print(f"  {'Pickle':<15} {'🔴 OUI (RCE !)':<20} {'🔴 NON':<18} {'🔴 INTERDIT'}")
    
    print(f"\n✅ TP 7.4 terminé")
