var mqtt = require('mqtt');

var fs = require('fs'),
    nconf = require('nconf');

var msg = process.argv[2]

nconf.file({file:'/home/xavier/projects/wsn/config/config.json'})
var GATEWAY_MAC = nconf.get('GATEWAY_MAC');
var MQTT_SERVER = nconf.get('MQTT_SERVER');
var mqtt_client = mqtt.connect(MQTT_SERVER);
mqtt_client.on('connect', function(){
    mqtt_client.publish(GATEWAY_MAC, msg);
    mqtt_client.end();
})