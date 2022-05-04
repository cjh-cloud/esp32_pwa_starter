#include <BLEDevice.h>
#include <BLEUtils.h>
#include <BLEServer.h>
#include <Arduino_JSON.h>
#include <EEPROM.h>
#include <WiFi.h>

#define SERVICE_UUID        "4fafc201-1fb5-459e-8fcc-c5c9c331914b"
#define CHARACTERISTIC_UUID "beb5483e-36e1-4688-b7f5-ea07361b26a8"

String ssid_name;
String ssid_pass;

class MyCallbacks: public BLECharacteristicCallbacks {
  bool initWiFi(const char* ssid, const char* pass) {
    WiFi.mode(WIFI_STA);
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
      Serial.println("YEEEEEBOI");
      Serial.println((const char*) message["ssid"]);
      Serial.println(strlen((const char*) message["ssid"]));

      const bool wifi_connected = initWiFi((const char*) message["ssid"], (const char*) message["pass"]);

      if (wifi_connected) {
        writeStringToEEPROM(0, String((const char*) message["ssid"]));
        writeStringToEEPROM(strlen((const char*) message["ssid"]), String((const char*) message["pass"]));
      }      
    } else {
      Serial.println("GETSHREKT");
    }
  }

  // TODO - get this to work
  void writeStringToEEPROM(int addrOffset, const String &strToWrite) // const char* strToWrite 
  {
    byte len = strToWrite.length(); //strlen(strToWrite); //
    EEPROM.write(addrOffset, len); // write length of string first, so when reading, know how many chars to read
    Serial.print("LEN...");
    Serial.println(len);
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

// TODO - 
//String readStringFromEEPROM(int startingAddress, int numBytesToRead)
//{
//  String eeprom_msg = "";
//  for (int i = 0; i < numBytesToRead; i++) {
//    eeprom_msg += EEPROM.read(startingAddress + i);
//  }
//  return eeprom_msg;
//}
String readStringFromEEPROM(int addrOffset)
{
  int newStrLen = EEPROM.read(addrOffset);
  char data[newStrLen + 1];
  for (int i = 0; i < newStrLen; i++)
  {
    data[i] = EEPROM.read(addrOffset + 1 + i);
  }
  data[newStrLen] = '\0'; // !!! NOTE !!! Remove the space between the slash "/" and "0" (I've added a space because otherwise there is a display bug)
  return String(data);
}

void setup() {
  Serial.begin(115200);

  EEPROM.begin(512);

//  Serial.println("Reading from EEPROM!");
//  String ssid_name_length = readStringFromEEPROM(0, 1); // If this returns a char, that means there are Wifi creds saved that we should try
//  Serial.println("ONE");
//  Serial.println(ssid_name_length);
//  Serial.println("TWO");
//  if (ssid_name_length != null) {
//    ssid_name = readStringFromEEPROM(1, ssid_name_length.toInt());
//    String ssid_pass_length = readStringFromEEPROM(ssid_name_length.toInt() + 1, 1);
//    if (ssid_pass_length != null) {
//      ssid_pass = readStringFromEEPROM(ssid_name_length.toInt() + 2, ssid_pass_length.toInt());
//
//      // TODO  - connect to Wifi!
//      Serial.println(ssid_name);
//      Serial.println(ssid_pass);
//    }
//  }
//  ssid_name = readStringFromEEPROM(0);
//  ssid_pass = readStringFromEEPROM(ssid_name.length());
  
  Serial.println("Starting BLE work!");

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
  // put your main code here, to run repeatedly:
  delay(2000);
  String retrievedString = readStringFromEEPROM(0);
  Serial.print("The String we read from EEPROM: ");
  Serial.println(EEPROM.read(0));
  Serial.println(retrievedString);
//  Serial.println(ssid_name);
//  Serial.println(ssid_pass);
  Serial.println(EEPROM.read(13)); // retrievedString.length()
  String pass = readStringFromEEPROM(retrievedString.length()+1);
  Serial.println(pass);
  
}
