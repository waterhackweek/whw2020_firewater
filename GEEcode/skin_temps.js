#file authored by Christina Herrick, University of New Hampshire. She has given permission for this code and variation of this code to be used by this group, but please request use from her directly at Christina.Herrick@unh.edu. If data collected using this code or any portion of this code, please attribute code co-author as Christina Herrick.

var sw = ee.Image("JRC/GSW1_1/GlobalSurfaceWater"),
    jrc_meta = ee.Image("JRC/GSW1_1/Metadata"),
    ag100 = ee.Image("NASA/ASTER_GED/AG100_003"),
    l4t1 = ee.ImageCollection("LANDSAT/LT04/C01/T1"),
    l4t2 = ee.ImageCollection("LANDSAT/LT04/C01/T2"),
    l5t1 = ee.ImageCollection("LANDSAT/LT05/C01/T1"),
    l5t2 = ee.ImageCollection("LANDSAT/LT05/C01/T2"),
    l7t1 = ee.ImageCollection("LANDSAT/LE07/C01/T1"),
    l7t2 = ee.ImageCollection("LANDSAT/LE07/C01/T2"),
    l8t1 = ee.ImageCollection("LANDSAT/LC08/C01/T1"),
    l8t2 = ee.ImageCollection("LANDSAT/LC08/C01/T2"),
    vapor = ee.ImageCollection("NCEP_RE/surface_wv"),
    midge = 
    /* color: #d62c92 */
    /* shown: false */
    ee.Feature(
        ee.Geometry.Point([-72.0344711064929, 43.41009720033876]),
        {
          "Name": "Midge",
          "system:index": "0"
        }),
    coffin = 
    /* color: #6990ff */
    /* shown: false */
    ee.Feature(
        ee.Geometry.Point([-72.0780033617383, 43.39301630882498]),
        {
          "Name": "Coffin",
          "system:index": "0"
        }),
    newbury = 
    /* color: #cecba7 */
    /* shown: false */
    ee.Feature(
        ee.Geometry.Point([-72.03916756416504, 43.32433355925022]),
        {
          "system:index": "0"
        }),
    fichter = 
    /* color: #968fff */
    /* shown: false */
    ee.Feature(
        ee.Geometry.Point([-72.04593263953979, 43.344331531537485]),
        {
          "system:index": "0"
        }),
    st200 = 
    /* color: #d63000 */
    /* shown: false */
    ee.Feature(
        ee.Geometry.Point([-72.043774, 43.403914]),
        {
          "system:index": "0"
        }),
    st210 = 
    /* color: #98ff00 */
    /* shown: false */
    ee.Feature(
        ee.Geometry.Point([-72.062433, 43.384405]),
        {
          "system:index": "0"
        }),
    st220 = 
    /* color: #10bae1 */
    /* shown: false */
    ee.Feature(
        ee.Geometry.Point([-72.055073, 43.3602]),
        {
          "system:index": "0"
        }),
    st230 = 
    /* color: #ffc82d */
    /* shown: false */
    ee.Feature(
        ee.Geometry.Point([-72.042191, 43.335879]),
        {
          "system:index": "0"
        }),
    loon = 
    /* color: #976fd6 */
    /* shown: false */
    ee.Feature(
        ee.Geometry.Point([-72.0576666, 43.3913333]),
        {
          "system:index": "0"
        }),
    harbor = 
    /* color: #98ff00 */
    /* shown: false */
    ee.Feature(
        ee.Geometry.Point([-72.0812139, 43.38565]),
        {
          "system:index": "0"
        }),
    box = /* color: #be3bb3 */ee.Geometry.Polygon(
        [[[-72.09056854248053, 43.316935124838935],
          [-72.02533721923834, 43.31643554010213],
          [-72.022933959961, 43.432229129757175],
          [-72.09194183349615, 43.432727761476514]]]);

var pctTime = 55; //what percent of the time does a pixel need to classify as water?
//var cc = 95; //cloud cover
var cloudthresh = 5; // <-- I don't use this anymore, but I keep it just in case
var rmse = 24;
var y1 = 2015, y2 = 2019; //year range
var m1 = 5, m2 = 10; //month range
//var p1 = 202, p2 = 189;
//var r1 = 12, r2 = 14;
//var d1 = '2009-06-01', d2 = '2014-06-30';
var path = 13, row = 30; //landsat

var emissivity = ee.Number(0.981); //constant emissivity value
var e = ee.Number(1).divide(emissivity);

var rainbow = ['gray','blueviolet','indigo','blue','green','yellow','orange','red','brown'];
var aoi = box;

var aster13 = ag100.select(['emissivity_band13']).multiply(0.001);
//print('aster13',aster13);
var aster14 = ag100.select(['emissivity_band14']).multiply(0.001);
//print('aster14',aster14);

//https://unh.box.com/v/landsat4-7-qavalues
var qa_values = ee.List([672,676,680,684,704,708,712,716,928,932,936,940,960,964,968,972]); //KEEP these pixel values
                        //1696,1700,1704,1708,1728,1732,1736,1740]); <-- these are snow/ice

//https://unh.box.com/v/landsat8-qavalues
var qa_val_8 = ee.List([2,2720,2722,2724,2728,2732,2752,2756,2760,2764,2976,2980,2984,2988,3008,3012,3016,3020]); //KEEP these pixel values
                        //,3744,3748,3752,3756,3776,3780,3784,3788]); <-- these are snow/ice

//////////////////////////////////////////////////////////////////////////////////
/* FILTER AND STACK LANDSAT */
//////////////////////////////////////////////////////////////////////////////////

/*
For each landsat stack, filter by total cloud cover, date, site location, and
make sure all landsat scenes are in descending orbit (wrs<234), then create radiance band, 
toa brightness temp band in Celcius, & band coefficients and constants.
Stack them together, and make sure the metadata and system time carries over. For landsat 8, 
make sure scenes are nadir and the TIRS algorithm isn't preliminary version

Coefficients derive from modeling the TIGR2311 atmospheric sounding database, except landsat 8,
which come from GAPRI4714.  They're the 'coeff' variable below

See this paper from 2003 for the gist - https://unh.box.com/v/jimenez-2003
this paper, table 2 for landsat 4-7 coefficients - https://unh.box.com/v/jimenez-2009
this paper, eq 6 for landsat 8 coefficients - https://unh.box.com/v/jimenez-2014
*/

var k = ee.Kernel.square({
  radius: 60,
  units: 'meters'
});

var k8 = ee.Kernel.square({
  radius: 200,
  units: 'meters'
});

var prep4bands = function(img) {
  var systime = img.get('system:time_start');
  var elev = img.get('SUN_ELEVATION');
  var sza = ee.Number(90).subtract(elev);
  var uid = img.get('system:index');
  
  var radiance = ee.Algorithms.Landsat.calibratedRadiance(img).select(['B6'],['radi']);
  var toa = ee.Algorithms.Landsat.TOA(img);
  toa = toa.select(['B[1-6]'],['blue','green','red','nir','swir','temp']);
  
  var red = toa.select(['B3'],['red']);
  var nir = toa.select(['B4'],['nir']);
  var ndvi = toa.normalizedDifference(['nir','red']).select(['nd'],['ndvi']);
  var ndsi = toa.normalizedDifference(['green','swir']).select(['nd'],['ndsi']);
  
  var bt = toa.select(['B6'],['bt']).subtract(273.15);
  
  var coeff = ee.Image([0.06674,-0.03447,1.04483,-0.50095,-1.15652,0.09812,-0.04732,1.50453,-0.34405])
              .select([0,1,2,3,4,5,6,7,8],['c11','c12','c13','c21','c22','c23','c31','c32','c33']);
  var Bg = ee.Image.constant(1290).select([0],['Bg']);
          
  var cs = ee.Algorithms.Landsat.simpleCloudScore(toa).select(['cloud']).lt(cloudthresh);

  // use the QA band to mask cloudy pixels  
  var p_qa = img.select(["BQA"]);
  var p_mask = p_qa.remap(qa_values,qa_values).mask().int8();//.updateMask(ndsi.lt(0.05)).int8();
  // use entropy on the mask to erode the masked areas by 60m/100m (1 more pixel)
  var ent = p_mask.entropy(k).multiply(10).uint8();
  var ent2 = ent.remap([0],[0]).mask();
  var entMask = p_mask.updateMask(ent2);
  
  var both = radiance.addBands(coeff).addBands(Bg).addBands(bt).addBands(ndvi).addBands(ndsi)
              //.mask(cs)
              .mask(entMask)
              .copyProperties(img)
              .set('sza',sza)
              .set('uid',uid)
              .set('system:time_start',systime);
  
  return ee.Image(both);
};

var prep5bands = function(img){
  var systime = img.get('system:time_start');
  var elev = img.get('SUN_ELEVATION');
  var sza = ee.Number(90).subtract(elev);
  var uid = img.get('system:index');
  
  var radiance = ee.Algorithms.Landsat.calibratedRadiance(img).select(['B6'],['radi']);
  var toa = ee.Algorithms.Landsat.TOA(img);
  toa = toa.select(['B[1-6]'],['blue','green','red','nir','swir','temp']);
  
  var red = toa.select(['B3'],['red']);
  var nir = toa.select(['B4'],['nir']);
  var ndvi = toa.normalizedDifference(['nir','red']).select(['nd'],['ndvi']);
  var ndsi = toa.normalizedDifference(['green','swir']).select(['nd'],['ndsi']);
  
  var bt = toa.select(['temp'],['bt']).subtract(273.15);
  
  var coeff = ee.Image([0.08158,-0.05707,1.05991,-0.58853,-1.08536,-0.00448,-0.06201,1.59086,-0.33513])
              .select([0,1,2,3,4,5,6,7,8],['c11','c12','c13','c21','c22','c23','c31','c32','c33']);
  var Bg = ee.Image.constant(1256).select([0],['Bg']);
          
  var cs = ee.Algorithms.Landsat.simpleCloudScore(toa).select(['cloud']).lt(cloudthresh);

  // use the QA band to mask cloudy pixels  
  var p_qa = img.select(["BQA"]);
  var p_mask = p_qa.remap(qa_values,qa_values).mask().int8();//.updateMask(ndsi.lt(0.05)).int8();
  // use entropy on the mask to erode the masked areas by 60m/100m (1 more pixel)
  var ent = p_mask.entropy(k).multiply(10).uint8();
  var ent2 = ent.remap([0],[0]).mask();
  var entMask = p_mask.updateMask(ent2);
  
  var both = radiance.addBands(coeff).addBands(Bg).addBands(bt).addBands(ndvi).addBands(ndsi)
              //.mask(cs)
              .mask(entMask)
              .copyProperties(img)
              .set('sza',sza)
              .set('uid',uid)
              .set('system:time_start',systime);
  
  return ee.Image(both);
};

var prep7bands = function(img){
  var systime = img.get('system:time_start');
  var elev = img.get('SUN_ELEVATION');
  var sza = ee.Number(90).subtract(elev);
  var uid = img.get('system:index');
  
  var radiance = ee.Algorithms.Landsat.calibratedRadiance(img).select(['B6_VCID_1'],['radi']);
  var toa = ee.Algorithms.Landsat.TOA(img);
  toa = toa.select(['B[1-5]','B6_VCID_1'],['blue','green','red','nir','swir','temp']);
  
  var red = toa.select(['B3'],['red']);
  var nir = toa.select(['B4'],['nir']);
  var ndvi = toa.normalizedDifference(['nir','red']).select(['nd'],['ndvi']);
  var ndsi = toa.normalizedDifference(['green','swir']).select(['nd'],['ndsi']);
  
  var bt = toa.select(['temp'],['bt']).subtract(273.15);
  
  var coeff = ee.Image([0.06982,-0.03366,1.04896,-0.51041,-1.20026,0.10490,-0.05457,1.52631,-0.32136])
                .select([0,1,2,3,4,5,6,7,8],['c11','c12','c13','c21','c22','c23','c31','c32','c33']);
  var Bg = ee.Image.constant(1277).select([0],['Bg']);
  
  var cs = ee.Algorithms.Landsat.simpleCloudScore(toa).select(['cloud']).lt(cloudthresh);
  
  // use the QA band to mask cloudy pixels  
  var p_qa = img.select(["BQA"]);
  var p_mask = p_qa.remap(qa_values,qa_values).mask().int8();//.updateMask(ndsi.lt(0.05)).int8();
  // use entropy on the mask to erode the masked areas by 60m/100m (1 more pixel)
  var ent = p_mask.entropy(k).multiply(10).uint8();
  var ent2 = ent.remap([0],[0]).mask();
  var entMask = p_mask.updateMask(ent2);
  
  var both = radiance.addBands(coeff).addBands(Bg).addBands(bt).addBands(ndvi).addBands(ndsi)
              //.mask(cs)
              .mask(entMask)
              .copyProperties(img)
              .set('sza',sza)
              .set('uid',uid)
              .set('system:time_start',systime);
  
  return ee.Image(both);
};

var prep8bands = function(img){
  var systime = img.get('system:time_start');
  var elev = img.get('SUN_ELEVATION');
  var sza = ee.Number(90).subtract(elev);
  var uid = img.get('system:index');
  
  var radiance = ee.Algorithms.Landsat.calibratedRadiance(img).select(['B10'],['radi']);
  var toa = ee.Algorithms.Landsat.TOA(img);
  toa = toa.select(['B[2-6]','B10'],['blue','green','red','nir','swir','temp']);
  
  var red = toa.select(['B4'],['red']);
  var nir = toa.select(['B5'],['nir']);
  var ndvi = toa.normalizedDifference(['nir','red']).select(['nd'],['ndvi']);
  var ndsi = toa.normalizedDifference(['green','swir']).select(['nd'],['ndsi']);
  
  var bt = toa.select(['temp'],['bt']).subtract(273.15);
  
  var coeff = ee.Image([0.04019,0.02916,1.01523,-0.38333,-1.50294,0.20324,0.00918,1.36072,-0.27514])
                .select([0,1,2,3,4,5,6,7,8],['c11','c12','c13','c21','c22','c23','c31','c32','c33']);
  var Bg = ee.Image.constant(1324).select([0],['Bg']);
  
  var cs = ee.Algorithms.Landsat.simpleCloudScore(toa).select(['cloud']).lt(cloudthresh);
  
  // use the QA band to mask cloudy pixels  
  var p_qa = img.select(["BQA"]);
  var p_mask = p_qa.remap(qa_val_8,qa_val_8).mask().int16();//.updateMask(ndsi.lt(0.05)).int16();
  // use entropy on the mask to erode the masked areas by 60m/100m (1 more pixel)
  var ent = p_mask.entropy(k8).multiply(10).uint16();
  var ent2 = ent.remap([0],[0]).mask();
  var entMask = p_mask.updateMask(ent2);
  
  var both = radiance.addBands(coeff).addBands(Bg).addBands(bt).addBands(ndvi).addBands(ndsi)
              //.mask(cs)
              .mask(entMask)
              .copyProperties(img)
              .set('sza',sza)
              .set('uid',uid)
              .set('system:time_start',systime);
  
  return ee.Image(both);
};

var l4 = l4t1.merge(l4t2)
        //.filterMetadata('CLOUD_COVER','less_than',cc)
        .filterMetadata('DATA_TYPE','equals','L1TP')
        .filterMetadata('GEOMETRIC_RMSE_MODEL','not_greater_than',rmse)
        .filterBounds(aoi)
        //.filterDate(d1,d2)
        .filterMetadata('WRS_PATH','equals',path)
        .filterMetadata('WRS_ROW','equals',row)
        .filter(ee.Filter.calendarRange(y1,y2,'year'))
        .filter(ee.Filter.calendarRange(m1,m2,'month'))
        //.filterMetadata('WRS_ROW','not_less_than',r1).filterMetadata('WRS_ROW','not_greater_than',r2)
        //.filterMetadata('WRS_PATH','not_greater_than',p1).filterMetadata('WRS_PATH','not_less_than',p2)
        //.filterMetadata('WRS_ROW','less_than',234)
        .map(prep4bands);

var l5 = l5t1.merge(l5t2)
        //.filterMetadata('CLOUD_COVER','less_than',cc)
        .filterMetadata('DATA_TYPE','equals','L1TP')
        .filterMetadata('GEOMETRIC_RMSE_MODEL','not_greater_than',rmse)
        .filterBounds(aoi)
        //.filterDate(d1,d2)
        .filterMetadata('WRS_PATH','equals',path)
        .filterMetadata('WRS_ROW','equals',row)
        .filter(ee.Filter.calendarRange(y1,y2,'year'))
        .filter(ee.Filter.calendarRange(m1,m2,'month'))
        //.filterMetadata('WRS_ROW','not_less_than',r1).filterMetadata('WRS_ROW','not_greater_than',r2)
        //.filterMetadata('WRS_PATH','not_greater_than',p1).filterMetadata('WRS_PATH','not_less_than',p2)
        //.filterMetadata('WRS_ROW','less_than',234)
        .map(prep5bands);

var l7 = l7t1.merge(l7t2)
        //.filterMetadata('CLOUD_COVER','less_than',cc)
        .filterMetadata('DATA_TYPE','equals','L1TP')
        .filterMetadata('GEOMETRIC_RMSE_MODEL','not_greater_than',rmse)
        .filterBounds(aoi)
        //.filterDate(d1,d2)
        .filterMetadata('WRS_PATH','equals',path)
        .filterMetadata('WRS_ROW','equals',row)
        .filter(ee.Filter.calendarRange(y1,y2,'year'))
        .filter(ee.Filter.calendarRange(m1,m2,'month'))
        //.filterMetadata('WRS_ROW','not_less_than',r1).filterMetadata('WRS_ROW','not_greater_than',r2)
        //.filterMetadata('WRS_PATH','not_greater_than',p1).filterMetadata('WRS_PATH','not_less_than',p2)
        //.filterMetadata('WRS_ROW','less_than',234)
        .map(prep7bands);

var l8 = l8t1.merge(l8t2)
        .filterMetadata('NADIR_OFFNADIR','equals','NADIR')
        .filterMetadata('TIRS_SSM_MODEL','not_equals','PRELIMINARY')
        //.filterMetadata('CLOUD_COVER','less_than',cc)
        .filterMetadata('DATA_TYPE','equals','L1TP')
        .filterMetadata('GEOMETRIC_RMSE_MODEL','not_greater_than',rmse)
        .filterBounds(aoi)
        //.filterDate(d1,d2)
        .filterMetadata('WRS_PATH','equals',path)
        .filterMetadata('WRS_ROW','equals',row)
        .filter(ee.Filter.calendarRange(y1,y2,'year'))
        .filter(ee.Filter.calendarRange(m1,m2,'month'))
        //.filterMetadata('WRS_ROW','not_less_than',r1).filterMetadata('WRS_ROW','not_greater_than',r2)
        //.filterMetadata('WRS_PATH','not_greater_than',p1).filterMetadata('WRS_PATH','not_less_than',p2)
        //.filterMetadata('WRS_ROW','less_than',234)
        .map(prep8bands);

////////////////////////////////////
//Make one large stacks of landsat data
/////////////////////////////////////
var landsat = ee.ImageCollection((l4).merge(l5).merge(l7).merge(l8)).filterMetadata('sza','less_than',77).sort('system:time_start');

print("landsat images used:",landsat.size());

//////////////////////////////////////////////////////////////////////////////////
/*FIND BIG WATER BODIES*/
//////////////////////////////////////////////////////////////////////////////////
/*
Since a pixel isn't the same from scene to scene, this ensures that the same pixels are
being compared from scene to scene. Using the Global Surface Water data layer, I 
delineated the lake water bodies. I could have done it by hand, but for future extrapolation,
I wanted a better way to do it.
*/
var wateroccurrence = sw.select(0);
//Map.addLayer(wateroccurrence,{'min':80,'max':100},'water');
var water = wateroccurrence.gte(pctTime);
water = water.updateMask(water.neq(0));//.int8();

var regions = water.addBands(wateroccurrence).reduceToVectors({
  reducer: ee.Reducer.min(),
  geometry: box,
  scale: 30,
  labelProperty: 'surfaceWater'
});

// Discard regions of a certain size.
var big_regions = regions;//.filter(ee.Filter.gte('sum',100000)); //100,000 m^2
//print(big_regions);
//print(big_regions.getDownloadURL('json'));

var lakeSunapee = ee.Feature(regions.filterMetadata('system:index','equals','+400611+128676').first());
var lakeaoi = big_regions.filterBounds(aoi);

//////////////////////////////////////////////////////////////////////////////////
/*ATMOSPHERIC CORRECTION & WATER SKIN TEMP OF LANDSAT*/
//////////////////////////////////////////////////////////////////////////////////
/*
The function below, 'atmosCorr', is where I actually apply the algorithm described in
the literature by Jimenez et al.
*/

//get skin surface temp
var atmosCorr = function(img) {
  img = ee.Image(img);
  var systime = img.get('system:time_start');
  
  var radi = img.select('radi');
  var bt = img.select('bt');
  var Bg = img.select('Bg');
  
  var gamma_top = bt.multiply(bt);
  var gamma_bot = radi.multiply(Bg);
  var gamma = gamma_top.divide(gamma_bot).select([0],['gamma']);
  
  var delta_right = gamma_top.divide(Bg);
  var delta = bt.subtract(delta_right).select([0],['delta']);
  
  var v = ee.Image(img.get('vapor')) //THIS GETS THE CORRESPONDING VAPOR IMAGE
          .multiply(0.1) // kg/m2 to g/cm2
          .select([0],['vapor']);
  //Since the literature says that the algorithm doesn't work well with
  //water vapor columns over 2.5g/cm, I masked those pixels
  v = v.mask(v.lte(2.5));
  
  img = img.addBands(v);
  
  var psi_1 = img.expression(
    '(c1*v*v)+(c2*v)+c3',{
      c1: img.select('c11'),
      c2: img.select('c12'),
      c3: img.select('c13'),
      v: img.select('vapor')
    }).select([0],['psi_1']);
    
  var psi_2 = img.expression(
    '(c1*v*v)+(c2*v)+c3',{
      c1: img.select('c21'),
      c2: img.select('c22'),
      c3: img.select('c23'),
      v: img.select('vapor')
    }).select([0],['psi_2']);
  
  var psi_3 = img.expression(
    '(c1*v*v)+(c2*v)+c3',{
      c1: img.select('c31'),
      c2: img.select('c32'),
      c3: img.select('c33'),
      v: img.select('vapor')
    }).select([0],['psi_3']);
 
  var surface_temp = psi_1.multiply(radi).add(psi_2).multiply(e).add(psi_3).multiply(gamma).add(delta);
  
  surface_temp = ee.Image(surface_temp).select([0],['surface_temp']).copyProperties(img);
  surface_temp = surface_temp.set('system:time_start',systime);

  return surface_temp;
};

// This connects the vapor image to the landsat image so it can be pulled during the 'atmosCorr' function
// It uses time to find the closest, and it also uses geometry to find one that intersects
var joinedVapor = ee.Join.saveFirst('vapor').apply({
  primary: landsat,
  secondary: vapor,
  condition: ee.Filter.and(
    ee.Filter.maxDifference({
      difference: 1000 * 60 * 60 * 12, //ms -> sec -> min -> hrs
      leftField: 'system:time_start',
      rightField: 'system:time_start',
    }),
    ee.Filter.intersects({
      leftField: '.geo',
      rightField: '.geo',
    })
  )
});

// The big finale-- apply the algorithm
var temps = joinedVapor.map(atmosCorr);

//temps = temps.filterMetadata('sza','less_than',77); // check solar zenith angle
//print('temps collection',temps);

var count = ee.ImageCollection(temps).reduce(ee.Reducer.count());

var tempsFirst = ee.Image(temps.first());
//print('t first',tempsFirst);

//////////////////////////////////////////////////////////////////////////////////
// GET STATS //
//////////////////////////////////////////////////////////////////////////////////

var LotsOStats = function(img){
  img = ee.Image(img);
  var geo = lakeSunapee.geometry(); // <--- change this aoi 
  
  var landsattime = img.get('system:time_start');
  var cloudcover = img.get('CLOUD_COVER');
  var vaporImg = ee.Image(img.get('vapor'));
  var vaportime = vaporImg.get('system:time_start');
  
  var vaporMath = ee.Algorithms.If(ee.Algorithms.IsEqual(vaporImg,null),-9999,vaporImg);
  var vaporMathg = ee.Image(vaporMath).multiply(0.1);
  
  var getCount = img.reduceRegion({
    reducer: ee.Reducer.count(),
    geometry: geo,
    //bestEffort:true,
    scale: 30,
    maxPixels:5e9
  });
  var count = ee.Dictionary(getCount).get('surface_temp');
  
  var getWaterCol = vaporMathg.reduceRegion({
    reducer: ee.Reducer.max(),
    geometry: geo,
    bestEffort: true,
    scale: 30
  });
  var waterCol = ee.Dictionary(getWaterCol).get('pr_wtr');
  
  var stats = img.reduceRegion({
    reducer: ee.Reducer.mean().combine({
      reducer2: ee.Reducer.stdDev(),
      sharedInputs:true
    }),
    geometry: geo,
    //bestEffort: true,
    scale: 30,
    maxPixels:5e9
  });
  
  var getMidge = img.reduceRegion({
    reducer: ee.Reducer.first(),
    geometry: midge,
    scale: 30
  });
  var stats_midge = ee.Dictionary(getMidge).get('surface_temp');
  stats_midge = ee.Algorithms.If(ee.Algorithms.IsEqual(stats_midge,null),-9999,stats_midge);
  
  var getFichter = img.reduceRegion({
    reducer: ee.Reducer.first(),
    geometry: fichter,
    scale: 30
  });
  var stats_fichter = ee.Dictionary(getFichter).get('surface_temp');
  stats_fichter = ee.Algorithms.If(ee.Algorithms.IsEqual(stats_fichter,null),-9999,stats_fichter);
  
  var getNewbury = img.reduceRegion({
    reducer: ee.Reducer.first(),
    geometry: newbury,
    scale: 30
  });
  var stats_newbury = ee.Dictionary(getNewbury).get('surface_temp');
  stats_newbury = ee.Algorithms.If(ee.Algorithms.IsEqual(stats_newbury,null),-9999,stats_newbury);
  
  var getCoffin = img.reduceRegion({
    reducer: ee.Reducer.first(),
    geometry: coffin,
    scale: 30
  });
  var stats_coffin = ee.Dictionary(getCoffin).get('surface_temp');
  stats_coffin = ee.Algorithms.If(ee.Algorithms.IsEqual(stats_coffin,null),-9999,stats_coffin);
  
  stats = ee.Dictionary(stats).set('pixel_count',count);
  stats = ee.Dictionary(stats).set('vapor_time',vaportime);
  stats = ee.Dictionary(stats).set('landsat_time',landsattime);
  stats = ee.Dictionary(stats).set('cloud_cover',cloudcover);
  stats = ee.Dictionary(stats).set('water_column',waterCol);
  stats = ee.Dictionary(stats).set('surface_temp_coffin',stats_coffin);
  stats = ee.Dictionary(stats).set('surface_temp_midge',stats_midge);
  stats = ee.Dictionary(stats).set('surface_temp_newbury',stats_newbury);
  stats = ee.Dictionary(stats).set('surface_temp_fichter',stats_fichter);
  stats = ee.Dictionary(stats).set('emiss',emissivity);


  return ee.Feature(null,stats);
};

var LotsOStats2 = function(img){
  img = ee.Image(img);
  var geo = lakeaoi; // <--- change this aoi 
  
  var landsattime = img.get('system:time_start');
  var cloudcover = img.get('CLOUD_COVER');
  var vaporImg = ee.Image(img.get('vapor'));
  var vaportime = vaporImg.get('system:time_start');
  
  var vaporMath = ee.Algorithms.If(ee.Algorithms.IsEqual(vaporImg,null),-9999,vaporImg);
  var vaporMathg = ee.Image(vaporMath).multiply(0.1);
  
  var getCount = img.reduceRegion({
    reducer: ee.Reducer.count(),
    geometry: geo,
    //bestEffort:true,
    scale: 30,
    maxPixels:5e9
  });
  var count = ee.Dictionary(getCount).get('surface_temp');
  
  var getWaterCol = vaporMathg.reduceRegion({
    reducer: ee.Reducer.max(),
    geometry: geo,
    bestEffort: true,
    scale: 30
  });
  var waterCol = ee.Dictionary(getWaterCol).get('pr_wtr');
  
  var stats = img.reduceRegion({
    reducer: ee.Reducer.mean().combine({
      reducer2: ee.Reducer.stdDev(),
      sharedInputs:true
    }),
    geometry: geo,
    //bestEffort: true,
    scale: 30,
    maxPixels:5e9
  });
  
  stats = ee.Dictionary(stats).set('pixel_count',count);
  stats = ee.Dictionary(stats).set('vapor_time',vaportime);
  stats = ee.Dictionary(stats).set('landsat_time',landsattime);
  stats = ee.Dictionary(stats).set('cloud_cover',cloudcover);
  stats = ee.Dictionary(stats).set('water_column',waterCol);
  stats = ee.Dictionary(stats).set('emiss',emissivity);


  return ee.Feature(null,stats);
};

var temp_stats = temps.map(LotsOStats2);

////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////
/*
var minmaxEmiss13 = aster13.reduceRegion({
  reducer: ee.Reducer.minMax(),
  geometry: lakeSunapee,//.geometry(),
  scale: 60,
  bestEffort: true
});
var meanEmiss13 = aster13.reduceRegion({
  reducer: ee.Reducer.mean(),
  geometry: lakeSunapee,//.geometry(),
  scale: 60,
  bestEffort: true
});
print('min max emiss 13',minmaxEmiss13);
print('mean emiss 13',meanEmiss13);

var minmaxEmiss14 = aster14.reduceRegion({
  reducer: ee.Reducer.minMax(),
  geometry: lakeSunapee,//.geometry(),
  scale: 60,
  bestEffort: true
});
var meanEmiss14 = aster14.reduceRegion({
  reducer: ee.Reducer.mean(),
  geometry: lakeSunapee,//.geometry(),
  scale: 60,
  bestEffort: true
});
print('min max emiss 14',minmaxEmiss14);
print('mean emiss 14',meanEmiss14);
*/


//////////////////////////////////////////////////////////////////////////////////
//Make sure there are still enough pixels left over the lake that haven't been masked
//////////////////////////////////////////////////////////////////////////////////

//var tempsBig = temp_stats.filterMetadata('pixel_count','greater_than',0)
//                .filterMetadata('surface_temp_mean','not_equals',0);


//////////////////////////////////////////////////////////////////////////////////
// CHART STUFF //
//////////////////////////////////////////////////////////////////////////////////

var getChartingProps = function(img) {
  img = ee.Image(img);
  
  var landsattime = img.get('system:time_start');
  var cloudcover = img.get('CLOUD_COVER');
  var spacecraft = img.get('SPACECRAFT_ID');
  var stats = ee.Dictionary({
    landsat_time:landsattime,
    cloud_cover:cloudcover,
    spacecraft:spacecraft
  });
  
  return ee.Feature(null,stats);
};

var landsatFeatures = landsat.map(getChartingProps);
print(landsatFeatures);

var mychart = ui.Chart.feature.groups({
  features: landsatFeatures,
  xProperty:"landsat_time",
  yProperty:"cloud_cover",
  seriesProperty:"spacecraft"
}).setChartType('ScatterChart')
.setOptions({
  pointSize:5,
  title: 'Landsat Availability Over AOI',
  hAxis: {title: 'Date'},
  vAxis: {title: 'Total Scene Cloud Cover'}
});

print(mychart);

var getSzaProps = function(img) {
  img = ee.Image(img);
  
  var landsattime = img.get('system:time_start');
  var sza = img.get('sza');
  var spacecraft = img.get('SPACECRAFT_ID');
  var stats = ee.Dictionary({
    landsat_time:landsattime,
    sun_angle:sza,
    spacecraft:spacecraft
  });
  
  return ee.Feature(null,stats);
};

var szaFeatures = landsat.map(getSzaProps);
print('sza features',szaFeatures);

var sza_chart = ui.Chart.feature.groups({
  features: szaFeatures,
  xProperty:"landsat_time",
  yProperty:"sun_angle",
  seriesProperty:"spacecraft"
}).setChartType('ScatterChart')
.setOptions({
  pointSize:5,
  title: 'Landsat Sun Angle Over AOI',
  hAxis: {title: 'Date'},
  vAxis: {title: 'Solar Zenith Angle'}
});

print(sza_chart);


//////////////////////////////////////////////////////////////////////////////////
// EXPORT STUFF //
//////////////////////////////////////////////////////////////////////////////////

Export.table.toDrive({
  collection: temp_stats,
  description: "temp_stats_sunapee",
  fileFormat: "CSV",
  folder: "GEE_IDS_Lutz"
});


//////////////////////////////////////////////////////////////////////////////////
// ADD STUFF TO MAP //
//////////////////////////////////////////////////////////////////////////////////
Map.addLayer(aster14,{min:967,max:982,opacity:0.5},'aster',false);
//Map.centerObject(count);

var valid_obs = jrc_meta.select(1);
Map.addLayer(valid_obs,{},'valid obs');

Map.addLayer(wateroccurrence,{},"water occurrence",false);
var transition = sw.select(5);
var transitionPalette = {'palette':['ffffff','0000ff','22b14c','d1102d','99d9ea','b5e61d','e6a1aa','ff7f27',
    'ffc90e','7f7f7f','c3c3c3']};
Map.addLayer(transition,transitionPalette,'transitional class');
/*
0	ffffff	No change
1	0000ff	Permanent
2	22b14c	New permanent
3	d1102d	Lost permanent
4	99d9ea	Seasonal
5	b5e61d	New seasonal
6	e6a1aa	Lost seasonal
7	ff7f27	Seasonal to permanent
8	ffc90e	Permanent to seasonal
9	7f7f7f	Ephemeral permanent
10	c3c3c3	Ephemeral seasonal
*/

var original = ee.Image('LANDSAT/LC08/C01/T1/LC08_198012_20140528');
Map.addLayer(original,{"bands":["B5","B4","B3"],"min":5896.26,"max":20260.74},'original',false);

//the resulting temp layer that is masked out for some reason...
//var checkOnIt = ee.Image(temps.filterMetadata('system:index','equals','2_LC08_198012_20140528').first());
//Map.addLayer(checkOnIt,{'min':0,'max':20},'check on it');

//var ncar = ee.Image('NCEP_RE/surface_wv/pr_wtr_eatm_2009061812').multiply(0.1); // kg/m2 to g/cm2
//Map.addLayer(ncar,{},'ncar');

//var outImg = prep4bands(original);
//print('outImg',outImg);

Map.addLayer(count,{},'count',false);

Map.addLayer(regions,{'color':'blue'},'regions',false);
//Map.centerObject(aoi,14);

