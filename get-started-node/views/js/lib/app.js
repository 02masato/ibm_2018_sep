var getShiftedWayPointsList  = function ( params  ) {
////////////////////////
////          parameters
////            offsetLatLng   , //{  lat:0.003 , lng:0.003 }
////            startPoint         // GoogleLatLng
////            number          ,
////            sensitivity       , // boolean
////////////////////////////

// param は 再利用の為 値渡しに             
    var wayPointsList = [] ,
          startLat = params.startPoint.lat   ,
          startLng = params.startPoint.lng ,
          endLat = params.endPoint.lat    ,
          endLng = params.endPoint.lng  ;
    
    if ( startLat > endLat ) 
       {  params.offsetLatLng.lat  =  - params.offsetLatLng.lat ;  }
    if ( startLng >  endLng ) 
       {  params.offsetLatLng.lng  =  - params.offsetLatLng.lng ;  }
     
     wayPointsList.push ( [{
             location  : new google.maps.LatLng( startLat,startLng ) ,
             stopover : false
        }] ); 
  
    var tmpLat = startLat + params.offsetLatLng.lat ;
    for( i = 0;  i < params.number; i++ ){
             wayPointsList.push ( [{
             location  : new google.maps.LatLng( tmpLat ,startLng ) ,
             stopover : false
        }] );
         tmpLat  = tmpLat + params.offsetLatLng.lat ;
     }
  
    var tmpLng =startLng +  params.offsetLatLng.lng ;
    for( i = 0;  i < params.number; i++ ){
             wayPointsList.push ( [{
             location  : new google.maps.LatLng(  startLat  ,tmpLng) ,
             stopover : false
        }] );
       tmpLng  = tmpLng +  params.offsetLatLng.lng ;
    }
    
    if( params.sensitivity ) {
        startLat = params.startPoint.lat   ,
        startLng = params.startPoint.lng ,
        tmpLat = startLat + params.offsetLatLng.lat ,
        tmpLng =startLng +  params.offsetLatLng.lng ;
          for( i = 0;  i < params.number; i++ ){
              wayPointsList.push ( [{
               location  : new google.maps.LatLng( startLat ,startLng ) ,
              stopover: false
           }] );
             tmpLat = tmpLat + params.offsetLatLng.lat ,
             tmpLng = tmpLng + params.offsetLatLng.lng ;
         }
    }
    return  wayPointsList;
}

var getLocationFromAddress = function ( address , handler ) {
    
    var geocoder = new google.maps.Geocoder( address );
    geocoder.geocode( { 'address': address }, function( results , status ) {
      if ( status == google.maps.GeocoderStatus.OK ) {
           handler(results[0].geometry.location );
    } else {
      console.log('Geocode was not successful for the following reason: ' + status);
    } 
  });
}

var calculateAndDisplayRoute = function (directionsService ,directionsDisplay , startPoint , endPoint , wayPoints ) {

  directionsService.route({
    origin: startPoint ,
    destination: endPoint ,
    waypoints: wayPoints ,
    travelMode: google.maps.TravelMode.DRIVING
  }, function(response, status) {
    if (status == google.maps.DirectionsStatus.OK) {
      directionsDisplay.setDirections(response);
    } else {
      window.alert('Directions request failed due to ' + status);
    }
  });
}

var renderRoutes = function ( startPoint , endPoint , wayPointsList , map ){
  var len =  wayPointsList.length +1;
  while( -- len ) { 
    var directionsService = new google.maps.DirectionsService;
    var directionsDisplay = new google.maps.DirectionsRenderer({
      map: map ,
      suppressMarkers: true
    }),
    markerA = new google.maps.Marker({
      position: startPoint,
      title: "start",
      label: "出発地点",
      map: map
    }),
    markerB = new google.maps.Marker({
      position: endPoint,
      title: "end",
      label: "目的地店",
      map: map
    });
       var wayPoints = wayPointsList[len];
       calculateAndDisplayRoute( directionsService , directionsDisplay , startPoint , endPoint , wayPoints );
   }
   var map = directionsDisplay.getMap();
   
 
}

