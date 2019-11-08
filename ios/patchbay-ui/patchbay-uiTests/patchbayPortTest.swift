//
//  patchbayPortTest.swift
//  patchbay-uiTests
//
//  Created by Andy on 11/6/19.
//  Copyright © 2019 Andy. All rights reserved.
//

import XCTest
@testable import class patchbay_ui.Arc
@testable import class patchbay_ui.Circle
@testable import class patchbay_ui.Port

class patchbayPortTest: XCTestCase {

    var inCircle: patchbay_ui.Circle!
    var outCircle: patchbay_ui.Circle!
    var inArc: patchbay_ui.Arc!
    var outArc: patchbay_ui.Arc!
    var inPort: patchbay_ui.Port!
    var outPort: patchbay_ui.Port!
    
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
            getTouchedPort: {() in self.touchedPort },
            getHoveredPort: {() in self.hoveredPort })
        outCircle = Circle(
            Type.output, 0.5, 0.1,
            getTouchedPort: {() in self.touchedPort },
            getHoveredPort: {() in self.hoveredPort })
        inArc = Arc(parent: inCircle, type: Type.input, id: "inArcID", name: "inArcName", color: Colors.black(),
            getTouchedPort: {() in self.touchedPort },
            getHoveredPort: {() in self.hoveredPort })
        outArc = Arc(parent: outCircle, type: Type.output, id: "outArcID", name: "outArcName", color: Colors.black(),
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
    }

    override func tearDown() {
        super.tearDown()
    }
    
    func inPortCreation() {
        XCTAssertEqual(inPort.color, Colors.black())
        XCTAssertEqual(inPort.outlineColor, Colors.background())
        XCTAssertEqual(inPort.highlightedColor, Colors.white())
        XCTAssertEqual(inPort.type, Type.input)
        XCTAssertEqual(inPort.id, "inputID")
    }
    
    func inPortAdjustToScreenSize() {
        inPort.adjustToScreenSize(
            radius: 30, width: 10, point: CGPoint(x: 100, y: 100))
        XCTAssertEqual(inPort.parentRadius, 30)
        XCTAssertEqual(inPort.parentWidth, 10)
        XCTAssertEqual(inPort.parentPoint, CGPoint(x: 100, y: 100))
        inPort.adjustToScreenSize(
            radius: 10, width: 15, point: CGPoint(x: 200, y: 300))
        XCTAssertEqual(inPort.parentRadius, 10)
        XCTAssertEqual(inPort.parentWidth, 15)
        XCTAssertEqual(inPort.parentPoint, CGPoint(x: 200, y: 300))
    }
    
    func testUpdateVisibilityAndScale() {
        inPort.adjustToScreenSize(
            radius: 30, width: 10, point: CGPoint(x: 100, y: 100))
        inPort.update(
            0.1, sizeScaler: 1.0, radLocation: 0.0, isVisible: true)
        XCTAssertEqual(inPort.sizeScaler, 1.0)
        XCTAssertEqual(inPort.visible, true)
        inPort.update(
            0.1, sizeScaler: 0.8, radLocation: 0.0, isVisible: true)
        XCTAssertEqual(inPort.sizeScaler, 0.8)
        XCTAssertEqual(inPort.visible, true)
        inPort.update(
            0.1, sizeScaler: 1.0, radLocation: 0.0, isVisible: false)
        XCTAssertEqual(inPort.sizeScaler, 0.0)
        XCTAssertEqual(inPort.visible, false)
        inPort.update(
            0.1, sizeScaler: 0.0, radLocation: 0.0, isVisible: false)
        XCTAssertEqual(inPort.sizeScaler, 0.0)
        XCTAssertEqual(inPort.visible, false)
        inPort.update(
            0.1, sizeScaler: 0.0, radLocation: 0.0, isVisible: true)
        XCTAssertEqual(inPort.sizeScaler, 0.0)
        XCTAssertEqual(inPort.visible, false)
        inPort.update(
            0.1, sizeScaler: 0.05, radLocation: 0.0, isVisible: true)
        XCTAssertEqual(inPort.sizeScaler, 0.0)
        XCTAssertEqual(inPort.visible, false)
    }
    
    func testUpdateAbsoluteXYPosition() {
        inPort.adjustToScreenSize(
            radius: 30, width: 10, point: CGPoint(x: 100, y: 100))
        inPort.update(
            0.1, sizeScaler: 1.0, radLocation: 0.0, isVisible: true)
        XCTAssertEqual(inPort.point, CGPoint(x: 130, y: 100))
        inPort.update(
            0.1, sizeScaler: 1.0, radLocation: Math.PI, isVisible: true)
        XCTAssertEqual(inPort.point, CGPoint(x: 70, y: 100))
        inPort.update(
            0.1, sizeScaler: 1.0, radLocation: Math.PI * 0.5, isVisible: true)
        XCTAssertEqual(inPort.point, CGPoint(x: 100, y: 130))
        inPort.update(
            0.1, sizeScaler: 1.0, radLocation: Math.PI * 1.5, isVisible: true)
        XCTAssertEqual(inPort.point, CGPoint(x: 100, y: 70))
    }
    
    func testCanDrawWithoutBreaking() {
        inPort.adjustToScreenSize(
            radius: 30, width: 10, point: CGPoint(x: 100, y: 100))
        inPort.update(
            0.1, sizeScaler: 1.0, radLocation: 0.0, isVisible: true)
        inPort.draw(context)
        inPort.drawName(context)
    }
    
    func testKnowsWhenItIsTouched() {
        XCTAssertEqual(inPort.isTouched(), false)
        touchedPort = inPort
        XCTAssertEqual(inPort.isTouched(), true)
        touchedPort = nil
        XCTAssertEqual(inPort.isTouched(), false)
    }
    
    func testKnowsWhenItIsHovered() {
        XCTAssertEqual(inPort.isHovered(), false)
        hoveredPort = inPort
        XCTAssertEqual(inPort.isHovered(), true)
        hoveredPort = nil
        XCTAssertEqual(inPort.isHovered(), false)
    }
    
    func testKnowsWhenItIsPotentialInput() {
        XCTAssertEqual(inPort.type, Type.input)
        XCTAssertEqual(outPort.type, Type.output)
        XCTAssertEqual(inPort.isPotentialConnection(), false)
        touchedPort = outPort
        XCTAssertEqual(inPort.isPotentialConnection(), true)
        touchedPort = inPort
        XCTAssertEqual(inPort.isPotentialConnection(), false)
        touchedPort = nil
        XCTAssertEqual(inPort.isPotentialConnection(), false)
    }
    
    func testKnowsWhenUserIsTouchingIt() {
        inPort.adjustToScreenSize(
            radius: 30, width: 10, point: CGPoint(x: 100, y: 100))
        inPort.update(
            0.1, sizeScaler: 1.0, radLocation: 0.0, isVisible: true)
        XCTAssertEqual(inPort.point, CGPoint(x: 130, y: 100))
        XCTAssertEqual(inPort.visible, true)
        XCTAssertEqual(inPort.sizeScaler, 1.0)
        XCTAssertEqual(inPort.parentWidth, 10)
        XCTAssertEqual(inPort.radius, 5)
        XCTAssertEqual(inPort.isUserTouching(point: CGPoint(x: 130, y: 100)), true)
        XCTAssertEqual(inPort.isUserTouching(point: CGPoint(x: 134, y: 100)), true)
        XCTAssertEqual(inPort.isUserTouching(point: CGPoint(x: 135, y: 100)), false)
    }
}
