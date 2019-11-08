//
//  patchbayTest.swift
//  patchbay-uiTests
//
//  Created by Andy on 11/8/19.
//  Copyright © 2019 Andy. All rights reserved.
//

import XCTest
@testable import class patchbay_ui.Patchbay
@testable import class patchbay_ui.Connection

class patchbayTest: XCTestCase {
    
    var patchbay: Patchbay!

    var context: CGContext!

    override func setUp() {
        super.setUp()
        let contextSize = CGSize(width: 400, height: 400)
        UIGraphicsBeginImageContextWithOptions(
            contextSize, false, 0.0)
        context = UIGraphicsGetCurrentContext()!
        patchbay = Patchbay()
        patchbay.setSize(contextSize)
    }

    override func tearDown() {
        super.tearDown()
    }
    
    func testCreatedWithoutBreaking() {
        XCTAssertNotNil(patchbay)
        XCTAssertEqual(patchbay.inCircle.type, Type.input)
        XCTAssertEqual(patchbay.outCircle.type, Type.output)
        XCTAssertTrue(patchbay.inCircle === patchbay.finger.inCircle)
        XCTAssertTrue(patchbay.outCircle === patchbay.finger.outCircle)
    }
    
    func testSetSize() {
        XCTAssertEqual(patchbay.size, CGSize(width: 400, height: 400))
        XCTAssertEqual(patchbay.screenSize, 400)
        XCTAssertTrue(patchbay.inCircle.point.x < 200)
        XCTAssertTrue(patchbay.inCircle.point.y < 200)
        XCTAssertTrue(patchbay.outCircle.point.x > 200)
        XCTAssertTrue(patchbay.outCircle.point.y > 200)
    }
    
    func testAddNode() {
        patchbay.addNode(
            id: "thisID", name: "thisName",
            inputs: [
                "thisInId1": "thisInName1",
                "thisInId2": "thisInName2"
            ],
            outputs: [
                "thisOutId1": "thisOutName1",
                "thisOutId2": "thisOutName2"
            ])
        patchbay.addNode(
            id: "thatID", name: "thatName",
            outputs: [
                "thatOutId1": "thatOutName1"
            ])
        patchbay.addNode(
            id: "otherID", name: "otherName",
            inputs: [
                "otherInId1": "otherInName1"
            ])
        XCTAssertEqual(patchbay.inCircle.arcs.count, 3)
        XCTAssertEqual(patchbay.outCircle.arcs.count, 3)
        XCTAssertEqual(patchbay.inCircle.arcs[0].id, "thisID")
        XCTAssertEqual(patchbay.outCircle.arcs[0].id, "thisID")
        XCTAssertEqual(patchbay.inCircle.arcs[0].name, "thisName")
        XCTAssertEqual(patchbay.outCircle.arcs[0].name, "thisName")
        XCTAssertEqual(patchbay.inCircle.arcs[0].ports.count, 2)
        XCTAssertEqual(patchbay.outCircle.arcs[0].ports.count, 2)
        XCTAssertEqual(patchbay.inCircle.arcs[0].ports[0].id, "thisInId1")
        XCTAssertEqual(patchbay.outCircle.arcs[0].ports[0].id, "thisOutId1")
        XCTAssertEqual(patchbay.inCircle.arcs[0].ports[1].id, "thisInId2")
        XCTAssertEqual(patchbay.outCircle.arcs[0].ports[1].id, "thisOutId2")
        XCTAssertEqual(patchbay.inCircle.arcs[1].id, "thatID")
        XCTAssertEqual(patchbay.outCircle.arcs[1].id, "thatID")
        XCTAssertEqual(patchbay.inCircle.arcs[1].name, "thatName")
        XCTAssertEqual(patchbay.outCircle.arcs[1].name, "thatName")
        XCTAssertEqual(patchbay.inCircle.arcs[1].ports.count, 0)
        XCTAssertEqual(patchbay.outCircle.arcs[1].ports.count, 1)
        XCTAssertEqual(patchbay.outCircle.arcs[1].ports[0].id, "thatOutId1")
        XCTAssertEqual(patchbay.inCircle.arcs[2].id, "otherID")
        XCTAssertEqual(patchbay.outCircle.arcs[2].id, "otherID")
        XCTAssertEqual(patchbay.inCircle.arcs[2].name, "otherName")
        XCTAssertEqual(patchbay.outCircle.arcs[2].name, "otherName")
        XCTAssertEqual(patchbay.inCircle.arcs[2].ports.count, 1)
        XCTAssertEqual(patchbay.outCircle.arcs[2].ports.count, 0)
        XCTAssertEqual(patchbay.inCircle.arcs[2].ports[0].id, "otherInId1")
    }
    
    func testCreateDeleteConnections() {
        patchbay.addNode(
            id: "thisID", name: "thisName",
            inputs: [
                "thisInId1": "thisInName1",
                "thisInId2": "thisInName2"
            ],
            outputs: [
                "thisOutId1": "thisOutName1",
                "thisOutId2": "thisOutName2"
            ])
        patchbay.setTouchedPort(patchbay.inCircle.arcs[0].ports[0])
        patchbay.setHoveredPort(patchbay.inCircle.arcs[0].ports[1])
        var connName = Connection.generateName(
            input: patchbay.touchedPort!,
            output: patchbay.hoveredPort!)
        XCTAssertTrue(patchbay.touchedPort === patchbay.inCircle.arcs[0].ports[0])
        XCTAssertTrue(patchbay.hoveredPort === patchbay.inCircle.arcs[0].ports[1])
        XCTAssertNil(patchbay.connections[connName])
        patchbay.makeConnection()
        XCTAssertNil(patchbay.connections[connName])
        patchbay.setTouchedPort(patchbay.inCircle.arcs[0].ports[0])
        patchbay.setHoveredPort(patchbay.outCircle.arcs[0].ports[0])
        connName = Connection.generateName(
            input: patchbay.touchedPort!,
            output: patchbay.hoveredPort!)
        XCTAssertTrue(patchbay.touchedPort === patchbay.inCircle.arcs[0].ports[0])
        XCTAssertTrue(patchbay.hoveredPort === patchbay.outCircle.arcs[0].ports[0])
        XCTAssertNil(patchbay.connections[connName])
        patchbay.makeConnection()
        XCTAssertNotNil(patchbay.connections[connName])
        patchbay.deleteConnection(patchbay.connections[connName]!)
        XCTAssertNil(patchbay.connections[connName])
    }
    
    func testUpdateDrawWithoutBreaking() {
        patchbay.update(1 / 20)
        patchbay.draw(context)
        patchbay.addNode(
            id: "thisID", name: "thisName",
            inputs: [
                "thisInId1": "thisInName1",
                "thisInId2": "thisInName2"
            ],
            outputs: [
                "thisOutId1": "thisOutName1",
                "thisOutId2": "thisOutName2"
            ])
        patchbay.addNode(
            id: "thatID", name: "thatName",
            outputs: [
                "thatOutId1": "thatOutName1"
            ])
        patchbay.addNode(
            id: "otherID", name: "otherName",
            inputs: [
                "otherInId1": "otherInName1"
            ])
        patchbay.update(1 / 20)
        patchbay.draw(context)
        patchbay.setTouchedPort(patchbay.inCircle.arcs[0].ports[0])
        patchbay.setHoveredPort(patchbay.outCircle.arcs[0].ports[0])
        patchbay.makeConnection()
        patchbay.update(1 / 20)
        patchbay.draw(context)
        for (_, conn) in patchbay.connections {
            patchbay.deleteConnection(conn)
        }
        patchbay.update(1 / 20)
        patchbay.draw(context)
    }
}
