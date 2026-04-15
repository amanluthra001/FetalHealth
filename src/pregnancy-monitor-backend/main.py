from fastapi import FastAPI, UploadFile, File, Form
import uvicorn
import joblib
import pandas as pd
import numpy as np
import cv2
import torch
import math
import segmentation_models_pytorch as smp 
from io import BytesIO

app = FastAPI()

# ---------------------------------------------------------
# 1. LOAD MODELS
# ---------------------------------------------------------
try:
    rf_model = joblib.load('risk_model.pkl')
    print("✅ Random Forest Model Loaded")
except FileNotFoundError:
    rf_model = None
    print("⚠️ Random Forest model not found.")

try:
    # 1. Build the empty ATTENTION U-Net house 
    unet_model = smp.Unet(
        encoder_name="resnet34",
        encoder_weights=None, 
        in_channels=1,
        classes=1,
        decoder_attention_type="scse" # 🌟 ADDED BACK: This tells PyTorch to expect attention weights!
    )
    
    # 2. Grab the weights from your saved ATTENTION file
    # 🌟 FIXED: Pointing to your new attention file
    state_dict = torch.load('best_attention_unet_resnet34.pth', map_location=torch.device('cpu'))
    
    # 3. Put the weights inside the house
    unet_model.load_state_dict(state_dict)
    
    # 4. Lock the doors (Set to evaluation mode)
    unet_model.eval() 
    print("✅ PyTorch Attention U-Net Model Loaded")
except Exception as e:
    unet_model = None
    print(f"⚠️ PyTorch U-Net model failed to load: {e}")

# ---------------------------------------------------------
# 2. THE API ENDPOINT
# ---------------------------------------------------------
@app.post("/analyze-risk")
async def analyze_risk(
    fileType: str = Form(...),
    ultrasound: UploadFile = File(None),
    Age: float = Form(None),
    SystolicBP: float = Form(None),
    DiastolicBP: float = Form(None),
    BS: float = Form(None),
    BodyTemp: float = Form(None),
    HeartRate: float = Form(None)
):
    print(f"📥 Processing Category: {fileType}")
    
    risk_score_a = 0.1 # Default Fetal Risk
    risk_score_b = 0.1 # Default Maternal Risk

    # --- 🟢 PROCESS MANUAL BLOOD DATA ---
    if fileType == 'manual_blood':
        try:
            if rf_model:
                df = pd.DataFrame([[Age, SystolicBP, DiastolicBP, BS, BodyTemp, HeartRate]], 
                                  columns=['Age', 'SystolicBP', 'DiastolicBP', 'BS', 'BodyTemp', 'HeartRate'])
                
                probabilities = rf_model.predict_proba(df)[0] 
                risk_score_b = float(probabilities[1]) if len(probabilities) > 1 else float(probabilities[0])
                print(f"🩸 Maternal Risk calculated: {risk_score_b:.2f}")
            else:
                risk_score_b = 0.65 
        except Exception as e:
            print(f"🔴 Error processing blood data: {e}")

    # --- 🔵 PROCESS ULTRASOUND (PYTORCH + OPENCV) ---
    elif fileType == 'ultrasound' and ultrasound:
        try:
            contents = await ultrasound.read()
            nparr = np.frombuffer(contents, np.uint8)
            img = cv2.imdecode(nparr, cv2.IMREAD_GRAYSCALE)
            
            if unet_model is not None and img is not None:
                img_resized = cv2.resize(img, (256, 256))
                img_norm = img_resized / 255.0
                
                input_tensor = torch.from_numpy(img_norm).float().unsqueeze(0).unsqueeze(0)
                
                with torch.no_grad():
                    output = unet_model(input_tensor)
                    pred_mask = torch.sigmoid(output).squeeze().cpu().numpy()
                
                binary_mask = (pred_mask > 0.5).astype(np.uint8) * 255
                contours, _ = cv2.findContours(binary_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
                
                if contours:
                    largest_contour = max(contours, key=cv2.contourArea)
                    
                    if len(largest_contour) >= 5: 
                        (x, y), (MA, ma), angle = cv2.fitEllipse(largest_contour)
                        
                        a, b = ma / 2, MA / 2
                        hc_pixels = math.pi * (3*(a+b) - math.sqrt((3*a + b) * (a + 3*b)))
                        
                        pixel_to_mm = 0.5 
                        hc_mm = hc_pixels * pixel_to_mm
                        
                        print(f"📏 Fetal HC: {hc_mm:.2f}mm")

                        if hc_mm < 160 or hc_mm > 240:
                            risk_score_a = 0.8 
                        elif hc_mm < 180 or hc_mm > 220:
                            risk_score_a = 0.5 
                        else:
                            risk_score_a = 0.1 
                else:
                    print("⚠️ No head contour detected in mask.")
            
        except Exception as e:
            print(f"🔴 Error in Ultrasound Pipeline: {e}")

    # --- 🟣 LATE FUSION ---
    final_score = (risk_score_a + risk_score_b) / 2
    
    if final_score > 0.7:
        status = "CRITICAL ALERT"
    elif final_score > 0.4:
        status = "WARNING"
    else:
        status = "HEALTHY"

    return {
        "status": status,
        "final_fusion_score": float(final_score),
        "fetal_risk": float(risk_score_a),
        "maternal_risk": float(risk_score_b)
    }

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000)