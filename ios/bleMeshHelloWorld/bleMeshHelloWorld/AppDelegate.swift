//
//  AppDelegate.swift
//  bleMeshHelloWorld
//
//  Created by Andy on 11/11/19.
//  Copyright © 2019 Andy. All rights reserved.
//

import UIKit
import os.log
import nRFMeshProvision

extension AppDelegate: LoggerDelegate {
    func log(message: String, ofCategory category: LogCategory, withLevel level: LogLevel) {
        if #available(iOS 10.0, *) {
            os_log("%{public}@", log: category.log, type: level.type, message)
        } else {
            NSLog("%@", message)
        }
    }
}

extension LogLevel {
    /// Mapping from mesh log levels to system log types.
    var type: OSLogType {
        switch self {
        case .debug:       return .debug
        case .verbose:     return .debug
        case .info:        return .info
        case .application: return .default
        case .warning:     return .error
        case .error:       return .fault
        }
    }
}

extension LogCategory {
    var log: OSLog {
        return OSLog(subsystem: Bundle.main.bundleIdentifier!, category: rawValue)
    }
}

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {

    var meshNetworkManager: MeshNetworkManager!
    var connection: NetworkConnection!
    
    let configuration: [String: Double] = [
        "acknowledgmentTimerInterval": 0.150,
        "transmissionTimerInteral": 0.600,
        "incompleteMessageTimeout": 10.0,
        "retransmissionLimit": 2,
        "acknowledgmentMessageInterval": 4.2,
        // As the interval has been increased, the timeout can be adjusted.
        // The acknowledged message will be repeated after 4.2 seconds,
        // 12.6 seconds (4.2 + 4.2 * 2), and 29.4 seconds (4.2 + 4.2 * 2 + 4.2 * 4).
        // Then, leave 10 seconds for until the incomplete message times out.
        "acknowledgmentMessageTimeout": 40.0
    ]
    
    let defaultNetName: String = "Patchbay Mesh Network"

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        // Create the main MeshNetworkManager instance and customize
        // configuration values.
        meshNetworkManager = MeshNetworkManager()
        meshNetworkManager.acknowledgmentTimerInterval = configuration["acknowledgmentTimerInterval"]!
        meshNetworkManager.transmissionTimerInteral = configuration["transmissionTimerInteral"]!
        meshNetworkManager.incompleteMessageTimeout = configuration["incompleteMessageTimeout"]!
        meshNetworkManager.retransmissionLimit = Int(configuration["retransmissionLimit"]!)
        meshNetworkManager.acknowledgmentMessageInterval = configuration["acknowledgmentMessageInterval"]!
        meshNetworkManager.acknowledgmentMessageTimeout = configuration["acknowledgmentMessageTimeout"]!
        meshNetworkManager.logger = self
        
        var loaded = false
        do {
            loaded = try meshNetworkManager.load()
        } catch {
            print(error)
        }
        if !loaded {
            createNewMeshNetwork()
        }
        meshNetworkDidChange()
        return true
    }
    
    /// This method creates a new mesh network with a default name and a
    /// single Provisioner.
    func createNewMeshNetwork() {
        let provisioner = Provisioner(name: UIDevice.current.name,
                                      allocatedUnicastRange: [AddressRange(0x0001...0x199A)],
                                      allocatedGroupRange:   [AddressRange(0xC000...0xCC9A)],
                                      allocatedSceneRange:   [SceneRange(0x0001...0x3333)])
        _ = meshNetworkManager.createNewMeshNetwork(withName: defaultNetName, by: provisioner)
        _ = meshNetworkManager.save()
    }
    
    /// Reinitializes the `NetworkConnection`
    /// so that it starts scanning for devices advertising the new Network ID.
    func meshNetworkDidChange() {
        connection?.close()
        let meshNetwork = meshNetworkManager.meshNetwork!
        connection = NetworkConnection(to: meshNetwork)
        connection!.dataDelegate = meshNetworkManager
        connection!.logger = self
        meshNetworkManager.transmitter = connection
        connection!.open()
    }

    // MARK: UISceneSession Lifecycle

    func application(_ application: UIApplication, configurationForConnecting connectingSceneSession: UISceneSession, options: UIScene.ConnectionOptions) -> UISceneConfiguration {
        // Called when a new scene session is being created.
        // Use this method to select a configuration to create the new scene with.
        return UISceneConfiguration(name: "Default Configuration", sessionRole: connectingSceneSession.role)
    }

    func application(_ application: UIApplication, didDiscardSceneSessions sceneSessions: Set<UISceneSession>) {
        // Called when the user discards a scene session.
        // If any sessions were discarded while the application was not running, this will be called shortly after application:didFinishLaunchingWithOptions.
        // Use this method to release any resources that were specific to the discarded scenes, as they will not return.
    }


}

