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
    
    var isLandscape: Bool = false
    
    let patchbay: Patchbay = Patchbay()
    
    required init?(coder aDecoder: NSCoder) {
        super.init(coder: aDecoder)
        self.setupAndSaveOrientation()
        self.setupAnimation()
        self.patchbay.setSize(frame.size)
        self.patchbay.addFakeNodes()
    }
    
    @objc func update(displayLink dLink: CADisplayLink) {
        let secBwFrames = CGFloat(dLink.targetTimestamp - dLink.timestamp)
        patchbay.update(secBwFrames)
        setNeedsDisplay()
    }
    
    override func draw(_ rect: CGRect) {
        if let context = UIGraphicsGetCurrentContext() {
            patchbay.draw(context)
        }
    }
    
    func onScreenRotated() {
        // called when the orientation (frame.size.width/height) has been updated
        // this happens on load, and then each time the device rotates
        patchbay.setSize(frame.size)
    }
    
    func handleTouchEvent(at location: CGPoint, type: String) {
        // called when a new touch event has happened on this UIView
        // location is a CGPoint with the coordinate of the event
        // type is either Type.touchEvent, Type.moveEvent, or Type.releaseEvent
        print("Event", type, location)
        patchbay.handleUserEvent(type, at: location)
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
