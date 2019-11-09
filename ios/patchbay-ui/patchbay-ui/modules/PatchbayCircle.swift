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
        "rotateFriction": 0.01,
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
    var arcAngleOffset: CGFloat = 0
    
    var isAutoMoving: Bool = false
    var autoTargetOffset: Int = 0
    var autoStepTotal: CGFloat = 0
    var autoStepCount: Int = 0
    var autoStepsPerSeconds: CGFloat = 0
    
    var typeFontSize: CGFloat = 0
    let typeFontColor: CGColor = Colors.black()
    var arcTextScaler: CGFloat = 0
    var typeYOffset: CGFloat = 0
    var xOffset0: CGFloat = 0
    var xOffset1: CGFloat = 0
    var arc0FontSize: CGFloat = 0
    var arc1FontSize: CGFloat = 0
    var arc0Color: CGColor = Colors.black()
    var arc1Color: CGColor = Colors.black()
    var arc0Name: String = ""
    var arc1Name: String = ""
    
    var getTouchedPort: () -> Port?
    var getHoveredPort: () -> Port?
    
    init(_ t: String, _ rPerc: CGFloat, _ tPerc: CGFloat,
         getTouchedPort gtp: @escaping () -> Port?,
         getHoveredPort ghp: @escaping () -> Port?) {
        self.type = t
        self.radiusPercentage = rPerc
        self.thicknessPercentage = tPerc
        self.getTouchedPort = gtp
        self.getHoveredPort = ghp
    }
    
    public func createArc(id arcID: String, name arcName: String, color arcColor: CGColor) -> Arc {
        let arc = Arc(
            parent: self, type: type, id: arcID, name: arcName, color: arcColor,
            getTouchedPort: getTouchedPort, getHoveredPort: getHoveredPort)
        arc.adjustToScreenSize(radius: radius, width: lineWidth, point: point, angleOffset: arcAngleOffset)
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
        if let port = getTouchedPort() {
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
    
    public func adjustToScreenSize(_ screenSize: CGFloat, angleOffset ao: CGFloat) {
        lineWidth = thicknessPercentage * screenSize
        radius = radiusPercentage * screenSize
        typeFontSize = defaults["typeFontSizeScaler"]! * screenSize
        arcTextScaler = defaults["arcTextScaler"]! * screenSize
        arcAngleOffset = ao
        for arc in arcs {
            arc.adjustToScreenSize(
                radius: radius, width: lineWidth, point: point, angleOffset: arcAngleOffset)
        }
    }
    
    public func update(_ secBwFrames: CGFloat) {
        if arcs.count == 0 {
            return
        }
        if isAutoMoving {
            updateAutoMoving(secBwFrames)
        }
        else {
            updateRotateDrag(secBwFrames)
        }
        updateArcs(secBwFrames)
        updateTexts()
    }
    
    public func draw(_ context: CGContext) {
        if arcs.count == 0 {
            return
        }
        context.saveGState()
        drawTexts(context)
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
    
    func drawTexts(_ context: CGContext) {
        context.saveGState()
        context.translateBy(x: point.x, y: point.y)
        // draw the TYPE
        Draw.textCenter(
            context, type.uppercased(), x: 0, y: typeYOffset,
            size: typeFontSize, color: typeFontColor, bold: true)
        // draw the ARC0 name
        Draw.textCenter(
            context, arc0Name, x: xOffset0, y: 0,
            size: arc0FontSize, color: arc0Color)
        // draw the ARC1 name
        Draw.textCenter(
            context, arc1Name, x: xOffset1, y: 0,
            size: arc1FontSize, color: arc1Color)
        context.restoreGState()
    }
    
    func updateArcs(_ secBwFrames: CGFloat) {
        for i in 0..<arcs.count {
            var arcIndex = i + expandedOffset
            if arcIndex >= arcs.count {
                arcIndex -= arcs.count
            }
            var sizeScaler = rotatePercent
            if expandedOffset == arcIndex {
                sizeScaler = 1 - sizeScaler
            }
            let startEndPoints = getRotatedStartEndPointsForArc(index: i)
            let isExpanded = i < 2
            arcs[arcIndex].update(
                secBwFrames, start: startEndPoints.x, end: startEndPoints.y,
                isSelected: isExpanded, sizeScaler: sizeScaler)
        }
    }
    
    func updateTexts() {
        // variables for drawing the TYPE text in the center of the Circle
        var labelOffsetYScaler = defaults["labelOffsetYScaler"]!
        if type == Type.input {
            labelOffsetYScaler *= -1
        }
        typeYOffset = typeFontSize * labelOffsetYScaler
        // variables for drawing the currently displayed arc's name
        let arc0 = arcs[expandedOffset]
        arc0Name = arc0.name
        arc0FontSize = arcTextScaler * arc0.sizeScaler
        arc0Color = arc0.color.copy(
            alpha: Math.clip(arc0.sizeScaler, min: 1))!
        xOffset0 = lineWidth * arcTextScaler * rotatePercent
        if arc0.type == Type.output {
          xOffset0 *= -1
        }
        xOffset0 *= defaults["textXOffsetScaler"]!
        // draw the next-in-line Arc's label (fading in/out)
        var arc1Index = expandedOffset + 1
        if arc1Index >= arcs.count {
            arc1Index -= arcs.count
        }
        let arc1 = arcs[arc1Index]
        arc1Name = arc1.name
        arc1FontSize = arcTextScaler * arc1.sizeScaler
        arc1Color = arc1.color.copy(
            alpha: Math.clip(arc1.sizeScaler, min: 1))!
        xOffset1 = lineWidth * arcTextScaler * (1 - rotatePercent)
        if arc1.type == Type.output {
            xOffset1 *= -1
        }
        xOffset1 *= defaults["textXOffsetScaler"]!
        xOffset1 *= -1
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
        if target < 0 {
            target += arcs.count
        }
        else if target >= arcs.count {
            target -= arcs.count
        }
        // the start/end radians are pre-calculated when arcs are added/deleted
        let realStart = arcStartEndPoints[i].x
        let realEnd = arcStartEndPoints[i].y
        var startDiff = arcStartEndPoints[target].x - realStart
        var endDiff = arcStartEndPoints[target].y - realEnd
        // special case when it's the 2nd expanded Arc
        if i == 1 {
            startDiff *= -1
            endDiff -= Math.PI2
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
        arcStartEndPoints = []
        if arcs.count == 1 {
            arcStartEndPoints = [CGPoint(
                x: Math.PI / 2,
                y: Math.PI / 2
            )]
        }
        else if arcs.count == 2 {
            arcStartEndPoints = [
                CGPoint(x: Math.PI, y: Math.PI2),
                CGPoint(x: 0, y: Math.PI)
            ]
        }
        else{
            arcStartEndPoints = [CGPoint(
                x: Math.PI,
                y: Math.PI2
            )]
            let smallerWidth = Math.PI / CGFloat(arcs.count - 1)
            for i in 1..<arcs.count {
                arcStartEndPoints.append(CGPoint(
                    x: (CGFloat(i) - 1) * smallerWidth,
                    y: CGFloat(i) * smallerWidth
                ))
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
