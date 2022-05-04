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
      console.log(ssid_Name.value);
      console.log(password.value);
      var encoder = new TextEncoder();
      // await characteristic.writeValue(encoder.encode(ssid_Name.value));
      // await characteristic.writeValue(encoder.encode(password.value));
      var thing = {
        ssid: ssid_Name.value,
        pass: password.value
      }
      await characteristic.writeValue(encoder.encode(JSON.stringify(thing)));
  }

  async function connectBluetooth() {

      // Connect Device
      // const device = await navigator.bluetooth.requestDevice({ filters: [{ services: ['heart_rate'] }] });
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


      // Get heart rate data
      // const hr = await server.getPrimaryService('4fafc201-1fb5-459e-8fcc-c5c9c331914b');
      // const hrMeasurement = await hr.getCharacteristic('heart_rate_measurement');

      // Listen to changes on device
      // await hrMeasurement.startNotifications(); 

      // hrMeasurement.addEventListener('characteristicvaluechanged', (e) => {
      //     console.log(parseHeartRate(e.target.value));
      // });

  }

  function parseHeartRate(value: any) {
      // In Chrome 50+, a DataView is returned instead of an ArrayBuffer.
      value = value.buffer ? value : new DataView(value);
      let flags = value.getUint8(0);
      let rate16Bits = flags & 0x1;
      let result = {};
      let index = 1;
      if (rate16Bits) {
          result.heartRate = value.getUint16(index, /*littleEndian=*/true);
          index += 2;
      } else {
          result.heartRate = value.getUint8(index);
          index += 1;
      }
      let contactDetected = flags & 0x2;
      let contactSensorPresent = flags & 0x4;
      if (contactSensorPresent) {
          result.contactDetected = !!contactDetected;
      }
      let energyPresent = flags & 0x8;
      if (energyPresent) {
          result.energyExpended = value.getUint16(index, /*littleEndian=*/true);
          index += 2;
      }
      let rrIntervalPresent = flags & 0x10;
      if (rrIntervalPresent) {
          let rrIntervals = [];
          for (; index + 1 < value.byteLength; index += 2) {
              rrIntervals.push(value.getUint16(index, /*littleEndian=*/true));
          }
          result.rrIntervals = rrIntervals;
      }
      return result;
  }

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        {/* <p>Hello Vite + React!</p>
        <p>
          <button type="button" onClick={() => setCount((count) => count + 1)}>
            count is: {count}
          </button>
        </p>
        <p>
          Edit <code>App.tsx</code> and save to test HMR updates.
        </p> */}

        {/*  */}
        <h2>Bluetooth 4</h2>
        <button id="ble" onClick={() => connectBluetooth()}>Connect Device</button>

        <p>Connected to: {connected}</p>

        <label className="ssid">SSID:</label><br/>
        <input type="text" id="ssid" name="ssid" placeholder="Wifi name" /><br/> {/*<!-- TODO : drop down for wifi networks? --> */}
        <label className="pwd">Password:</label><br/>
        <input type="password" id="pwd" name="pwd" />
        <button id="wifi" onClick={() => connectWifi()}>Connect Wifi</button>

        {/* <script>
            if ('serviceWorker' in navigator) {
                navigator.serviceWorker.register('/service-worker.js');
            }
        </script> */}
        {/*  */}
        
      </header>
    </div>
  )
}

export default App
