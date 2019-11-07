//
//  PatchbayView.swift
//  patchbay-ui
//
//  Created by Andy on 11/5/19.
//  Copyright © 2019 Andy. All rights reserved.
//

import UIKit

class PatchbayView: UIView {

    let framerate: Int = 15
    
    // width/height are Optional
    // so they can be set after calling super.init()
    var width: CGFloat!
    var height: CGFloat!
    
    var isLandscape: Bool = false
    
    required init?(coder aDecoder: NSCoder) {
        super.init(coder: aDecoder)
        self.setupAndSaveOrientation()
        self.setupAnimation()
    }
    
    @objc func update(displayLink dLink: CADisplayLink) {
        let secBwFrames = CGFloat(dLink.targetTimestamp - dLink.timestamp)
        setNeedsDisplay()
    }
    
    override func draw(_ rect: CGRect) {
        if let context = UIGraphicsGetCurrentContext() {
            Draw.background(context, width, height, Colors.background())
            let lineX1 = CGFloat.random(in: 0..<width)
            let lineY1 = CGFloat.random(in: 0..<height)
            let lineX2 = CGFloat.random(in: 0..<width)
            let lineY2 = CGFloat.random(in: 0..<height)
            let lineColor = Colors.palette.randomElement()!()
            Draw.line(context, lineX1, lineY1, lineX2, lineY2, width: 3, color: lineColor)
            let rectX1 = CGFloat.random(in: 0..<width)
            let rectY1 = CGFloat.random(in: 0..<height)
            let rectWidth = CGFloat.random(in: 0..<width - rectX1)
            let rectHeight = CGFloat.random(in: 0..<height - rectY1)
            let rectRect = CGRect(x: rectX1, y: rectY1, width: rectWidth, height: rectHeight)
            let rectStroke = Colors.palette.randomElement()!()
            let rectFill = Colors.palette.randomElement()!()
            Draw.rect(context, rectRect, fill: rectFill, width: 3, stroke: rectStroke)
            let circleX = CGFloat.random(in: 0..<width)
            let circleY = CGFloat.random(in: 0..<height)
            let circleRadius = CGFloat.random(in: 0..<CGFloat.minimum(width, height) * 0.2)
            let circleStroke = Colors.palette.randomElement()!()
            let circleFill = Colors.palette.randomElement()!()
            Draw.circle(context, circleX, circleY, radius: circleRadius, fill: circleFill, width: 3, stroke: circleStroke)
            let arcX = CGFloat.random(in: 0..<width)
            let arcY = CGFloat.random(in: 0..<height)
            let arcRadius = CGFloat.random(in: 0..<CGFloat.minimum(width, height))
            let arcStroke = Colors.palette.randomElement()!()
            let arcStart = CGFloat.random(in: 0..<Math.PI2)
            let arcEnd = arcStart + CGFloat.random(in: 0..<Math.PI2)
            Draw.arc(context, arcX, arcY, radius: arcRadius, start: arcStart, end: arcEnd, width: 3, stroke: arcStroke)
            let textX = CGFloat.random(in: 0..<width)
            let textY = CGFloat.random(in: 0..<height)
            let textRadians = CGFloat.random(in: 0..<CGFloat.pi * 2)
            let textSize = CGFloat.random(in: 4..<30)
            let textColor = Colors.palette.randomElement()!()
            let textMsg = "pawpawohyea"
            context.saveGState()
            context.translateBy(x: textX, y: textY)
            context.rotate(by: textRadians)
            Draw.textLeft(context, textMsg, x: 0, y: 0, size: textSize, color: textColor)
            Draw.textCenter(context, textMsg, x: 0, y: textSize, size: textSize, color: textColor, bold: true)
            Draw.textRight(context, textMsg, x: 0, y: textSize * 2, size: textSize, color: textColor)
            context.restoreGState()
        }
    }
    
    func onScreenRotated() {
        // called when the orientation (width and height) has been updated
        // this happens on load, and then each time the device rotates
    }
    
    func handleTouchEvent(at location: CGPoint, type: String) {
        // called when a new touch event has happened on this UIView
        // location is a CGPoint with the coordinate of the event
        // type is either Type.touchEvent, Type.moveEvent, or Type.releaseEvent
    }
    
    override func gestureRecognizerShouldBegin(_ gestureRecognizer: UIGestureRecognizer) -> Bool {
        return true
    }
    
    override func touchesBegan(_ touches: Set<UITouch>, with event: UIEvent?) {
        if let touch = touches.first {
            let location = touch.location(in: self)
            handleTouchEvent(at: location, type: Type.touch)
        }
        else {
            super.touchesBegan(touches, with: event);
        }
    }
    
    override func touchesMoved(_ touches: Set<UITouch>, with event: UIEvent?) {
        if let touch = touches.first {
            let location = touch.location(in: self)
            handleTouchEvent(at: location, type: Type.move)
        }
        else {
            super.touchesMoved(touches, with: event);
        }
    }
    
    override func touchesEnded(_ touches: Set<UITouch>, with event: UIEvent?) {
        if let touch = touches.first {
            let location = touch.location(in: self)
            handleTouchEvent(at: location, type: Type.release)
        }
        else {
            super.touchesEnded(touches, with: event);
        }
    }
    
    override func touchesCancelled(_ touches: Set<UITouch>, with event: UIEvent?) {
        if let touch = touches.first {
            let location = touch.location(in: self)
            handleTouchEvent(at: location, type: Type.release)
        }
        else {
            super.touchesCancelled(touches, with: event);
        }
    }
    
    @objc func onOrientationChange() {
        // this method is called during init(), and every time device rotates
        let w = UIScreen.main.bounds.width
        let h = UIScreen.main.bounds.height
        frame = CGRect(x: 0, y: 0, width: w, height: h);
        width = w
        height = h
        if w > h {
            isLandscape = true
        }
        else {
            isLandscape = false
        }
        onScreenRotated()
    }
    
    func setupAndSaveOrientation() {
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(self.onOrientationChange),
            name: UIDevice.orientationDidChangeNotification,
            object: nil
        )
        // run it once to set the landscape
        self.onOrientationChange()
    }
    
    
    func setupAnimation() {
        let displayLink = CADisplayLink(
            target: self, selector: #selector(update))
        displayLink.preferredFramesPerSecond = framerate;
        displayLink.add(to: .current, forMode: .default)
    }
}
