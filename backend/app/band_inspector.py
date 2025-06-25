#!/usr/bin/env python3
"""
Detailed band inspection script to debug multispectral images.
"""

import argparse
import numpy as np
import rasterio
from rasterio.enums import Resampling

def inspect_file(filepath):
    """Thoroughly inspect a raster file's band structure."""
    print(f"Inspecting: {filepath}")
    print("=" * 60)
    
    try:
        with rasterio.open(filepath) as src:
            # Basic file info
            print(f"Driver: {src.driver}")
            print(f"Dimensions: {src.width} x {src.height}")
            print(f"Band count: {src.count}")
            print(f"Data types: {src.dtypes}")
            print(f"CRS: {src.crs}")
            print(f"Transform: {src.transform}")
            print()
            
            # Check if file has band descriptions/names
            print("Band descriptions:")
            for i in range(1, src.count + 1):
                desc = src.descriptions[i-1] if src.descriptions else None
                print(f"  Band {i}: {desc if desc else 'No description'}")
            print()
            
            # Read and analyze each band
            print("Band statistics:")
            for band_num in range(1, src.count + 1):
                try:
                    band_data = src.read(band_num)
                    valid_data = band_data[band_data != src.nodata] if src.nodata else band_data
                    
                    print(f"  Band {band_num}:")
                    print(f"    Shape: {band_data.shape}")
                    print(f"    Data type: {band_data.dtype}")
                    print(f"    Min: {valid_data.min()}")
                    print(f"    Max: {valid_data.max()}")
                    print(f"    Mean: {valid_data.mean():.2f}")
                    print(f"    Std: {valid_data.std():.2f}")
                    
                    # Check for saturated pixels
                    saturated_count = np.sum(band_data >= 65535)
                    saturated_pct = (saturated_count / band_data.size) * 100
                    print(f"    Saturated pixels (>=65535): {saturated_count:,} ({saturated_pct:.2f}%)")
                    
                    # Check for zero/very low values
                    zero_count = np.sum(band_data == 0)
                    zero_pct = (zero_count / band_data.size) * 100
                    print(f"    Zero pixels: {zero_count:,} ({zero_pct:.2f}%)")
                    print()
                    
                except Exception as e:
                    print(f"  Band {band_num}: ERROR reading - {e}")
                    print()
            
            # Try to read specific bands that the original script expects
            print("Testing band access for multispectral indices:")
            band_mapping = {
                'Blue': 1,
                'Green': 2, 
                'Red': 3,
                'NIR': 5
            }
            
            for band_name, band_num in band_mapping.items():
                try:
                    if band_num <= src.count:
                        data = src.read(band_num)
                        print(f"  ✓ {band_name} (Band {band_num}): Successfully read")
                    else:
                        print(f"  ✗ {band_name} (Band {band_num}): Band number exceeds available bands ({src.count})")
                except Exception as e:
                    print(f"  ✗ {band_name} (Band {band_num}): Error - {e}")
            
            print()
            
            # Check metadata for clues about band meanings
            print("File metadata:")
            for key, value in src.tags().items():
                print(f"  {key}: {value}")
                
    except Exception as e:
        print(f"ERROR opening file: {e}")

def main():
    parser = argparse.ArgumentParser(description="Inspect raster file band structure")
    parser.add_argument("input", help="Input raster file to inspect")
    args = parser.parse_args()
    
    inspect_file(args.input)

if __name__ == "__main__":
    main()