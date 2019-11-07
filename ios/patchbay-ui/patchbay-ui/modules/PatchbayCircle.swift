//
//  PatchbayCircle.swift
//  patchbay-ui
//
//  Created by Andy on 11/6/19.
//  Copyright © 2019 Andy. All rights reserved.
//

import Foundation
import UIKit

public class Circle {
    
    let defaults: [String: CGFloat] = [
        "autoStepsPerSeconds": 3.0,
        "rotateFriction": 0.1,
        "padding": Math.PI / 200,
        "textXOffsetScaler": 0.075,
        "arcTextScaler": 0.04,
        "typeFontSizeScaler": 0.025,
        "labelOffsetYScaler": 2
    ]
    
    public var type: String!
    public var point: CGPoint = CGPoint(x: 0, y: 0)
    public var touched: Bool = false
    public var arcs: [Arc] = []
    public var radiansMoved: CGFloat = 0
    
    var radiusPercentage: CGFloat!
    var thicknessPercentage: CGFloat!
    
    var lineWidth: CGFloat = 0
    var radius: CGFloat = 0
    
    // using CGPoint() to hold start/end arc positions
    // where X will be used for Start, and Y for End
    var arcStartEndPoints: [CGPoint] = []
    var expandedOffset: Int = 0
    var rotatePercent: CGFloat = 0
    
    var isAutoMoving: Bool = false
    var autoTargetOffset: Int = 0
    var autoStepTotal: CGFloat = 0
    var autoStepCount: Int = 0
    var autoStepsPerSeconds: CGFloat = 0
    
    var typeFontSize: CGFloat = 0
    var arcTextScaler: CGFloat = 0
    
    var getGlobalTouchedPort: () -> Port?
    var getGlobalHoveredPort: () -> Port?
    
    init(_ t: String, _ rPerc: CGFloat, _ tPerc: CGFloat, touchedPort tp: @escaping () -> Port?, hoveredPort hp: @escaping () -> Port?) {
        self.type = t
        self.radiusPercentage = rPerc
        self.thicknessPercentage = tPerc
        self.getGlobalTouchedPort = tp
        self.getGlobalHoveredPort = hp
    }
    
    public func createArc(id arcID: String, name arcName: String, color arcColor: CGColor) -> Arc {
        let arc = Arc(
            parent: self, type: type, id: arcID, name: arcName, color: arcColor,
            touchedPort: getGlobalTouchedPort, hoveredPort: getGlobalHoveredPort)
        arc.adjustToScreenSize(radius: radius, width: lineWidth, point: point)
        return arc
    }
    
    public func addArc(arc: Arc) {
        arcs.append(arc)
        updateArcStartEndPoints()
    }
    
    public func deleteArc(arc: Arc) {
        for (i, a) in arcs.enumerated() {
            if arc === a {
                arcs.remove(at: i)
                if (expandedOffset >= arcs.count) {
                    expandedOffset = arcs.count - 1
                }
                updateArcStartEndPoints()
                return
            }
        }
    }
    
    public func getArcFromId(id arcID: String) -> Arc? {
        for arc in arcs {
            if arc.id == arcID {
                return arc
            }
        }
        return nil
    }
    
    public func deleteArcFromId(id arcID: String) {
        if let arc = getArcFromId(id: arcID) {
            deleteArc(arc: arc)
        }
    }
    
    public func holdsTouchedPort() -> Bool {
        if let port = getGlobalTouchedPort() {
            return port.type == type
        }
        return false
    }
    
    public func getExpandedArcs() -> [Arc] {
        var eArcs = [arcs[expandedOffset]]
        if rotatePercent > 0 && rotatePercent < 1 {
            var nextIndex = expandedOffset + 1
            if nextIndex >= arcs.count {
                nextIndex -= arcs.count
            }
            eArcs.append(arcs[nextIndex])
        }
        return eArcs
    }
    
    public func adjustToScreenSize(screenSize: CGFloat) {
        lineWidth = thicknessPercentage * screenSize;
        radius = radiusPercentage * screenSize;
        typeFontSize = defaults["typeFontSizeScaler"]! * screenSize;
        arcTextScaler = defaults["arcTextScaler"]! * screenSize;
        for arc in arcs {
            arc.adjustToScreenSize(
                radius: radius, width: lineWidth, point: point)
        }
    }
    
    public func update(_ secBwFrames: CGFloat) {
        if isAutoMoving {
            updateAutoMoving(secBwFrames)
        }
        else {
            updateRotateDrag(secBwFrames)
        }
        for (i, arc) in arcs.enumerated() {
            if let arcIndex = getIndexOfArc(arc: arc) {
                var sizeScaler = rotatePercent
                if expandedOffset == arcIndex {
                    sizeScaler = 1 - sizeScaler
                }
                let startEndPoints = getRotatedStartEndPointsForArc(index: i)
                let isExpanded = i < 2
                arc.update(
                    secBwFrames, start: startEndPoints.x, end: startEndPoints.y,
                    isSelected: isExpanded, sizeScaler: sizeScaler)
            }
        }
    }
    
    public func draw(_ context: CGContext) {
        context.saveGState()
        context.translateBy(x: point.x, y: point.y)
        // draw the TYPE text in the center of the Circle
        // then draw the currently displayed arc's name
        // draw the next-in-line Arc's label (fading in/out)
        // now draw the actual child Arcs
        for arc in arcs {
            arc.draw(context)
        }
        context.restoreGState()
    }
    
    public func mouseEvent (point p: CGPoint, radian r: CGFloat) -> Port? {
        for arc in getExpandedArcs() {
            if let port = arc.getPortTouching(point: p) {
                touched = false
                return port
            }
        }
        touched = true;
        // see which arc was touched
        for arc in arcs {
            if (r > arc.start && r < arc.end) {
                arc.touched = true
                break
            }
        }
        return nil
    }
    
    public func isCloseTo (point p: CGPoint) -> Bool {
        let distFromCenter = Math.distance(point, p)
        let halfWidth = lineWidth / 2;
        let outerRad = radius + halfWidth;
        let innerRad = radius - halfWidth;
        if (distFromCenter <= outerRad && distFromCenter >= innerRad) {
            return true;
        }
        return false;
    }
    
    public func tapEvent () {
        if touched {
            for (i, arc) in arcs.enumerated() {
                if (arc.touched) {
                    startAutoMove(newOffset: i)
                }
            }
        }
        clearTouchedHovered()
    }
    
    public func clearTouchedHovered() {
        touched = false;
        for arc in arcs {
            arc.touched = false
        }
    }
    
    func startAutoMove (newOffset: Int) {
        autoTargetOffset = newOffset
        isAutoMoving = true
        let moveUp = CGFloat(newOffset - (expandedOffset + arcs.count))
        let moveDown = CGFloat(newOffset - expandedOffset)
        var arcsToMove = moveUp - rotatePercent
        if abs(moveUp) > abs(moveDown) {
            let arcsCount = CGFloat(arcs.count)
            if abs(moveDown) > arcsCount / 2 {
                arcsToMove = moveDown + arcsCount + rotatePercent
            }
            else if (moveDown == 0) {
                arcsToMove = (moveDown - rotatePercent).truncatingRemainder(
                    dividingBy: arcsCount)
            }
            else {
                arcsToMove = (moveDown + rotatePercent).truncatingRemainder(
                    dividingBy: arcsCount)
            }
        }
        autoStepsPerSeconds = defaults["autoStepsPerSeconds"]!
        autoStepTotal = arcsToMove / autoStepsPerSeconds
        if (autoStepTotal < 0) {
            autoStepTotal *= -1
            autoStepsPerSeconds *= -1
        }
        autoStepCount = 0
    }
    
    func updateAutoMoving(_ secBwFrames: CGFloat) {
        if CGFloat(autoStepCount) < autoStepTotal {
            rotatePercent += autoStepsPerSeconds * secBwFrames
            autoStepCount += 1
            if (rotatePercent >= 1) {
                incrementExpandedOffset()
                rotatePercent = 0
            }
            else if (rotatePercent < 0) {
                decrementExpandedOffset()
                rotatePercent = 1 + rotatePercent
            }
        }
        else {
            isAutoMoving = false
            expandedOffset = autoTargetOffset
            rotatePercent = 0
        }
    }
    
    func updateRotateDrag(_ secBwFrames: CGFloat) {
        // no need to do anything if the circle hasn't moved
        if (radiansMoved == 0.0) {
            return
        }
        // keep the radians moved below PI (half a circle)
        if (radiansMoved > Math.PI / 2) {
            radiansMoved = Math.PI - radiansMoved.truncatingRemainder(
                dividingBy: Math.PI)
            radiansMoved *= -1
        }
        // if not touching, decelerate the radians moved until stop
        if (!touched) {
            // https://gamedev.stackexchange.com/questions/20905
            radiansMoved *= pow(defaults["rotateFriction"]!, secBwFrames)
            if (abs(radiansMoved) < 0.0001) { // some very small value
                radiansMoved = 0.0
            }
        }
        var relMovement = radiansMoved / Math.PI2;
        if (relMovement > 0.5) {
            relMovement = 1 - relMovement.truncatingRemainder(
                dividingBy: 1)
        }
        else if (relMovement < -0.5) {
            relMovement = 1 + relMovement.truncatingRemainder(
                dividingBy: 1);
        }
        if (relMovement < 1 && relMovement > -1) {
            let animStep = relMovement / (1 / CGFloat(arcs.count));
            rotatePercent -= animStep;
            if (rotatePercent >= 1) {
                incrementExpandedOffset()
                rotatePercent -= 1;
            }
            else if (rotatePercent < 0) {
                decrementExpandedOffset();
                rotatePercent += 1;
            }
        }
    }
    
    func getRotatedStartEndPointsForArc(index i: Int) -> CGPoint {
        // `target` is the index of the neighboring arc
        // in the direction that we are rotating
        var target = i - 1;
        if (target < 0) {
            target = arcs.count + target;
        }
        else if (target >= arcs.count) {
            target -= arcs.count
        }
        // the start/end radians are pre-calculated when arcs are added/deleted
        let realStart = arcStartEndPoints[i].x;
        var startDiff = arcStartEndPoints[target].x - realStart;
        let realEnd = arcStartEndPoints[i].y;
        var endDiff = arcStartEndPoints[target].y - realEnd;
        if i == 1 {
            startDiff = startDiff * -1;
            endDiff = -Math.PI2 + endDiff;
        }
        var currentStart = (startDiff * rotatePercent) + realStart
        var currentEnd = (endDiff * rotatePercent) + realEnd
        if currentStart > Math.PI2 {
            currentStart = currentStart.truncatingRemainder(
                dividingBy: Math.PI2)
        }
        else if currentStart < 0 {
            currentStart += Math.PI2
        }
        if currentEnd > Math.PI2 {
            currentEnd = currentEnd.truncatingRemainder(
                dividingBy: Math.PI2)
        }
        else if currentEnd < 0 {
            currentEnd += Math.PI2
        }
        return CGPoint(
            x: currentStart + defaults["padding"]!,
            y: currentEnd - defaults["padding"]!
        )
    }
    
    func updateArcStartEndPoints() {
        arcStartEndPoints = [];
        if (arcs.count == 1) {
            arcStartEndPoints = [CGPoint(x: Math.PI / 2, y: Math.PI / 2)]
        }
        else if (arcs.count == 2) {
            arcStartEndPoints = [
                CGPoint(x: Math.PI, y: Math.PI2),
                CGPoint(x: 0, y: Math.PI)
            ]
        }
        else{
            arcStartEndPoints = [CGPoint(x: Math.PI, y: Math.PI2)]
            let smallerWidth = Math.PI / CGFloat(arcs.count - 1)
            for i in 0..<arcs.count {
                let newPoint = CGPoint(
                    x: (CGFloat(i) - 1) * smallerWidth,
                    y: CGFloat(i) * smallerWidth)
                arcStartEndPoints.append(newPoint)
            }
        }
    }
    
    func incrementExpandedOffset() {
        expandedOffset += 1
        if expandedOffset >= arcs.count {
            expandedOffset -= arcs.count
        }
    }
    
    func decrementExpandedOffset() {
        expandedOffset -= 1
        if expandedOffset < 0 {
            expandedOffset += arcs.count
        }
    }
    
    func getIndexOfArc(arc: Arc) -> Int? {
        for (i, a) in arcs.enumerated() {
            if (a === arc) {
                return i
            }
        }
        return nil
    }
}
