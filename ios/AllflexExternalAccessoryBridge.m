#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>

@interface RCT_EXTERN_MODULE(AllflexExternalAccessory, RCTEventEmitter)

RCT_EXTERN_METHOD(connect:
                  (RCTPromiseResolveBlock)resolve
                  rejecter:
                  (RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(disconnect:
                  (RCTPromiseResolveBlock)resolve
                  rejecter:
                  (RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(getConnectedAccessories:
                  (RCTPromiseResolveBlock)resolve
                  rejecter:
                  (RCTPromiseRejectBlock)reject)

@end