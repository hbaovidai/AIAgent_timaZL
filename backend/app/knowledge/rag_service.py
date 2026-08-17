import os
import uuid
import logging
from typing import List, Dict, Any, Optional
import chromadb
from chromadb.config import Settings

logger = logging.getLogger("rag")

DATA_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "data", "chromadb"))
os.makedirs(DATA_DIR, exist_ok=True)


class RAGService:
    """
    RAG & Knowledge Base Service using Persistent ChromaDB.
    Indexes documents (PDF, Markdown, TXT) and performs semantic vector search.
    """

    def __init__(self):
        self.client = chromadb.PersistentClient(path=DATA_DIR)
        self.collection = self.client.get_or_create_collection(
            name="tima_knowledge_base",
            metadata={"description": "Knowledge Base & Document Repository for Tima AI Agent"},
        )
        logger.info(f"[RAG] Persistent ChromaDB initialized at {DATA_DIR}. Current items: {self.collection.count()}")

    def _chunk_text(self, text: str, chunk_size: int = 500, overlap: int = 100) -> List[str]:
        """Splits long text into overlapping chunks."""
        if not text or len(text) <= chunk_size:
            return [text] if text else []
        chunks = []
        start = 0
        while start < len(text):
            end = start + chunk_size
            chunks.append(text[start:end])
            start += chunk_size - overlap
        return chunks

    def add_document(self, filename: str, content: str, author: str = "Huỳnh Bảo") -> Dict[str, Any]:
        """Chunks, embeds, and stores a document in ChromaDB."""
        doc_id = str(uuid.uuid4())
        chunks = self._chunk_text(content)
        if not chunks:
            return {"success": False, "error": "Document content is empty."}

        ids = [f"{doc_id}_{i}" for i in range(len(chunks))]
        documents = chunks
        metadatas = [
            {
                "doc_id": doc_id,
                "filename": filename,
                "author": author,
                "chunk_index": i,
                "total_chunks": len(chunks),
                "created_at": str(os.path.getmtime(DATA_DIR)),
            }
            for i in range(len(chunks))
        ]

        self.collection.add(ids=ids, documents=documents, metadatas=metadatas)
        logger.info(f"[RAG] Indexed '{filename}' into {len(chunks)} chunks (Doc ID: {doc_id}).")

        return {
            "success": True,
            "doc_id": doc_id,
            "filename": filename,
            "chunks_count": len(chunks),
            "total_collection_items": self.collection.count(),
        }

    def query(self, query_text: str, n_results: int = 3) -> Dict[str, Any]:
        """Performs semantic vector search for matching context."""
        if self.collection.count() == 0:
            return {
                "success": True,
                "results": [],
                "formatted_context": "Kho tài liệu hiện tại đang trống. Chưa có tài liệu nào được nạp.",
            }

        n = min(n_results, self.collection.count())
        res = self.collection.query(query_texts=[query_text], n_results=n)

        docs = res.get("documents", [[]])[0]
        metas = res.get("metadatas", [[]])[0]
        distances = res.get("distances", [[]])[0] if res.get("distances") else []

        results = []
        formatted_parts = []
        for idx, (doc, meta) in enumerate(zip(docs, metas), 1):
            dist = distances[idx - 1] if idx - 1 < len(distances) else None
            filename = meta.get("filename", "Tài liệu")
            chunk_idx = meta.get("chunk_index", 0)
            results.append({
                "filename": filename,
                "chunk_index": chunk_idx,
                "content": doc,
                "distance": dist,
            })
            formatted_parts.append(f"[{idx}] (Nguồn: {filename} - Đoạn {chunk_idx + 1}):\n{doc}")

        formatted_context = "\n\n".join(formatted_parts) if formatted_parts else "Không tìm thấy đoạn thông tin phù hợp trong kho tài liệu."

        return {
            "success": True,
            "query": query_text,
            "total_matches": len(results),
            "results": results,
            "formatted_context": formatted_context,
        }

    def list_documents(self) -> List[Dict[str, Any]]:
        """Lists all distinct documents stored in the vector database."""
        if self.collection.count() == 0:
            return []
        all_data = self.collection.get()
        metas = all_data.get("metadatas", [])

        doc_map = {}
        for m in metas:
            if not m:
                continue
            d_id = m.get("doc_id", "unknown")
            if d_id not in doc_map:
                doc_map[d_id] = {
                    "id": d_id,
                    "filename": m.get("filename", "Tài liệu"),
                    "author": m.get("author", "Huỳnh Bảo"),
                    "total_chunks": m.get("total_chunks", 1),
                }

        return list(doc_map.values())

    def get_document_details(self, doc_id: str) -> Optional[Dict[str, Any]]:
        """Retrieves full content and all chunks of a specific document."""
        if self.collection.count() == 0:
            return None
        res = self.collection.get(where={"doc_id": doc_id})
        docs = res.get("documents", [])
        metas = res.get("metadatas", [])
        if not docs:
            return None

        indexed_chunks = []
        filename = "Tài liệu"
        author = "Huỳnh Bảo"
        for doc, meta in zip(docs, metas):
            if meta:
                filename = meta.get("filename", filename)
                author = meta.get("author", author)
                indexed_chunks.append({
                    "chunk_index": meta.get("chunk_index", 0),
                    "content": doc,
                })

        indexed_chunks.sort(key=lambda x: x["chunk_index"])
        full_text = "\n\n".join([c["content"] for c in indexed_chunks])

        return {
            "id": doc_id,
            "filename": filename,
            "author": author,
            "total_chunks": len(indexed_chunks),
            "full_text": full_text,
            "chunks": indexed_chunks,
        }

    def delete_document(self, doc_id: str) -> bool:
        """Deletes all chunks belonging to a document."""
        try:
            self.collection.delete(where={"doc_id": doc_id})
            logger.info(f"[RAG] Deleted document {doc_id}.")
            return True
        except Exception as e:
            logger.error(f"[RAG] Failed to delete doc {doc_id}: {e}")
            return False


rag_service = RAGService()
