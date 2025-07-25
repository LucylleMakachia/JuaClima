import rasterio
import matplotlib.pyplot as plt
import os
from tempfile import NamedTemporaryFile

def generate_raster_preview(file_bytes, filename):
    with NamedTemporaryFile(delete=False, suffix=".tif") as tif_file:
        tif_file.write(file_bytes)
        tif_file.flush()
        
        with rasterio.open(tif_file.name) as src:
            data = src.read(1)  # Read first band

        plt.imshow(data, cmap='viridis')
        img_path = f"{filename}.png"
        plt.axis("off")
        plt.savefig(f"static/{img_path}", bbox_inches='tight')
        plt.close()
        return img_path
