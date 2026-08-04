import Foundation
import ExternalAccessory
import React

@objc(AllflexExternalAccessory)
class AllflexExternalAccessory: RCTEventEmitter, StreamDelegate {

    private var accessory: EAAccessory?
    private var session: EASession?
    private var inputStream: InputStream?
    private var outputStream: OutputStream?

    private var hasListeners = false

    override init() {
        super.init()

        EAAccessoryManager.shared().registerForLocalNotifications()

        NotificationCenter.default.addObserver(
            self,
            selector: #selector(accessoryDidDisconnect),
            name: .EAAccessoryDidDisconnect,
            object: nil
        )

        NotificationCenter.default.addObserver(
            self,
            selector: #selector(accessoryDidConnect),
            name: .EAAccessoryDidConnect,
            object: nil
        )
    }

    deinit {
        NotificationCenter.default.removeObserver(self)
        closeSession()
    }

    override static func requiresMainQueueSetup() -> Bool {
        return true
    }

    override func supportedEvents() -> [String]! {
        return [
            "AllflexDataReceived",
            "AllflexConnectionChanged"
        ]
    }

    override func startObserving() {
        hasListeners = true
    }

    override func stopObserving() {
        hasListeners = false
    }

    @objc(connect:rejecter:)
    func connect(
        resolve: @escaping RCTPromiseResolveBlock,
        rejecter reject: @escaping RCTPromiseRejectBlock
    ) {
        let protocolosPermitidos = getSupportedProtocols()

        if protocolosPermitidos.isEmpty {
            reject(
                "NO_PROTOCOLS",
                "No hay protocolos definidos en UISupportedExternalAccessoryProtocols dentro de Info.plist.",
                nil
            )
            return
        }

        let accesorios = EAAccessoryManager.shared().connectedAccessories

        guard let encontrado = accesorios.first(where: { accesorio in
            let nombre = accesorio.name.uppercased()
            let pareceAllflex = nombre.contains("LPR") || nombre.contains("ALLFLEX")

            let tieneProtocoloValido = accesorio.protocolStrings.contains { protocoloAccesorio in
                protocolosPermitidos.contains(protocoloAccesorio)
            }

            return pareceAllflex && tieneProtocoloValido
        }) ?? accesorios.first(where: { accesorio in
            accesorio.protocolStrings.contains { protocoloAccesorio in
                protocolosPermitidos.contains(protocoloAccesorio)
            }
        }) else {
            reject(
                "NO_ACCESSORY",
                "No se encontró ningún lector Allflex/LPR conectado compatible. Comprueba que esté emparejado y conectado en Ajustes > Bluetooth.",
                nil
            )
            return
        }

        guard let protocolo = encontrado.protocolStrings.first(where: { protocoloAccesorio in
            protocolosPermitidos.contains(protocoloAccesorio)
        }) else {
            reject(
                "NO_MATCHING_PROTOCOL",
                "El lector está conectado, pero no coincide con ningún protocolo declarado en Info.plist.",
                nil
            )
            return
        }

        closeSession()

        guard let nuevaSession = EASession(accessory: encontrado, forProtocol: protocolo) else {
            reject(
                "SESSION_ERROR",
                "No se pudo abrir una sesión con el lector Allflex/LPR.",
                nil
            )
            return
        }

        accessory = encontrado
        session = nuevaSession

        inputStream = nuevaSession.inputStream
        outputStream = nuevaSession.outputStream

        inputStream?.delegate = self
        outputStream?.delegate = self

        inputStream?.schedule(in: .current, forMode: .default)
        outputStream?.schedule(in: .current, forMode: .default)

        inputStream?.open()
        outputStream?.open()

        emitConnectionChanged(isConnected: true)

        resolve([
            "id": encontrado.serialNumber,
            "name": encontrado.name,
            "manufacturer": encontrado.manufacturer,
            "modelNumber": encontrado.modelNumber,
            "protocol": protocolo
        ])
    }

    @objc(disconnect:rejecter:)
    func disconnect(
        resolve: @escaping RCTPromiseResolveBlock,
        rejecter reject: @escaping RCTPromiseRejectBlock
    ) {
        closeSession()
        emitConnectionChanged(isConnected: false)
        resolve(true)
    }

    @objc(getConnectedAccessories:rejecter:)
    func getConnectedAccessories(
        resolve: @escaping RCTPromiseResolveBlock,
        rejecter reject: @escaping RCTPromiseRejectBlock
    ) {
        let accesorios = EAAccessoryManager.shared().connectedAccessories

        let resultado = accesorios.map { accesorio in
            return [
                "id": accesorio.serialNumber,
                "name": accesorio.name,
                "manufacturer": accesorio.manufacturer,
                "modelNumber": accesorio.modelNumber,
                "protocolStrings": accesorio.protocolStrings
            ] as [String: Any]
        }

        resolve(resultado)
    }

    func stream(_ aStream: Stream, handle eventCode: Stream.Event) {
        guard aStream == inputStream else {
            return
        }

        switch eventCode {
        case .hasBytesAvailable:
            readAvailableBytes()

        case .errorOccurred:
            emitConnectionChanged(isConnected: false)

        case .endEncountered:
            closeSession()
            emitConnectionChanged(isConnected: false)

        default:
            break
        }
    }

    private func readAvailableBytes() {
        guard let inputStream = inputStream else {
            return
        }

        let bufferSize = 1024
        var buffer = [UInt8](repeating: 0, count: bufferSize)

        while inputStream.hasBytesAvailable {
            let bytesRead = inputStream.read(&buffer, maxLength: bufferSize)

            if bytesRead > 0 {
                let data = Data(buffer.prefix(bytesRead))

                let texto =
                    String(data: data, encoding: .utf8) ??
                    String(data: data, encoding: .ascii) ??
                    ""

                if !texto.isEmpty {
                    emitData(texto)
                }
            } else if bytesRead < 0 {
                emitConnectionChanged(isConnected: false)
                break
            }
        }
    }

    private func closeSession() {
        inputStream?.close()
        outputStream?.close()

        inputStream?.remove(from: .current, forMode: .default)
        outputStream?.remove(from: .current, forMode: .default)

        inputStream?.delegate = nil
        outputStream?.delegate = nil

        inputStream = nil
        outputStream = nil
        session = nil
        accessory = nil
    }

    private func getSupportedProtocols() -> [String] {
        guard let protocolos = Bundle.main.object(
            forInfoDictionaryKey: "UISupportedExternalAccessoryProtocols"
        ) as? [String] else {
            return []
        }

        return protocolos
    }

    private func emitData(_ text: String) {
        guard hasListeners else {
            return
        }

        sendEvent(
            withName: "AllflexDataReceived",
            body: [
                "text": text
            ]
        )
    }

    private func emitConnectionChanged(isConnected: Bool) {
        guard hasListeners else {
            return
        }

        sendEvent(
            withName: "AllflexConnectionChanged",
            body: [
                "isConnected": isConnected,
                "name": accessory?.name ?? "Allflex LPR",
                "id": accessory?.serialNumber ?? ""
            ]
        )
    }

    @objc
    private func accessoryDidDisconnect(notification: Notification) {
        closeSession()
        emitConnectionChanged(isConnected: false)
    }

    @objc
    private func accessoryDidConnect(notification: Notification) {
        emitConnectionChanged(isConnected: true)
    }
}