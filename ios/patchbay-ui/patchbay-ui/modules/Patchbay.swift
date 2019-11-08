//
//  Patchbay.swift
//  patchbay-ui
//
//  Created by Andy on 11/8/19.
//  Copyright © 2019 Andy. All rights reserved.
//

import Foundation
import UIKit

public class Patchbay {
    
    let defaults: [String: CGFloat] = [
        "screenPercentage": 0.25,
        "arcThicknessPercentage": 0.08,
        "circleCenterXOffsetScaler": 0.3,
        "circleCenterYOffsetScaler": 0.1
    ]
    
    var inCircle: Circle!
    var outCircle: Circle!
    var connections: [String: Connection] = [:]
    var finger: Finger!
    
    var touchedPort: Port? = nil
    var hoveredPort: Port? = nil
    
    var size: CGSize = CGSize(width: 0, height: 0)
    var screenSize: CGFloat = 0
    
    var backgroundColor: CGColor = Colors.background()
    
    init() {
        inCircle = createCircle(type: Type.input)
        outCircle = createCircle(type: Type.output)
        finger = createFinger()
    }
    
    // setSize() must be called directly after creation
    public func setSize(_ s: CGSize) {
        size = s
        updateScreenVariables()
        adjustChildrenToScreenSize()
    }
    
    public func update(_ secBwFrames: CGFloat) {
        finger.update()
        inCircle.update(secBwFrames)
        outCircle.update(secBwFrames)
        for (_, conn) in connections {
            conn.update(secBwFrames)
        }
    }
    
    public func draw(_ context: CGContext) {
        context.saveGState()
        Draw.background(context, size.width, size.height, backgroundColor)
        inCircle.draw(context)
        outCircle.draw(context)
        for (_, conn) in connections {
            conn.draw(context)
        }
        finger.draw(context)
        context.restoreGState()
    }
    
    public func handleUserEvent(_ type: String, at point: CGPoint) {
        if type == Type.touch {
            finger.touchEvent(point: point)
        }
        else if type == Type.move {
            finger.moveEvent(point: point)
        }
        else if type == Type.release {
            finger.releaseEvent(point: point)
        }
    }
    
    public func addNode(id: String, name: String,
                        inputs: [String: String]? = nil,
                        outputs: [String: String]? = nil) {
        /*
         inputs/outputs are dictionaries of [ID: Name] strings
         */
        // TODO: assign colors to nodes in some predictable way
        let rColor = Colors.palette.randomElement()!()
        let inArc = inCircle.createArc(
            id: id, name: name, color: rColor)
        let outArc = outCircle.createArc(
            id: id, name: name, color: rColor)
        if let ins = inputs {
            // sort alphabetically by ID
            let sortedIns = ins.sorted(by: { $0.value < $1.value })
            for (id, portName) in sortedIns {
                let inPort = inArc.createPort(
                    id: id, name: portName)
                inArc.addPort(port: inPort)
            }
        }
        if let outs = outputs {
            // sort alphabetically by ID
            let sortedIns = outs.sorted(by: { $0.value < $1.value })
            for (id, portName) in sortedIns {
                let outPort = outArc.createPort(
                    id: id, name: portName)
                outArc.addPort(port: outPort)
            }
        }
        inCircle.addArc(arc: inArc)
        outCircle.addArc(arc: outArc)
    }
    
    func createConnection(input: Port, output: Port) -> Connection {
        let conn = Connection(input: input, output: output)
        conn.adjustToScreenSize(screenSize)
        return conn
    }
    
    func addConnection(_ c: Connection) {
        connections[c.name] = c
    }
    
    func makeConnection() {
        if let tp = touchedPort, let hp = hoveredPort {
            if tp.type == Type.input && hp.type == Type.output {
                addConnection(createConnection(input: tp, output: hp))
            }
            else if hp.type == Type.input && tp.type == Type.output {
                addConnection(createConnection(input: hp, output: tp))
            }
        }
    }
    
    func deleteConnection(_ c: Connection) {
        connections.removeValue(forKey: c.name)
    }
    
    func deleteConnectionByName(_ n: String) {
        connections.removeValue(forKey: n)
    }
    
    func getTouchedPort() -> Port? {
        return touchedPort
    }
    
    func getHoveredPort() -> Port? {
        return hoveredPort
    }
    
    func setTouchedPort(_ p: Port?) {
        touchedPort = nil
        if let port = p {
            touchedPort = port
        }
    }
    
    func setHoveredPort(_ p: Port?) {
        hoveredPort = nil
        if let port = p {
            hoveredPort = port
        }
    }
    
    func createCircle(type t: String) -> Circle {
        return Circle(
            t,
            defaults["screenPercentage"]!,
            defaults["arcThicknessPercentage"]!,
            getTouchedPort: getTouchedPort,
            getHoveredPort: getHoveredPort)
    }
    
    func createFinger() -> Finger {
        return Finger(
            inCircle,
            outCircle,
            getConnections: { () -> [String : Connection] in self.connections },
            makeConnection: makeConnection,
            deleteConnection: deleteConnection,
            getTouchedPort: getTouchedPort,
            getHoveredPort: getHoveredPort,
            setTouchedPort: setTouchedPort,
            setHoveredPort: setHoveredPort)
    }
    
    func updateScreenVariables() {
        screenSize = CGFloat.minimum(size.width, size.height)
        let xOffset = size.width * defaults["circleCenterXOffsetScaler"]!
        let yOffset = size.height * defaults["circleCenterYOffsetScaler"]!
        inCircle.point = CGPoint(
            x: (size.width / 2) - xOffset,
            y: (size.height / 2) - yOffset)
        outCircle.point = CGPoint(
            x: (size.width / 2) + xOffset,
            y: (size.height / 2) + yOffset)
    }
    
    func adjustChildrenToScreenSize() {
        finger.adjustToScreenSize(screenSize)
        inCircle.adjustToScreenSize(screenSize)
        outCircle.adjustToScreenSize(screenSize)
        for (_, conn) in connections {
            conn.adjustToScreenSize(screenSize)
        }
    }
}
