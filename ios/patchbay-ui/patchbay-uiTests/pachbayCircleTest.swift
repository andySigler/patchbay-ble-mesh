//
//  pachbayCircleTest.swift
//  patchbay-uiTests
//
//  Created by Andy on 11/8/19.
//  Copyright © 2019 Andy. All rights reserved.
//

import XCTest
@testable import class patchbay_ui.Circle
@testable import class patchbay_ui.Port

class pachbayCircleTest: XCTestCase {

    var inCircle: patchbay_ui.Circle!
    
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
            Type.input, 0.2, 0.1,
            getTouchedPort: {() in self.touchedPort },
            getHoveredPort: {() in self.hoveredPort })
    }

    override func tearDown() {
        super.tearDown()
    }

    func testCanBeCreated() {
        XCTAssertEqual(inCircle.type, Type.input)
    }
    
    func testCanCreateArcs() {
        let arc = inCircle.createArc(
            id: "someID", name: "someName", color: Colors.black())
        XCTAssertEqual(arc.id, "someID")
        XCTAssertEqual(arc.type, Type.input)
        XCTAssertTrue(arc.parent === inCircle)
        XCTAssertEqual(inCircle.arcs.count, 0)
        inCircle.addArc(arc: arc)
        XCTAssertEqual(inCircle.arcs.count, 1)
        inCircle.addArc(
            arc: inCircle.createArc(
                id: "thatID",
                name: "thatName",
                color: Colors.white()))
        XCTAssertEqual(inCircle.arcs.count, 2)
    }
    
    func testCanDeleteArcs() {
        XCTAssertEqual(inCircle.arcs.count, 0)
        let arc1 = inCircle.createArc(
            id: "thisID", name: "thisName", color: Colors.white())
        let arc2 = inCircle.createArc(
            id: "thatID", name: "thatName", color: Colors.white())
        let arc3 = inCircle.createArc(
            id: "otherID", name: "otherName", color: Colors.white())
        inCircle.addArc(arc: arc1)
        inCircle.addArc(arc: arc2)
        XCTAssertEqual(inCircle.arcs.count, 2)
        inCircle.deleteArc(arc: arc1)
        XCTAssertEqual(inCircle.arcs.count, 1)
        inCircle.deleteArc(arc: arc3)
        XCTAssertEqual(inCircle.arcs.count, 1)
        inCircle.deleteArc(arc: arc2)
        XCTAssertEqual(inCircle.arcs.count, 0)
    }
    
    func testKnowsItHoldsTouchedPort() {
        let arc = inCircle.createArc(
            id: "thisID", name: "thisName", color: Colors.white())
        let port = arc.createPort(id: "portID", name: "portName")
        arc.addPort(port: port)
        inCircle.addArc(arc: arc)
        XCTAssertFalse(inCircle.holdsTouchedPort())
        touchedPort = port
        XCTAssertTrue(inCircle.holdsTouchedPort())
    }
    
    func testUpdateDrawWithoutBreaking() {
        inCircle.adjustToScreenSize(screenSize: 400)
        inCircle.update(0.1)
        inCircle.draw(context)
        let arc1 = inCircle.createArc(
            id: "thisID", name: "thisName", color: Colors.white())
        let arc2 = inCircle.createArc(
            id: "thatID", name: "thatName", color: Colors.white())
        inCircle.addArc(arc: arc1)
        inCircle.addArc(arc: arc2)
        inCircle.update(0.1)
        inCircle.draw(context)
    }
    
    func testKnowsItIsInteractedWidth() {
        inCircle.point = CGPoint(x: 400, y: 400)
        inCircle.adjustToScreenSize(screenSize: 800)
        XCTAssertFalse(
            inCircle.isCloseTo(point: CGPoint(x: 400, y: 400)))
        XCTAssertFalse(
            inCircle.isCloseTo(point: CGPoint(x: 519, y: 400)))
        XCTAssertTrue(
            inCircle.isCloseTo(point: CGPoint(x: 560, y: 400)))
        XCTAssertTrue(
            inCircle.isCloseTo(point: CGPoint(x: 521, y: 400)))
    }
}
