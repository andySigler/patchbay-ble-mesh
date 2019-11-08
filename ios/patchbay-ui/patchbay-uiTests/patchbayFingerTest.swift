//
//  patchbayFingerTest.swift
//  patchbay-uiTests
//
//  Created by Andy on 11/8/19.
//  Copyright © 2019 Andy. All rights reserved.
//

import XCTest
@testable import class patchbay_ui.Circle
@testable import class patchbay_ui.Connection
@testable import class patchbay_ui.Finger
@testable import class patchbay_ui.Port

class pachbayFingerTest: XCTestCase {
    
    var finger: patchbay_ui.Finger!

    var inCircle: patchbay_ui.Circle!
    var outCircle: patchbay_ui.Circle!
    var connections: [String: Connection] = [String: Connection]()
    
    var touchedPort: patchbay_ui.Port? = nil
    var hoveredPort: patchbay_ui.Port? = nil
    
    var context: CGContext!

    override func setUp() {
        super.setUp()
        let contextSize = CGSize(width: 400, height: 400)
        UIGraphicsBeginImageContextWithOptions(
            contextSize, false, 0.0)
        context = UIGraphicsGetCurrentContext()!
        touchedPort = nil
        hoveredPort = nil
        connections = [String: Connection]()
        func makeConnection() {
            if let tp = touchedPort, let hp = hoveredPort {
                var conn: Connection
                if tp.type == Type.input && hp.type == Type.output {
                    conn = Connection(input: tp, output: hp)
                    connections[conn.name] = conn
                }
                else if hp.type == Type.input && tp.type == Type.output {
                    conn = Connection(input: tp, output: hp)
                    connections[conn.name] = conn
                }
                touchedPort = nil
                hoveredPort = nil
            }
        }
        func deleteConnection(_ c: Connection) {
            for (name, conn) in connections {
                if c === conn {
                    connections.removeValue(forKey: name)
                }
            }
        }
        func setTouchedPort(_ port: Port?) {
            touchedPort = nil
            if let p = port {
                touchedPort = p
            }
        }
        func setHoveredPort(_ port: Port?) {
            hoveredPort = nil
            if let p = port {
                hoveredPort = p
            }
        }
        inCircle = Circle(
            Type.input, 0.2, 0.1,
            getTouchedPort: {() in self.touchedPort },
            getHoveredPort: {() in self.hoveredPort })
        outCircle = Circle(
            Type.output, 0.2, 0.1,
            getTouchedPort: {() in self.touchedPort },
            getHoveredPort: {() in self.hoveredPort })
        let inArc = inCircle.createArc(id: "arcID", name: "name", color: Colors.black())
        let outArc = outCircle.createArc(id: "arcID", name: "name", color: Colors.black())
        inArc.addPort(port: inArc.createPort(id: "inPortID", name: "inPortName"))
        outArc.addPort(port: outArc.createPort(id: "outPortID", name: "outPortName"))
        inCircle.addArc(arc: inArc)
        outCircle.addArc(arc: outArc)
        finger = Finger(
            inCircle, outCircle,
            getConnections: {() in self.connections },
            makeConnection: makeConnection,
            deleteConnection: deleteConnection,
            getTouchedPort: {() in self.touchedPort },
            getHoveredPort: {() in self.hoveredPort },
            setTouchedPort: setTouchedPort,
            setHoveredPort: setHoveredPort)
    }

    override func tearDown() {
        super.tearDown()
    }

    func testCanBeCreated() {
        XCTAssertTrue(finger.inCircle === inCircle)
        XCTAssertTrue(finger.outCircle === outCircle)
        XCTAssertFalse(finger.isTouchingScreen)
        XCTAssertEqual(finger.radianNew, finger.radianPrev)
        XCTAssertNil(finger.getTouchedPort())
        XCTAssertNil(finger.getHoveredPort())
    }
    
    func testHandleMouseEvents() {
        finger.adjustToScreenSize(500)
        finger.touchEvent(point: CGPoint(x: 100, y: 200))
        XCTAssertEqual(finger.point, CGPoint(x: 100, y: 200))
        XCTAssertEqual(finger.touchPoint, CGPoint(x: 100, y: 200))
        XCTAssertTrue(finger.isTouchingScreen)
        finger.moveEvent(point: CGPoint(x: 110, y: 200))
        XCTAssertEqual(finger.point, CGPoint(x: 110, y: 200))
        XCTAssertEqual(finger.touchPoint, CGPoint(x: 100, y: 200))
        XCTAssertTrue(finger.isTouchingScreen)
        finger.releaseEvent(point: CGPoint(x: 110, y: 200))
        XCTAssertEqual(finger.point, CGPoint(x: 110, y: 200))
        XCTAssertEqual(finger.touchPoint, CGPoint(x: 100, y: 200))
        XCTAssertFalse(finger.isTouchingScreen)
    }
    
    func testSetGetPorts() {
        XCTAssertNil(finger.getTouchedPort())
        XCTAssertNil(finger.getHoveredPort())
        let tPort = inCircle.arcs[0].ports[0]
        touchedPort = tPort
        XCTAssertTrue(finger.getTouchedPort() === tPort)
        XCTAssertNil(finger.getHoveredPort())
        let hPort = outCircle.arcs[0].ports[0]
        hoveredPort = hPort
        XCTAssertTrue(finger.getTouchedPort() === tPort)
        XCTAssertTrue(finger.getHoveredPort() === hPort)
        finger.setTouchedPort(hPort)
        finger.setHoveredPort(tPort)
        XCTAssertTrue(finger.getTouchedPort() === hPort)
        XCTAssertTrue(finger.getHoveredPort() === tPort)
        finger.setTouchedPort(nil)
        finger.setHoveredPort(nil)
        XCTAssertNil(finger.getTouchedPort())
        XCTAssertNil(finger.getHoveredPort())
    }
    
    func testGetMakeDeleteConnections() {
        let inPort = inCircle.arcs[0].ports[0]
        let outPort = outCircle.arcs[0].ports[0]
        inPort.visible = true
        outPort.visible = true
        inPort.sizeScaler = 1.0
        outPort.sizeScaler = 1.0
        let conn = Connection(input: inPort, output: outPort)
        let connName = conn.name!
        XCTAssertNil(connections[connName])
        XCTAssertNil(finger.getConnections()[connName])
        connections[connName] = conn
        XCTAssertTrue(connections[connName] === conn)
        XCTAssertTrue(finger.getConnections()[connName] === conn)
        connections.removeValue(forKey: connName)
        XCTAssertNil(connections[connName])
        XCTAssertNil(finger.getConnections()[connName])
        finger.setTouchedPort(inPort)
        finger.setHoveredPort(outPort)
        XCTAssertTrue(finger.getTouchedPort() === inPort)
        XCTAssertTrue(finger.getHoveredPort() === outPort)
        finger.makeConnection()
        XCTAssertNotNil(connections[connName])
        XCTAssertNotNil(finger.getConnections()[connName])
        let newConn = finger.getConnections()[connName]!
        finger.deleteConnection(newConn)
        XCTAssertNil(connections[connName])
        XCTAssertNil(finger.getConnections()[connName])
        finger.setTouchedPort(inPort)
        finger.setHoveredPort(outPort)
        XCTAssertTrue(finger.getTouchedPort() === inPort)
        XCTAssertTrue(finger.getHoveredPort() === outPort)
        finger.makeConnection()
        XCTAssertNotNil(connections[connName])
        XCTAssertNotNil(finger.getConnections()[connName])
        let touchedConn = finger.getConnections()[connName]!
        touchedConn.radius = 10
        finger.point = CGPoint(x: 110, y: 110)
        touchedConn.point = CGPoint(x: 10, y: 10)
        XCTAssertFalse(finger.deleteConnectionIfTouched())
        XCTAssertNotNil(connections[connName])
        XCTAssertNotNil(finger.getConnections()[connName])
        finger.point = CGPoint(x: 10, y: 10)
        touchedConn.point = CGPoint(x: 10, y: 10)
        XCTAssertFalse(finger.deleteConnectionIfTouched())
        XCTAssertNotNil(connections[connName])
        XCTAssertNotNil(finger.getConnections()[connName])
        touchedConn.selected = true
        XCTAssertTrue(finger.deleteConnectionIfTouched())
        XCTAssertNil(connections[connName])
        XCTAssertNil(finger.getConnections()[connName])
    }
    
    func testUpdateDrawWithoutBreaking() {
        finger.adjustToScreenSize(500)
        finger.update()
        finger.draw(context)
        finger.touchEvent(point: CGPoint(x: 100, y: 200))
        finger.moveEvent(point: CGPoint(x: 110, y: 200))
        finger.update()
        finger.draw(context)
        finger.setTouchedPort(inCircle.arcs[0].ports[0])
        finger.update()
        finger.draw(context)
        finger.setHoveredPort(outCircle.arcs[0].ports[0])
        finger.update()
        finger.draw(context)
        finger.releaseEvent(point: CGPoint(x: 110, y: 200))
        finger.update()
        finger.draw(context)
        XCTAssertNil(finger.getTouchedPort())
        XCTAssertNil(finger.getHoveredPort())
    }
}
