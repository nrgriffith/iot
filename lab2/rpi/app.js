var firebase = require('firebase/app');
require('firebase/database');
var nodeimu = require('nodeimu');
var IMU = new nodeimu.IMU();
var sense = require('sense-hat-led');

var config = {
    apiKey: "AIzaSyDeXPowwDP1M02vsDZkkeLDMfU1_t6SrEs", 	//apikey
    authDomain: "iot-lab2-c1bfa.firebaseapp.com",	//id
    databaseURL: "https://iot-lab2-c1bfa.firebaseio.com",
    projectId: "iot-lab2-c1bfa",
    storageBucket: "iot-lab2-c1bfa.appspot.com",
    messagingSenderId: "319629914250"
};

firebase.initializeApp(config);

// Get a reference to the database service
var database = firebase.database();

setInterval(getSensorData, 60000);
database.ref().child('update_light').on('value', function(snapshot){updateLight(snapshot);});

var updates = {};

clearLights();

function getSensorData(){
    
    //get all sensor data
    var data = IMU.getValueSync();

    //get temperature
    var temperature = data.temperature.toFixed(4);
    //console.log(temperature); 

    //get pressure
    var pressure = data.pressure.toFixed(4);
    //console.log(pressure);

    //get humidity
    var humidity = data.humidity.toFixed(4);
    //console.log(humidity);   
	
	console.log("data gathered, uploading to database...");
	uploadSensorData(temperature, humidity);
}


function uploadSensorData(temperature, humidity){
	updates['/temperature'] = temperature;
	updates['/humidity'] = humidity;	
	
    database.ref().update(updates);

	console.log("data uploaded successfully...\n");
}

function updateLight(snapshot){
	if(snapshot.val() == true){
		console.log("Changing light color...");
		var data = database.ref().child('/').once('value', 
			function(data){
				sense.setPixel(
				data.val().light_row,
				data.val().light_column,
				data.val().light_r,
				data.val().light_g,
				data.val().light_b)
			}
		);
		console.log("light set...");
		console.log("setting update_light to false...\n");
		updates['/update_light'] = false;
		database.ref().update(updates);
	}
}

function clearLights(){
	console.log("clearing all lights...");
	for(var i=0; i<8; i++){
		for(var j=0; j<8; j++){
			sense.setPixel(i,j,[0,0,0]);
		}
	}
}
