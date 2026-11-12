from pathlib import Path
import modal

app = modal.App("pregnacare-ml")

BASE_DIR = Path(__file__).resolve().parent

# Define the container image:
# Instead of uploading the 98MB .pth model from Windows, download it directly inside the cloud container
image = (
    modal.Image.debian_slim(python_version="3.11")
    .apt_install("libglib2.0-0", "libgomp1", "curl")
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
    # Download the weights and source directly from your GitHub repository during cloud image build
    .run_commands(
        "mkdir -p /root && "
        "curl -fsSL https://raw.githubusercontent.com/amanluthra001/FetalHealth/main/src/pregnancy-monitor-backend/main.py -o /root/main.py && "
        "curl -fsSL https://raw.githubusercontent.com/amanluthra001/FetalHealth/main/src/pregnancy-monitor-backend/risk_model.pkl -o /root/risk_model.pkl && "
        "curl -fsSL https://raw.githubusercontent.com/amanluthra001/FetalHealth/raw/main/src/pregnancy-monitor-backend/best_attention_unet_resnet34.pth -o /root/best_attention_unet_resnet34.pth"
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
