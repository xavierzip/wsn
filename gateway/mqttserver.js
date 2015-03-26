var util = require('util');
var mqtt = require('mqtt');
var fs = require('fs'),
    nconf = require('nconf');

nconf.file({file:'/home/xavier/projects/wsn/config/config.json'});
var MQTT_SERVER = nconf.get('MQTT_SERVER');

var mqtt_client = mqtt.connect(MQTT_SERVER);
mqtt_client.on('connect', function(){
    mqtt_client.subscribe('DATACENTER');
});
mqtt_client.on('message', function(topic, message){
    console.log(util.inspect(message));
});