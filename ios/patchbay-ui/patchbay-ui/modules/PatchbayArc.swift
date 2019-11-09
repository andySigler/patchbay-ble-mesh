//
//  PatchbayArc.swift
//  patchbay-ui
//
//  Created by Andy on 11/6/19.
//  Copyright © 2019 Andy. All rights reserved.
//

import Foundation
import UIKit

public class Arc {
    
    let defaults: [String: CGFloat] = [
        "emptyLineWidthScaler": 0.1,
        "gutterThicknessScaler": 0.77,
        "gutterStartEndScaler": 0.006,
        "sizeScalerPreMultiplier": 1.9
    ]
    
    public var parent: Circle!
    public var type: String!
    public var id: String!
    public var name: String!
    public var touched: Bool = false
    public var isSelected: Bool = false
    
    var sizeScaler: CGFloat = 0
    var start: CGFloat = 0
    var end: CGFloat = 0
    var point: CGPoint = CGPoint(x: 0, y: 0)
    var angleOffset: CGFloat = 0
    var radius: CGFloat = 0
    var lineWidth: CGFloat = 0
    var drawnLineWidth: CGFloat = 0
    var drawnLineWidthScaler: CGFloat!
    var rotStep: CGFloat = 0
    
    var shouldDrawGutter: Bool = false
    var gutterStart: CGFloat = 0
    var gutterEnd: CGFloat = 0
    var gutterThickness: CGFloat = 0
    let gutterColor: CGColor = Colors.background()
    
    var ports: [Port] = []
    
    var getTouchedPort: () -> Port?
    var getHoveredPort: () -> Port?
    
    var color: CGColor = Colors.black()
    
    init(parent p: Circle, type t: String, id i: String, name n: String, color c: CGColor,
         getTouchedPort gtp: @escaping () -> Port?,
         getHoveredPort ghp: @escaping () -> Port?) {
        self.parent = p
        self.type = t
        self.id = i
        self.name = n
        self.color = c
        self.getTouchedPort = gtp
        self.getHoveredPort = ghp
        self.drawnLineWidthScaler = self.defaults["emptyLineWidthScaler"]!
    }
    
    public func createPort(id portID: String, name portName: String) -> Port {
        let port = Port(
            parent: self, type: type,
            id: portID, name: portName, color: color,
            getTouchedPort: getTouchedPort,
            getHoveredPort: getHoveredPort)
        port.adjustToScreenSize(radius: radius, width: lineWidth, point: point)
        return port
    }
    
    public func addPort(port: Port) {
        ports.append(port)
        // update some draw settings that change when ports.length > 0
        shouldDrawGutter = type == Type.input
        drawnLineWidthScaler = 1
    }
    
    public func getPortTouching (point p: CGPoint) -> Port? {
        for port in ports {
            if port.isUserTouching(point: p) {
                return port
            }
        }
        return nil
    }
    
    public func adjustToScreenSize(radius r: CGFloat, width w: CGFloat, point p: CGPoint, angleOffset ao: CGFloat) {
        radius = r
        lineWidth = w
        point = p
        angleOffset = ao
        for port in ports {
            port.adjustToScreenSize(radius: radius, width: lineWidth, point: point);
        }
    }
    
    public func update(_ secBwFrames: CGFloat, start s: CGFloat, end e: CGFloat, isSelected i: Bool, sizeScaler ss: CGFloat) {
        sizeScaler = modifySizeScaler(scaler: ss)
        isSelected = i
        start = (s + angleOffset).truncatingRemainder(dividingBy: Math.PI2)
        end = (e + angleOffset).truncatingRemainder(dividingBy: Math.PI2)
        if end < start {
            end += Math.PI2
        }
        drawnLineWidth = Math.clip(lineWidth * drawnLineWidthScaler, min: 1)
        updatePorts(secBwFrames)
        if shouldDrawGutter {
            updateGutter()
        }
    }
    
    public func draw(_ context: CGContext) {
        context.saveGState()
        context.setShadow(offset: CGSize(width: 10, height: 10), blur: 1)
        Draw.arc(
            context, point, radius: radius,
            start: start, end: end,
            width: drawnLineWidth, stroke: color)
        context.restoreGState()
        context.saveGState()
        // draw a grey arc in the middle of the main arc
        if shouldDrawGutter {
            Draw.arc(
                context, point, radius: radius,
                start: gutterStart, end: gutterEnd,
                width: gutterThickness, stroke: gutterColor)
        }
        drawAllPortNames(context)
        drawPorts(context)
        context.restoreGState()
    }
    
    func updatePorts(_ secBwFrames: CGFloat) {
        // update each Port's visual draw settings
        rotStep = (end - start) / CGFloat(ports.count);
        for (i, port) in ports.enumerated() {
            let radLocation = start + (rotStep * CGFloat(i)) + (rotStep / 2);
            port.update(
                secBwFrames, sizeScaler: sizeScaler,
                radLocation: radLocation, isVisible: isSelected);
        }
    }
    
    func updateGutter() {
        // if it's an Input Arc and is selected, give it an inner grey "gutter"
        gutterThickness = Math.clip(
            lineWidth * defaults["gutterThicknessScaler"]!, min: 1);
        gutterStart = start + (Math.PI2 * defaults["gutterStartEndScaler"]!);
        gutterEnd = end - (Math.PI2 * defaults["gutterStartEndScaler"]!);
    }
    
    func modifySizeScaler (scaler: CGFloat) -> CGFloat {
        let newScaler: CGFloat = Math.clip(
            scaler * defaults["sizeScalerPreMultiplier"]!, min: 0, max: 1);
        return pow(newScaler, 2)
    }
    
    func drawPorts(_ context: CGContext) {
        // draw the child Ports
        context.saveGState()
        for port in ports {
            if port.visible {
                // Ports store their absolute coordinate
                // so no need for translation/rotation
                port.draw(context)
            }
        }
        context.restoreGState()
    }
    
    func drawAllPortNames(_ context: CGContext) {
        context.saveGState()
        context.translateBy(x: point.x, y: point.y)
        for port in ports {
            drawPortName(context, port: port)
        }
        context.restoreGState()
    }
    
    func drawPortName(_ context: CGContext, port: Port) {
        // at this point, must already be translated to the center of the Circle
        if let indexOfPort = getIndexOfPort(port: port) {
            let portRelRadsToPort = rotStep * CGFloat(indexOfPort)
            let radiansToTouchedPort = start + (rotStep / 2) + portRelRadsToPort
            context.saveGState()
            context.rotate(by: radiansToTouchedPort)
            port.drawName(context)
            context.restoreGState()
        }
    }
    
    func getIndexOfPort(port: Port) -> Int? {
        for (i, p) in ports.enumerated() {
            if (p === port) {
                return i
            }
        }
        return nil
    }
}
