# TP7.3 — Protocol Buffers en Python
# Description : Sérialisation binaire avec Protobuf (simulation sans compilation)

import json
import struct
import time

class DocumentProtobuf:
    """Simulation de sérialisation Protobuf pour le TP7"""
    
    def __init__(self, id_doc=0, titre="", contenu="", auteur="", visibilite="public"):
        self.id_doc = id_doc
        self.titre = titre
        self.contenu = contenu
        self.auteur = auteur
        self.visibilite = visibilite
    
    def serialiser_binaire(self):
        """Sérialisation binaire compacte (simulation Protobuf)"""
        titre_bytes = self.titre.encode('utf-8')
        contenu_bytes = self.contenu.encode('utf-8')
        auteur_bytes = self.auteur.encode('utf-8')
        vis_bytes = self.visibilite.encode('utf-8')
        
        # Format: [id(4)][len_titre(2)][titre][len_contenu(2)][contenu][len_auteur(2)][auteur][len_vis(2)][vis]
        data = struct.pack('>I', self.id_doc)
        for champ in [titre_bytes, contenu_bytes, auteur_bytes, vis_bytes]:
            data += struct.pack('>H', len(champ)) + champ
        return data
    
    @classmethod
    def deserialiser_binaire(cls, data):
        """Désérialisation depuis le format binaire"""
        offset = 0
        id_doc = struct.unpack_from('>I', data, offset)[0]; offset += 4
        champs = []
        for _ in range(4):
            longueur = struct.unpack_from('>H', data, offset)[0]; offset += 2
            champs.append(data[offset:offset+longueur].decode('utf-8')); offset += longueur
        return cls(id_doc, *champs)
    
    def to_json(self):
        return json.dumps(self.__dict__, ensure_ascii=False)
    
    def __repr__(self):
        return f"Document(id={self.id_doc}, titre='{self.titre}', auteur='{self.auteur}')"


def benchmark_serialisation(n=1000):
    """Compare JSON vs binaire en performance"""
    doc = DocumentProtobuf(1, "Rapport sécurité Q4", "Contenu détaillé "*50, "Hamza", "equipe")
    
    # JSON
    debut = time.perf_counter()
    for _ in range(n):
        serialise = doc.to_json()
        json.loads(serialise)
    temps_json = time.perf_counter() - debut
    taille_json = len(serialise.encode('utf-8'))
    
    # Binaire
    debut = time.perf_counter()
    for _ in range(n):
        serialise = doc.serialiser_binaire()
        DocumentProtobuf.deserialiser_binaire(serialise)
    temps_bin = time.perf_counter() - debut
    taille_bin = len(serialise)
    
    print(f"\n{'Métrique':<25} {'JSON':>12} {'Binaire':>12} {'Gain':>10}")
    print("-" * 62)
    print(f"{'Taille (octets)':<25} {taille_json:>12} {taille_bin:>12} {(1-taille_bin/taille_json)*100:>9.1f}%")
    print(f"{'Temps {n} itérations':<25} {temps_json*1000:>10.1f}ms {temps_bin*1000:>10.1f}ms {(1-temps_bin/temps_json)*100:>9.1f}%")


if __name__ == "__main__":
    print("=" * 60)
    print("  TP 7.3 — Protocol Buffers (Sérialisation Binaire)")
    print("=" * 60)
    
    # Créer un document
    doc = DocumentProtobuf(42, "Rapport de sécurité", "Analyse des vulnérabilités", "Hamza", "equipe")
    print(f"\nDocument original : {doc}")
    
    # Sérialiser en JSON
    json_str = doc.to_json()
    print(f"JSON ({len(json_str.encode())} octets) : {json_str}")
    
    # Sérialiser en binaire
    binaire = doc.serialiser_binaire()
    print(f"Binaire ({len(binaire)} octets) : {binaire.hex()[:60]}...")
    
    # Désérialiser
    doc_recupere = DocumentProtobuf.deserialiser_binaire(binaire)
    print(f"Récupéré : {doc_recupere}")
    print(f"Intégrité : {'✅ OK' if doc.titre == doc_recupere.titre else '❌ ERREUR'}")
    
    # Benchmark
    print("\n--- Benchmark : JSON vs Binaire ---")
    benchmark_serialisation(5000)
    
    print(f"\n✅ TP 7.3 terminé")
