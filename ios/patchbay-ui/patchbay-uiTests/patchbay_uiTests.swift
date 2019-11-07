//
//  patchbay_uiTests.swift
//  patchbay-uiTests
//
//  Created by Andy on 11/5/19.
//  Copyright © 2019 Andy. All rights reserved.
//

import XCTest
@testable import class patchbay_ui.Type
@testable import class patchbay_ui.Math
@testable import class patchbay_ui.Draw

class patchbayUtilsTest: XCTestCase {
    
    var context: CGContext!

    override func setUp() {
        super.setUp()
        let contextSize = CGSize(width: 400, height: 400)
        UIGraphicsBeginImageContextWithOptions(contextSize, false, 0.0)
        context = UIGraphicsGetCurrentContext()!
    }

    override func tearDown() {
        context = nil
        super.tearDown()
    }
    
    func testTypes() {
        XCTAssertEqual(Type.input, "in")
        XCTAssertEqual(Type.output, "out")
        XCTAssertEqual(Type.touch, "touch")
        XCTAssertEqual(Type.move, "move")
        XCTAssertEqual(Type.release, "release")
    }
    
    func testMathPI() {
        XCTAssertEqual(Math.PI, CGFloat.pi)
        XCTAssertEqual(Math.PI2, CGFloat.pi * 2)
    }
    
    func testMathClip() {
        XCTAssertEqual(Math.clip(10), 10)
        XCTAssertEqual(Math.clip(10, min: 5), 10)
        XCTAssertEqual(Math.clip(4, min: 5), 5)
        XCTAssertEqual(Math.clip(10, max: 12), 10)
        XCTAssertEqual(Math.clip(10, max: 5), 5)
        XCTAssertEqual(Math.clip(0.5, min: 0, max: 1), 0.5)
        XCTAssertEqual(Math.clip(-0.5, min: 0, max: 1), 0.0)
        XCTAssertEqual(Math.clip(1.5, min: 0, max: 1), 1.0)
    }
    
    func testMathDistance() {
        XCTAssertEqual(
            Math.distance(CGPoint(x: 0, y: 0), CGPoint(x: 0, y: 10)),
            10
        )
        XCTAssertEqual(
            Math.distance(CGPoint(x: 10, y: 0), CGPoint(x: 0, y: 0)),
            10
        )
        XCTAssertEqual(
            Math.distance(CGPoint(x: 0, y: 0), CGPoint(x: 1, y: 1)),
            CGFloat(2).squareRoot()
        )
    }
    
    func testColors() {
        XCTAssertEqual(
            Colors.white(),
            CGColor(srgbRed: 1.0, green: 1.0, blue: 1.0, alpha: 1.0)
        )
        XCTAssertEqual(
            Colors.black(),
            CGColor(srgbRed: 0.0, green: 0.0, blue: 0.0, alpha: 1.0)
        )
        XCTAssertEqual(
            Colors.black().copy(alpha: 0.1),
            CGColor(srgbRed: 0.0, green: 0.0, blue: 0.0, alpha: 0.1)
        )
        XCTAssertGreaterThan(Colors.palette.count, 0)
    }

    func testDrawLines() {
        Draw.line(
            context,
            from: CGPoint(x: 399, y: 0), to: CGPoint(x: 0, y: 399),
            width: 1, color: Colors.black()
        )
        Draw.line(context, 0, 0, 399, 399, width: 1, color: Colors.black())
    }
    
    func testDrawCircles() {
        Draw.circle(
            context,
            CGPoint(x: 200, y: 200), radius: 50,
            fill: Colors.black(), width: 2, stroke: Colors.white()
        )
        Draw.circle(
            context,
            200, 200, radius: 50,
            fill: Colors.black(), width: 2, stroke: Colors.white()
        )
    }
    
    func testDrawRectangles() {
        Draw.rect(
            context,
            CGRect(x: 10, y: 10, width: 100, height: 100),
            fill: Colors.black(), width: 2, stroke: Colors.white()
        )
    }
    
    func testDrawBackground() {
        Draw.background(context, 400, 400, Colors.white())
    }
    
    func testDrawText() {
        Draw.textLeft(context, "test", x: 10, y: 10, size: 14, color: Colors.white())
        Draw.textCenter(context, "test", x: 10, y: 30, size: 14, color: Colors.white(), bold: true)
        Draw.textRight(context, "test", x: 10, y: 50, size: 14, color: Colors.white())
    }
}
