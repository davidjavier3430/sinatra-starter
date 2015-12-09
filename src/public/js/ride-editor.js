var RideEditor = function( element , options ){

  element = $(element);

  //Give an unique id to this editor, and save it
  this.id  = RideEditor.index + 1;
  RideEditor.editors[ this.id ] = this;
  RideEditor.index++;

  this.options = $.extend( options , {
    "readOnly": !element.attr("data-ride-editable") ,
    "center":  {
      lat: 18.1992109, lng: -66.9131826
    },
    "zoom": 8
  });

  this.element    = element;
  this.mapEl      = this.element.find("*[data-ride-map]");
  this.locationEl = this.element.find("*[data-ride-search]");
  this.dataEl     = this.element.find("*[data-ride-data]");
  this.data       = {
    "meters": 0 ,
    "points":   []
  };
  this.markers    = [];
  this.map        = null;
  this.directionsService = null;
  this.directionsService = null;
  this.placesBox         = null;

  this.init();

};

RideEditor.index    = 0;
RideEditor.editors  = [];

RideEditor.delete = function( id , pointIndex ){
   RideEditor.editors[ id ].data.points.splice( pointIndex , 1 );
  RideEditor.editors[ id ].update();
};

RideEditor.prototype.init = function(){

  //Init Map
  this.map = new google.maps.Map( this.mapEl.get(0) , { center: this.options.center , zoom: this.options.zoom }  );
  this.directionsService = new google.maps.DirectionsService;
  this.directionsDisplay = new google.maps.DirectionsRenderer;

  this.directionsDisplay.setMap(this.map);
  this.directionsDisplay.setOptions({ draggable: true , suppressMarkers: true });

  //Init PlaceBox
  if( this.locationEl.length ){
    this.placesBox = new google.maps.places.SearchBox( this.locationEl.get(0) );
    var self = this;
    this.placesBox.addListener('places_changed',  function(){
       self.onSeachBoxPlaceChanged();
    });

    this.locationEl.closest("form").on('keyup keypress', function(e) {
      var code = e.keyCode || e.which;
      if (code == 13) {
        e.preventDefault();
        return false;
      }
    });

  }

  //Load Data From Form
  this.load();

};

RideEditor.prototype.load = function(){

  try{
    if( this.dataEl.val().trim() ){
      this.data = JSON.parse( this.dataEl.val() );
      this.update();
    }
  }catch(err){
      console.log( this.dataEl.val() );
      console.log( "Cannot Read Map Data" , err );
  }

};

RideEditor.prototype.onSeachBoxPlaceChanged = function(){

  var places = this.placesBox.getPlaces();

  if (places.length == 0) {
       return;
  }

  //Clear Input
  this.locationEl.val("");

  if( !this.options.readOnly ){

    this.data.points.push({
      "name"   : places[0].name || places[0].formatted_address ,
      "address": places[0].formatted_address ,
      "lat"    : places[0].geometry.location.lat() ,
      "lng"    : places[0].geometry.location.lng()
    });

    this.update();

  }else{
    this.map.setCenter( places[0].geometry.location );
    this.map.setZoom( 13 );
  }
};

RideEditor.prototype.update = function(){

  //Remove previous markers
  this.markers.forEach( function( marker ){
    marker.setMap( null );
  });
  this.markers = [];

  //If we have no points there is nothing to do
  if( this.data.points.length == 0 ){
      return;
  }

  if( this.data.points.length == 1 ){
    var point = this.data.points[0];
    this.markers.push(this.createMarker( point , 0 ));
    this.map.setCenter( {lat: point.lat , lng: point.lng } );
    this.map.setZoom( 13 );
    return;
  }

  //Create Waypoints
  var waypoints = [];
  for( var i = 1 ; i < this.data.points.length - 1 ; i++ ){
    var point = this.data.points[i];
    waypoints.push({
      location: point.lat + "," + point.lng ,
      stopover: true
    });
  }

  //Get the current position of the map
  var center = this.map.getCenter();
  var zoom   = this.map.getZoom();

  var self             = this;
  var originPoint      = this.data.points[0];
  var destinationPoint = this.data.points[ this.data.points.length - 1];
  this.directionsService.route({
      origin:            originPoint.lat + "," + originPoint.lng,
      destination:       destinationPoint.lat + "," + destinationPoint.lng,
      waypoints:         waypoints,
      optimizeWaypoints: false,
      travelMode:        google.maps.TravelMode.DRIVING,
    }, function(response, status) {
       self.onDirectionsServiceResponse( response, status );
    });

};

RideEditor.prototype.onDirectionsServiceResponse = function( response, status ){

  if (status !== google.maps.DirectionsStatus.OK) {
      //Last Location was invalid
      alert("Invalid Location, Is that reachable by land?");
      this.data.points.pop();
      this.update();
      return;
  }

  //Render Directions
  this.directionsDisplay.setDirections(response);

  //Render Markers
  var self = this;
  this.data.points.forEach( function( point , i ){
    self.markers.push( self.createMarker( point , i ));
  })

  //Calculate Distance
  this.data.meters = response.routes[0].legs.reduce(function( acum , leg ) {
      return acum + leg.distance.value
  } , 0 );

  //Update form
  this.dataEl.val( JSON.stringify( this.data ));

};

RideEditor.prototype.createMarker = function( point , index ){

  //Create Info Window
  var infoWindowContent = [];
  infoWindowContent.push( "<div class='col s12 m12 text-align ubuntu-500'>" );
  infoWindowContent.push( point.name );
  infoWindowContent.push( "<address>" );
  infoWindowContent.push( point.address );
  infoWindowContent.push( "</address>" );
  if( !this.options.readOnly ){
    infoWindowContent.push( "<div class='col s12 m12 text-align'>" );
    infoWindowContent.push( "<button class='waves-effect waves-light btn ubuntu-500' onclick='RideEditor.delete(" + this.id + "," + index + ")'> <i class='material-icons prefix'>delete</i> Remove </button>");
    infoWindowContent.push( "</div>" );
  }
  infoWindowContent.push( "</div>" );
  infoWindowContent = infoWindowContent.join("\n");

  var infowindow = new google.maps.InfoWindow({
      content: infoWindowContent
  });

  //Create Marker
  var labels = "ABCDEFGHIJKLMNNOPQRSTUVWXYZ";
  var marker = new google.maps.Marker({
     map:       this.map,
     label:     labels[ index % labels.length ],
     draggable: !this.options.readOnly ,
     animation:  google.maps.Animation.DROP,
     infoWindow: infowindow,
     position:  {lat: point.lat , lng: point.lng }
  });

  var self = this;
  marker.addListener("dragend" , function( e ){
      self.data.points[ index ].lat = e.latLng.lat();
      self.data.points[ index ].lng = e.latLng.lng();
      self.update();
  });

  marker.addListener('click', function() {
     infowindow.open(this.map, marker);
  });

  //Automaticall Open Infowindows
  infowindow.open(this.map, marker);

  return marker;

};

(function( $ ){

  $.fn.rideEditor = function( opts ) {
    return this.each(function() {
        new RideEditor( this )
    });
  };

  $(document).ready( function(){
     $("*[data-ride]").rideEditor();
  });

})( jQuery );
