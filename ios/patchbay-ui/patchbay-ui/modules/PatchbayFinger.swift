//
//  PatchbayCircle.swift
//  patchbay-ui
//
//  Created by Andy on 11/6/19.
//  Copyright © 2019 Andy. All rights reserved.
//

import Foundation
import UIKit

public class Finger {
    
    let defaults: [String: CGFloat] = [
        "tapPixelsMovedThresh": 10,
        "touchCircleRadiusScaler": 0.1,
        "touchCircleThicknessScaler": 0.01,
        "touchedLineWidth": 3
    ]
    
    var inCircle: Circle!
    var outCircle: Circle!
    
    var getConnections: () -> [String: Connection]
    var makeConnection: () -> Void
    var deleteConnection: (_ connection: Connection) -> Void
    
    var getTouchedPort: () -> Port?
    var getHoveredPort: () -> Port?
    var setTouchedPort: (_ p: Port?) -> Void
    var setHoveredPort: (_ p: Port?) -> Void
    
    var circleRadius: CGFloat = 0
    var circleThickness: CGFloat = 0
    var touchedLineColor: CGColor = Colors.highlight()
    var touchedCircleColor: CGColor = Colors.highlight()
    var hoveredCircleColor: CGColor = Colors.highlight()
    
    var point: CGPoint = CGPoint(x: 0, y: 0)
    var touchPoint: CGPoint = CGPoint(x: 0, y: 0)
    
    var isTouchingScreen: Bool = false
    
    var radianNew: [String: CGFloat] = [
        Type.input: 0,
        Type.output: 0
    ]
    var radianPrev: [String: CGFloat] = [
        Type.input: 0,
        Type.output: 0
    ]
    
    init(_ inC: Circle, _ outC: Circle,
         getConnections gc: @escaping () -> [String: Connection],
         makeConnection mc: @escaping () -> Void,
         deleteConnection dc: @escaping (_ connection: Connection) -> Void,
         getTouchedPort gtp: @escaping () -> Port?,
         getHoveredPort ghp: @escaping () -> Port?,
         setTouchedPort stp: @escaping (_ p: Port?) -> Void,
         setHoveredPort shp: @escaping (_ p: Port?) -> Void) {
        inCircle = inC
        outCircle = outC
        getConnections = gc
        makeConnection = mc
        deleteConnection = dc
        getTouchedPort = gtp
        getHoveredPort = ghp
        setTouchedPort = stp
        setHoveredPort = shp
    }
    
    public func adjustToScreenSize(_ screenSize: CGFloat) {
        circleRadius = screenSize * defaults["touchCircleRadiusScaler"]!
        circleThickness = screenSize * defaults["touchCircleThicknessScaler"]!
    }
    
    public func update() {
        if let _ = getTouchedPort() {
        }
        else {
            if inCircle.touched {
                inCircle.radiansMoved = radianNew[Type.input]! - radianPrev[Type.input]!
            }
            else if outCircle.touched {
                outCircle.radiansMoved = radianNew[Type.output]! - radianPrev[Type.output]!
            }
        }
        radianPrev = radianNew
    }
    
    public func touchEvent(point p: CGPoint) {
        touchPoint = p
        moveEvent(point: p)
        radianPrev = radianNew
        if let _ = getTouchedConnection() {
            //
        }
        else {
            unselectAllConnections()
        }
        inCircle.clearTouchedHovered()
        outCircle.clearTouchedHovered()
        if inCircle.isCloseTo(point: point) {
            let r = radianNew[Type.input]!
            if let port = inCircle.mouseEvent(point: point, radian: r) {
                setTouchedPort(port)
            }
        }
        else if outCircle.isCloseTo(point: point) {
            let r = radianNew[Type.output]!
            if let port = outCircle.mouseEvent(point: point, radian: r) {
                setTouchedPort(port)
            }
        }
    }
    
    public func moveEvent(point p: CGPoint) {
        point = p
        isTouchingScreen = true
        radianNew[Type.input] = radiansFromCenterOf(circle: inCircle)
        radianNew[Type.output] = radiansFromCenterOf(circle: outCircle)
        if let port = getTouchedPort() {
            findHoveredPort(touchedPort: port)
        }
    }
    
    public func releaseEvent(point p: CGPoint) {
        point = p
        isTouchingScreen = false
        let distMoved = Math.distance(touchPoint, point)
        if distMoved < defaults["tapPixelsMovedThresh"]! {
            releaseWithoutMoving()
        }
        else {
            if let _ = getTouchedPort(), let _ = getHoveredPort() {
                makeConnection()
            }
            unselectAllConnections()
            clearCirclesTouchedHovered()
        }
    }
    
    func releaseWithoutMoving() {
        if deleteConnectionIfTouched() == false {
            // just incase there is no touched port
            unselectAllConnections()
        }
        if let _ = getTouchedPort() {
            unselectAllConnections()
            for (_, conn) in getConnections() {
                if conn.input.isTouched() || conn.output.isTouched() {
                    conn.selected = true
                }
            }
        }
        else {
            inCircle.tapEvent()
            outCircle.tapEvent()
        }
        clearCirclesTouchedHovered()
    }
    
    public func draw(_ context: CGContext) {
        if let tPort = getTouchedPort() {
            drawTouchLine(context, port: tPort)
            drawTouchedPort(context, port: tPort)
            if let hPort = getHoveredPort() {
                drawHoveredPort(context, port: hPort)
            }
        }
    }
    
    func drawTouchLine(_ context: CGContext, port p: Port) {
        Draw.line(
            context, from: p.point, to: point,
            width: defaults["touchedLineWidth"]!, color: touchedLineColor)
        // then two smaller filled in circles to cover the tips of the line
        Draw.circle(
            context, p.point,
            radius: defaults["touchedLineWidth"]!, fill: touchedLineColor)
        Draw.circle(
            context, point,
            radius: defaults["touchedLineWidth"]!, fill: touchedLineColor)
    }
    
    func drawTouchedPort(_ context: CGContext, port p: Port) {
        context.saveGState()
        Draw.circle(
            context, p.point, radius: circleRadius,
            width: circleThickness, stroke: touchedCircleColor)
        context.restoreGState()
    }
    
    func drawHoveredPort(_ context: CGContext, port p: Port) {
        context.saveGState()
        Draw.circle(
            context, p.point, radius: circleRadius,
            width: circleThickness, stroke: hoveredCircleColor)
        context.restoreGState()
    }
    
    func findHoveredPort(touchedPort p: Port) {
        if let inPort = getHoveredPortFromCircle(inCircle, p) {
            setHoveredPort(inPort)
        }
        else if let outPort = getHoveredPortFromCircle(outCircle, p) {
            setHoveredPort(outPort)
        }
    }
    
    func getHoveredPortFromCircle(_ circle: Circle, _ touchedPort: Port) -> Port? {
        if circle.arcs.count == 0 {
            return nil
        }
        if touchedPort.type == circle.type {
            return nil
        }
        for arc in circle.getExpandedArcs() {
            for port in arc.ports {
                if port.isUserTouching(point: point) {
                    return port
                }
            }
        }
        return nil
    }
    
    func deleteConnectionIfTouched() -> Bool {
        if let conn = getTouchedConnection() {
            deleteConnection(conn)
            return true
        }
        return false
    }
    
    func getTouchedConnection() -> Connection? {
        for (_, conn) in getConnections() {
            if conn.isUserTouching(point: point) {
                return conn
            }
        }
        return nil
    }
    
    func unselectAllConnections() {
        for (_, conn) in getConnections() {
            conn.selected = false
        }
    }
    
    func clearCirclesTouchedHovered() {
        inCircle.clearTouchedHovered()
        outCircle.clearTouchedHovered()
        setTouchedPort(nil)
        setHoveredPort(nil)
    }
    
    func radiansFromCenterOf(circle: Circle) -> CGFloat {
        let xDist = abs(circle.point.x - point.x);
        let yDist = abs(circle.point.y - point.y);
        if point.x > circle.point.x {
            if point.y > circle.point.y {
                // bottom right
                return atan(yDist / xDist)
            }
            else if point.y < circle.point.y {
                // top right
                return atan(xDist / yDist) + (Math.PI * 1.5)
            }
            else {
                // we're touching the y line
                return 0
            }
        }
        else if point.x < circle.point.x {
            if point.y > circle.point.y {
                // bottom left
                return atan(xDist / yDist) + (Math.PI * 0.5)
            }
            else if point.y < circle.point.y {
                // top left
                return atan(yDist / xDist) + Math.PI
            }
            else {
                // we're touching the y line
                return Math.PI
            }
        }
        else {
            //we're touching the x line
            if point.y > circle.point.y {
                return Math.PI * 0.5
            }
            else if point.y < circle.point.y {
                return Math.PI * 1.5
            }
            else {
                // we're touching the middle
                return 0
            }
        }
    }
}
