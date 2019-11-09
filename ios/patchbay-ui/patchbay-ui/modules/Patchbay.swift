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
        "screenPercentage": 0.35,
        "arcThicknessPercentage": 0.1,
        "circleXOffsetScalerLandscape": 0.25,
        "circleYOffsetScalerLandscape": 0.05,
        "circleXOffsetScalerPortrait": 0.05,
        "circleYOffsetScalerPortrait": 0.25,
        "angleOffsetInputLandscape": 0.25,
        "angleOffsetOutputLandscape": 0.75,
        "angleOffsetInputPortrait": 0.0,
        "angleOffsetOutputPortrait": 0.5
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
        if !hasNodes() {
            return
        }
        finger.update()
        inCircle.update(secBwFrames)
        outCircle.update(secBwFrames)
        for (_, conn) in connections {
            conn.update(secBwFrames)
        }
    }
    
    public func draw(_ context: CGContext) {
        if !hasNodes() {
            return
        }
        context.saveGState()
        Draw.background(
            context, size.width, size.height, backgroundColor)
        context.saveGState()
        inCircle.draw(context)
        outCircle.draw(context)
        for (_, conn) in connections {
            conn.draw(context)
        }
        finger.draw(context)
        context.restoreGState()
    }
    
    public func handleUserEvent(_ type: String, at point: CGPoint) {
        if !hasNodes() {
            return
        }
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
    
    func hasNodes() -> Bool {
        return inCircle.arcs.count == outCircle.arcs.count && inCircle.arcs.count > 0
    }
    
    func updateScreenVariables() {
        screenSize = CGFloat.minimum(size.width, size.height)
        var xOffset = size.width * defaults["circleXOffsetScalerPortrait"]!
        var yOffset = size.height * defaults["circleYOffsetScalerPortrait"]!
        if size.width > size.height {
            xOffset = size.width * defaults["circleXOffsetScalerLandscape"]!
            yOffset = size.height * defaults["circleYOffsetScalerLandscape"]!
        }
        inCircle.point = CGPoint(
            x: (size.width / 2) - xOffset,
            y: (size.height / 2) + yOffset)
        outCircle.point = CGPoint(
            x: (size.width / 2) + xOffset,
            y: (size.height / 2) - yOffset)
    }
    
    func adjustChildrenToScreenSize() {
        var inAngleOffset = defaults["angleOffsetInputPortrait"]! * Math.PI2
        var outAngleOffset = defaults["angleOffsetOutputPortrait"]! * Math.PI2
        if size.width > size.height {
            inAngleOffset = defaults["angleOffsetInputLandscape"]! * Math.PI2
            outAngleOffset = defaults["angleOffsetOutputLandscape"]! * Math.PI2
        }
        inCircle.adjustToScreenSize(screenSize, angleOffset: inAngleOffset)
        outCircle.adjustToScreenSize(screenSize, angleOffset: outAngleOffset)
        finger.adjustToScreenSize(screenSize)
        for (_, conn) in connections {
            conn.adjustToScreenSize(screenSize)
        }
    }
    
    func addFakeNodes() {
        addNode(
            id: "Phone", name: "Phone",
            inputs: [
                "Dial": "Dial",
                "Mic": "Mic"
            ],
            outputs: [
                "Bell": "Bell"
            ])
        addNode(
            id: "Biggie", name: "Biggie",
            outputs: [
                "Nod": "Nod",
                "Position": "Position"
            ])
        addNode(
            id: "Switch", name: "Switch",
            inputs: [
                "State": "State"
            ])
        addNode(
            id: "Toy-Pony", name: "Toy-Pony",
            outputs: [
                "speed": "speed"
            ])
        addNode(
            id: "Maraca", name: "Maraca",
            inputs: [
                "Intensity": "Intensity",
                "Beat": "Beat"
            ])
        addNode(
            id: "Guitar", name: "Guitar",
            inputs: [
                "Volume": "Volume",
                "Speed": "Speed",
                "Pitch": "Pitch"
            ])
        addNode(
            id: "Lamp", name: "Lamp",
            outputs: [
                "Brightness": "Brightness",
                "State": "State"
            ])
        addNode(
            id: "Boombox", name: "Boombox",
            inputs: [
                "Beat": "Beat",
                "Volume": "Volume"
            ],
            outputs: [
                "Volume": "Volume",
                "Song": "Song"
            ])
        addNode(
            id: "Snare", name: "Snare",
            inputs: [
                "Beat": "Beat",
                "Volume": "Volume"
            ],
            outputs: [
                "Volume": "Volume"
            ])
        addNode(
            id: "Monome", name: "Monome",
            inputs: [
                "Pitch": "Pitch",
                "State": "State"
            ])
        addNode(
            id: "Drawing-Bot", name: "Drawing-Bot",
            outputs: [
                "Speed": "Speed",
                "Direction": "Direction",
                "Pen-Height": "Pen-Height"
            ])
    }
}
