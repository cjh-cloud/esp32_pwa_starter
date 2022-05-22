# ESP32 PWA Starter

## React PWA
https://create-react-app.dev/docs/making-a-progressive-web-app/#offline-first-considerations

Running the project in dev mode:
```
git clone <this-repo>
cd esp32-pwa-app
npm run dev
```

Hosting a prod build to test PWA install:
```


npm run build
npx serve -s build
```

CloudFlare tunnel - works with both examples above
https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/tunnel-guide

> .\cloudflared.exe tunnel --url http://localhost:3000

---

## ESP32 Stuff

Based on Neil Kolban example for IDF: https://github.com/nkolban/esp32-snippets/blob/master/cpp_utils/tests/BLE%20Tests/SampleServer.cpp
Ported to Arduino ESP32 by Evandro Copercini
updates by chegewara


https://randomnerdtutorials.com/esp32-bluetooth-low-energy-ble-arduino-ide/

https://randomnerdtutorials.com/installing-the-esp32-board-in-arduino-ide-windows-instructions/

https://roboticsbackend.com/arduino-write-string-in-eeprom/

https://www.aranacorp.com/en/using-the-eeprom-with-the-esp32/

See the following for generating UUIDs:
https://www.uuidgenerator.net/

Curl example to change LED strip colour:
`curl -d '{"red":5, "green":10, "blue":100}' -H "Content-Type: application/json" -X POST http://192.168.1.68:80/led`

https://randomnerdtutorials.com/esp32-set-custom-hostname-arduino/
https://randomnerdtutorials.com/esp32-static-fixed-ip-address-arduino-ide/
https://www.survivingwithandroid.com/esp32-rest-api-esp32-api-server/