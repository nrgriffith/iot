#include <Adafruit_ATParser.h>
#include <Adafruit_BLE.h>
#include <Adafruit_BLEBattery.h>
#include <Adafruit_BLEEddystone.h>
#include <Adafruit_BLEGatt.h>
#include <Adafruit_BLEMIDI.h>
#include <Adafruit_BluefruitLE_SPI.h>
#include <Adafruit_BluefruitLE_UART.h>

/*********************************************************************
 This is an example for our nRF51822 based Bluefruit LE modules

 Pick one up today in the adafruit shop!

 Adafruit invests time and resources providing this open source code,
 please support Adafruit and open-source hardware by purchasing
 products from Adafruit!

 MIT license, check LICENSE for more information
 All text above, and the splash screen below must be included in
 any redistribution
*********************************************************************/

/*
    Please note the long strings of data sent mean the *RTS* pin is
    required with UART to slow down data sent to the Bluefruit LE!  
*/

#include <Arduino.h>
#include <SPI.h>
#if not defined (_VARIANT_ARDUINO_DUE_X_) && not defined (_VARIANT_ARDUINO_ZERO_)
  #include <SoftwareSerial.h>
#endif

#include "Adafruit_BluefruitLE_SPI.h"
#include "Adafruit_BLEGatt.h"

#include "BluefruitConfig.h"

/* ...hardware SPI, using SCK/MOSI/MISO hardware SPI pins and then user selected CS/IRQ/RST */
Adafruit_BluefruitLE_SPI ble(BLUEFRUIT_SPI_CS, BLUEFRUIT_SPI_IRQ, BLUEFRUIT_SPI_RST);

Adafruit_BLEGatt gatt(ble);

// A small helper
void error(const __FlashStringHelper*err) 
{
  Serial.println(err);
  while (1);
}

/* The service information */

int32_t etsServiceId;
int32_t etsMeasureCharId;

int sensorPin = 0; //the analog pin the TMP36's Vout (sense) pin is connected to
                        //the resolution is 10 mV / degree centigrade with a
                        //500 mV offset to allow for negative temperatures

/**************************************************************************/
/*!
    @brief  Sets up the HW an the BLE module (this function is called
            automatically on startup)
*/
/**************************************************************************/
void setup(void)
{
  while (!Serial); // required for Flora & Micro
  delay(500);

  boolean success;

  Serial.begin(115200);
  Serial.println(F("Adafruit Bluefruit Thermometer Example"));
  Serial.println(F("--------------------------------------------"));

  randomSeed(micros());

  /* Initialise the module */
  Serial.print(F("Initialising the Bluefruit LE module: "));

  if ( !ble.begin(VERBOSE_MODE) )
  {
    error(F("Couldn't find Bluefruit, make sure it's in CoMmanD mode & check wiring?"));
  }

  Serial.println( F("OK!") );

  /* Perform a factory reset to make sure everything is in a known state */
  Serial.println(F("Performing a factory reset: "));
  if (! ble.factoryReset() )
  {
       error(F("Couldn't factory reset"));
  }

  /* Disable command echo from Bluefruit */
  ble.echo(false);

  Serial.println("Requesting Bluefruit info:");
  /* Print Bluefruit information */
  ble.info();

    /* Change the device name to make it easier to find */
  Serial.println(F("Setting device name to 'Bluefruit HRM': "));

  if (! ble.sendCommandCheckOK(F("AT+GAPDEVNAME=Bluefruit HRM")) ) 
  {
    error(F("Could not set device name?"));
  }

  /* Add the Environmental Sensing Service definition */
  /* Service ID should be 1 */
  Serial.println(F("Adding the Environmental Sensing service definition (UUID = 0x181A): "));
  etsServiceId = gatt.addService(0x181A);
  if (etsServiceId == 0) 
  {
    error(F("Could not add Environmental Sensing service"));
  }

  /* Add the Temperature Measurement characteristic */
  /* Chars ID for Measurement should be 1 */
  Serial.println(F("Adding the Temperature Measurement characteristic (UUID = 0x2A6E): "));
  success = ble.sendCommandWithIntReply( F("AT+GATTADDCHAR=UUID=0x2A6E, PROPERTIES=0x20, MIN_LEN=2, MAX_LEN=2"), &etsMeasureCharId);
  if (! success) 
  {
    error(F("Could not add HRM characteristic"));
  }

  /* Add the Environmental Sensing Service to the advertising data (needed for Nordic apps to detect the service) */
  Serial.print(F("Adding Environmental Sensing Service UUID to the advertising payload: "));
  uint8_t advdata[] { 0x02, 0x01, 0x06, 0x05, 0x02, 0x1a, 0x18, 0x0a, 0x18 };
  ble.setAdvData( advdata, sizeof(advdata) );

  /* Reset the device for the new service setting changes to take effect */
  Serial.print(F("Performing a SW reset (service changes require a reset): "));
  ble.reset();

  Serial.println();
}


void loop(void)
{
    // Check for user input
  char inputs[BUFSIZE+1];

  if ( getUserInput(inputs, BUFSIZE) )
  {
    // Send characters to Bluefruit
    Serial.print("[Send] ");
    Serial.println(inputs);

    ble.print("AT+BLEUARTTX=");
    ble.println(inputs);

    // check response stastus
    if (! ble.waitForOK() ) {
      Serial.println(F("Failed to send?"));
    }
  }

  // read the temperature
  int reading = analogRead(sensorPin);
  float voltage = reading * 5.0;
  voltage /= 1024.0;
  // print out the voltage
  Serial.print(voltage); Serial.println(" volts");
  // now print out the temperature
  float temperatureC = (voltage - 0.5) * 100 ;  //converting from 10 mv per degree wit 500 mV offset
                                               //to degrees ((voltage - 500mV) times 100)
  Serial.print(temperatureC); Serial.println(" degrees C");
 
  //Get randomized temperature
  //float temp = random(0, 60) / 2.5 * 100;
  //int tempInt = (int)temp;
  //Serial.println("Int: ");
  //Serial.println(tempInt);
  
  //convert temperature to bytes (it was multiplied by 100 when it was harvested)
  int tempInt = (int)temperatureC;
  byte tempBytes[2];
  tempBytes[1] = tempInt >> 8;
  tempBytes[0] = tempInt;
  Serial.println(tempBytes[0]);
  //byte tempBytes[2];
  
  //Serial.println(temp/100.0);
  gatt.setChar(etsMeasureCharId, tempBytes, 2); //Send the temperature over Bluetooth
  
  // Check for incoming characters from Bluefruit
  ble.println("AT+BLEUARTRX");
  ble.readline();
  if (strcmp(ble.buffer, "OK") == 0) 
  {
    // no data
  }
  else
  {
    // Some data was found, its in the buffer
    Serial.print(F("[Recv] ")); 
    Serial.println(ble.buffer);
  }

  delay(1000);
}

bool getUserInput(char buffer[], uint8_t maxSize)
{
  // timeout in 100 milliseconds
  TimeoutTimer timeout(100);

  memset(buffer, 0, maxSize);
  while( (!Serial.available()) && !timeout.expired() ) { delay(1); }

  if ( timeout.expired() ) return false;

  delay(2);
  uint8_t count=0;
  do
  {
    count += Serial.readBytes(buffer+count, maxSize);
    delay(2);
  } while( (count < maxSize) && (Serial.available()) );

  return true;
}
