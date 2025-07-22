# main.py or app.py

from fastapi import FastAPI, UploadFile, File, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles

from routes import raster  # Custom raster routes

import os
import uuid
import shapefile
import geojson
import rasterio
import matplotlib.pyplot as plt
import numpy as np
import tempfile
import zipfile
import pandas as pd
import json
import logging
from rasterio.enums import Resampling

# ─── Logging Configuration ────────────────────────────────
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ─── Initialize FastAPI App ───────────────────────────────
app = FastAPI()
app.include_router(raster.router)

# ─── CORS Configuration ───────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Directory Setup ──────────────────────────────────────
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOAD_DIR = os.path.join(BASE_DIR, "uploads")
PREVIEW_DIR = os.path.join(BASE_DIR, "static", "previews")

os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(PREVIEW_DIR, exist_ok=True)

# ─── Serve Static Files ───────────────────────────────────
app.mount("/static", StaticFiles(directory="static"), name="static")

# ─── Convert SHP ZIP to GeoJSON ───────────────────────────
@app.post("/convert/shp")
async def convert_shp(file: UploadFile = File(...)):
    try:
        temp_zip = os.path.join(UPLOAD_DIR, f"{uuid.uuid4()}_{file.filename}")
        with open(temp_zip, "wb") as f:
            f.write(await file.read())

        with tempfile.TemporaryDirectory() as extract_dir:
            with zipfile.ZipFile(temp_zip, "r") as zip_ref:
                zip_ref.extractall(extract_dir)

            shp_files = [f for f in os.listdir(extract_dir) if f.endswith(".shp")]
            shx_files = [f for f in os.listdir(extract_dir) if f.endswith(".shx")]
            dbf_files = [f for f in os.listdir(extract_dir) if f.endswith(".dbf")]

            if not (shp_files and shx_files and dbf_files):
                raise ValueError("Missing .shp, .shx or .dbf in uploaded zip.")

            shp_path = os.path.join(extract_dir, shp_files[0])
            sf = shapefile.Reader(shp_path)
            fields = [field[0] for field in sf.fields[1:]]
            features = []

            for shape_rec in sf.iterShapeRecords():
                geom = shape_rec.shape.__geo_interface__
                props = dict(zip(fields, shape_rec.record))
                features.append(geojson.Feature(geometry=geom, properties=props))

            return JSONResponse(content=geojson.FeatureCollection(features))

    except Exception as e:
        logger.exception("Failed to convert SHP zip")
        return JSONResponse(content={"error": "SHP conversion failed."}, status_code=500)

# ─── Generate Raster Preview (PNG) ────────────────────────
@app.post("/preview/raster")
async def preview_raster(file: UploadFile = File(...)):
    try:
        temp_path = os.path.join(UPLOAD_DIR, f"{uuid.uuid4()}_{file.filename}")
        with open(temp_path, "wb") as f:
            f.write(await file.read())

        with rasterio.open(temp_path) as src:
            profile = src.profile
            bounds = src.bounds
            band = src.read(1, resampling=Resampling.nearest)
            band = np.nan_to_num(band)
            norm_data = (band - band.min()) / (band.max() - band.min() + 1e-8)

        preview_name = f"{uuid.uuid4()}.png"
        preview_path = os.path.join(PREVIEW_DIR, preview_name)
        plt.imsave(preview_path, norm_data, cmap="viridis")
        plt.close()

        return {
            "meta": {
                "width": profile["width"],
                "height": profile["height"],
                "crs": str(profile["crs"]),
                "dtype": profile["dtype"],
                "bbox": [bounds.left, bounds.bottom, bounds.right, bounds.top],
            },
            "preview": f"/static/previews/{preview_name}"
        }

    except Exception as e:
        logger.exception("Failed to generate raster preview")
        return JSONResponse(content={"error": "Raster preview failed."}, status_code=500)

# ─── Export GeoJSON to SHP ZIP ────────────────────────────
@app.post("/export/shapefile")
async def export_shapefile(geojson_data: dict = Body(...)):
    try:
        with tempfile.TemporaryDirectory() as tmpdir:
            shp_path = os.path.join(tmpdir, "output.shp")
            writer = shapefile.Writer(shp_path)
            writer.autoBalance = 1

            features = geojson_data.get("features", [])
            if not features:
                raise ValueError("GeoJSON has no features.")

            field_keys = features[0]["properties"].keys()
            for key in field_keys:
                writer.field(str(key), "C")

            for feature in features:
                geom = feature["geometry"]
                coords = geom.get("coordinates", [])
                gtype = geom.get("type")
                props = feature["properties"]

                if gtype == "Point":
                    writer.point(*coords)
                elif gtype == "MultiPoint":
                    for pt in coords:
                        writer.point(*pt)
                        writer.record(*[str(props[k]) for k in field_keys])
                    continue
                elif gtype == "LineString":
                    writer.line([coords])
                elif gtype == "MultiLineString":
                    writer.line(coords)
                elif gtype == "Polygon":
                    writer.poly([coords[0]])
                elif gtype == "MultiPolygon":
                    for poly in coords:
                        writer.poly([poly[0]])
                        writer.record(*[str(props[k]) for k in field_keys])
                    continue
                else:
                    continue  # Skip unsupported geometry

                writer.record(*[str(props[k]) for k in field_keys])

            writer.close()

            zip_path = os.path.join(tmpdir, "shapefile.zip")
            with zipfile.ZipFile(zip_path, "w") as zipf:
                for ext in ["shp", "shx", "dbf"]:
                    file_path = f"{shp_path[:-4]}.{ext}"
                    zipf.write(file_path, arcname=os.path.basename(file_path))

            return FileResponse(zip_path, filename="exported_shapefile.zip", media_type="application/zip")

    except Exception as e:
        logger.exception("Failed to export shapefile")
        return JSONResponse(content={"error": "Export to shapefile failed."}, status_code=500)

# ─── Export GeoJSON to CSV ────────────────────────────────
@app.post("/export/csv")
async def export_csv(geojson_data: dict = Body(...)):
    try:
        features = geojson_data.get("features", [])
        if not features:
            raise ValueError("GeoJSON has no features.")

        rows = []
        for feature in features:
            row = feature["properties"].copy()
            row["geometry"] = json.dumps(feature["geometry"])
            rows.append(row)

        df = pd.DataFrame(rows)
        csv_path = os.path.join(UPLOAD_DIR, f"{uuid.uuid4()}_export.csv")
        df.to_csv(csv_path, index=False)

        return FileResponse(csv_path, filename="exported_data.csv", media_type="text/csv")

    except Exception as e:
        logger.exception("Failed to export CSV")
        return JSONResponse(content={"error": "Export to CSV failed."}, status_code=500)
