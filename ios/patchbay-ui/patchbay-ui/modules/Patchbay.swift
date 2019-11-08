//
//  Patchbay.swift
//  patchbay-ui
//
//  Created by Andy on 11/8/19.
//  Copyright © 2019 Andy. All rights reserved.
//

import Foundation
import UIKit

public class Patchbay {
    
    let defaults: [String: CGFloat] = [
        "screenPercentage": 0.25,
        "arcThicknessPercentage": 0.08,
        "circleCenterXOffsetScaler": 0.3,
        "circleCenterYOffsetScaler": 0.1
    ]
    
    var connections: [Connection] = []
    
//    var inCircle: Circle!
//    var outCircle: Circle!
//    var finger: Finger!
    
    var size: CGSize = CGSize(width: 0, height: 0)
    var screenSize: CGFloat = 0
    
    init() {
        //
    }
    
    public func update(_ secBwFrames: CGFloat) {
        //
    }
    
    public func draw(_ context: CGContext) {
        //
    }
}
