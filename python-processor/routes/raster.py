# routes/raster.py

from fastapi import APIRouter, Query, HTTPException
from fastapi.responses import FileResponse
from pathlib import Path
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

EXPORT_DIR = Path("./raster_exports")

# Supported raster export formats
SUPPORTED_FORMATS = {
    "geotiff": "tif",
    "tif": "tif"
}

@router.get("/api/raster/export")
def export_raster(datasetId: str, format: str = Query("geotiff"), colormap: str = Query(None)):
    """
    Download an exported raster file by dataset ID.
    Optional: specify a colormap (for preview UIs) — not used here yet.
    """
    ext = SUPPORTED_FORMATS.get(format.lower())
    if not ext:
        raise HTTPException(status_code=400, detail=f"Unsupported raster format: {format}")

    filename = f"{datasetId}.{ext}"
    file_path = EXPORT_DIR / filename

    try:
        if not file_path.resolve().is_file():
            logger.warning(f"Raster file not found: {file_path}")
            raise HTTPException(status_code=404, detail="Raster file not found")

        logger.info(f"Serving raster file: {file_path}")

        return FileResponse(
            path=str(file_path),
            filename=filename,
            media_type="image/tiff" if ext == "tif" else "application/octet-stream"
        )
    except Exception as e:
        logger.error(f"Error serving raster file: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")
