import gradio as gr
import uvicorn
from src.app import app as fastapi_app

def api_info():
    return (
        "SmartFind Backend API is live on Hugging Face Spaces!\n\n"
        "• Interactive Swagger Docs: /docs\n"
        "• Health Check: /health\n"
        "• Search Endpoint: POST /search"
    )

with gr.Blocks(title="SmartFind API") as demo:
    gr.Markdown("# 🔍 SmartFind Vector Search API")
    gr.Markdown(
        "Production-grade FastAPI backend serving LangChain `SelfQueryRetriever`, "
        "Google Gemini, and Pinecone Cloud Vector Database."
    )
    gr.Textbox(value=api_info(), label="API Status & Documentation", interactive=False, lines=6)

# Mount Gradio onto the existing FastAPI application at /gradio
app = gr.mount_gradio_app(fastapi_app, demo, path="/gradio")

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=7860)
