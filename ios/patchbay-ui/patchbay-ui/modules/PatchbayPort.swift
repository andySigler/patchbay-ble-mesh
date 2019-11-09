//
//  PatchbayPort.swift
//  patchbay-ui
//
//  Created by Andy on 11/6/19.
//  Copyright © 2019 Andy. All rights reserved.
//

import Foundation
import UIKit

public class Port {
    
    let defaults: [String: CGFloat] = [
        "wobbleSeconds": 2.0,
        "wobbleScaler": 0.1,
        "outlineWidthScaler": 0.2,
        "minSizeScaler": 0.25,
        "fontSizeScaler": 0.4
    ]
    
    public var parent: Arc!
    public var type: String!
    public var id: String!
    public var name: String!
    public var point: CGPoint = CGPoint(x: 0, y: 0)
    public var visible: Bool = false
    public var sizeScaler: CGFloat = 0.0
    
    var getTouchedPort: () -> Port?
    var getHoveredPort: () -> Port?
    
    var textOffset: CGFloat = 0.0
    var fontSize: CGFloat = 0.0
    
    var radius: CGFloat = 0.0
    var outlineWidth: CGFloat = 0.0
    var drawnPortRadius: CGFloat = 0.0
    var wobbleCounter: CGFloat = 0.0

    var parentPoint: CGPoint = CGPoint(x: 0, y: 0)
    var parentRadius: CGFloat = 0.0
    var parentWidth: CGFloat = 0.0

    var color: CGColor
    var outlineColor: CGColor = Colors.background()
    var highlightedColor: CGColor = Colors.white()
    
    init(parent p: Arc, type t: String, id d: String, name n: String, color c: CGColor,
         getTouchedPort gtp: @escaping () -> Port?,
         getHoveredPort ghp: @escaping () -> Port?) {
        self.parent = p
        self.type = t
        self.id = d
        self.name = n
        self.color = c
        
        self.getTouchedPort = gtp
        self.getHoveredPort = ghp
        
        self.wobbleCounter = CGFloat.random(in: 0..<Math.PI2)
    }
    
    public func adjustToScreenSize(radius r: CGFloat, width w: CGFloat, point p: CGPoint) {
        parentRadius = r
        parentWidth = w
        parentPoint = p
    }
    
    public func update(_ secBwFrames: CGFloat, sizeScaler scaler: CGFloat, radLocation: CGFloat, isVisible: Bool) {
        // the Port is only visible if
        // 1) told so by parent, and
        // 2) is big enough
        visible = isVisible && (scaler > defaults["minSizeScaler"]!)
        if visible {
            sizeScaler = scaler
        }
        else {
            sizeScaler = 0
        }
        // Ports need an absolute coordinate on the screen
        // because their position is used to determine when they are being
        // interacted with
        point = CGPoint(
            x: (parentRadius * cos(radLocation)) + parentPoint.x,
            y: (parentRadius * sin(radLocation)) + parentPoint.y
        )
        // drawArc() radius and stroke width
        radius = (parentWidth / 2) * sizeScaler
        drawnPortRadius = radius
        if (isPotentialConnection()) {
            wobbleCounter += defaults["wobbleSeconds"]! * secBwFrames
            wobbleCounter = wobbleCounter.truncatingRemainder(
                dividingBy: Math.PI2)
            let wobbleMaxSize = defaults["wobbleScaler"]! * radius
            drawnPortRadius += sin(wobbleCounter) * wobbleMaxSize;
        }
        outlineWidth = drawnPortRadius * defaults["outlineWidthScaler"]!
        // text settings
        textOffset = (parentRadius - (parentWidth / 2)) - outlineWidth
        fontSize = sizeScaler * parentWidth * defaults["fontSizeScaler"]!
    }
    
    public func draw(_ context: CGContext) {
        if visible {
            context.saveGState()
            // draws with an absolute coordinate (no translation needed)
            Draw.circle(
                context, point, radius: radius,
                fill: color, width: outlineWidth, stroke: outlineColor
            )
            context.restoreGState()
        }
    }
    
    public func drawName(_ context: CGContext) {
        var textColor: CGColor = color
        if(isTouched() || isHovered()) {
          textColor = highlightedColor
        }
        context.saveGState()
        context.translateBy(x: textOffset, y: 0)
        if (point.x < parentPoint.x) {
            context.rotate(by: Math.PI)
            Draw.textLeft(
                context, name, x: 0, y: 0,
                size: fontSize, color: textColor
            )
        }
        else {
            Draw.textRight(
                context, name, x: 0, y: 0,
                size: fontSize, color: textColor
            )
        }
        context.restoreGState()
    }
    
    public func isUserTouching(point p: CGPoint) -> Bool {
        let dist = Math.distance(point, p)
        if (visible && dist < radius) {
          return true;
        }
        return false;
    }
    
    public func isTouched() -> Bool {
        if let port = getTouchedPort() {
            return port === self
        }
        return false
    }
    
    func isPotentialConnection() -> Bool {
        if let port = getTouchedPort() {
            return port.type != type
        }
        return false
    }
    
    func isHovered() -> Bool {
        if let port = getHoveredPort() {
            return port === self
        }
        return false
    }
}
