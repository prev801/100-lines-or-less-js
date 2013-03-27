dojo.require("esri.map");
var map;
var myPano;
function init_AGS(pLat,pLon) {
	var options = {basemap:"gray", center:[pLon, pLat], zoom: 15, slider:false};
  	map = new esri.Map("mapDiv",options);
	wid_biz_stat.onLoad();
	wid_biz_stat.sendToServer(pLat,pLon);
}
function init_GE_StreetView(pLat,pLon) {
	var panoramaOpt = {
		position: new google.maps.LatLng(pLat, pLon),
        pov: {heading: 0,pitch: 0,zoom: 1},
        zoomControl:false,
        addressControl:false,
        panControl:false};
    myPano = new google.maps.StreetViewPanorama(dojo.byId('pano'), panoramaOpt);
    google.maps.event.addListener(myPano, 'pano_changed', function(event) {       	
        var vPoint = myPano.getPosition();
        wid_biz_stat.sendToServer(vPoint.lat(),vPoint.lng());
        map.centerAt(new esri.geometry.Point(vPoint.lng(),vPoint.lat()));
    });
}
function init_getUserLocation() {
	if(navigator.geolocation) {
		navigator.geolocation.getCurrentPosition(function(position) {
		init_GE_StreetView(position.coords.latitude,position.coords.longitude);
		init_AGS(position.coords.latitude,position.coords.longitude);
		}
	)}
	else {
		init_GE_StreetView(33.83029,-116.54529);
		init_AGS(33.83029 ,-116.54529);
	}
}

var wid_biz_stat = {
	queryTask:null,
	onLoad: function() {
		var agsRest = "http://server.arcgisonline.com/ArcGIS/rest/services/";
		var TaskURL = agsRest + "Demographics/USA_Retail_Spending_Potential/MapServer/1";
		if (!dojo.getObject("esri.tasks.query")) {					
			dojo.require("esri.tasks.query");
			this.queryTask = new esri.tasks.QueryTask(TaskURL);			
		}else{
			this.queryTask = new esri.tasks.QueryTask(TaskURL);	
		}
		dojo.connect(map, "onExtentChange", wid_biz_stat.processPosition);
		dojo.connect(map, "onZoomEnd", wid_biz_stat.processPosition);
		dojo.connect(map, "onPanEnd", wid_biz_stat.processPosition);	
	},	
	processPosition: function(pEvt) {
		var geo = map.geographicExtent;
		var CenterX = (geo.xmax + geo.xmin) / 2;
		var CenterY = (geo.ymax + geo.ymin) / 2;
   		wid_biz_stat.sendToServer(CenterY,CenterX);	
	},	
	sendToServer: function(pLat,pLon){		
		var query = new esri.tasks.Query();
        query.returnGeometry = false;
        query.geometry = new esri.geometry.Point({latitude: pLat,longitude: pLon});
        query.where="1=1";
        query.outFields = ["MEDHINC_CY", "X15001_A", "X15001_I"];		
		wid_biz_stat.queryTask.execute(query, wid_biz_stat.showResults);
	},	
	showResults: function(pResult) {
		var s = "<table align='right'><tr><td><table>"; var rate = 0;
        for (var i=0, il=pResult.features.length; i<il; i++) {
        	var alias = pResult.fieldAliases;
         	var featAtt = pResult.features[i].attributes;
          	for (att in featAtt) {
            	s = s + "<tr><td><img src='images//" + alias[att].replace(":","") + ".png'></td>";
            	if(att == "X15001_I") {
            		var index = featAtt[att] - 100;
            		if(index >= 0){s = s + "<td><img src='images/up.png'></td>";rate = rate + 1;}
            		else{s = s + "<td><img src='images/down.png'></td>";}	
            	}
            	else if(att == "MEDHINC_CY") {
            		var income = featAtt[att] - 52762;
            		if(income >= 0){s = s + "<td><img src='images/up.png'></td>";rate = rate + 1;}
            		else{s = s + "<td><img src='images/down.png'></td>";}
            	}
            	else {
            		var retail = featAtt[att] - 12990;
            		if(retail >= 0){s = s + "<td><img src='images/up.png'></td>";rate = rate + 1;}
            		else{s = s + "<td><img src='images/down.png'></td>";}            		
            	}
            	s = s + "</tr>";
          	}
        }
       	s = s + "</table></td><td colspan='2'><img src='images/rate"+rate+".png'></td></tr>";
		dojo.byId('biz_info').innerHTML = s + "</table>";
	}	
};
dojo.addOnLoad(init_getUserLocation);
