import sys
import Pyro5.api

def run_test(name, func, *args):
    print(f"\n--- Test: {name} ---")
    try:
        res = func(*args)
        if isinstance(res, list):
            print(f"✅ Succès : {len(res)} éléments trouvés -> {res}")
        else:
            print(f"✅ Succès : {res}")
    except Exception as e:
        print(f"❌ Erreur interceptée : {type(e).__name__} - {e}")

def main():
    # Force UTF-8 encoding for Windows terminals to display emojis correctly
    if hasattr(sys.stdout, 'reconfigure'):
        sys.stdout.reconfigure(encoding='utf-8')
        
    print("=== Démarrage du Client RMI ===")
    
    try:
        # Localiser le Name Server et demander l'adresse du service
        ns = Pyro5.api.locate_ns()
        uri = ns.lookup("bank.documents.service")
        print(f"✅ Name Server contacté. Service trouvé à l'URI: {uri}")
    except Exception as e:
        print(f"❌ Erreur de connexion au Name Server ou Service introuvable: {e}")
        print("Avez-vous bien lancé 'python -m Pyro5.nameserver' et 'server_docs.py' ?")
        return

    # Connexion à l'objet distant via un Proxy transparent
    with Pyro5.api.Proxy(uri) as proxy:
        valid_token = "secret-tp10-2024"
        invalid_token = "hack-123"

        # --- TP 10.2 : Contrôle d'accès (Token) ---
        print("\n[TP 10.2] Validation d'Authentification")
        run_test("List documents (Valid Token)", proxy.list_documents, valid_token)
        run_test("List documents (Invalid Token)", proxy.list_documents, invalid_token)

        # --- TP 10.3 : Validation Stricte des Entrées ---
        print("\n[TP 10.3] Validation des Entrées (Type, Format, Injection)")
        run_test("Cas normal ('doc_001')", proxy.get_document_content, "doc_001", valid_token)
        run_test("Document inexistant ('doc_999')", proxy.get_document_content, "doc_999", valid_token)
        run_test("Path traversal ('../../etc')", proxy.get_document_content, "../../etc", valid_token)
        run_test("Type invalide (12345)", proxy.get_document_content, 12345, valid_token)
        run_test("Chaîne vide ('')", proxy.get_document_content, "", valid_token)
        run_test("Trop long ('a' * 100)", proxy.get_document_content, "a"*100, valid_token)
        run_test("Format Invalide ('doc;DROP')", proxy.get_document_content, "doc;DROP", valid_token)

        # On peut aussi vérifier que l'appel d'une méthode interne cachée explose (Attaque Exposition TP 10.4)
        print("\n[TP 10.4] Attaque sur les méthodes non exposées")
        print("\n--- Test: Appel méthode interne _reload_index() ---")
        try:
            proxy._reload_index()
            print("❌ ERREUR CRITIQUE : La méthode secrète a pu être appelée !")
        except AttributeError as e:
            print(f"✅ Succès : Attaque bloquée ! Erreur interceptée : AttributeError - {e}")

    print("\n=== Fin des tests du Client ===")

if __name__ == "__main__":
    main()
