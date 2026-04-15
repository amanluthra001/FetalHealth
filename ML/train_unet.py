import os
import cv2
import numpy as np
import pandas as pd
from tensorflow.keras.utils import Sequence
from segmentation_models import Unet
from segmentation_models.losses import bce_jaccard_loss
from segmentation_models.metrics import iou_score
import tensorflow as tf

# 1. CONFIGURATION
# Update these paths to where you unzipped the dataset
IMG_DIR = 'training_set/'        # Folder with original images
MASK_DIR = 'training_set_annotations/' # Folder with mask images
BATCH_SIZE = 8
IMG_SIZE = (256, 256) # We resize everything to this for the AI

# 2. DATA LOADER (The "Feeder")
# This custom class feeds images and masks to the model efficiently
class HC18Generator(Sequence):
    def __init__(self, image_filenames, batch_size=BATCH_SIZE):
        self.filenames = image_filenames
        self.batch_size = batch_size

    def __len__(self):
        return len(self.filenames) // self.batch_size

    def __getitem__(self, index):
        batch_files = self.filenames[index*self.batch_size : (index+1)*self.batch_size]
        images = []
        masks = []
        
        for file in batch_files:
            # Load Image (Grayscale)
            img_path = os.path.join(IMG_DIR, file)
            img = cv2.imread(img_path, cv2.IMREAD_GRAYSCALE)
            img = cv2.resize(img, IMG_SIZE)
            img = np.expand_dims(img, axis=-1) / 255.0 # Normalize 0-1
            
            # Load Mask (The Ground Truth)
            # HC18 masks usually have same name but ending in '_Annotation' or similar
            # CHECK YOUR FOLDER: If masks are "001_Annotation.png", use this:
            mask_name = file.replace('.png', '_Annotation.png') 
            mask_path = os.path.join(MASK_DIR, mask_name)
            
            mask = cv2.imread(mask_path, cv2.IMREAD_GRAYSCALE)
            mask = cv2.resize(mask, IMG_SIZE)
            # Binarize: Make sure it's strictly 0 or 1
            _, mask = cv2.threshold(mask, 127, 1, cv2.THRESH_BINARY)
            mask = np.expand_dims(mask, axis=-1)
            
            images.append(img)
            masks.append(mask)
            
        return np.array(images), np.array(masks)

# 3. LOAD DATA LIST
all_files = [f for f in os.listdir(IMG_DIR) if f.endswith('.png')]
# Split: 80% Train, 20% Val
split = int(len(all_files) * 0.8)
train_files = all_files[:split]
val_files = all_files[split:]

train_gen = HC18Generator(train_files)
val_gen = HC18Generator(val_files)

# 4. BUILD MODEL (U-Net with ResNet34 Backbone)
# "Backbone" means we use a pre-trained brain (ResNet) to see shapes
model = Unet('resnet34', encoder_weights=None, input_shape=(256, 256, 1), classes=1, activation='sigmoid')

model.compile(optimizer='adam', loss=bce_jaccard_loss, metrics=[iou_score])

# 5. TRAIN
print(f"Starting training on {len(train_files)} images...")
model.fit(train_gen, epochs=15, validation_data=val_gen)

# 6. SAVE
model.save('fetal_unet_model.h5')
print("Model Saved! ready for biometry.")