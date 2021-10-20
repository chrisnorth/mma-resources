# mma-resources
Resources related to multi-messenger astronomy outreach workshops

IN DEVELOPMENT!

## Dependencies
* numpy
* astropy
* matplotlib
* afterglowpy (currently works with v0.7.3)

## X-ray
Uses afterglowpy to produce models

### Scripts
* xray/python/plotGrid_JetCocoon.py: plot models with real (GW170817) data points added 
	* Note that parameters at the top of the file set the plot parameters
* xray/python/plotRandom.py: plot set of 9 random lightcurves with random jet type, distance and viewing angle
* xray/python/plotRandomData.py: plot mock data for random jet type, distance and viewing angle

## Gravitational Waves
Plots localisation plots for grav waves detector timings

### Scripts
* gw/python/plot-locmaps.py: plot localisation timing maps for grav wave detectors.
