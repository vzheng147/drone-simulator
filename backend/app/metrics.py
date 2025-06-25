#!/usr/bin/env python3
"""
Improved metrics calculation with intuitive visualizations and legends.
"""

import argparse
import numpy as np
import rasterio
from rasterio.enums import Resampling
import matplotlib.pyplot as plt
from matplotlib.colors import LinearSegmentedColormap
import matplotlib.patches as mpatches
from mpl_toolkits.axes_grid1 import make_axes_locatable
import warnings
warnings.filterwarnings('ignore')

def ndvi(nir, red):
    return (nir - red) / (nir + red)

def ndwi(green, nir):
    return (green - nir) / (green + nir)

def psri(red, green, blue):
    return (red - green) / blue

def mask_saturated_pixels(array, saturation_value=65535):
    """Mask saturated pixels as NaN."""
    array = array.astype('float32')
    array[array >= saturation_value] = np.nan
    return array

def stretch(arr):
    """Scale to 0-1 safely; preserves nodata."""
    valid = np.isfinite(arr)
    if not np.any(valid):
        return arr
    a = arr[valid].min()
    b = arr[valid].max()
    if b == a:
        return arr
    arr[valid] = (arr[valid] - a) / (b - a)
    return arr

def write_index(dataset, index_array, dst_path, dtype=rasterio.float32):
    meta = dataset.meta.copy()
    meta.update(
        driver='GTiff',
        dtype=dtype,
        count=1,
        nodata=np.nan,
        compress='deflate',
    )
    with rasterio.open(dst_path, 'w', **meta) as dst:
        dst.write(index_array.astype(dtype), 1)

def create_ndvi_colormap():
    """Create a colormap for NDVI (brown to yellow to green)"""
    colors = ['#8B4513', '#D2691E', '#DAA520', '#FFFF00', '#ADFF2F', '#32CD32', '#228B22', '#006400']
    return LinearSegmentedColormap.from_list('ndvi', colors, N=256)

def create_ndwi_colormap():
    """Create a colormap for NDWI (dry brown to wet blue)"""
    colors = ['#8B4513', '#D2691E', '#F4A460', '#FFFF99', '#87CEEB', '#4682B4', '#0000CD', '#000080']
    return LinearSegmentedColormap.from_list('ndwi', colors, N=256)

def create_psri_colormap():
    """Create a colormap for PSRI (healthy green to stressed yellow/red)"""
    colors = ['#006400', '#32CD32', '#ADFF2F', '#FFFF00', '#FFD700', '#FFA500', '#FF4500', '#DC143C']
    return LinearSegmentedColormap.from_list('psri', colors, N=256)

def create_legend_labels(index_name):
    """Create appropriate legend labels for each index"""
    if index_name == 'NDVI':
        return {
            'title': 'Vegetation Vigor',
            'labels': ['Bare Soil/Rock', 'Sparse Vegetation', 'Moderate Vegetation', 'Dense Vegetation'],
            'description': 'Green indicates healthy, vigorous vegetation'
        }
    elif index_name == 'NDWI':
        return {
            'title': 'Water Content/Stress',
            'labels': ['Very Dry', 'Dry', 'Moderate', 'Wet/High Water Content'],
            'description': 'Blue indicates high water content, brown indicates water stress'
        }
    elif index_name == 'PSRI':
        return {
            'title': 'Plant Senescence/Stress',
            'labels': ['Healthy/Young', 'Slightly Stressed', 'Moderately Stressed', 'Highly Stressed/Senescent'],
            'description': 'Green indicates healthy plants, yellow/red indicates stress or aging'
        }

def visualize_index(index_array, index_name, output_path, vmin=None, vmax=None):
    """Create an intuitive visualization with legend for a spectral index"""
    
    # Set up the figure
    fig, ax = plt.subplots(figsize=(12, 8))
    
    # Choose colormap and value range based on index
    if index_name == 'NDVI':
        cmap = create_ndvi_colormap()
        if vmin is None: vmin = -0.2
        if vmax is None: vmax = 0.8
    elif index_name == 'NDWI':
        cmap = create_ndwi_colormap()
        if vmin is None: vmin = -0.5
        if vmax is None: vmax = 0.3
    elif index_name == 'PSRI':
        cmap = create_psri_colormap()
        if vmin is None: vmin = -0.1
        if vmax is None: vmax = 0.2
    else:
        cmap = 'viridis'
        if vmin is None: vmin = np.nanpercentile(index_array, 2)
        if vmax is None: vmax = np.nanpercentile(index_array, 98)
    
    # Display the image
    im = ax.imshow(index_array, cmap=cmap, vmin=vmin, vmax=vmax, aspect='equal')
    ax.set_title(f'{index_name} - {create_legend_labels(index_name)["title"]}', 
                 fontsize=16, fontweight='bold', pad=20)
    ax.axis('off')
    
    # Add colorbar
    divider = make_axes_locatable(ax)
    cax = divider.append_axes("right", size="3%", pad=0.1)
    cbar = plt.colorbar(im, cax=cax)
    cbar.set_label(f'{index_name} Value', rotation=270, labelpad=20, fontsize=12)
    
    # Add descriptive legend
    legend_info = create_legend_labels(index_name)
    
    # Create color patches for legend
    n_labels = len(legend_info['labels'])
    colors_for_legend = []
    values = np.linspace(vmin, vmax, n_labels)
    
    for val in values:
        normalized_val = (val - vmin) / (vmax - vmin)
        colors_for_legend.append(cmap(normalized_val))
    
    # Create legend patches
    patches = [mpatches.Patch(color=color, label=label) 
              for color, label in zip(colors_for_legend, legend_info['labels'])]
    
    # Add legend to the plot
    legend = ax.legend(handles=patches, loc='upper left', bbox_to_anchor=(0, 1), 
                      frameon=True, fancybox=True, shadow=True)
    legend.set_title(legend_info['title'], prop={'weight': 'bold'})
    
    # Add description text
    fig.text(0.02, 0.02, legend_info['description'], fontsize=10, 
             style='italic', wrap=True, bbox=dict(boxstyle="round,pad=0.3", 
             facecolor="lightgray", alpha=0.5))
    
    # Add statistics text
    valid_data = index_array[np.isfinite(index_array)]
    if len(valid_data) > 0:
        stats_text = f"Mean: {np.mean(valid_data):.3f}\nStd: {np.std(valid_data):.3f}\nRange: {np.min(valid_data):.3f} to {np.max(valid_data):.3f}"
        fig.text(0.98, 0.02, stats_text, fontsize=10, ha='right',
                bbox=dict(boxstyle="round,pad=0.3", facecolor="white", alpha=0.8))
    
    plt.tight_layout()
    plt.savefig(output_path, dpi=300, bbox_inches='tight', facecolor='white')
    plt.close()
    
    print(f"✓ Visualization saved: {output_path}")

def print_statistics(name, array):
    """Print statistics for an index array."""
    valid = array[np.isfinite(array)]
    if len(valid) > 0:
        print(f"{name}:")
        print(f"  Range: {valid.min():.3f} to {valid.max():.3f}")
        print(f"  Mean: {valid.mean():.3f}")
        print(f"  Valid pixels: {len(valid):,} ({len(valid)/array.size*100:.1f}%)")
    else:
        print(f"{name}: No valid pixels!")
    print()

def main(args):
    with rasterio.open(args.input) as src:
        print(f"Processing: {args.input}")
        print(f"Dimensions: {src.width} x {src.height}")
        print(f"Bands: {src.count}")
        print()
        
        # Load and mask saturated pixels
        red   = mask_saturated_pixels(src.read(args.red, resampling=Resampling.nearest))
        nir   = mask_saturated_pixels(src.read(args.nir, resampling=Resampling.nearest))
        green = mask_saturated_pixels(src.read(args.green, resampling=Resampling.nearest))
        blue  = mask_saturated_pixels(src.read(args.blue, resampling=Resampling.nearest))

        # Print band statistics
        print("Band Statistics (after masking saturated pixels):")
        print(f"Red (Band {args.red}): {np.nanmean(red):.0f} ± {np.nanstd(red):.0f}")
        print(f"NIR (Band {args.nir}): {np.nanmean(nir):.0f} ± {np.nanstd(nir):.0f}")
        print(f"Green (Band {args.green}): {np.nanmean(green):.0f} ± {np.nanstd(green):.0f}")
        print(f"Blue (Band {args.blue}): {np.nanmean(blue):.0f} ± {np.nanstd(blue):.0f}")
        print()

        # Calculate indices
        np.seterr(divide='ignore', invalid='ignore')
        
        ndvi_img = ndvi(nir, red)
        ndwi_img = ndwi(green, nir)
        psri_img = psri(red, green, blue)

        # Print index statistics before stretching
        print("Index Statistics (before stretching):")
        print_statistics("NDVI", ndvi_img)
        print_statistics("NDWI", ndwi_img)
        print_statistics("PSRI", psri_img)

        # Single summary values for the entire image
        print("Single summary values for entire image:")
        valid_ndvi = ndvi_img[np.isfinite(ndvi_img)]
        valid_ndwi = ndwi_img[np.isfinite(ndwi_img)]
        valid_psri = psri_img[np.isfinite(psri_img)]

        if len(valid_ndvi) > 0:
            print(f"NDVI Summary: Mean={np.mean(valid_ndvi):.3f}, Median={np.median(valid_ndvi):.3f}")
        if len(valid_ndwi) > 0:
            print(f"NDWI Summary: Mean={np.mean(valid_ndwi):.3f}, Median={np.median(valid_ndwi):.3f}")
        if len(valid_psri) > 0:
            print(f"PSRI Summary: Mean={np.mean(valid_psri):.3f}, Median={np.median(valid_psri):.3f}")
        print()

        # Optional contrast stretch for GeoTIFF output
        if args.stretch:
            ndvi_stretched = stretch(ndvi_img.copy())
            ndwi_stretched = stretch(ndwi_img.copy())
            psri_stretched = stretch(psri_img.copy())
            print("Applied contrast stretching for GeoTIFF outputs.")
        else:
            ndvi_stretched = ndvi_img
            ndwi_stretched = ndwi_img
            psri_stretched = psri_img

        # Write GeoTIFF outputs
        prefix = args.out_prefix
        write_index(src, ndvi_stretched, f'{prefix}ndvi.tif')
        write_index(src, ndwi_stretched, f'{prefix}ndwi.tif')
        write_index(src, psri_stretched, f'{prefix}psri.tif')

        print("✓ GeoTIFF indices written:",
              f'{prefix}ndvi.tif, {prefix}ndwi.tif, {prefix}psri.tif')

        # Create visualizations (always use original, non-stretched data for consistent interpretation)
        if args.visualize:
            print("\nCreating visualizations...")
            visualize_index(ndvi_img, 'NDVI', f'{prefix}ndvi_map.png')
            visualize_index(ndwi_img, 'NDWI', f'{prefix}ndwi_map.png')
            visualize_index(psri_img, 'PSRI', f'{prefix}psri_map.png')
            
            # Create a combined visualization
            fig, axes = plt.subplots(1, 3, figsize=(18, 6))
            
            # NDVI
            im1 = axes[0].imshow(ndvi_img, cmap=create_ndvi_colormap(), vmin=-0.2, vmax=0.8)
            axes[0].set_title('NDVI - Vegetation Vigor', fontweight='bold')
            axes[0].axis('off')
            plt.colorbar(im1, ax=axes[0], fraction=0.046, pad=0.04)
            
            # NDWI
            im2 = axes[1].imshow(ndwi_img, cmap=create_ndwi_colormap(), vmin=-0.5, vmax=0.3)
            axes[1].set_title('NDWI - Water Content', fontweight='bold')
            axes[1].axis('off')
            plt.colorbar(im2, ax=axes[1], fraction=0.046, pad=0.04)
            
            # PSRI
            im3 = axes[2].imshow(psri_img, cmap=create_psri_colormap(), vmin=-0.1, vmax=0.2)
            axes[2].set_title('PSRI - Plant Stress', fontweight='bold')
            axes[2].axis('off')
            plt.colorbar(im3, ax=axes[2], fraction=0.046, pad=0.04)
            
            plt.tight_layout()
            plt.savefig(f'{prefix}combined_indices.png', dpi=300, bbox_inches='tight', facecolor='white')
            plt.close()
            
            print(f"✓ Combined visualization saved: {prefix}combined_indices.png")

if __name__ == "__main__":
    p = argparse.ArgumentParser(description="Compute and visualize NDVI, NDWI, PSRI from a GeoTIFF")
    p.add_argument("input", help="Input multispectral GeoTIFF")
    p.add_argument("--red",   type=int, default=3, help="1-based band # for Red")
    p.add_argument("--nir",   type=int, default=5, help="1-based band # for NIR")
    p.add_argument("--green", type=int, default=2, help="1-based band # for Green")
    p.add_argument("--blue",  type=int, default=1, help="1-based band # for Blue")
    p.add_argument("--out-prefix", default="", help="Prefix for output files")
    p.add_argument("--stretch", action="store_true",
                   help="Contrast-stretch GeoTIFF output (0-1) for easy viewing")
    p.add_argument("--visualize", action="store_true", default=True,
                   help="Create visualization maps with legends (default: True)")
    main(p.parse_args())