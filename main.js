import './style.css'

var ee = require('@google/earthengine');

function main(){
// Require client library and private key.
var privateKey = require('./.private-key.json');

// Initialize client library and run analysis.
var runAnalysis = function() {
  ee.initialize(null, null, function() {
    // ... run analysis ...
  }, function(e) {
    console.error('Initialization error: ' + e);
  });
};

// Authenticate using a service account.
ee.data.authenticateViaPrivateKey(privateKey, runAnalysis, function(e) {
  console.error('Authentication error: ' + e);
});

ee.data.authenticateViaPrivateKey(AIzaSyCygLKhPAmV_9hENXOMZm_5uYnJ3kYFalE);

ee.initialize();

//Code down below here
//Our area of interest
var geometry = ee.Geometry.Point([23.475629, 38.062403]); //Attica
// ee.Geometry.Point([28.021, 36.1635]); //Rhode Island
// Import a global dataset of administrative units level 1.
var adminUnits = ee.FeatureCollection(
'FAO/GAUL_SIMPLIFIED_500m/2015/level1');
// Filter for the administrative unit that intersects
// the geometry located at the top of this script.
var adminSelect = adminUnits.filterBounds(geometry);
// Center the map on this area.
Map.centerObject(adminSelect, 7);
// Make the base map HYBRID.
Map.setOptions('HYBRID');
// Add it to the map to make sure you have what you want.
Map.addLayer(adminSelect, {}, 'selected admin unit');
// Import the Sentinel-5P NO2 offline product.
var no2Raw = ee.ImageCollection('COPERNICUS/S5P/OFFL/L3_NO2');
var coRaw = ee.ImageCollection('COPERNICUS/S5P/OFFL/L3_CO');
var AAIRaw = ee.ImageCollection('COPERNICUS/S5P/OFFL/L3_AER_AI');
// Define function to exclude cloudy pixels.
function maskClouds(image) {
// Get the cloud fraction band of the image.
var cf = image.select('cloud_fraction');
// Create a mask using 0.3 threshold.
var mask = cf.lte(0.3); // You can play around with this value.
// Return a masked image.
return image.updateMask(mask).copyProperties(image);
}
// Clean and filter the Sentinel-5P NO2 offline product.
var no2 = no2Raw
// Filter for images intersecting our area of interest.
.filterBounds(adminSelect)
// Map the cloud masking function over the image collection.
.map(maskClouds)
// Select the tropospheric vertical column of NO2 band.
.select('tropospheric_NO2_column_number_density');
// Clean and filter the Sentinel-5P CO offline product.
var co = coRaw
// Filter for images intersecting our area of interest.
.filterBounds(adminSelect)
// Select the vertically integrated CO column density band.
.select('CO_column_number_density');
// Clean and filter the Sentinel-5P UV Aerosol Index offline product.
var AAI = AAIRaw
// Filter for images intersecting our area of interest.
.filterBounds(adminSelect)
// Select the absorbing aerosol index band.
.select('absorbing_aerosol_index');
// Create a median composite for July 2022
var no2Median = no2.filterDate('2022-07-01', '2022-08-01').median();
var coMedian = co.filterDate('2022-07-01', '2022-08-01').median();
var AAIMedian = AAI.filterDate('2022-07-01', '2022-08-01').median();
// Clip it to your area of interest (only necessary for visualization purposes).
var no2MedianClipped = no2Median.clipToCollection(adminSelect);
var coMedianClipped = coMedian.clipToCollection(adminSelect);
var AAIMedianClipped = AAIMedian.clipToCollection(adminSelect);
// NO2 visualization options.
var no2Viz = {
min: 0,
max: 0.0002,
palette: ['black', 'blue', 'purple', 'cyan', 'green',
'yellow', 'red'
]
};
// CO visualization options.
var coViz = {
min: 0,
max: 0.05,
palette: ['black', 'blue', 'purple', 'cyan', 'green',
'yellow', 'red'
]
};
// AAI visualization options.
var AAIViz = {
min: -1,
max: 2,
palette: ['black', 'blue', 'purple', 'cyan', 'green',
'yellow', 'red'
]
};
Map.addLayer(no2MedianClipped, no2Viz, 'median no2 July 2022');
Map.addLayer(coMedianClipped, coViz, 'median co July 2022');
Map.addLayer(AAIMedianClipped, AAIViz, 'median AAI July 2022');
// Define a wildfire NO2 median composite.
var no2fire = no2.filterDate('2023-07-17', '2023-07-20')
//var no2fire = no2.filterDate('2023-07-22', '2023-07-25')
.median().clipToCollection(adminSelect);
// .mean().clipToCollection(adminSelect);
// Define a wildfire CO median composite.
var cofire = co.filterDate('2023-07-17', '2023-07-20')
//var cofire = co.filterDate('2023-07-22', '2023-07-25')
.median().clipToCollection(adminSelect);
// .mean().clipToCollection(adminSelect);
// Define a wildfire AAI median composite.
var AAIfire = AAI.filterDate('2023-07-09', '2023-07-10')
//var AAIfire = AAI.filterDate('2023-07-22', '2023-07-25')
.median().clipToCollection(adminSelect);
// .mean().clipToCollection(adminSelect);
// Define a baseline NO2 using the month of July 2022.
var no2Baseline = no2.filterDate('2023-06-01', '2023-07-01')
.median().clipToCollection(adminSelect);
// .mean().clipToCollection(adminSelect);
// Define a baseline CO using the month of July 2022.
var coBaseline = co.filterDate('2023-06-01', '2023-07-01')
.median().clipToCollection(adminSelect);
// .mean().clipToCollection(adminSelect);
// Define a baseline AAI using the month of July 2022.
var AAIBaseline = AAI.filterDate('2022-07-01', '2022-08-01')
.median().clipToCollection(adminSelect);
// .mean().clipToCollection(adminSelect);
// Create a ui map widget to hold the baseline NO2 image.
var leftMap = ui.Map().centerObject(adminSelect, 7).setOptions(
'HYBRID');
// Create ta ui map widget to hold the wildfire NO2 image.
var rightMap = ui.Map().setOptions('HYBRID');
// Create a split panel widget to hold the two maps.
var sliderPanel = ui.SplitPanel({
firstPanel: leftMap,
secondPanel: rightMap,
orientation: 'horizontal',
wipe: true,
style: {
stretch: 'both'
}
});
var linker = ui.Map.Linker([leftMap, rightMap]);
// Make a function to add a label.
function makeMapLab(lab, position) {
var label = ui.Label({
value: lab,
style: {
fontSize: '16px',
color: '#ffffff',
fontWeight: 'bold',
backgroundColor: '#ffffff00',
padding: '0px'
}
});
var panel = ui.Panel({
widgets: [label],
layout: ui.Panel.Layout.flow('horizontal'),
style: {
position: position,
backgroundColor: '#00000057',
padding: '0px'
}
});
return panel;
}
// Create baseline map layer, add it to the left map, and add the label.
var no2BaselineLayer = ui.Map.Layer(no2Baseline, no2Viz);
var coBaselineLayer = ui.Map.Layer(coBaseline, coViz);
var AAIBaselineLayer = ui.Map.Layer(AAIBaseline, AAIViz);
leftMap.layers().reset([no2BaselineLayer]);
//leftMap.layers().reset([coBaselineLayer]);
//leftMap.layers().reset([AAIBaselineLayer]);
leftMap.add(makeMapLab('Baseline 2022 July', 'top-left'));
// Create wildfire map layer, add it to the right map, and add the label.
var no2fireLayer = ui.Map.Layer(no2fire, no2Viz);
var cofireLayer = ui.Map.Layer(cofire, coViz);
var AAIfireLayer = ui.Map.Layer(AAIfire, AAIViz);
rightMap.layers().reset([no2fireLayer]);
//rightMap.layers().reset([cofireLayer]);
//rightMap.layers().reset([AAIfireLayer]);
rightMap.add(makeMapLab('Wildfire 2023 July', 'top-right'));
// Reset the map interface (ui.root) with the split panel widget.
// Note that the Map.addLayer() calls earlier on in Section 2
// will no longer be shown because we have replaced the Map widget
// with the sliderPanel widget.
ui.root.widgets().reset([sliderPanel]);
// Create a function to get the mean NO2 for the study region per image in the NO2 collection.
function getConc(collectionLabel, img) {
return function(img) {
// Calculate the mean NO2.
var no2Mean = img.reduceRegion({
reducer: ee.Reducer.mean(),
geometry: adminSelect.geometry(),
scale: 1000
}).get('tropospheric_NO2_column_number_density');
// Get the day-of-year of the image.
var doy = img.date().getRelative('day', 'year');
// Return a feature with NO2 concentration and day-of-year properties.
return ee.Feature(null, {
'conc': no2Mean,
'DOY': doy,
'type': collectionLabel
});
};
}
// Get the concentrations for a baseline and wildfire collection and merge for plotting.
var no2AggChange_forPlotting = no2
.filterDate('2023-07-01', '2023-08-01')
.map(getConc('wildfire'))
.merge(no2.filterDate('2022-07-01', '2022-08-01')
.map(getConc('baseline')));
no2AggChange_forPlotting = no2AggChange_forPlotting
.filter(ee.Filter.notNull(['conc']));
// Make a chart.
var chart1 = ui.Chart.feature.groups(
no2AggChange_forPlotting, 'DOY', 'conc', 'type')
.setChartType('LineChart')
.setOptions({
title: 'DOY time series for mean [NO2] during ' +
'July 2022 (baseline) and July 2023 (wildfire)'
});
// Print it to the console.
print('Baseline vs wildfire NO2 for the study region by DOY', chart1);
}
export default main();
