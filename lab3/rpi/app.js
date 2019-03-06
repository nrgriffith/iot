var firebase = require('firebase/app');
require('firebase/database');
var nodeimu = require('nodeimu');
var IMU = new nodeimu.IMU();
var sense = require('sense-hat-led');

//config values were obtained directly from the website that stores our database
//https://console.firebase.google.com/project/iot-lab2-c1bfa/overview
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

//setInterval the function getSensorData is called (in milliseconds)
setInterval(getSensorData, 60000);
//set updateLight function to be called everytime the value of update_lght is changed
database.ref().child('update_light').on('value', function(snapshot){updateLight(snapshot);});

//global variable used to update database
var updates = {};
//clear lights on rasberry pi
sense.clear();

console.log("\n");

function getSensorData(){
    
    //get all sensor data
    var data = IMU.getValueSync();

    //get temperature
    var temperature = data.temperature;
    console.log("Temperature: " + temperature); 

    //get pressure (thought we needed this, but we didn't)
    //var pressure = data.pressure;
    //console.log(pressure);

    //get humidity
    var humidity = data.humidity;
    console.log("Humidity: " + humidity);   
	
	console.log("data gathered, uploading to database...");
	uploadSensorData(temperature, humidity);
}


function uploadSensorData(temperature, humidity){
	//edit updates variable to read in values
	updates['/temperature'] = temperature;
	updates['/humidity'] = humidity;	
	
	//update database
    database.ref().update(updates);

	console.log("data uploaded successfully\n");
}

//function is called when update_light changes
function updateLight(snapshot){
	if(snapshot.val() == true){
		//.once reads the value one time instead of everytime the value is changed
		database.ref().child('/').once('value', 
			function(data){
				console.log("Changing light in row: %s col: %s...", data.val().light_row, data.val().light_column);
				
				//set light to value reflected in the database
				sense.setPixel(
				data.val().light_column,
				data.val().light_row,
				data.val().light_r,
				data.val().light_g,
				data.val().light_b)

				console.log("light set\n");

				//this code would set update_light to false again which was used when testing
				//console.log("setting update_light to false...");
				//updates['/update_light'] = false;
				//database.ref().update(updates);
				//console.log("done\n");
			}
		);
	}
}

