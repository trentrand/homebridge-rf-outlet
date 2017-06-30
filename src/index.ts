'use strict';

var async = require('async');
var rpi433 = require('rpi-433');
// Example Accessory Configuration (see config-example.json) -
//   {
//     "accessory": "Outlet",
//     "name": "Bedroom Lamp",
//     "type": "Light",
//     "manufacturer": "Ikea",
//     "model": "SKEBY Lamp",
//     "serial": "",
//     "rf_on": 4265267,
//     "rf_off": 4265276
//   }

let Service: any, Characteristic: any;

interface Callback {
  (error: any, stdout: any, stderr: any): void;
}

export = function(homebridge: any) {
  Service = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;
  homebridge.registerAccessory("homebridge-outlet", "Outlet", OutletAccessory);
}

class Config {
  name: string;
  type: 'Light' = 'Light'; // only 'Light' is supported right now, submit a PR!
  manufacturer?: string = '';
  model?: string = '';
  serial?: string = '';
  rf_on: string;
  rf_off: string;
}

class OutletAccessory {
  log: (message: any) => void;
  config: Config;
  powerOnState: boolean;
  rfEmitter: any;

  constructor(log: (message: any) => void, config: Config) {
    // Register accessory information
    this.config = config;

    // Register accessory default power state as 'off'
    this.powerOnState = false;

    this.rfEmitter = rpi433.emitter({
      pin: 0, // Send through WiringPi pin 0 (physical pin 11) - see `gpio readall`
      pulseLength: 180
    });

    this.log = log;
    this.log("Starting device " + this.config.name + "...");
  }

  // queue = async.queue(function(rf_code: string, callback: Callback) {
  //   this.rfEmitter.sendCode(rf_code, (error: any, stdout: any) => {   //Send 1234
  //     if(!error) this.log('Sent code:\t' + stdout);
  //   });
  // }, 1);

  // Get the power state of this outlet
  getPowerState = (callback: any) => {
    this.log('Power state for ' + this.config.name + ' is ' + this.powerOnState);
    callback(null, this.powerOnState);
  }

  // Set the power state of this outlet
  setPowerState = (powerOnState: boolean, callback: any) => {
    this.powerOnState = powerOnState;
    this.log("Turning " + this.config.name + " " + (this.powerOnState == true ? "on" : "off"));

    var rf_code = this.powerOnState ? this.config.rf_on : this.config.rf_off;

    this.rfEmitter.sendCode(rf_code, (error: any, stdout: any) => {
        this.log((error ? 'Failed to send code: \t': 'Sent code:\t') + stdout);
    });
    // this.queue.push(rf_code);

    callback(null);
  }

  // React to the 'identify' HAP-NodeJS Accessory request
  // https://github.com/KhaosT/HAP-NodeJS/blob/master/lib/Accessory.js#L32-L38
  identify = (callback: any) => {
    this.log(this.config.name + " was identified.");
    callback();
  }

  // Register this outlets required (and optional) services
  getServices = () => {
    var outletService: any;
    if (this.config.type == "Light") {
      outletService = new Service.Lightbulb(this.config.name);
      // Bind state value to required Lightbulb charactertisics
      outletService.getCharacteristic(Characteristic.On)
        .on('get', this.getPowerState.bind(this))
        .on('set', this.setPowerState.bind(this));
    }

    var informationService = new Service.AccessoryInformation()
      .setCharacteristic(Characteristic.Manufacturer, this.config.manufacturer)
      .setCharacteristic(Characteristic.Model, this.config.model)
      .setCharacteristic(Characteristic.SerialNumber, this.config.serial);

    return [informationService, outletService];
  }
}
