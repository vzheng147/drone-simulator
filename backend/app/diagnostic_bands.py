#!/usr/bin/env python3
"""
Diagnostic script to analyze multispectral bands and their statistics.
"""

import numpy as np
import rasterio

def analyze_bands(input_file):
    """Analyze each band's statistics and create histograms."""
    
    with rasterio.open(input_file) as src:
        print(f"File: {input_file}")
        print(f"Bands: {src.count}")
        print(f"Dimensions: {src.width} x {src.height}")
        print(f"Data type: {src.dtypes[0]}")
        print(f"CRS: {src.crs}")
        print("-" * 50)
        
        # Analyze each band
        for band_num in range(1, src.count + 1):
            band_data = src.read(band_num).astype('float32')
            
            # Calculate statistics
            valid_data = band_data[np.isfinite(band_data)]
            
            print(f"Band {band_num}:")
            print(f"  Min: {valid_data.min():.2f}")
            print(f"  Max: {valid_data.max():.2f}")
            print(f"  Mean: {valid_data.mean():.2f}")
            print(f"  Std: {valid_data.std():.2f}")
            print(f"  Data range: {valid_data.max() - valid_data.min():.2f}")
            
            # Sample some pixel values
            sample_size = min(1000, len(valid_data))
            sample_indices = np.random.choice(len(valid_data), sample_size, replace=False)
            sample_values = valid_data[sample_indices]
            print(f"  Sample values: {sample_values[:10]}")
            print()

        # Test NDVI calculation with different band combinations
        print("Testing NDVI calculations with different band combinations:")
        print("(Looking for reasonable NDVI values between -1 and 1)")
        print("-" * 50)
        
        for red_band in range(1, src.count + 1):
            for nir_band in range(1, src.count + 1):
                if red_band != nir_band:
                    red = src.read(red_band).astype('float32')
                    nir = src.read(nir_band).astype('float32')
                    
                    # Calculate NDVI
                    with np.errstate(divide='ignore', invalid='ignore'):
                        ndvi = (nir - red) / (nir + red)
                    
                    valid_ndvi = ndvi[np.isfinite(ndvi)]
                    
                    if len(valid_ndvi) > 0:
                        print(f"  Red=Band{red_band}, NIR=Band{nir_band}:")
                        print(f"    NDVI range: {valid_ndvi.min():.3f} to {valid_ndvi.max():.3f}")
                        print(f"    NDVI mean: {valid_ndvi.mean():.3f}")
                        print(f"    Values in [-1,1]: {np.sum((valid_ndvi >= -1) & (valid_ndvi <= 1))/len(valid_ndvi)*100:.1f}%")
                        print()

if __name__ == "__main__":
    import sys
    if len(sys.argv) != 2:
        print("Usage: python diagnostic_bands.py <input.tif>")
        sys.exit(1)
    
    analyze_bands(sys.argv[1])