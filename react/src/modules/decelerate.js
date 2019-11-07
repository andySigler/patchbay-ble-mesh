function test(friction) {
    var fps = 30
    var count = 0;
    var secBwFrames = 1 / fps;
    var radiansMoved = Math.PI / 10;
    while (Math.abs(radiansMoved) > 0.0001) {
        radiansMoved = radiansMoved * Math.pow(friction, secBwFrames);
        count += 1;
    }
    console.log(friction, 'Seconds:', count / fps);
}

var testVals = [
    0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9
];

for (var i = 0; i < testVals.length; i++) {
    test(testVals[i])
}
