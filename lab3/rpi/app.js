
// change me if needed
var myAddress = 'fa:20:cd:78:e4:bf'; // station 7
var myAddress = 'f3:4d:10:12:08:a3'; // station 1

// variables for code
var storedInterval = 10;

// Enable noble
var noble = require('noble');
// Chewck if BLE adapter is powered on
noble.on('stateChange', function(state) 
{
  if(state === 'poweredOn') 
  {
    console.log('Powered on!');
    noble.startScanning();
  }
});

// firebase stuff
var firebase = require('firebase/app');
require('firebase/database');
var nodeimu = require('nodeimu');
var IMU = new nodeimu.IMU();
var sense = require('sense-hat-led');

//config values were obtained directly from the website that stores our database
//https://console.firebase.google.com/project/iot-lab2-c1bfa/overview
var config = {
    apiKey: "AIzaSyAcfu270WqHvKgClqaZ9qkgVRHk59i2qyY",
    authDomain: "k2-iot-lab3.firebaseapp.com",
    databaseURL: "https://k2-iot-lab3.firebaseio.com",
    projectId: "k2-iot-lab3",
    storageBucket: "k2-iot-lab3.appspot.com",
    messagingSenderId: "911922504776"
};
firebase.initializeApp(config);

// Get a reference to the database service
var database = firebase.database();

//set updateLight function to be called everytime the value of update_lght is changed
//database.ref().child('Update').on('value', function(snapshot){updateLight(snapshot);});

//set updateInterval function to be called everytime the value of Interval is changed
//database.ref().child('Interval').on('value', function(snapshot){updateInterval(snapshot);});

//getSensorData();


//Register function to receive newly discovered devices
noble.on('discover', function(device) 
{
  if(device.address === myAddress) 
  {
    console.log('Found device: ' + device.address);

    //found our device, now connect to it
    //Be sure to turn off scanning before connecting
    noble.stopScanning();

    device.connect(function(error) 
    {
      // Once connected, we need to kick off service discovery
      device.discoverAllServicesAndCharacteristics(function(error, services, characteristics) 
      {

        //Discovery done! Find characteristics we care about
        var uartTx = null;
        var uartRx = null;

        //look for UART service characteristic
        characteristics.forEach(function(ch, chID) 
        {
          if (ch.uuid === '6e400002b5a3f393e0a9e50e24dcca9e') 
          {
            uartTx = ch;
            console.log("Found UART Tx characteristic");
          }

          if (ch.uuid === '6e400003b5a3f393e0a9e50e24dcca9e') 
          {
            uartRx = ch;
            console.log("Found UART Rx characteristic");
          }

        });

        //Check if we found UART Tx characteristic
        if (!uartTx) 
        {
          console.log('Failed to find UART Tx Characteristic! ');
          process.exit();
        }

        //Check if we found UART Rx characteristic
        if (!uartRx) 
        {
          console.log('Failed to find UART Rx Characteristic! ');
          process.exit();
        }

        //set up listener for console input
        //when console input is received, send it to uartTx
        var stdin = process.openStdin();

        stdin.addListener("data", function (d) 
        {
          // d will have a linefeed at the end.  Get rid ofit with trim
          var inStr = d.toString().trim();
          //Can only send 20 bytes in a Bluetooth LE packet
          //so truncate string if it is too long
          if (inStr.length > 20) 
          {
            inStr = inStr.slice(0, 19);
          }

          console.log("Sent: " + inStr);
          uartTx.write(new Buffer(inStr));
        });

        // Now set up listener to receive data from uartRx
        //and display on console
        uartRx.notify(true);

        uartRx.on('read', function(data, isNotification) 
        {
          console.log ("Received: " + data.toString());
        });

      });  //end of device.discover

    });   //end of device.connect

  }      //end of if (device.address...
  
});     //end of noble.on   

//setInterval the function getSensorData is called (in milliseconds)
//setInterval(getSensorData, 60000);


//global variable used to update database
var updates = {};
//clear lights on rasberry pi
sense.clear();

console.log("\n");
/*
function getSensorData(){
    
    //get all sensor data
    var hatData = IMU.getValueSync();

    //get temperature
    var temperature = hatData.temperature;
    console.log("Temperature: " + temperature); 

    //get pressure (thought we needed this, but we didn't)
    //var pressure = data.pressure;
    //console.log(pressure);

    //get humidity
    var humidity = hatData.humidity;
    console.log("Humidity: " + humidity);   
	
	console.log("data gathered, uploading to database...");
	uploadSensorData(temperature, humidity);
}
*/
/*
function uploadSensorData(temperature, humidity){

	//edit updates variable to read in values
	updates['/Temperature'] = temperature;
	updates['/Humidity'] = humidity;	
	
	//update database
    database.ref().update(updates);

        database.ref('/Temperature').set(temperature);
	console.log("data uploaded successfully\n");
}
*/
/*
// function is called when Interval changes
function updateInterval(snapshot){
	if(snapshot.val() != storedInterval){
		var d = parseInt(snapshot.val());
		if(!(d < 10 && d > 1)) // valid values are from 1 - 10, so if it goes invalid, just use the last interval
		{
			d = storedInterval;
		}
		//.once reads the value one time instead of everytime the value is changed
		database.ref().child('/').once('value', 
			function(d){
				console.log("Changing the interval to %d", d);
				
				var inStr = d.toString().trim();
				
				//Can only send 20 bytes in a Bluetooth LE packet
				//so truncate string if it is too long
				if (inStr.length > 20) 
				{
					inStr = inStr.slice(0, 19);
				}

				uartTx.write(new Buffer(inStr));

				console.log("Sent: " + inStr);

				//this code would set update_light to false again which was used when testing
				//console.log("setting update_light to false...");
				//updates['/update_light'] = false;
				//database.ref().update(updates);
				//console.log("done\n");
			}
		);
	}
}
*/
/*
//function is called when Update_Light changes
function updateLight(snapshot){
	if(snapshot.val() == true){
		//.once reads the value one time instead of everytime the value is changed
		database.ref().child('/').once('value', 
			function(data){
				console.log("Changing light in row: %s col: %s...", data.val().Light_Row, data.val().Light_Col);
				
				//set light to value reflected in the database
				sense.setPixel(
				data.val().Light_Col,
				data.val().Light_Row,
				data.val().Light_R,
				data.val().Light_G,
				data.val().Light_B)

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

*/
