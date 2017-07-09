'use strict';
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
var Service, Characteristic;
var Config = (function () {
    function Config() {
        this.type = 'Light'; // only 'Light' is supported right now, submit a PR!
        this.manufacturer = '';
        this.model = '';
        this.serial = '';
    }
    return Config;
}());
var OutletAccessory = (function () {
    function OutletAccessory(log, config) {
        var _this = this;
        // Get the power state of this outlet
        this.getPowerState = function (callback) {
            _this.log('Power state for ' + _this.config.name + ' is ' + _this.powerOnState);
            callback(null, _this.powerOnState);
        };
        // Set the power state of this outlet
        this.setPowerState = function (powerOnState, callback) {
            _this.powerOnState = powerOnState;
            _this.log("Turning " + _this.config.name + " " + (_this.powerOnState == true ? "on" : "off"));
            var rf_code = _this.powerOnState ? _this.config.rf_on : _this.config.rf_off;
            _this.rfEmitter.sendCode(rf_code, function (error, stdout) {
                _this.log(error ? 'Failed: ' + error : 'Sent ' + stdout);
            });
            callback(null);
        };
        // React to the 'identify' HAP-NodeJS Accessory request
        // https://github.com/KhaosT/HAP-NodeJS/blob/master/lib/Accessory.js#L32-L38
        this.identify = function (callback) {
            _this.log(_this.config.name + " was identified.");
            callback();
        };
        // Register this outlets required (and optional) services
        this.getServices = function () {
            var outletService;
            if (_this.config.type == "Light") {
                outletService = new Service.Lightbulb(_this.config.name);
                // Bind state value to required Lightbulb charactertisics
                outletService.getCharacteristic(Characteristic.On)
                    .on('get', _this.getPowerState.bind(_this))
                    .on('set', _this.setPowerState.bind(_this));
            }
            var informationService = new Service.AccessoryInformation()
                .setCharacteristic(Characteristic.Manufacturer, _this.config.manufacturer)
                .setCharacteristic(Characteristic.Model, _this.config.model)
                .setCharacteristic(Characteristic.SerialNumber, _this.config.serial);
            return [informationService, outletService];
        };
        // Register accessory information
        this.config = config;
        // Register accessory default power state as 'off'
        this.powerOnState = false;
        this.rfEmitter = rpi433.emitter({
            pin: 0,
            pulseLength: 180
        });
        this.log = log;
        this.log("Starting device " + this.config.name + "...");
    }
    return OutletAccessory;
}());
module.exports = function (homebridge) {
    Service = homebridge.hap.Service;
    Characteristic = homebridge.hap.Characteristic;
    homebridge.registerAccessory("homebridge-outlet", "Outlet", OutletAccessory);
};
