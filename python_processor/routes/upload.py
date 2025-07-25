"""
Routes for uploading shapefile ZIP archives.

This module defines an endpoint to receive, extract, and process uploaded ZIP files 
containing shapefile components (.shp, .shx, .dbf, etc.).
"""

import logging  # standard library import first

from fastapi import APIRouter, File, UploadFile, HTTPException  # third-party imports
from fastapi.responses import JSONResponse
from ..utils.shapefile import extract_zip_to_temp

router = APIRouter()
logger = logging.getLogger(__name__)

@router.post("/upload-shp")
async def upload_shapefile(zip_file: UploadFile = File(...)):
    """
    Handle shapefile upload as a ZIP archive and return its metadata.

    This endpoint accepts a .zip file containing a shapefile (.shp, .shx, .dbf, etc.),
    extracts and processes it, and returns basic metadata like filename and bounding box.

    Args:
        zip_file (UploadFile): A ZIP file containing shapefile components.

    Returns:
        JSONResponse: Metadata including file name, bounding box, and CRS.
    
    Raises:
        HTTPException: If the uploaded file is not a ZIP or cannot be processed.
    """
    if not zip_file.filename.endswith(".zip"):
        raise HTTPException(status_code=400, detail="Only .zip files are accepted.")

    try:
        metadata = extract_zip_to_temp(zip_file)
        logger.info("Shapefile uploaded successfully: %s", metadata["filename"])
        return JSONResponse(content=metadata)
    except Exception as e:
        logger.error("Error processing uploaded zip: %s", str(e), exc_info=True)
        raise HTTPException(status_code=400, detail=str(e)) from e
