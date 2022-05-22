import React from 'react';
import { useState } from 'react'
import './App.css'

import { RgbColorPicker } from 'react-colorful';

let device: any, server: any, service: any, characteristic: any;

function App() {
  let [connected, setConnected] = useState<string | null>(null)
  const [color, setColor] = useState({ r: 255, g: 255, b: 255 }); // default white

  async function connectWifi() {
      console.log("connect wifi...");
      const ssid_Name = document.getElementById('ssid');
      const password = document.getElementById('pwd');
      var encoder = new TextEncoder();
      var thing = {
        // @ts-ignore
        ssid: ssid_Name.value,
        // @ts-ignore
        pass: password.value
      }
      await characteristic.writeValue(encoder.encode(JSON.stringify(thing)));
  }

  async function connectBluetooth() {

      // Connect Device
      // @ts-ignore
      device = await navigator.bluetooth.requestDevice(
          { 
              filters: [{ 
                  name: 'cdawgs_dongle',
                  services: ["4fafc201-1fb5-459e-8fcc-c5c9c331914b"] 
              }],
              
          }
      );
      console.log('requested device');
      server = await device.gatt.connect();

      setConnected('cdawgs_dongle')
      console.log(connected)

      service = await server.getPrimaryService('4fafc201-1fb5-459e-8fcc-c5c9c331914b');
      console.log('got service');
      characteristic = await service.getCharacteristic('beb5483e-36e1-4688-b7f5-ea07361b26a8');
      console.log('got char');
      
      var thing = await characteristic.readValue();
      var decoder = new TextDecoder("utf-8");
      console.log(decoder.decode(thing));
      // console.log(thing);
      console.log('read char');
      
      // TODO : send something to the ESP
      var encoder = new TextEncoder();
      characteristic.writeValue(encoder.encode("gday")); // see if we can get this

  }

  // curl -d '{"red":250, "green":10, "blue":100}' -H "Content-Type: application/json" -X POST http://cdawgsdongle:80/led
  async function sendrgb(event: any) {
    setColor(event);

    fetch('http://192.168.1.253:80/led', {
      mode: 'no-cors',
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        red: event.r,
        green: event.g,
        blue: event.b
      })
    })
  }

  return (
    <div className="App">
      <header className="App-header">

        <h2>ESP32 Wifi Setup</h2>

        <hr className='hr'></hr>

        <div className='container'>
          <button className='button' id="ble" onClick={() => connectBluetooth()}>Connect Bluetooth</button>
          <br />
          <label>Connected to: {connected}</label>
        </div>

        <hr className='hr'></hr>

        <div className='container'>
          <div className='container'>
            <label className="ssid">SSID: </label>
            <input type="text" id="ssid" name="ssid" placeholder="Wifi name" /><br/> {/*<!-- TODO : drop down for wifi networks? --> */}
          {/* </div>
          <div className='container'> */}
            <label className="pwd">Password: </label>
            <input type="password" id="pwd" name="pwd" />
          </div>
          <div className='container'>
            <button className='button' id="wifi" onClick={() => connectWifi()}>Connect Wifi</button>
          </div>
        </div>

        <hr className='hr'></hr>

        <div className='container colourpicker'>
          <RgbColorPicker color={color} onChange={sendrgb} />
        </div>

        <hr className='hr'></hr>
        
      </header>
    </div>
  )
}

export default App;
