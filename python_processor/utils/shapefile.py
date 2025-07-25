"""
Utility functions for handling shapefile uploads and processing.

Includes extraction of shapefile ZIP archives to temporary directories
and basic validation of the shapefile contents.
"""

import logging
import os
import shutil
import tempfile
import zipfile
from typing import Any

BASE_DIR = os.path.dirname(os.path.abspath(__file__))  # path to python_processor
LOG_DIR = os.path.join(BASE_DIR, "logs")
os.makedirs(LOG_DIR, exist_ok=True)  # create log directory if missing

LOG_FILE = os.path.join(LOG_DIR, "app.log")

logging.basicConfig(
    filename=LOG_FILE,
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
)

logger = logging.getLogger(__name__)

def extract_zip_to_temp(uploaded_zip: Any) -> dict[str, Any]:
    """
    Extracts a zip file containing a shapefile to a temporary directory.

    Args:
        uploaded_zip (Any): The uploaded zip file object (UploadFile from FastAPI).

    Returns:
        dict[str, Any]: Dictionary with the original filename, list of extracted files,
                        and the name of the .shp file if found.

    Raises:
        ValueError: If the file is not a valid zip or doesn't contain a .shp file.
    """
    try:
        with tempfile.TemporaryDirectory() as tmpdirname:
            zip_path = os.path.join(tmpdirname, uploaded_zip.filename)

            with open(zip_path, "wb") as buffer:
                # Copy the uploaded file stream to the temporary file
                shutil.copyfileobj(uploaded_zip.file, buffer)

            with zipfile.ZipFile(zip_path, "r") as zip_ref:
                zip_ref.extractall(tmpdirname)

            filenames = os.listdir(tmpdirname)
            shp_file = next((f for f in filenames if f.endswith(".shp")), None)

            if not shp_file:
                raise ValueError("No .shp file found in the uploaded zip.")

            logger.info("Extracted .shp: %s", shp_file)

            return {
                "filename": uploaded_zip.filename,
                "files": filenames,
                "shp_found": shp_file,
            }

    except zipfile.BadZipFile as e:
        logger.error("Bad zip file: %s", str(e), exc_info=True)
        raise ValueError("The uploaded file is not a valid zip archive.") from e
    except Exception as e:
        logger.error("Unexpected error in extract_zip_to_temp: %s", str(e), exc_info=True)
        raise
