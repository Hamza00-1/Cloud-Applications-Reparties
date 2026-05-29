# TP5.1 — Schématisation d'architecture distribuée
# Module : Applications Réparties et Cybersécurité
# Description : Serveur multi-threaded simulant un système distribué
#               avec découverte de services et communication inter-nœuds

import socket
import threading
import json
import time
import random

class NoeudDistribue:
    """
    TP 5.1 — Représente un nœud dans un système distribué.
    Chaque nœud a son propre serveur et peut communiquer avec d'autres nœuds.
    """

    def __init__(self, nom, port, pairs=None):
        self.nom = nom
        self.port = port
        self.pairs = pairs or []  # Liste des (host, port) des autres nœuds
        self.documents = {}       # Stockage local
        self.horloge_logique = 0  # Horloge de Lamport (TP 5.2)
        self.actif = True
        self._lock = threading.Lock()

    def incrementer_horloge(self):
        """TP 5.2 — Horloge logique de Lamport : incrémentation locale"""
        with self._lock:
            self.horloge_logique += 1
            return self.horloge_logique

    def synchroniser_horloge(self, horloge_recue):
        """TP 5.2 — Synchronisation de l'horloge lors de la réception d'un message"""
        with self._lock:
            self.horloge_logique = max(self.horloge_logique, horloge_recue) + 1
            return self.horloge_logique

    def demarrer_serveur(self):
        """Lance le serveur TCP du nœud"""
        serveur = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        serveur.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        serveur.bind(("localhost", self.port))
        serveur.listen(5)
        serveur.settimeout(1.0)
        print(f"[{self.nom}] 🟢 Serveur démarré sur le port {self.port}")

        while self.actif:
            try:
                client, adresse = serveur.accept()
                thread = threading.Thread(
                    target=self.traiter_requete,
                    args=(client, adresse),
                    daemon=True
                )
                thread.start()
            except socket.timeout:
                continue
        serveur.close()

    def traiter_requete(self, client, adresse):
        """Traite une requête entrante"""
        try:
            donnees = client.recv(4096).decode("utf-8")
            requete = json.loads(donnees)

            # Synchroniser l'horloge avec celle de l'émetteur
            horloge_source = requete.get("horloge", 0)
            self.synchroniser_horloge(horloge_source)

            action = requete.get("action")
            print(f"[{self.nom}] 📨 Reçu: {action} de {requete.get('source', '?')} "
                  f"(horloge: {self.horloge_logique})")

            # TP 5.2 — Simulation de latence variable (jitter)
            latence = random.uniform(0.01, 0.1)
            time.sleep(latence)

            if action == "STOCKER":
                cle = requete["cle"]
                valeur = requete["valeur"]
                self.documents[cle] = {
                    "valeur": valeur,
                    "horloge": self.horloge_logique,
                    "source": requete.get("source")
                }
                reponse = {"statut": "OK", "message": f"Document '{cle}' stocké"}

            elif action == "LIRE":
                cle = requete["cle"]
                if cle in self.documents:
                    reponse = {"statut": "OK", "document": self.documents[cle]}
                else:
                    reponse = {"statut": "ERREUR", "message": "Document introuvable"}

            elif action == "LISTER":
                reponse = {
                    "statut": "OK",
                    "documents": list(self.documents.keys()),
                    "total": len(self.documents)
                }

            elif action == "PING":
                reponse = {
                    "statut": "OK",
                    "noeud": self.nom,
                    "horloge": self.horloge_logique,
                    "documents": len(self.documents)
                }
            else:
                reponse = {"statut": "ERREUR", "message": "Action inconnue"}

            reponse["horloge"] = self.horloge_logique
            reponse["noeud"] = self.nom
            client.send(json.dumps(reponse).encode("utf-8"))

        except Exception as e:
            erreur = {"statut": "ERREUR", "message": str(e)}
            client.send(json.dumps(erreur).encode("utf-8"))
        finally:
            client.close()

    def envoyer_requete(self, host, port, requete):
        """Envoie une requête à un autre nœud"""
        self.incrementer_horloge()
        requete["horloge"] = self.horloge_logique
        requete["source"] = self.nom

        try:
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.settimeout(5.0)  # Timeout de 5 secondes
            sock.connect((host, port))
            sock.send(json.dumps(requete).encode("utf-8"))
            reponse = sock.recv(4096).decode("utf-8")
            sock.close()
            return json.loads(reponse)
        except socket.timeout:
            print(f"[{self.nom}] ⏱️ Timeout lors de la connexion à {host}:{port}")
            return {"statut": "ERREUR", "message": "Timeout — nœud injoignable"}
        except ConnectionRefusedError:
            print(f"[{self.nom}] ❌ Connexion refusée par {host}:{port}")
            return {"statut": "ERREUR", "message": "Connexion refusée — panne partielle ?"}

    def repliquer_document(self, cle, valeur):
        """TP 5.1 — Réplication d'un document vers tous les pairs"""
        print(f"[{self.nom}] 🔄 Réplication de '{cle}' vers {len(self.pairs)} pairs...")
        resultats = []
        for host, port in self.pairs:
            requete = {"action": "STOCKER", "cle": cle, "valeur": valeur}
            resultat = self.envoyer_requete(host, port, requete)
            resultats.append({"noeud": f"{host}:{port}", "resultat": resultat})
        return resultats

    def arreter(self):
        """Arrête le nœud"""
        self.actif = False
        print(f"[{self.nom}] 🔴 Nœud arrêté")


# =====================================================
# DÉMONSTRATION — Système distribué avec 3 nœuds
# =====================================================
if __name__ == "__main__":
    print("=" * 60)
    print("  TP 5.1 — Système Distribué avec 3 Nœuds")
    print("  Horloge de Lamport + Réplication + Pannes partielles")
    print("=" * 60)

    # Créer 3 nœuds interconnectés
    noeud_a = NoeudDistribue("Noeud-A", 9001, [("localhost", 9002), ("localhost", 9003)])
    noeud_b = NoeudDistribue("Noeud-B", 9002, [("localhost", 9001), ("localhost", 9003)])
    noeud_c = NoeudDistribue("Noeud-C", 9003, [("localhost", 9001), ("localhost", 9002)])

    # Démarrer les serveurs dans des threads séparés
    for noeud in [noeud_a, noeud_b, noeud_c]:
        thread = threading.Thread(target=noeud.demarrer_serveur, daemon=True)
        thread.start()

    time.sleep(1)  # Attendre le démarrage

    print("\n--- Test 1 : Stockage et lecture ---")
    # Noeud A stocke un document
    noeud_a.documents["rapport_2024"] = {
        "valeur": "Rapport annuel 2024",
        "horloge": noeud_a.incrementer_horloge(),
        "source": "Noeud-A"
    }
    print(f"[Noeud-A] Document stocké localement")

    # Noeud A réplique vers B et C
    print("\n--- Test 2 : Réplication vers les pairs ---")
    resultats = noeud_a.repliquer_document("rapport_2024", "Rapport annuel 2024")
    for r in resultats:
        print(f"  → {r['noeud']} : {r['resultat'].get('statut', 'ERREUR')}")

    # Vérifier la cohérence — lire depuis B
    print("\n--- Test 3 : Lecture depuis un pair (cohérence) ---")
    reponse = noeud_a.envoyer_requete("localhost", 9002, {"action": "LIRE", "cle": "rapport_2024"})
    print(f"  Lecture depuis Noeud-B : {reponse}")

    # Ping pour vérifier les horloges
    print("\n--- Test 4 : Vérification des horloges logiques ---")
    for port, nom in [(9001, "A"), (9002, "B"), (9003, "C")]:
        reponse = noeud_a.envoyer_requete("localhost", port, {"action": "PING"})
        print(f"  Noeud-{nom} : horloge={reponse.get('horloge', '?')}, "
              f"docs={reponse.get('documents', '?')}")

    # TP 5.2 — Simuler une panne partielle
    print("\n--- Test 5 : Simulation de panne partielle ---")
    noeud_c.arreter()
    time.sleep(0.5)
    reponse = noeud_a.envoyer_requete("localhost", 9003, {"action": "PING"})
    print(f"  Tentative de contact Noeud-C : {reponse.get('message', reponse.get('statut'))}")
    print("  → Le système continue de fonctionner malgré la panne de C !")

    # Nettoyage
    time.sleep(1)
    for noeud in [noeud_a, noeud_b]:
        noeud.arreter()

    print("\n✅ Démonstration terminée avec succès !")
