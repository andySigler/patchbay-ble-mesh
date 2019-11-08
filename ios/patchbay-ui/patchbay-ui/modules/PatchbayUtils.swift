//
//  PatchbayUtils.swift
//  patchbay-ui
//
//  Created by Andy on 11/5/19.
//  Copyright © 2019 Andy. All rights reserved.
//

import Foundation
import UIKit

public class Type {
    public static let input: String = "in"
    public static let output: String = "out"
    public static let touch: String = "touch"
    public static let move: String = "move"
    public static let release: String = "release"
}

public class Math {
    public static let PI: CGFloat = CGFloat.pi
    public static let PI2: CGFloat = CGFloat.pi * 2
    public static func clip(_ value: CGFloat, min: CGFloat = -CGFloat.infinity, max: CGFloat = CGFloat.infinity) -> CGFloat {
        return CGFloat.minimum(CGFloat.maximum(value, min), max)
    }
    public static func distance(_ from: CGPoint, _ to: CGPoint) -> CGFloat {
        let diffX = from.x - to.x
        let diffY = from.y - to.y
        return (diffX * diffX + diffY * diffY).squareRoot()
    }
}

public class Colors {
    public static func black() -> CGColor {
        return CGColor(srgbRed: 0.0, green: 0.0, blue: 0.0, alpha: 1.0)
    }
    public static func white() -> CGColor {
        return CGColor(srgbRed: 1.0, green: 1.0, blue: 1.0, alpha: 1.0)
    }
    public static func delete() -> CGColor {
        return CGColor(srgbRed: 0.886, green: 0.153, blue: 0.153, alpha: 1.0)
    }
    public static func highlight() -> CGColor {
        return CGColor(srgbRed: 0.392, green: 1.0, blue: 1.0, alpha: 1.0)
    }
    public static func background() -> CGColor {
        return CGColor(srgbRed: 0.31, green: 0.31, blue: 0.31, alpha: 1.0)
    }
    public static let palette: Array<(() -> CGColor)> = [
        {() -> CGColor in
            return CGColor(srgbRed: 0.69, green: 0.31, blue: 0.31, alpha: 1.0)
        },
        {() -> CGColor in
            return CGColor(srgbRed: 0.69, green: 0.31, blue: 0.69, alpha: 1.0)
        },
        {() -> CGColor in
            return CGColor(srgbRed: 0.169, green: 0.827, blue: 0.988, alpha: 1.0)
        },
        {() -> CGColor in
            return CGColor(srgbRed: 0.69, green: 0.69, blue: 0.31, alpha: 1.0)
        },
        {() -> CGColor in
            return CGColor(srgbRed: 0.988, green: 0.471, blue: 0.169, alpha: 1.0)
        },
        {() -> CGColor in
            return CGColor(srgbRed: 0.69, green: 0.69, blue: 0.69, alpha: 1.0)
        },
        {() -> CGColor in
            return CGColor(srgbRed: 0.118, green: 0.576, blue: 0.686, alpha: 1.0)
        }
    ]
}

public class Draw {
    public static func line(_ context: CGContext, from: CGPoint, to: CGPoint, width: CGFloat, color: CGColor) {
        context.saveGState()
        context.setLineWidth(width)
        context.setStrokeColor(color)
        context.move(to: from)
        context.addLine(to: to)
        context.strokePath()
        context.restoreGState()
    }
    public static func line(_ context: CGContext, _ x1: CGFloat, _ y1: CGFloat, _ x2: CGFloat, _ y2: CGFloat, width: CGFloat, color: CGColor) {
        line(
            context,
            from: CGPoint(x: x1, y: y1),
            to: CGPoint(x: x2, y: y2),
            width: width,
            color: color
        )
    }
    public static func circle(_ context: CGContext, _ origin: CGPoint, radius: CGFloat, fill: CGColor? = nil, width: CGFloat? = nil, stroke: CGColor? = nil) {
        let boundingBox = CGRect(
            x: origin.x - radius,
            y: origin.y - radius,
            width: radius * 2,
            height: radius * 2
        )
        context.saveGState()
        if let f = fill {
            context.setFillColor(f)
            context.fillEllipse(in: boundingBox)
        }
        if let s = stroke, let w = width {
            context.setStrokeColor(s)
            context.setLineWidth(w)
            context.strokeEllipse(in: boundingBox)
        }
        context.restoreGState()
    }
    public static func circle(_ context: CGContext, _ x: CGFloat, _ y: CGFloat, radius: CGFloat, fill: CGColor? = nil, width: CGFloat? = nil, stroke: CGColor? = nil) {
        circle(context, CGPoint(x: x, y: y), radius: radius, fill: fill, width: width, stroke: stroke)
    }
    public static func arc(_ context: CGContext, _ center: CGPoint, radius: CGFloat, start: CGFloat, end: CGFloat, width: CGFloat, stroke: CGColor) {
        context.saveGState()
        context.setStrokeColor(stroke)
        context.setLineWidth(width)
        context.addArc(
            center: center,
            radius: radius,
            startAngle: start,
            endAngle: end,
            clockwise: true // clockwise by default (same as HTML5 canvas)
        )
        context.strokePath()
        context.restoreGState()
    }
    public static func arc(_ context: CGContext, _ x: CGFloat, _ y: CGFloat, radius: CGFloat, start: CGFloat, end: CGFloat, width: CGFloat, stroke: CGColor) {
        arc(context, CGPoint(x: x, y: y), radius: radius, start: start, end: end, width: width, stroke: stroke)
    }
    public static func rect(_ context: CGContext, _ rect: CGRect, fill: CGColor? = nil, width: CGFloat? = nil, stroke: CGColor? = nil) {
        context.saveGState()
        if let f = fill {
            context.setFillColor(f)
            context.fill(rect)
        }
        if let s = stroke, let w = width {
            context.setStrokeColor(s)
            context.stroke(rect, width: w)
        }
        context.restoreGState()
    }
    public static func background(_ context: CGContext, _ width: CGFloat, _ height: CGFloat, _ color: CGColor) {
        rect(context, CGRect(x: 0, y: 0, width: width, height: height), fill: color)
    }
    public static func text(_ context: CGContext, _ msg: String, x: CGFloat, y: CGFloat, size: CGFloat, color: CGColor, bold: Bool, align: NSTextAlignment) {
        let paragraphStyle = NSMutableParagraphStyle()
        paragraphStyle.alignment = align
        var font = UIFont.systemFont(ofSize: size)
        if bold {
            font = UIFont.boldSystemFont(ofSize: size)
        }
        let options = [
            NSAttributedString.Key.paragraphStyle: paragraphStyle,
            NSAttributedString.Key.font: font,
            NSAttributedString.Key.foregroundColor: UIColor(cgColor: color)
        ]
        let drawnSize = msg.size(withAttributes: options)
        var xOffset: CGFloat = 0
        if align == NSTextAlignment.center {
            xOffset = drawnSize.width / 2
        }
        else if align == NSTextAlignment.right {
            xOffset = drawnSize.width
        }
        let textBox = CGRect(
            x: x - xOffset,
            y: y - drawnSize.height / 2,
            width: drawnSize.width,
            height: drawnSize.height
        )
        context.saveGState()
        context.setTextDrawingMode(CGTextDrawingMode.fill)
        msg.draw(in: textBox, withAttributes: options)
        context.restoreGState()
    }
    public static func textCenter(_ context: CGContext, _ msg: String, x: CGFloat, y: CGFloat, size: CGFloat, color: CGColor, bold: Bool = false) {
        text(context, msg, x: x, y: y, size: size, color: color, bold: bold, align: NSTextAlignment.center)
    }
    public static func textRight(_ context: CGContext, _ msg: String, x: CGFloat, y: CGFloat, size: CGFloat, color: CGColor, bold: Bool = false) {
        text(context, msg, x: x, y: y, size: size, color: color, bold: bold, align: NSTextAlignment.right)
    }
    public static func textLeft(_ context: CGContext, _ msg: String, x: CGFloat, y: CGFloat, size: CGFloat, color: CGColor, bold: Bool = false) {
        text(context, msg, x: x, y: y, size: size, color: color, bold: bold, align: NSTextAlignment.left)
    }
}

public class Simulate {
    public static func makeSimulation() {
        //
    }
}
