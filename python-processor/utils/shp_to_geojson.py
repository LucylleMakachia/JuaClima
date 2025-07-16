import shapefile
import geojson
import os
from tempfile import NamedTemporaryFile

def convert_shp_to_geojson(file_bytes, filename):
    with NamedTemporaryFile(delete=False, suffix=".shp") as temp_file:
        temp_file.write(file_bytes)
        temp_file.flush()

        reader = shapefile.Reader(temp_file.name)
        fields = reader.fields[1:]
        field_names = [field[0] for field in fields]
        features = []

        for sr in reader.shapeRecords():
            atr = dict(zip(field_names, sr.record))
            geom = sr.shape.__geo_interface__
            features.append(geojson.Feature(geometry=geom, properties=atr))

        return geojson.FeatureCollection(features)
