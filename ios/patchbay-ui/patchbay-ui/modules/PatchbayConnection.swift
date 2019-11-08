//
//  PatchbayCircle.swift
//  patchbay-ui
//
//  Created by Andy on 11/6/19.
//  Copyright © 2019 Andy. All rights reserved.
//

import Foundation
import UIKit

public class Connection {
    
    let defaults: [String: CGFloat] = [
        "lineWidthPixels": 3.0,
        "screenSizeScaler": 0.02,
        "wobbleSeconds": 2.0,
        "wobbleScaler": 0.2,
        "crossSignThicknessScaler": 0.75,
        "crossSignScaler": 0.6
    ]
    
    public var input: Port!
    public var output: Port!
    public var name: String!
    public var selected: Bool = false
    
    // the location and size of the delete circle
    public var point: CGPoint = CGPoint(x: 0, y: 0)
    var visible: Bool = false
    var radius: CGFloat = 0
    var lineWidth: CGFloat = 0
    var sizeScaler: CGFloat = 0
    
    // some variables to keep track of the sinusoidal pulsing
    // when hovered for deletion
    var wobbleCounter: CGFloat = CGFloat.random(in: 0..<Math.PI2)
    var wobbledRadius: CGFloat = 0
    var crossSignThickness: CGFloat = 0
    var crossSignRadius: CGFloat = 0
    
    // colors
    var lineColor: CGColor = Colors.white()
    var delLineColor: CGColor = Colors.delete()
    
    public static func generateName(input: Port, output: Port) -> String {
        let inArcID = String(input.parent.id)
        let outArcID = String(output.parent.id)
        let inPortID = String(input.id)
        let outPortID = String(output.id)
        return inArcID + "/" + inPortID + "->" + outArcID + "/" + outPortID
    }
    
    init(input i: Port, output o: Port) {
        self.input = i
        self.output = o
        self.name = Connection.generateName(input: i, output: o)
        self.point = self.getCurrentPoint()
    }
    
    public func adjustToScreenSize(_ screenSize: CGFloat) {
        radius = screenSize * defaults["screenSizeScaler"]!
    }
    
    public func update(_ secBwFrames: CGFloat) {
        visible = input.visible && output.visible
        if visible {
            sizeScaler = CGFloat.minimum(input.sizeScaler, output.sizeScaler)
            lineWidth = sizeScaler * defaults["lineWidthPixels"]!
            if selected {
                point = getCurrentPoint()
                // update the sinusoidal pulsing added to the line
                // when it is selected
                wobbleCounter += defaults["wobbleSeconds"]! * secBwFrames
                wobbleCounter = wobbleCounter.truncatingRemainder(
                    dividingBy: Math.PI2)
                let wobbleRadiusAdder = sin(wobbleCounter) * defaults["wobbleScaler"]! * radius;
                wobbledRadius = (radius + wobbleRadiusAdder) * sizeScaler;
                crossSignRadius = wobbledRadius * defaults["crossSignScaler"]!
                crossSignThickness = lineWidth * defaults["crossSignThicknessScaler"]!
            }
        }
    }
    
    public func draw(_ context: CGContext) {
        if visible {
            // apply an alpha channel based on the current size
            let normalColor: CGColor = lineColor.copy(alpha: sizeScaler)!
            let delColor: CGColor = delLineColor.copy(alpha: sizeScaler)!
            // the color of the line depends on whether it's selected
            var drawLineColor: CGColor = normalColor
            if selected {
                drawLineColor = delColor
            }
            context.saveGState()
            // draw the line from one Port to the other
            Draw.line(
                context, from: input.point, to: output.point,
                width: lineWidth, color: drawLineColor)
            // draw the two circles on top of that line, inside each port
            // these make the edges of the line look a bit nicer, using
            // the line's width for a radius
            Draw.circle(
                context, input.point, radius: lineWidth, fill: drawLineColor)
            Draw.circle(
                context, output.point, radius: lineWidth, fill: drawLineColor)
            if selected {
                drawDeleteCircle(
                    context, normalColor: normalColor, delColor: delColor)
            }
            context.restoreGState()
        }
    }
    
    public func isUserTouching(point p: CGPoint) -> Bool {
        if (!selected) {
            return false
        }
        let dist = Math.distance(point, p)
        if (dist < radius) {
            return true
        }
        return false
    }
    
    func drawDeleteCircle(_ context: CGContext, normalColor: CGColor, delColor: CGColor) {
        context.saveGState()
        context.translateBy(x: point.x, y: point.y)
        // the cross's bounding circle
        Draw.circle(
            context, 0, 0, radius: wobbledRadius,
            fill: normalColor, width: lineWidth, stroke: delColor)
        // two lines, to create a cross "X"
        Draw.line(
            context, 0, crossSignRadius, 0, -crossSignRadius,
            width: lineWidth, color: delColor)
        context.rotate(by: -Math.PI / 2)
        Draw.line(
            context, 0, crossSignRadius, 0, -crossSignRadius,
            width: lineWidth, color: delColor)
        context.restoreGState()
    }
    
    func getCurrentPoint() -> CGPoint {
        // the coordinate where a deletion circle would be
        // will be halfway between the two ports
        let x = ((output.point.x - input.point.x) / 2) + input.point.x;
        let y = ((output.point.y - input.point.y) / 2) + input.point.y;
        return CGPoint(x: x, y: y)
    }
}
