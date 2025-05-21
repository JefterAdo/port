from sentence_transformers import SentenceTransformer
import chromadb
from chromadb.config import Settings as ChromaClientSettings # Renommé pour éviter conflit avec nos Settings
from datetime import datetime
import json
from typing import Dict, List, Optional, Union, Any

from .config import settings # Importation des settings centralisés

class RAGEngine:
    def __init__(self, collection_name="docs"):
        self.model = SentenceTransformer("all-MiniLM-L6-v2")
        
        # Configuration du client ChromaDB via l'objet settings
        client_settings_chroma = ChromaClientSettings(anonymized_telemetry=False)
        if settings.CHROMA_SSL_ENABLED:
            client_settings_chroma.chroma_server_ssl_verify = settings.CHROMA_SSL_VERIFY
            # Note: Le port par défaut pour HTTPS est souvent différent (ex: 443), 
            # assurez-vous que CHROMA_PORT est correct pour votre configuration SSL.

        # Utilisation de HttpClient pour se préparer à un serveur ChromaDB distant
        self.client = chromadb.HttpClient(
            host=settings.CHROMA_HOST,
            port=settings.CHROMA_PORT,
            ssl=settings.CHROMA_SSL_ENABLED,
            settings=client_settings_chroma
        )
        
        self.collection = self.client.get_or_create_collection(
            name=collection_name,
            metadata={"hnsw:space": "cosine"}
        )

    def add_document(self, doc_id: str, text: str, metadata: Optional[Dict[str, Any]] = None):
        """
        Ajoute un document au moteur RAG avec des métadonnées optionnelles
        
        Args:
            doc_id: Identifiant unique du document
            text: Contenu textuel du document
            metadata: Métadonnées optionnelles (type de document, date, etc.)
        """
        try:
            # Métadonnées par défaut
            default_metadata = {
                "doc_type": "standard",
                "source_type": "internal",
                "indexed_at": datetime.now().isoformat(),
            }
            
            # Fusionner les métadonnées par défaut avec celles fournies
            final_metadata = {**default_metadata, **(metadata or {})}
            
            embedding = self.model.encode([text])[0]
            self.collection.add(
                documents=[text], 
                embeddings=[embedding], 
                ids=[doc_id],
                metadatas=[final_metadata]
            )
            print(f"[RAGEngine] Document ajouté: {doc_id} (type: {final_metadata.get('doc_type')})")
        except Exception as e:
            print(f"[RAGEngine][ERROR] add_document: {e}")
            raise
            
    def add_edls_document(self, edls_item: Dict[str, Any]):
        """
        Indexe un document EDLS dans le moteur RAG
        
        Args:
            edls_item: Dictionnaire contenant les données d'un EDLS
        """
        try:
            # Créer un identifiant unique pour l'EDLS
            doc_id = f"edls_{edls_item['id']}"
            
            # Préparer le contenu textuel à indexer
            title = edls_item.get('title', '')
            content = edls_item.get('content', '')
            ai_analysis = edls_item.get('aiAnalysis', {})
            summary = ai_analysis.get('summary', '') if ai_analysis else ''
            key_points = ' '.join(ai_analysis.get('keyPoints', [])) if ai_analysis else ''
            
            # Combiner les informations en un seul texte
            text = f"TITRE: {title}\n\nCONTENU: {content}\n\nRÉSUMÉ: {summary}\n\nPOINTS CLÉS: {key_points}"
            
            # Métadonnées pour l'EDLS
            metadata = {
                "doc_type": "edls",
                "source_type": "internal",
                "title": title,
                "status": edls_item.get('status', 'new'),
                "classification": str(edls_item.get('classification', '')),
                "created_at": edls_item.get('createdAt', ''),
                "updated_at": edls_item.get('updatedAt', ''),
            }
            
            # Ajouter le document
            self.add_document(doc_id, text, metadata)
            return {"status": "success", "doc_id": doc_id}
            
        except Exception as e:
            print(f"[RAGEngine][ERROR] add_edls_document: {e}")
            return {"status": "error", "error": str(e)}
    
    def add_forces_faiblesses_document(self, item: Dict[str, Any], party_name: str = ""):
        """
        Indexe un document Forces/Faiblesses dans le moteur RAG
        
        Args:
            item: Dictionnaire contenant les données d'un élément Forces/Faiblesses
            party_name: Nom du parti politique (optionnel)
        """
        try:
            # Créer un identifiant unique
            doc_id = f"forces_{item['id']}"
            
            # Préparer le contenu textuel à indexer
            type_element = item.get('type', '')
            categorie = item.get('categorie', '')
            contenu = item.get('contenu', '')
            resume = item.get('resume', '')
            source = item.get('source', '')
            
            # Combiner les informations en un seul texte
            text = f"PARTI: {party_name}\n\nTYPE: {type_element}\n\nCATÉGORIE: {categorie}\n\nCONTENU: {contenu}\n\nRÉSUMÉ: {resume}\n\nSOURCE: {source}"
            
            # Métadonnées pour Forces/Faiblesses
            metadata = {
                "doc_type": "forces",
                "source_type": "internal",
                "party_id": item.get('party_id', ''),
                "party_name": party_name,
                "type_element": type_element,
                "categorie": categorie,
                "date": str(item.get('date', '')),
            }
            
            # Ajouter le document
            self.add_document(doc_id, text, metadata)
            return {"status": "success", "doc_id": doc_id}
            
        except Exception as e:
            print(f"[RAGEngine][ERROR] add_forces_faiblesses_document: {e}")
            return {"status": "error", "error": str(e)}

    def search(self, query: str, n_results: int = 3, filters: Optional[Dict[str, Any]] = None):
        """
        Recherche des documents pertinents en fonction d'une requête et de filtres optionnels
        
        Args:
            query: Texte de la requête de recherche
            n_results: Nombre de résultats à retourner
            filters: Filtres optionnels (type de document, plage de dates, etc.)
        """
        try:
            # Encoder la requête
            query_emb = self.model.encode([query])[0]
            
            # Préparer les filtres pour ChromaDB
            where_clause = {}
            if filters:
                # Filtre par type de document
                if filters.get('document_type'):
                    where_clause["doc_type"] = filters['document_type']
                
                # Filtre par source
                if filters.get('source_type'):
                    where_clause["source_type"] = filters['source_type']
                
                # Autres filtres spécifiques pourraient être ajoutés ici
                # Note: ChromaDB a des limitations sur les filtres de date, 
                # nous devrons peut-être implémenter un post-filtrage
            
            # Exécuter la requête avec les filtres
            results = self.collection.query(
                query_embeddings=[query_emb],
                n_results=n_results,
                where=where_clause if where_clause else None,
                include=["metadatas"]
            )
            
            # Formatage pour le front avec métadonnées
            documents = results.get("documents", [[]])[0]
            ids = results.get("ids", [[]])[0]
            distances = results.get("distances", [[]])[0]
            metadatas = results.get("metadatas", [[]])[0]
            
            # Post-filtrage pour les dates si nécessaire
            filtered_results = []
            for i, (doc, doc_id, distance, metadata) in enumerate(zip(documents, ids, distances, metadatas)):
                # Vérifier les filtres de date si présents
                include_doc = True
                
                if filters and filters.get('date_from') and metadata.get('created_at'):
                    try:
                        doc_date = datetime.fromisoformat(metadata['created_at'].replace('Z', '+00:00'))
                        filter_date = datetime.fromisoformat(filters['date_from'].replace('Z', '+00:00'))
                        if doc_date < filter_date:
                            include_doc = False
                    except (ValueError, TypeError):
                        pass
                
                if filters and filters.get('date_to') and metadata.get('created_at'):
                    try:
                        doc_date = datetime.fromisoformat(metadata['created_at'].replace('Z', '+00:00'))
                        filter_date = datetime.fromisoformat(filters['date_to'].replace('Z', '+00:00'))
                        if doc_date > filter_date:
                            include_doc = False
                    except (ValueError, TypeError):
                        pass
                
                if include_doc:
                    filtered_results.append({
                        "document": doc,
                        "id": doc_id,
                        "distance": distance,
                        "metadata": metadata
                    })
            
            # Réorganiser les résultats pour la compatibilité avec le frontend existant
            return {
                "documents": [r["document"] for r in filtered_results],
                "ids": [r["id"] for r in filtered_results],
                "distances": [r["distance"] for r in filtered_results],
                "metadatas": [r["metadata"] for r in filtered_results],
            }
        except Exception as e:
            print(f"[RAGEngine][ERROR] search: {e}")
            return {"documents": [], "ids": [], "distances": [], "metadatas": [], "error": str(e)}

    def answer_question(self, question: str, n_results_for_context: int = 3, filters: Optional[Dict[str, Any]] = None):
        """
        Répond à une question en utilisant les documents pertinents comme contexte
        
        Args:
            question: La question posée
            n_results_for_context: Nombre de documents à utiliser comme contexte
            filters: Filtres optionnels pour les documents de contexte
        """
        try:
            question_emb = self.model.encode([question])[0]
            
            # Préparer les filtres pour ChromaDB
            where_clause = {}
            if filters:
                if filters.get('document_type'):
                    where_clause["doc_type"] = filters['document_type']
                if filters.get('source_type'):
                    where_clause["source_type"] = filters['source_type']
            
            # Récupérer les documents pertinents pour la question
            context_results = self.collection.query(
                query_embeddings=[question_emb],
                n_results=n_results_for_context,
                where=where_clause if where_clause else None,
                include=["metadatas"]
            )
            
            retrieved_docs = context_results.get("documents", [[]])[0]
            retrieved_ids = context_results.get("ids", [[]])[0]
            retrieved_metadatas = context_results.get("metadatas", [[]])[0]
            
            # Post-filtrage pour les dates si nécessaire (même logique que dans search)
            filtered_docs = []
            filtered_ids = []
            filtered_distances = []
            filtered_metadatas = []
            
            distances = context_results.get("distances", [[]])[0]
            
            for i, (doc, doc_id, distance, metadata) in enumerate(zip(retrieved_docs, retrieved_ids, distances, retrieved_metadatas)):
                include_doc = True
                
                if filters and filters.get('date_from') and metadata.get('created_at'):
                    try:
                        doc_date = datetime.fromisoformat(metadata['created_at'].replace('Z', '+00:00'))
                        filter_date = datetime.fromisoformat(filters['date_from'].replace('Z', '+00:00'))
                        if doc_date < filter_date:
                            include_doc = False
                    except (ValueError, TypeError):
                        pass
                
                if filters and filters.get('date_to') and metadata.get('created_at'):
                    try:
                        doc_date = datetime.fromisoformat(metadata['created_at'].replace('Z', '+00:00'))
                        filter_date = datetime.fromisoformat(filters['date_to'].replace('Z', '+00:00'))
                        if doc_date > filter_date:
                            include_doc = False
                    except (ValueError, TypeError):
                        pass
                
                if include_doc:
                    filtered_docs.append(doc)
                    filtered_ids.append(doc_id)
                    filtered_distances.append(distance)
                    filtered_metadatas.append(metadata)
            
            # Placeholder pour la génération de réponse avec un LLM
            # Dans un système RAG réel, vous passeriez `question` et `filtered_docs` à un LLM
            placeholder_answer = f"LLM Answer Generation (Pending): Based on {len(filtered_docs)} retrieved documents, the answer to '{question}' would be generated here."
            
            # Ajouter des informations sur les types de documents utilisés comme contexte
            doc_types = set(metadata.get('doc_type', 'standard') for metadata in filtered_metadatas)
            doc_types_str = ", ".join(doc_types) if doc_types else "standard"
            placeholder_answer += f"\n\nTypes de documents utilisés comme contexte: {doc_types_str}"
            
            return {
                "question": question,
                "placeholder_answer": placeholder_answer,
                "retrieved_context_documents": filtered_docs,
                "retrieved_context_ids": filtered_ids,
                "distances": filtered_distances,
                "metadatas": filtered_metadatas
            }
        except Exception as e:
            print(f"[RAGEngine][ERROR] answer_question: {e}")
            return {
                "question": question,
                "placeholder_answer": "Error occurred during context retrieval.",
                "retrieved_context_documents": [],
                "retrieved_context_ids": [],
                "distances": [],
                "metadatas": [],
                "error": str(e)
            }
