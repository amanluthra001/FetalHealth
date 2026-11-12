from pathlib import Path
import modal

app = modal.App("pregnacare-ml")

BASE_DIR = Path(__file__).resolve().parent

image = (
    modal.Image.debian_slim(python_version="3.11")
    .apt_install("libglib2.0-0", "libgomp1")
    .pip_install(
        "torch>=2.4.0",
        "torchvision>=0.19.0",
        index_url="https://download.pytorch.org/whl/cpu",
    )
    .pip_install(
        "fastapi[standard]>=0.115.0",
        "uvicorn[standard]>=0.30.0",
        "python-multipart>=0.0.9",
        "joblib>=1.4.0",
        "pandas>=2.2.0",
        "numpy>=1.26.0",
        "scikit-learn==1.7.2",
        "opencv-python-headless>=4.10.0",
        "segmentation-models-pytorch>=0.3.4",
    )
    .add_local_file(BASE_DIR / "main.py", "/root/main.py")
    .add_local_file(BASE_DIR / "risk_model.pkl", "/root/risk_model.pkl")
    .add_local_file(
        BASE_DIR / "best_attention_unet_resnet34.pth",
        "/root/best_attention_unet_resnet34.pth",
    )
)


@app.function(image=image, cpu=2, memory=4096, timeout=120)
@modal.asgi_app()
def api():
    import sys

    if "/root" not in sys.path:
        sys.path.insert(0, "/root")
    from main import app as web_app

    return web_app
