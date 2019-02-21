var firebase = require('firebase/app');
require('firebase/database');
var nodeimu = require('nodeimu');
var IMU = new nodeimu.IMU();
var sense = require('sense-hat-led');

console.log("setting color to blue...");
sense.setPixel(0,0,[0,0,254]);

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

console.log("terminating...");
sense.setPixel(0,0,[0,0,0]);
