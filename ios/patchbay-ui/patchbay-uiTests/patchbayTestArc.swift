//
//  patchbayTestArc.swift
//  patchbay-uiTests
//
//  Created by Andy on 11/7/19.
//  Copyright © 2019 Andy. All rights reserved.
//

import XCTest
@testable import class patchbay_ui.Arc
@testable import class patchbay_ui.Circle
@testable import class patchbay_ui.Port

class patchbayTestArc: XCTestCase {
        
    var inCircle: patchbay_ui.Circle!
    var outCircle: patchbay_ui.Circle!
    var inArc: patchbay_ui.Arc!
    var outArc: patchbay_ui.Arc!
    
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
        inCircle = Circle(
            Type.input, 0.5, 0.1,
            touchedPort: {() in self.touchedPort },
            hoveredPort: {() in self.hoveredPort })
        outCircle = Circle(
            Type.output, 0.5, 0.1,
            touchedPort: {() in self.touchedPort },
            hoveredPort: {() in self.hoveredPort })
        inArc = Arc(
            parent: inCircle, type: Type.input,
            id: "inArcID", name: "inArcName",
            color: Colors.black(),
            touchedPort: {() in self.touchedPort },
            hoveredPort: {() in self.hoveredPort })
        outArc = Arc(
            parent: outCircle, type: Type.output,
            id: "outArcID", name: "outArcName",
            color: Colors.black(),
            touchedPort: {() in self.touchedPort },
            hoveredPort: {() in self.hoveredPort })
    }

    override func tearDown() {
        super.tearDown()
    }
    
    func testCanBeCreated() {
        XCTAssertEqual(inArc.ports.count, 0)
        XCTAssertEqual(inArc.id, "inArcID")
    }
    
    func testCanHavePortsAdded() {
        XCTAssertEqual(inArc.ports.count, 0)
        let port = inArc.createPort(id: "someID", name: "someName")
        inArc.addPort(port: port)
        XCTAssertEqual(inArc.ports.count, 1)
    }
    
    func testCanTellIfItShouldDrawAGutter() {
        XCTAssertEqual(inArc.ports.count, 0)
        XCTAssertEqual(inArc.shouldDrawGutter, false)
        let port = inArc.createPort(id: "someID", name: "someName")
        inArc.addPort(port: port)
        XCTAssertEqual(inArc.ports.count, 1)
        XCTAssertEqual(inArc.type, Type.input)
        XCTAssertEqual(inArc.shouldDrawGutter, true)
        inArc.type = Type.output
        let port2 = inArc.createPort(id: "otherID", name: "otherName")
        inArc.addPort(port: port2)
        XCTAssertEqual(inArc.ports.count, 2)
        XCTAssertEqual(inArc.type, Type.output)
        XCTAssertEqual(inArc.shouldDrawGutter, false)
    }
    
    func testReturnsTheIndexOfAPort() {
        let port = inArc.createPort(id: "someID", name: "someName")
        inArc.addPort(port: port)
        XCTAssertEqual(inArc.getIndexOfPort(port: port), 0)
        let port2 = inArc.createPort(id: "otherID", name: "otherName")
        inArc.addPort(port: port2)
        XCTAssertEqual(inArc.getIndexOfPort(port: port), 0)
        XCTAssertEqual(inArc.getIndexOfPort(port: port2), 1)
        let port3 = inArc.createPort(id: "thisID", name: "thisName")
        XCTAssertNil(inArc.getIndexOfPort(port: port3))
    }
    
    func testCanUpdateWithoutBreaking() {
        inArc.adjustToScreenSize(
            radius: 50, width: 10, point: CGPoint(x: 50, y: 50))
        inArc.update(
            0.1, start: 0, end: Math.PI,
            isSelected: true, sizeScaler: 1.0)
        inArc.update(
            0.1, start: 0, end: Math.PI,
            isSelected: false, sizeScaler: 0.0)
        inArc.update(
            0.1, start: 0, end: Math.PI / 10,
            isSelected: false, sizeScaler: 0.0)
        let port1 = inArc.createPort(id: "someID", name: "someName")
        let port2 = inArc.createPort(id: "otherID", name: "otherName")
        inArc.addPort(port: port1)
        inArc.addPort(port: port2)
        inArc.update(
            0.1, start: 0, end: Math.PI,
            isSelected: true, sizeScaler: 1.0)
        inArc.update(
            0.1, start: 0, end: Math.PI,
            isSelected: false, sizeScaler: 0.0)
        inArc.update(
            0.1, start: 0, end: Math.PI / 10,
            isSelected: false, sizeScaler: 0.0)
    }
    
    func testCanGetUserTouchedPort() {
        let port1 = inArc.createPort(id: "someID", name: "someName")
        let port2 = inArc.createPort(id: "otherID", name: "otherName")
        inArc.addPort(port: port1)
        inArc.addPort(port: port2)
        inArc.adjustToScreenSize(
            radius: 50, width: 10, point: CGPoint(x: 50, y: 50))
        inArc.update(
            0.1, start: 0, end: Math.PI,
            isSelected: true, sizeScaler: 1.0)
        port1.point = CGPoint(x: 10, y: 10)
        port2.point = CGPoint(x: 110, y: 110)
        XCTAssertEqual(
            inArc.getPortTouching(
                point: CGPoint(x: 10, y: 10))!.id,
            port1.id)
        XCTAssertEqual(
            inArc.getPortTouching(
                point: CGPoint(x: 110, y: 110))!.id,
            port2.id)
        inArc.update(
            0.1, start: 0, end: Math.PI,
            isSelected: false, sizeScaler: 0.0)
        XCTAssertNil(
            inArc.getPortTouching(point: CGPoint(x: 10, y: 10)))
        XCTAssertNil(
            inArc.getPortTouching(point: CGPoint(x: 110, y: 110)))
        inArc.update(
            0.1, start: 0, end: Math.PI,
            isSelected: true, sizeScaler: 1.0)
        XCTAssertNil(
            inArc.getPortTouching(point: CGPoint(x: 30, y: 30)))
        XCTAssertNil(
            inArc.getPortTouching(point: CGPoint(x: 130, y: 130)))
    }
    
    func testDrawWithoutBreaking() {
        inArc.adjustToScreenSize(
            radius: 50, width: 10, point: CGPoint(x: 50, y: 50))
        inArc.update(
            0.1, start: 0, end: Math.PI,
            isSelected: true, sizeScaler: 1.0)
        inArc.draw(context)
        inArc.update(
            0.1, start: 0, end: Math.PI,
            isSelected: false, sizeScaler: 0.0)
        inArc.draw(context)
        let port1 = inArc.createPort(id: "someID", name: "someName")
        let port2 = inArc.createPort(id: "otherID", name: "otherName")
        inArc.addPort(port: port1)
        inArc.addPort(port: port2)
        inArc.update(
            0.1, start: 0, end: Math.PI,
            isSelected: true, sizeScaler: 1.0)
        inArc.draw(context)
        inArc.update(
            0.1, start: 0, end: Math.PI,
            isSelected: false, sizeScaler: 0.0)
        inArc.draw(context)
    }
}
