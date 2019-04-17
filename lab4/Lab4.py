#!/usr/bin/env python3
import paho.mqtt.client as mqtt
import json
import time
from influxdb import InfluxDBClient
import pprint   #pretty printer to print dictionary

def on_connect(client, userdata, flags, rc):
    print("Connected with result code "+str(rc))
    client.subscribe("uiowa/iot/#")
    
def on_message(client, userdata, msg):
    msgtopic = msg.topic.split('/')
    #print("Received a message on topic: " + msgtopic[2])
    m_decode=str(msg.payload.decode("utf-8", "ignore"))
    #print("type of decoded message payload is: " + str(type(m_decode)))
    msg_payload = json.loads(m_decode)
    #print("Type of msg_payload after json.loads() is: " + str(type(msg_payload)))
    #print("Contents of message payload: ")
    #pp = pprint.PrettyPrinter(indent=2)
    #pp.pprint(msg_payload)
    obj2['usage']=str(msg_payload)
    obj1['measurement']=msgtopic[2]
    obj1['fields']=obj2
    #print("Data: \n")
    #print(json.dumps(obj1, indent=4))
    dbclient.write_points([obj1])
    print("Added: " + obj2['usage'] + " to " + obj1['measurement'])

# Initialize the MQTT client that should connect to the Mosquitto broker
mqtt_client = mqtt.Client()
mqtt_client.on_connect = on_connect
mqtt_client.on_message = on_message
connOK=False

# Initialize InfluxDB and other stuff
dbclient = InfluxDBClient(host='localhost', port=8086, username='root', password='root', database='lab4test')

obj1={}
obj2={}

while(connOK == False):
    try:
        mqtt_client.username_pw_set("iotlab4", "iotlab4") 
        mqtt_client.connect("engr-r-hrl000.iowa.uiowa.edu", 1883, 60)
        connOK = True
    except:
        connOK = False
    time.sleep(1)

# Blocking loop to the Mosquitto broker
mqtt_client.loop_forever()
