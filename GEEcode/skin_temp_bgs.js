/*This script is meant to extract statistics from the MODIS LST product for the surface water temperature of Clear Lake Reservoir in CA. In order to run this, you need to import the shape file of the lake as an asset and then add the asset to the code editor. */

//updated 03Sept2020
//by B. Steele
//v. 03Sept2020 - adds conversion of LST to degrees C (using both the scaling factor and the conversion from Kelvin), adds additional stats in the ee.Reducer step; still need to figure out how to eliminate mixels.
//v 03Sept2020b - corrects ee.Reducer to .unweighted(), meaning that only pixels with centroids within the clipped area are counted during aggregation!

// define satellite info
var sw = ee.Image("JRC/GSW1_1/GlobalSurfaceWater"),
    mLST = ee.ImageCollection("MODIS/006/MOD11A1")
              .filter(ee.Filter.date('2009-01-01', '2020-01-01'));

var pctTime = 91.5; //what percent of the time does a pixel need to classify as water?
//var y1 = 2009, y2 = 2019; //year range

// Scale to Kelvin and convert to Celsius, set image acquisition time.
var modLSTc = mLST.map(function(img) {
  return img
    .multiply(0.02)
    .subtract(273.15)
    .copyProperties(img, ['system:time_start']);
});

var landSurfaceTemperature = modLSTc.select('LST_Day_1km');

var landSurfaceTemperatureVis = {
  min: 13000.0*0.02-273.15,
  max: 16500.0*0.02-273.15,
  palette: [
    '040274', '040281', '0502a3', '0502b8', '0502ce', '0502e6',
    '0602ff', '235cb1', '307ef3', '269db1', '30c8e2', '32d3ef',
    '3be285', '3ff38f', '86e26f', '3ae237', 'b5e22e', 'd6e21f',
    'fff705', 'ffd611', 'ffb613', 'ff8b13', 'ff6e08', 'ff500d',
    'ff0000', 'de0101', 'c21301', 'a71001', '911003'
  ],
};

//shrink geometry to water area
var wateroccurrence = sw.select(0);
var water = wateroccurrence.gte(pctTime);
water = water.updateMask(water.neq(0));//.int8();
var clear_water = water.addBands(wateroccurrence).reduceToVectors({
  reducer: ee.Reducer.min(),
  geometry: clear,
  scale: 500, //
  labelProperty: 'surfaceWater'
});

/* need to shrink area further to make sure we aren't including pixels on land*/



//calc stats
var LotsOStats2 = function(img){
  img = ee.Image(img)
    .clip(clear_water);
var geo = clear_water.geometry(); 
  
  var modistime = img.get('system:time_start');

  var getCount = img.reduceRegion({
    reducer: ee.Reducer.count(),
    geometry:geo,
    //bestEffort:true,
    scale: 1000,
    maxPixels:1e9
  });
  
var minLST = img.reduceRegion({
    reducer: ee.Reducer.min().unweighted(),
    geometry:geo,
    //bestEffort:true,
    scale: 1000,
    maxPixels:1e9
  });
  
var maxLST = img.reduceRegion({
    reducer: ee.Reducer.max().unweighted(),
    geometry:geo,
    //bestEffort:true,
    scale: 1000,
    maxPixels:1e9
  });

var count = ee.Dictionary(getCount).get('LST_Day_1km');

  var stats = img.reduceRegion({
    reducer: ee.Reducer.median().unweighted().combine({
      reducer2: ee.Reducer.stdDev().unweighted(),
      sharedInputs:true
    }),
    geometry: geo,
    //bestEffort: true,
    scale: 1000,
    maxPixels:1e9
  });

  
  stats = ee.Dictionary(stats).set('pixel_count',count);
  stats = ee.Dictionary(stats).set('modis_time',modistime);
  stats = ee.Dictionary(stats).set('minLST', minLST);
  stats = ee.Dictionary(stats).set('maxLST', maxLST);

  return ee.Feature(null,stats);
};

var temp_stats = landSurfaceTemperature.map(LotsOStats2);

print(temp_stats);

// make viz
var filt_lst = temp_stats.select('LST_Day_1km_mean');

Map.setCenter(-121.14, 41.857840, 12);

print(landSurfaceTemperature);

Map.addLayer(
  clear_water
  );
Map.addLayer(
  clear
  );
Map.addLayer(
  landSurfaceTemperature.median().clip(clear_water),
  landSurfaceTemperatureVis,
  'Land Surface Temp');

  

Export.table.toDrive({
  collection: temp_stats,
  description: "temp_stats_clear",
  fileFormat: "CSV",
  folder: "whw_clear_res"
});
