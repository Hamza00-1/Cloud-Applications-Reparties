import Pyro5.api
import logging
import re

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s'
)
logger = logging.getLogger(__name__)

# Données simulées côté serveur
_DOCUMENTS = {
    "doc_001": "Rapport annuel 2024 — données confidentielles",
    "doc_002": "Politique de sécurité — version 3.2",
    "doc_003": "Guide d'utilisation — accès public",
}

@Pyro5.api.expose
class DocumentService:
    """Service de gestion de documents — équivalent RMI Python (Version Sécurisée)."""

    # Token partagé pour l'authentification (pour l'exercice)
    _VALID_TOKEN = "secret-tp10-2024"

    def _check_token(self, token: str):
        """Méthode interne pour vérifier le token d'accès. Inaccessible à distance."""
        if token != self._VALID_TOKEN:
            logger.warning(f"Token invalide reçu: {token!r}")
            raise PermissionError("Accès refusé")

    def list_documents(self, token: str) -> list:
        """Retourne la liste des IDs de documents disponibles."""
        self._check_token(token)
        logger.info("Appel list_documents()")
        return list(_DOCUMENTS.keys())

    def get_document_content(self, doc_id: str, token: str) -> str:
        """Retourne le contenu d'un document après validation stricte et authentification."""
        self._check_token(token)
        
        # 1. Validation du type
        if not isinstance(doc_id, str):
            logger.warning(f"Type invalide reçu pour doc_id: {type(doc_id)}")
            raise ValueError("Paramètre invalide")
            
        # 2. Validation de la longueur
        if not (3 <= len(doc_id) <= 32):
            logger.warning(f"Longueur invalide pour doc_id: {len(doc_id)}")
            raise ValueError("Identifiant invalide")

        # 3. Validation du format (alphanumérique + underscore)
        if not re.match(r'^[a-zA-Z0-9_]+$', doc_id):
            logger.warning(f"Format doc_id non conforme: {doc_id!r}")
            raise ValueError("Identifiant invalide")

        # 4. Vérification existence et Exceptions Sûres
        try:
            if doc_id not in _DOCUMENTS:
                logger.info(f"Document non trouvé: {doc_id}")
                raise KeyError("Document introuvable")
            
            logger.info(f"Document servi: {doc_id}")
            return _DOCUMENTS[doc_id]
        except KeyError as e:
            raise e
        except Exception as e:
            # Séparation de l'information : log détaillé en interne, message générique au client
            logger.error(f"Erreur interne inattendue sur {doc_id}: {e}", exc_info=True)
            raise RuntimeError("Erreur de service interne. Contactez l'administrateur.")

    def _reload_index(self):
        """Méthode INTERNE d'administration. Pas de @expose, donc invisible sur le réseau."""
        logger.info("Rechargement de l'index interne effectué.")
        pass

def main():
    try:
        # Création du serveur d'objet (Daemon)
        with Pyro5.api.Daemon() as daemon:
            # Recherche du serveur de noms (Name Server)
            ns = Pyro5.api.locate_ns()
            # Enregistrement de la classe au sein du serveur pour générer un URI
            uri = daemon.register(DocumentService)
            # Enregistrement logique sur le serveur de nom
            ns.register("bank.documents.service", uri)
            logger.info(f"DocumentService prêt et enregistré. URI: {uri}")
            
            # Lancement de la boucle d'attente
            daemon.requestLoop()
    except Exception as e:
        logger.error(f"Erreur au lancement du serveur: {e}")

if __name__ == "__main__":
    main()
