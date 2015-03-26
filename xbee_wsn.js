var util = require('util');
var SerialPort = require('serialport').SerialPort;
var xbee_api = require('xbee-api');
var mqtt = require('mqtt');


// Get gateway configuration info from config file
// Config Setup
var fs = require('fs'),
    nconf = require('nconf');

nconf.file({file:'/home/xavier/projects/wsn/config/config.json'})
var GATEWAY_MAC = nconf.get('GATEWAY_MAC');
var MQTT_SERVER = nconf.get('MQTT_SERVER');
var REPORTING_MODE = nconf.get('REPORTING_MODE');

// Defines
// Coordinator ZigBee
var g_COORDINATOR_ADDR16_LSB = 0x00;
var g_COORDINATOR_ADDR16_MSB = 0x00;
var g_COORDINATOR_ENDPOINT = 0xE8;
// Packet type
var MQTT_PACKET_TYPE_GATEWAY_CMD = 0x00;
var MQTT_PACKET_TYPE_GATEWAY_STATUS = 0x01;
var MQTT_PACKET_TYPE_SENSORNODE_STATUS = 0x02;
var MQTT_PACKET_TYPE_SENSORNODE_DATA = 0x03;
// Packet value
var MQTT_GATEWAY_STATUS_OFFLINE = 0x00;
var MQTT_GATEWAY_STATUS_ONLINE = 0x01;

// Initialize mqtt client
var mqtt_client = mqtt.connect(MQTT_SERVER);
mqtt_client.on('connect', function(){
    var packet = new Buffer([]);
    var temp = new Buffer(GATEWAY_MAC,'hex');
    packet = Buffer.concat([packet, temp]);
    temp = new Buffer([MQTT_PACKET_TYPE_GATEWAY_STATUS, MQTT_GATEWAY_STATUS_ONLINE]);
    packet = Buffer.concat([packet, temp]);
    mqtt_client.publish('DATACENTER',packet);
    mqtt_client.subscribe(GATEWAY_MAC);  // subscribe to the message for the gateway only
    // // Formulate a json packet
    // var mqtt_packet = [];
    // mqtt_packet.push(MAC);
    // mqtt_packet.push(MQTT_PACKET_TYPE_GATEWAY_STATUS);
    // mqtt_packet.push(MQTT_GATEWAY_STATUS_ONLINE);
    // client.publish(DATACENTER, mqtt_packet);
});
mqtt_client.on('message', function(topic, message){
    console.log(util.inspect(message))
    msg = message.toString();
    if(msg === 'scan'){
        console.log('scanning devices');
        sendATCommand('CB',[0x02]);
    }else if(msg.indexOf(' ') > -1 && msg.indexOf('interval') > -1){
        console.log('modifying reporting interval');
        // Send a message to a sensor node to change the reporting interval
        var match_descriptor_resp = {
          type: EXPLICIT_ZIGBEE_COMMAND_FRAME,
          destination64: sensorNodes[0].Addr64,
          destination16: sensorNodes[0].Addr16,
          sourceEndpoint: 0,
          destinationEndpoint: 0x0,
          clusterId: ZB_TEMPERATURE_MEASUREMENT,
          profileId: ZB_WSN,
          data: [frame.data[6], 0x00, g_COORDINATOR_ADDR16_LSB, g_COORDINATOR_ADDR16_MSB, 0x01, g_COORDINATOR_ENDPOINT]
          // data: [0x30]
        }
        sendAPI(match_descriptor_resp)

    }
})



// Get input arguments
var COM_PORT = process.argv[2]

// Initilize 
var C = xbee_api.constants;
var xbeeAPI = new xbee_api.XBeeAPI({
  api_mode: 1,
  raw_frames: false
});
var serialport = new SerialPort(COM_PORT, {
  baudrate: 115200,
  parser: xbeeAPI.rawParser()
});

// Create a variable store the list of nodes at server
var sensorNodes = [];

// API_GET_NODES();

serialport.on("open", function() {
//  console.log("Serial port open... sending ATND");
    sendATCommand('CH',[]);
});

var sendATCommand = function(cdStr, param) {
  var frame = {
    type: C.FRAME_TYPE.AT_COMMAND,
    command: cdStr,
    commandParameter: param,
  };

  serialport.write(xbeeAPI.buildFrame(frame), function(err, res) {
    if (err) 
      throw(err);
    else{
//      console.log("written bytes: "+util.inspect(res));
    }
  });
}

var sendAPI = function(frame){
  serialport.write(xbeeAPI.buildFrame(frame), function(err, res) {
    if (err) 
      throw(err);
    else{
//      console.log("written bytes: "+util.inspect(res));
    }
  });
}

// XBee Command set
var AT_COMMAND_RESPONSE                 = 0x88
var ZIGBEE_TRANSMIT_STATUS              = 0x8B
var ZIGBEE_EXPLICIT_RX_INDICATOR        = 0x91
var EXPLICIT_ZIGBEE_COMMAND_FRAME       = 0x11

// ZCL Cluster ID
var ZB_GENERAL_IDENTIFY                 = 0x0003
var ZB_MATCH_DESCRIPTOR_REQUEST         = 0x0006
var ZB_ZDP_ED_BIND_REQUEST              = 0x0020
var ZB_ZDP_BIND_REQUEST                 = 0x0021
var ZB_ZDP_UNBIND_REQUEST               = 0x0022
var ZB_MATCH_DESCRIPTOR_RESPONSE        = 0x8006
var ZB_DEVICE_ANNOUNCE                  = 0x0013
var ZB_MANAGEMENT_LEAVE_REQUEST         = 0x0034
var ZB_IAS_ZONE                         = 0x0500
var ZB_TEMPERATURE_MEASUREMENT          = 0x0402
var ZB_RELATIVE_HUMIDITY                = 0x0405

// ZCL Profile ID
var ZB_SIMPLE_DESCRIPTOR                = 0x0000
var ZB_HOME_AUTOMATION                  = 0x0104
var ZB_WSN                              = 0xDFFF

// ZCL Command ID
var ZB_ZONE_ENROLL_REQUEST              = 0x01
var ZB_GENERAL_IDENTIFY_QUERY           = 0x01
var ZB_ZONE_STATUS_CHANGE_NOTIFICATION  = 0x00

// IAS Zone Maskt
var ZB_IAS_ZONE_ALARM1_MASK             = 1
var ZB_IAS_ZONE_ALARM2_MASK             = 2
var ZB_IAS_ZONE_TAMPER_MASK             = 4
var ZB_IAS_ZONE_BATTERY_MASK            = 8
var ZB_IAS_ZONE_SUPERVISION_MASK        = 16
var ZB_IAS_ZONE_RESTORE_MASK            = 32
var ZB_IAS_ZONE_TROUBLE_MASK            = 64
var ZB_IAS_ZONE_AC_MAIN_MASK            = 128


var handle_ZB_Explicit_Rx_Indicator = function (frame){
    // console.log('data> '+util.inspect(frame.data))
    // Get destination endpoint
    var ds_ep = frame.data[0].toString(16)  
    // console.log("DSEP> 0x"+ds_ep);
    // Get Cluster ID
    var cl_id = frame.data[1]<<8;
    cl_id = cl_id + frame.data[2];   
    // console.log("CLID> 0x"+cl_id.toString(16));
    // Get Profile ID
    var pf_id = frame.data[3]<<8;
    pf_id = pf_id + frame.data[4];
    // console.log("PFID> 0x"+pf_id.toString(16));
    // console.log("ADDR> 0x"+frame.remote64);
    var cm_id = frame.data[8]
    
    // Handle Different Cluster ID and Profile ID
    switch(pf_id){
        case ZB_SIMPLE_DESCRIPTOR:
            switch(cl_id){
                case ZB_MATCH_DESCRIPTOR_REQUEST:
                    console.log('=>Match Descriptor Request');
                    var match_descriptor_resp = {
                      type: EXPLICIT_ZIGBEE_COMMAND_FRAME,
                      destination64: frame.remote64,
                      destination16: frame.remote16,
                      sourceEndpoint: 0,
                      destinationEndpoint: 0x0,
                      clusterId: ZB_MATCH_DESCRIPTOR_RESPONSE,
                      profileId: ZB_SIMPLE_DESCRIPTOR,
                      data: [frame.data[6], 0x00, g_COORDINATOR_ADDR16_LSB, g_COORDINATOR_ADDR16_MSB, 0x01, g_COORDINATOR_ENDPOINT]
                    }
                    sendAPI(match_descriptor_resp)
                    break;
                case ZB_DEVICE_ANNOUNCE:
                    console.log('=>Device Announce')
                    var packet = new Buffer([]);
                    var temp = new Buffer(GATEWAY_MAC,'hex');
                    packet = Buffer.concat([packet, temp]);
                    temp = new Buffer([MQTT_PACKET_TYPE_SENSORNODE_STATUS]);
                    packet = Buffer.concat([packet, temp]);
                    temp = new Buffer(frame.remote64,'hex');
                    packet = Buffer.concat([packet, temp]);
                    temp = new Buffer([MQTT_GATEWAY_STATUS_ONLINE]);
                    packet = Buffer.concat([packet, temp]);
                    mqtt_client.publish('DATACENTER',packet);

                    var sensor = {
                        Addr64: frame.remote64,
                        Addr64: frame.remote16
                    };
                    sensorNodes.push(sensor);
                    // var match_descriptor_resp = {
                    //   type: EXPLICIT_ZIGBEE_COMMAND_FRAME,
                    //   destination64: frame.remote64,
                    //   destination16: frame.remote16,
                    //   sourceEndpoint: 0,
                    //   destinationEndpoint: 0x0,
                    //   clusterId: ZB_MATCH_DESCRIPTOR_RESPONSE,
                    //   profileId: ZB_SIMPLE_DESCRIPTOR,
                    //   data: [frame.data[6], 0x00, g_COORDINATOR_ADDR16_LSB, g_COORDINATOR_ADDR16_MSB, 0x01, g_COORDINATOR_ENDPOINT]
                    // }
                    // sendAPI(match_descriptor_resp)
                    break;
                case ZB_ZDP_ED_BIND_REQUEST:
                    console.log('=>End Device Bind Request')
                    break;
                case ZB_MANAGEMENT_LEAVE_REQUEST:
                    console.log('=>Management Leave Request')
                    
                    break;
                default:
                    break;
            }
            break;
        case ZB_HOME_AUTOMATION:
            switch(cl_id){
                case ZB_GENERAL_IDENTIFY:
                    switch(cm_id){
                        case ZB_GENERAL_IDENTIFY_QUERY:
                            console.log('=>Identify Query')
                            break;
                        default:
                            break;
                    }
                    break;
                case ZB_IAS_ZONE:
                    switch(cm_id){
                        case ZB_ZONE_ENROLL_REQUEST:
                            console.log('=>Zone Enroll Request')
                            break;
                        case ZB_ZONE_STATUS_CHANGE_NOTIFICATION:
                            console.log('=>Zone Status Change')
                            var status = frame.data[9]
                            if(status & ZB_IAS_ZONE_ALARM1_MASK){
                                console.log('>>Alarm1<<')
                            }
                            if(status & ZB_IAS_ZONE_ALARM2_MASK){
                                console.log('>>Alarm2<<')
                            }
                            if(status & ZB_IAS_ZONE_TAMPER_MASK){
                                console.log('>>Tamper<<')
                            }
                            if(status & ZB_IAS_ZONE_BATTERY_MASK){
                                console.log('>>Battery Weak<<')
                            }
                            if(status & ZB_IAS_ZONE_SUPERVISION_MASK){
                                console.log('>>Supervision<<')
                            }
                            if(status & ZB_IAS_ZONE_RESTORE_MASK){
                                console.log('>>Restore Report<<')
                            }
                            if(status & ZB_IAS_ZONE_TROUBLE_MASK){
                                console.log('>>Trouble<<')
                            }
                            if(status & ZB_IAS_ZONE_AC_MAIN_MASK){
                                console.log('>>AC Main Fail<<')
                            }
                            break;
                        default:
                            break;
                    }
                    break;
                default:
                    break;
            }
            break;
        case ZB_WSN:
             switch(cl_id){
                case ZB_TEMPERATURE_MEASUREMENT:
                    
                    // break;
                case ZB_RELATIVE_HUMIDITY:
                    // break;
                default:
                    var packet = new Buffer([]);
                    var temp = new Buffer(GATEWAY_MAC,'hex');
                    packet = Buffer.concat([packet, temp]);
                    temp = new Buffer([MQTT_PACKET_TYPE_SENSORNODE_DATA]);
                    packet = Buffer.concat([packet, temp]);
                    temp = new Buffer(frame.remote64,'hex');
                    packet = Buffer.concat([packet, temp]);
                    packet = Buffer.concat([packet, frame.data]);
                    mqtt_client.publish('DATACENTER',packet);
                    break;
             }
            break;
        default:
            break;
    }
}


var handle_ZB_AT_Command_Response = function (frame){
    console.log('Command> '+frame.command)
    switch(frame.command){
        case 'ND':
            console.log('ADDR_16> '+frame.nodeIdentification.remote16)
            console.log('ADDR_64> '+frame.nodeIdentification.remote64)
            mqtt_client.publish('DATACENTER',frame.nodeIdentification.remote64);
            break;
        case 'CH':
//            console.log("OBJ> "+util.inspect(frame));
            console.log('Channel> '+util.inspect(frame.commandData[0]))
            // sendATCommand('ND',[]);
            break;
        case 'CB':
            setTimeout(function(){
                sendATCommand('ND',[]);
            }, 10*1000);
            break;
        default:
            break;
    }
}

xbeeAPI.on("frame_object", function(frame) {
    // console.log("OBJ> "+util.inspect(frame));
    switch (frame.type){
        case AT_COMMAND_RESPONSE:
            console.log('**AT Command Response**')
            handle_ZB_AT_Command_Response(frame);
            break;
        case ZIGBEE_EXPLICIT_RX_INDICATOR:
            console.log('**ZB Explicit Rx**')
            handle_ZB_Explicit_Rx_Indicator(frame);
            break;
        case ZIGBEE_TRANSMIT_STATUS:
            console.log('**ZB Transmit Successful')
            break;
        default:
            console.log('**ZB Message Rx**')
            break;
    }
});