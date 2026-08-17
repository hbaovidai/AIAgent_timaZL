import io
from typing import Optional, Dict, Any, List
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from pydantic import BaseModel
from pypdf import PdfReader
from app.knowledge.rag_service import rag_service

router = APIRouter()


class TextDocumentRequest(BaseModel):
    filename: str
    content: str
    author: Optional[str] = "Huỳnh Bảo"


class SearchKnowledgeRequest(BaseModel):
    query: str
    n_results: Optional[int] = 3


@router.get("/documents")
async def list_documents():
    """List all indexed documents in the ChromaDB knowledge base."""
    docs = rag_service.list_documents()
    return {
        "total_documents": len(docs),
        "documents": docs,
    }


@router.post("/documents/text")
async def add_text_document(req: TextDocumentRequest):
    """Index raw text content into the RAG knowledge base."""
    res = rag_service.add_document(filename=req.filename, content=req.content, author=req.author or "Huỳnh Bảo")
    return res


@router.post("/documents/upload")
async def upload_document(file: UploadFile = File(...), author: str = Form("Huỳnh Bảo")):
    """
    Upload and index a PDF, Markdown, or TXT file into the RAG knowledge base.
    """
    filename = file.filename or "uploaded_document"
    contents = await file.read()

    extracted_text = ""
    if filename.lower().endswith(".pdf"):
        try:
            reader = PdfReader(io.BytesIO(contents))
            pages_text = []
            for idx, page in enumerate(reader.pages):
                p_text = page.extract_text()
                if p_text:
                    pages_text.append(f"--- Trang {idx + 1} ---\n{p_text}")
            extracted_text = "\n\n".join(pages_text)
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Không thể đọc file PDF: {str(e)}")
    else:
        # Plain text / Markdown
        try:
            extracted_text = contents.decode("utf-8")
        except UnicodeDecodeError:
            extracted_text = contents.decode("latin-1", errors="ignore")

    if not extracted_text.strip():
        raise HTTPException(status_code=400, detail="Tài liệu không có nội dung chữ hoặc file rỗng.")

    res = rag_service.add_document(filename=filename, content=extracted_text, author=author)
    return res


@router.get("/documents/{doc_id}")
async def get_document(doc_id: str):
    """Retrieve full content and chunks of a specific document."""
    doc = rag_service.get_document_details(doc_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Không tìm thấy tài liệu.")
    return doc


@router.delete("/documents/{doc_id}")
async def delete_document(doc_id: str):
    """Delete a document from the RAG knowledge base."""
    ok = rag_service.delete_document(doc_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Không tìm thấy tài liệu cần xóa.")
    return {"message": "Document deleted successfully", "doc_id": doc_id}


@router.post("/documents/search")
async def search_knowledge(req: SearchKnowledgeRequest):
    """Semantic vector search across the indexed knowledge base."""
    res = rag_service.query(query_text=req.query, n_results=req.n_results or 3)
    return res
