#include <BLEDevice.h>
#include <BLEUtils.h>
#include <BLEServer.h>
#include <Arduino_JSON.h>
#include <EEPROM.h>
#include <WiFi.h>
#include <WebServer.h>
#include <Adafruit_NeoPixel.h>

#define SERVICE_UUID        "4fafc201-1fb5-459e-8fcc-c5c9c331914b"
#define CHARACTERISTIC_UUID "beb5483e-36e1-4688-b7f5-ea07361b26a8"

#define PIN 25
#define STRIPSIZE 3 // Limited by max 256 bytes ram. At 3 bytes/LED you get max ~85 pixels
Adafruit_NeoPixel strip = Adafruit_NeoPixel(STRIPSIZE, PIN, NEO_GRB + NEO_KHZ800);

String hostname = "cdawgsdongle";
String ssid_name;
String ssid_pass;

WebServer server(80);

class MyCallbacks: public BLECharacteristicCallbacks {
  public:
  bool initWiFi(const char* ssid, const char* pass) {    
    WiFi.mode(WIFI_STA);

    // --- Static IP - because PWAs can't do anything smart with UDP or Hostnames
    // Set your Static IP address
    IPAddress local_IP(192, 168, 1, 253);
    // Set your Gateway IP address
    IPAddress gateway(192, 168, 1, 1);
    
    IPAddress subnet(255, 255, 0, 0);
    IPAddress primaryDNS(8, 8, 8, 8); // optional
    IPAddress secondaryDNS(8, 8, 4, 4); // optional
    WiFi.config(local_IP, gateway, subnet, primaryDNS, secondaryDNS);

    // --- Dynamic IP but set a hostname
    // WiFi.config(INADDR_NONE, INADDR_NONE, INADDR_NONE, INADDR_NONE);
    // WiFi.setHostname(hostname.c_str()); // define hostname
    
    WiFi.begin(ssid, pass);
    Serial.print("Connecting to WiFi ..");
    int count = 0;
    while (WiFi.status() != WL_CONNECTED && count < 10) {
      Serial.print('.');
      delay(1000);
      count++;
    }

    if (WiFi.status() == WL_CONNECTED) {
      Serial.println(WiFi.localIP());
      return true;
    } else {
      return false;
    }
  }

  void onWrite(BLECharacteristic *pCharacteristic) {
    std::string value = pCharacteristic->getValue();
    Serial.print(value.c_str());
    JSONVar message = JSON.parse(value.c_str());

    // if message is object with "ssid" and "pass", connect to wifi with these
    if ((const char*) message["ssid"] != null && (const char*) message["pass"] != null) {
      Serial.println("Received Wifi credentials");

      const bool wifi_connected = initWiFi((const char*) message["ssid"], (const char*) message["pass"]);

      if (wifi_connected) {
        writeStringToEEPROM(0, String((const char*) message["ssid"]));
        writeStringToEEPROM(strlen((const char*) message["ssid"]), String((const char*) message["pass"]));
      }      
    } else {
      Serial.println("GETSHREKT");
    }
  }

  void writeStringToEEPROM(int addrOffset, const String &strToWrite) // const char* strToWrite 
  {
    byte len = strToWrite.length(); //strlen(strToWrite); //
    EEPROM.write(addrOffset, len); // write length of string first, so when reading, know how many chars to read
    for (int i = 0; i < len; i++)
    {
      EEPROM.write(addrOffset + 1 + i, strToWrite[i]);
    }
    EEPROM.commit();
  }
};

class MyServerCallbacks: public BLEServerCallbacks {
  void onConnect(BLEServer* pServer) {
    Serial.println("CONNECTED...");
  }

  void onDisconnect(BLEServer* pServer) {
    Serial.println("DISCONNECTED...");
    pServer->startAdvertising();
  }
};

String readStringFromEEPROM(int addrOffset)
{
  int newStrLen = EEPROM.read(addrOffset);
  char data[newStrLen + 1];
  for (int i = 0; i < newStrLen; i++)
  {
    data[i] = EEPROM.read(addrOffset + 1 + i);
  }
  data[newStrLen] = '\0';
  return String(data);
}

// Fill the dots one after the other with a color
void colorWipe(uint32_t c, uint8_t wait) {
  for(uint16_t i=0; i<strip.numPixels(); i++) {
      strip.setPixelColor(i, c);
      strip.show();
      delay(wait);
  }
}

void handlePost() {
  if (server.hasArg("plain") == false) {
    //handle error here
  }
  String body = server.arg("plain");
  JSONVar jsonDocument = JSON.parse(body.c_str());
  Serial.print(jsonDocument);

  // Get RGB components
  int red = jsonDocument["red"];
  int green = jsonDocument["green"];
  int blue = jsonDocument["blue"];

  colorWipe(strip.Color(red, green, blue), 25);

  // Respond to the client
  server.send(200, "application/json", "{}");
}

void getTest() {
  Serial.println("Get Test");
  
  server.send(200, "application/json", "{}");
}

void setup() {
  Serial.begin(115200);

  strip.begin();
  strip.setBrightness(100); // set accordingly
  strip.show(); // Initialize all pixels to 'off'

  EEPROM.begin(512);

  ssid_name = readStringFromEEPROM(0);
  ssid_pass = readStringFromEEPROM(ssid_name.length()+1);

  if (ssid_name != null && ssid_pass != null) {
    MyCallbacks wifi_handler; // instantiate this Class just to use the initWifi method
    bool wifi_con = wifi_handler.initWiFi(ssid_name.c_str(), ssid_pass.c_str());
    Serial.print("Connected to Wifi: " + wifi_con);
    server.on("/led", HTTP_POST, handlePost);
    server.on("/test", getTest);
    // start server     
    server.begin();
  }

  BLEDevice::init("cdawgs_dongle");
  BLEServer *pServer = BLEDevice::createServer();
  pServer->setCallbacks(new MyServerCallbacks());
  
  BLEService *pService = pServer->createService(SERVICE_UUID);
  
  BLECharacteristic *pCharacteristic = pService->createCharacteristic(
                                         CHARACTERISTIC_UUID,
                                         BLECharacteristic::PROPERTY_READ |
                                         BLECharacteristic::PROPERTY_WRITE
                                       );
  pCharacteristic->setCallbacks(new MyCallbacks());

  pCharacteristic->setValue("Hello World says Cdawg");
  pService->start();
  
  BLEAdvertising *pAdvertising = pServer->getAdvertising();  // this still is working for backward compatibility
//  BLEAdvertising *pAdvertising = BLEDevice::getAdvertising();
  pAdvertising->addServiceUUID(SERVICE_UUID);
  
//  pAdvertising->setScanResponse(true);
//  pAdvertising->setMinPreferred(0x06);  // functions that help with iPhone connections issue
//  pAdvertising->setMinPreferred(0x12);
//  BLEDevice::startAdvertising();
  pAdvertising->start();
  Serial.println("Characteristic defined! Now you can read it in your phone!");
}

void writeStringToEEPROM(int addrOffset, const String &strToWrite)
{
  byte len = strToWrite.length();
  EEPROM.write(addrOffset, len);
  for (int i = 0; i < len; i++)
  {
    EEPROM.write(addrOffset + 1 + i, strToWrite[i]);
  }
}

void loop() {
  // Serial.println(WiFi.localIP());
  server.handleClient(); // This is for the REST API to work
}
