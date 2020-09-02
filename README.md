# Waterhackweek 2020: Fire and Water
### How 

Slack channel: [#fire-and-water](https://waterhackweek2020.slack.com/messages/C019MP15H70) 
Google Drive:https://drive.google.com/drive/folders/1he4AevUwBnyOu1mv9Gttn7MJImSd7cvc

---

### Collaborators:
* Bethel Steel (Project Lead)
* Steven Pestana (spestana@uw.edu) (Data Science Lead)

---

### The Problem:
* What are the patterns (spatial, temporal) of snowmelt in the Tuolumne River Basin?
* Can we deliniate a snowmelt elevation band using in situ data from Dana Meadows, and an assumed air temperature lapse rate?

### Specific Questions/Goals:
* Learn how to read, plot, and manipulate ASO raster data, and time series meteorological data in python

### Broader Impacts and Applicaitons: 
* The winter snowpack of the Tuolumne River Basin (TRB) is a major water supply for human use in California

---

### Data:
Lidar from the NASA Airborne Snow Observatory provides snapshots in time of snow depth across a watershed
* Snow depth (geotiff raster at 30m resolution, ASO lidar-derived) 2014, 2015, 2016
* DEM (geotiff raster at 30m resolution, ASO lidar-derived)
* [Data readme](https://github.com/waterhackweek/whw2019_snowmelt/tree/master/data)
* [Google drive folder](https://drive.google.com/drive/folders/1wDo9Xc2FYYhxTw9HUvVxhX7I8XEYYnv7?usp=sharing)
* [Data access demo notebook](https://nbviewer.jupyter.org/github/waterhackweek/whw2019_snowmelt/blob/master/data/data-access-demo.ipynb)

![ASO Slide](https://github.com/waterhackweek/whw2019_snowmelt/blob/master/aso.PNG)

---

### Existing Methods/Tools and Prior Work:
* https://github.com/NCristea/NCristeaGEE 
* https://github.com/geohackweek/ghw2018_snowmelt
* [Creating a hydroshare resource](https://www.hydroshare.org/resource/7015162a158648ba95ff547a6eb753ba/), and [in pysumma](https://gist.github.com/spestana/3038f9b9e9e34fc39ed13248ca894ef5)
* environment file from [Geohackweek tutorial materials](https://geohackweek.github.io/raster/01-introduction/)

---

### Python Packages Used:
* numpy
* pandas
* rasterio

---

### Background Reading:
* NASA JPL - [Airborne Snow Observatory](https://aso.jpl.nasa.gov/)
* Musselman, Keith N., et al. "Slower snowmelt in a warmer world." Nature Climate Change 7.3 (2017): 214. doi: 10.1038/nclimate3225  https://www.nature.com/articles/nclimate3225.pdf 
* Painter, T. H., Berisford, D. F., Boardman, J. W., Bormann, K. J., Deems, J. S., Gehrke, F., ... & Mattmann, C. (2016). The Airborne Snow Observatory: Fusion of scanning lidar, imaging spectrometer, and physically-based modeling for mapping snow water equivalent and snow albedo. Remote Sensing of Environment, 184, 139-152.

