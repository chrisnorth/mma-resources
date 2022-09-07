# mma-resources
Resources related to multi-messenger astronomy outreach workshops

IN DEVELOPMENT!

## Data/Simulations (/data)

### Python Dependencies
* numpy
* astropy
* matplotlib
* afterglowpy (currently works with v0.7.3)


### X-ray
Uses afterglowpy to produce models

#### Scripts
* data/xray/python/plotGrid_JetCocoon.py: plot models with real (GW170817) data points added 
	* Note that parameters at the top of the file set the plot parameters
* data/xray/python/plotRandom.py: plot set of 9 random lightcurves with random jet type, distance and viewing angle
* data/xray/python/plotRandomData.py: plot mock data for random jet type, distance and viewing angle

### Gravitational Waves
Plots localisation plots for grav waves detector timings

#### Data
* data/GW/dt_XY.csv: CSV file of time differences for detector pair X-Y on Cartesian grid of whole sky

#### Plots
* plots/GW/dt_XY.png: png file showing time differences for detector pair X-Y on Cartesian grid of whole sky

#### Scripts
* python/GW/plot-locmaps.py: plot localisation timing maps for grav wave detectors, and output data files


## Front-end

The source for the website is the `src/` directory. The structure of this directory will be copied to the `dist/` directory by the build process using the default language. The build process will also create sub-directories with the same structure for each language code that has been enabled. Within the `src/` directory, HTML and JS files can contain ``{{ site.translations.main.welcome.title }}`` style language replacement string. These reference the structure of language YAML files	that are included under `translations` in `config.yml`. For example:

```
translations:
    main: "translations.yml"
    waveform: "src/gw/waveform-fitter/data/translations.yml"
```

references two different translation files and gives each one a namespace. So ``{{ site.translations.main.welcome.title }}`` extracts the `welcome>title` from `translations.yml`.

The site can be built using:

```perl build.pl```

This process will be run automatically on push via a Github Action.
