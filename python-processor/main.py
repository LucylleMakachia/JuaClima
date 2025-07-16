from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
import os
import uuid
import shapefile
import geojson
import rasterio
import matplotlib.pyplot as plt
from fastapi.staticfiles import StaticFiles
from rasterio.plot import reshape_as_image
from rasterio.enums import Resampling
import numpy as np

app = FastAPI()

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOAD_DIR = os.path.join(BASE_DIR, "uploads")
PREVIEW_DIR = os.path.join(BASE_DIR, "static", "previews")
os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(PREVIEW_DIR, exist_ok=True)

# Serve static previews
app.mount("/static", StaticFiles(directory="static"), name="static")

# ─── SHP to GeoJSON ───────────────────────────────────────

@app.post("/convert/shp")
async def convert_shp(file: UploadFile = File(...)):
    try:
        # Save uploaded SHP file
        temp_path = os.path.join(UPLOAD_DIR, f"{uuid.uuid4()}_{file.filename}")
        with open(temp_path, "wb") as f:
            f.write(await file.read())

        # Load SHP file
        sf = shapefile.Reader(temp_path)
        fields = [field[0] for field in sf.fields[1:]]
        features = []

        for shape_rec in sf.iterShapeRecords():
            geom = shape_rec.shape.__geo_interface__
            props = dict(zip(fields, shape_rec.record))
            features.append(geojson.Feature(geometry=geom, properties=props))

        geojson_data = geojson.FeatureCollection(features)

        return JSONResponse(content=geojson_data)
    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)

# ─── TIFF Preview & Metadata ──────────────────────────────

@app.post("/preview/raster")
async def preview_raster(file: UploadFile = File(...)):
    try:
        # Save TIFF
        temp_path = os.path.join(UPLOAD_DIR, f"{uuid.uuid4()}_{file.filename}")
        with open(temp_path, "wb") as f:
            f.write(await file.read())

        with rasterio.open(temp_path) as src:
            profile = src.profile
            bounds = src.bounds
            data = src.read(1, resampling=Resampling.nearest)

            # Normalize for preview
            data = np.nan_to_num(data)
            norm_data = (data - np.min(data)) / (np.max(data) - np.min(data) + 1e-8)

        # Save preview image
        preview_name = f"{uuid.uuid4()}.png"
        preview_path = os.path.join(PREVIEW_DIR, preview_name)
        plt.imsave(preview_path, norm_data, cmap="viridis")

        return {
            "meta": {
                "width": profile["width"],
                "height": profile["height"],
                "crs": str(profile["crs"]),
                "dtype": profile["dtype"],
                "bbox": [bounds.left, bounds.bottom, bounds.right, bounds.top],
            },
            "preview": f"static/previews/{preview_name}"
        }

    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)
