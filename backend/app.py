import gradio as gr
from src.app import app as fastapi_app

# Interactive Gradio test interface for Hugging Face preview
def search_status_preview():
    return (
        "🚀 SmartFind Backend API is running successfully on Hugging Face Spaces!\n\n"
        "• Interactive API Docs (Swagger): /docs\n"
        "• Health Check: /health\n"
        "• Search Endpoint: POST /search\n"
    )

with gr.Blocks(title="SmartFind API") as demo:
    gr.Markdown("# 🔍 SmartFind Vector Search API")
    gr.Markdown(
        "Production-grade FastAPI backend serving LangChain `SelfQueryRetriever`, "
        "Google Gemini, and Pinecone Cloud Vector Database."
    )
    status_output = gr.Textbox(value=search_status_preview(), label="API Status & Endpoints", interactive=False, lines=6)

# Mount FastAPI app onto Gradio root
app = gr.mount_gradio_app(fastapi_app, demo, path="/gradio")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:fastapi_app", host="0.0.0.0", port=7860, reload=False)
