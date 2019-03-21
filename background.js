// Returns a new notification ID used in the notification.
function getNotificationId() {
  var id = Math.floor(Math.random() * 9007199254740992) + 1;
  return id.toString();
}


function getDistanceFromLatLonInKm(lat1,lon1,lat2,lon2) {
  var R = 6371; // Radius of the earth in km
  var dLat = deg2rad(lat2-lat1);  // deg2rad below
  var dLon = deg2rad(lon2-lon1); 
  var a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2)
    ; 
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  var d = R * c; // Distance in km
  return d;
}

function deg2rad(deg) {
  return deg * (Math.PI/180)
}



function calculateIntensity(distance, magnitude)
{
    var depth = 10;
    var c1 = -0.2;
    var c2 = 0.59;
    var c3 = -0.0039;
    var c4 = 1;
    var c5 = 0.008;
    
    var satTerm = 0.00750 * Math.pow(10.0, (0.507*magnitude));
    var R = Math.sqrt( Math.pow(distance, 2.0) + Math.pow(satTerm, 2.0));
    
    d = c1 + (c2 * magnitude) + (c3 * R) - (c4 * Math.log10(R)) + (c5 * depth);
    accel = Math.pow(10, d);

    return accel;
}

function getIntencityString(accel)
{
   if (accel < 1)
   {
      return "No se siente";
   }
   if (accel >= 1 && accel < 5)
   {
      return "Debil";
   }
   if((accel >= 5) && (accel < 20))
   {
      return "Moderado";
   }
   if((accel >= 20) && (accel < 50))
   {
      return "Fuerte";
   }
   if((accel >= 50) && (accel < 120))
   {
      return "Muy fuerte";
   }
   if(accel >= 120)
   {
      return "Severo";
   }
}

function calculateSeconds(eventtime)
{
    var seconds = parseInt(((new Date(eventtime).getTime()) - (new Date().getTime()))/1000);

    if(seconds > 0)
    {
      return seconds;
    }
    else
    {
      return false;
    }
}


function messageReceived(message) {

  var eventLatitude = message.data.Lat;
  var eventLongitude = message.data.Lon;
  var magnitude = message.data.Mw;


 // console.log(message.data);
  var eventtime = message.data.EqStartTime;


  //console.log(eventtime);


  var seconds = calculateSeconds(eventtime);


  if(seconds == false)
  {
      return;
  }

  //console.log(seconds);


  chrome.storage.local.get(["latitude","longitude"], function(location){
      var distance = getDistanceFromLatLonInKm(eventLatitude, eventLongitude, location.latitude, location.longitude);
      var accel = calculateIntensity(distance, magnitude);
      var intencity = getIntencityString(accel);

      console.log(seconds);
      console.log(intencity);

      chrome.app.window.create(
          "warning.html",
          {  
              width: 370,
              height: 520,
              frame: 'chrome'
          }, function(document) {

              seconds = 60;

              document = document.contentWindow.document;

              document.addEventListener('DOMContentLoaded', function(){

              var totalSeconds = seconds;

                  function calculateProgress(seconds)
                  {
                    var canvas = document.getElementById('myCanvas'); // 1
                    var secondsPassed = totalSeconds - seconds;

                    console.log(canvas);
                    var context = canvas.getContext('2d');
                    var centerX = canvas.width / 2;
                    var centerY = canvas.height / 2;
                    var radius = 86; // 2
                    var per = secondsPassed/totalSeconds; // 3


                    document.getElementById("progressPercent").innerHTML = seconds + " segundos";
                    context.beginPath(); // 5
                    context.arc(centerX, centerY, radius, 0, per*2*Math.PI, false); // 6
                    context.lineWidth = 29;
                    context.lineCap = 'round';
                    context.strokeStyle = 'rgba(24, 255, 255, 1)';
                    context.stroke();
                  }

                  calculateProgress(seconds);


                  var progressInterval = setInterval(function(){

                    seconds = seconds - 1;

                    calculateProgress(seconds);

                    if(seconds < 1)
                    { 
                      clearInterval(progressInterval);
                    }
                  }, 1000);


                  document.getElementById("earthquakeIntensity").innerHTML = intencity;
              }, false);
          }
      );
  });
}

var registerWindowCreated = false;

function firstTimeRegistration() {
    updateLocation();

    setInterval(function(){
      updateLocation();
    }, 60000 * 120);
}

// Set up a listener for GCM message event.
chrome.gcm.onMessage.addListener(messageReceived);


function updateLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.watchPosition(function(position){

          //console.log(position);

          chrome.storage.local.set({
              "latitude" : position.coords.latitude,
              "longitude" : position.coords.longitude
          });

          chrome.storage.local.get(["latitude","longitude"], function(location){
              console.log(location);
          });

        });
    } else {
        x.innerHTML = "Geolocation is not supported by this browser.";
    }
}


// Set up listeners to trigger the first time registration.
chrome.runtime.onInstalled.addListener(firstTimeRegistration);
//chrome.runtime.onActivated.addListener(firstTimeRegistration);
chrome.runtime.onStartup.addListener(firstTimeRegistration);
