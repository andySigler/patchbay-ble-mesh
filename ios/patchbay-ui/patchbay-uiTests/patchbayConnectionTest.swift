//
//  patchbayConnectionTest.swift
//  patchbay-uiTests
//
//  Created by Andy on 11/7/19.
//  Copyright © 2019 Andy. All rights reserved.
//

import XCTest
@testable import class patchbay_ui.Arc
@testable import class patchbay_ui.Circle
@testable import class patchbay_ui.Connection
@testable import class patchbay_ui.Port

class patchbayConnectionTest: XCTestCase {
    
    var inCircle: patchbay_ui.Circle!
    var outCircle: patchbay_ui.Circle!
    var inArc: patchbay_ui.Arc!
    var outArc: patchbay_ui.Arc!
    var inPort: patchbay_ui.Port!
    var outPort: patchbay_ui.Port!
    
    var touchedPort: patchbay_ui.Port? = nil
    var hoveredPort: patchbay_ui.Port? = nil
    
    var testConnection: patchbay_ui.Connection! = nil
    
    var context: CGContext!

    override func setUp() {
        super.setUp()
        let contextSize = CGSize(width: 400, height: 400)
        UIGraphicsBeginImageContextWithOptions(
            contextSize, false, 0.0)
        context = UIGraphicsGetCurrentContext()!
        touchedPort = nil
        hoveredPort = nil
        inCircle = Circle(
            Type.input, 0.5, 0.1,
            getTouchedPort: {() in self.touchedPort },
            getHoveredPort: {() in self.hoveredPort })
        outCircle = Circle(
            Type.output, 0.5, 0.1,
            getTouchedPort: {() in self.touchedPort },
            getHoveredPort: {() in self.hoveredPort })
        inArc = Arc(
            parent: inCircle, type: Type.input,
            id: "inArcID", name: "inArcName",
            color: Colors.black(),
            getTouchedPort: {() in self.touchedPort },
            getHoveredPort: {() in self.hoveredPort })
        outArc = Arc(
            parent: outCircle, type: Type.output,
            id: "outArcID", name: "outArcName",
            color: Colors.black(),
            getTouchedPort: {() in self.touchedPort },
            getHoveredPort: {() in self.hoveredPort })
        inPort = Port(
            parent: inArc, type: Type.input,
            id: "inputID", name: "inputName",
            color: Colors.black(),
            getTouchedPort: {() in self.touchedPort },
            getHoveredPort: {() in self.hoveredPort })
        outPort = Port(
            parent: outArc, type: Type.output,
            id: "outputID", name: "outputName",
            color: Colors.black(),
            getTouchedPort: {() in self.touchedPort },
            getHoveredPort: {() in self.hoveredPort })
        testConnection = Connection(input: inPort, output: outPort)
    }

    override func tearDown() {
        super.tearDown()
    }
    
    func testCanBeCreated() {
        XCTAssertEqual(testConnection.input.id, inPort.id)
        XCTAssertEqual(testConnection.output.id, outPort.id)
    }
    
    func testCanGenerateNamesFromPorts() {
        XCTAssertEqual(
            Connection.generateName(input: inPort, output: outPort),
            "inArcID/inputID->outArcID/outputID")
        inPort.id = "thisID"
        outPort.id = "thatID"
        XCTAssertEqual(
            Connection.generateName(input: inPort, output: outPort),
            "inArcID/thisID->outArcID/thatID")
    }
    
    func testVisibleFlag() {
        testConnection.adjustToScreenSize(screenSize: 400)
        inPort.visible = false
        outPort.visible = false
        testConnection.update(0.1)
        XCTAssertEqual(testConnection.visible, false)
        inPort.visible = true
        outPort.visible = false
        testConnection.update(0.1)
        XCTAssertEqual(testConnection.visible, false)
        inPort.visible = false
        outPort.visible = true
        testConnection.update(0.1)
        XCTAssertEqual(testConnection.visible, false)
        inPort.visible = true
        outPort.visible = true
        testConnection.update(0.1)
        XCTAssertEqual(testConnection.visible, true)
    }
    
    func testSizeScaler() {
        testConnection.adjustToScreenSize(screenSize: 400)
        inPort.visible = true
        outPort.visible = true
        inPort.sizeScaler = 0.0
        outPort.sizeScaler = 0.0
        testConnection.update(0.1)
        XCTAssertEqual(testConnection.sizeScaler, 0.0)
        inPort.sizeScaler = 0.0
        outPort.sizeScaler = 1.0
        testConnection.update(0.1)
        XCTAssertEqual(testConnection.sizeScaler, 0.0)
        inPort.sizeScaler = 1.0
        outPort.sizeScaler = 0.0
        testConnection.update(0.1)
        XCTAssertEqual(testConnection.sizeScaler, 0.0)
        inPort.sizeScaler = 0.3
        outPort.sizeScaler = 0.32
        testConnection.update(0.1)
        XCTAssertEqual(testConnection.sizeScaler, 0.3)
    }
    
    func testUpdateVariables() {
        testConnection.adjustToScreenSize(screenSize: 400)
        inPort.visible = true
        outPort.visible = true
        inPort.sizeScaler = 1.0
        outPort.sizeScaler = 1.0
        testConnection.update(0.1)
        XCTAssertEqual(testConnection.sizeScaler, 1.0)
        XCTAssertEqual(testConnection.visible, true)
        XCTAssertGreaterThan(testConnection.lineWidth, 0.0)
        outPort.sizeScaler = 0.0
        testConnection.update(0.1)
        XCTAssertEqual(testConnection.sizeScaler, 0.0)
        XCTAssertEqual(testConnection.visible, true)
        XCTAssertEqual(testConnection.lineWidth, 0.0)
    }
    
    func testUpdateVariablesWhileSelected() {
        testConnection.adjustToScreenSize(screenSize: 400)
        inPort.visible = true
        outPort.visible = true
        inPort.sizeScaler = 1.0
        outPort.sizeScaler = 1.0
        inPort.point = CGPoint(x: 20, y: 20)
        outPort.point = CGPoint(x: 60, y: 100)
        testConnection.selected = true
        testConnection.update(0.1)
        XCTAssertEqual(testConnection.sizeScaler, 1.0)
        XCTAssertEqual(testConnection.visible, true)
        XCTAssertGreaterThan(testConnection.lineWidth, 0.0)
        XCTAssertEqual(testConnection.point, CGPoint(x: 40, y: 60))
        XCTAssertGreaterThan(testConnection.wobbledRadius, 0.0)
        XCTAssertGreaterThan(testConnection.crossSignRadius, 0.0)
        XCTAssertGreaterThan(testConnection.crossSignThickness, 0.0)
    }
    
    func testCanDrawWithoutBreaking() {
        testConnection.adjustToScreenSize(screenSize: 400)
        inPort.visible = true
        outPort.visible = true
        inPort.sizeScaler = 0.0
        outPort.sizeScaler = 1.0
        testConnection.selected = false
        testConnection.update(0.1)
        testConnection.draw(context)
        inPort.sizeScaler = 1.0
        outPort.sizeScaler = 1.0
        testConnection.selected = false
        testConnection.update(0.1)
        testConnection.draw(context)
        outPort.sizeScaler = 1.0
        testConnection.selected = true
        testConnection.update(0.1)
        testConnection.draw(context)
    }
    
    func testCanDetectUserTouching() {
        testConnection.adjustToScreenSize(screenSize: 400)
        inPort.visible = true
        outPort.visible = true
        inPort.sizeScaler = 1.0
        outPort.sizeScaler = 1.0
        inPort.point = CGPoint(x: 20, y: 20)
        outPort.point = CGPoint(x: 60, y: 100)
        testConnection.selected = true
        testConnection.update(0.1)
        XCTAssertEqual(
            testConnection.point, CGPoint(x: 40, y: 60))
        XCTAssertEqual(
            testConnection.isUserTouching(point: CGPoint(x: 40, y: 60)),
            true)
        XCTAssertEqual(
            testConnection.isUserTouching(point: CGPoint(x: 60, y: 40)),
            false)
        testConnection.selected = false
        XCTAssertEqual(
            testConnection.isUserTouching(point: CGPoint(x: 40, y: 60)),
            false)
    }
}
