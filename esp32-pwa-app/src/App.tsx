import React from 'react';
// import logo from './logo.svg';
// import './App.css';

// function App() {
//   return (
//     <div className="App">
//       <header className="App-header">
//         <img src={logo} className="App-logo" alt="logo" />
//         <p>
//           Edit <code>src/App.tsx</code> and save to reload.
//         </p>
//         <a
//           className="App-link"
//           href="https://reactjs.org"
//           target="_blank"
//           rel="noopener noreferrer"
//         >
//           Learn React
//         </a>
//       </header>
//     </div>
//   );
// }

// export default App;

import { useState } from 'react'
import logo from './logo.svg'
import './App.css'

let device: any, server: any, service: any, characteristic: any;
// import './bluetooth.js'

function App() {
  // const [count, setCount] = useState(0)
  let [connected, setConnected] = useState<string | null>(null)

  async function connectWifi() {
      console.log("connect wifi...");
      const ssid_Name = document.getElementById('ssid');
      const password = document.getElementById('pwd');
      // console.log(ssid_Name.value);
      // console.log(password.value);
      var encoder = new TextEncoder();
      // await characteristic.writeValue(encoder.encode(ssid_Name.value));
      // await characteristic.writeValue(encoder.encode(password.value));
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
      // const device = await navigator.bluetooth.requestDevice({ filters: [{ services: ['heart_rate'] }] });
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

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />

        <h2>Bluetooth 4</h2>
        <button id="ble" onClick={() => connectBluetooth()}>Connect Device</button>

        <p>Connected to: {connected}</p>

        <label className="ssid">SSID:</label><br/>
        <input type="text" id="ssid" name="ssid" placeholder="Wifi name" /><br/> {/*<!-- TODO : drop down for wifi networks? --> */}
        <label className="pwd">Password:</label><br/>
        <input type="password" id="pwd" name="pwd" />
        <button id="wifi" onClick={() => connectWifi()}>Connect Wifi</button>
        
      </header>
    </div>
  )
}

export default App;
