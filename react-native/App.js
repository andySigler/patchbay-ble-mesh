import React, { Component } from 'react';
import { View, Dimensions } from 'react-native';

import Canvas from 'react-native-canvas';


function drawCircle(context, color, x, y) {
  context.strokeStyle = color;
  context.lineWidth = 5; // hard-coded width
  context.beginPath();
  context.arc(x, y, 30, 0, Math.PI * 2, false);  // hard-coded radius
  context.closePath();
  context.stroke();
}


function updateBouncingCircleCoords(width, height, pos, step) {
  pos.x += step.x;
  if (pos.x < 0 || pos.x > width) {
    step.x *= -1;
    pos.x += step.x;
  }
  pos.y += step.y;
  if (pos.y < 0 || pos.y > height) {
    step.y *= -1;
    pos.y += step.y;
  }
  return [pos, step]
}


function drawLoop(width, height, context, pos, step) {
  [pos, step] = updateBouncingCircleCoords(width, height, pos, step);
  context.save();
  context.fillStyle = 'gray';
  context.fillRect(0, 0, width, height);
  drawCircle(context, 'blue', pos.x, pos.y);
  drawCircle(context, 'red', width / 2, height / 2);
  context.restore();
  requestAnimationFrame(() => drawLoop(width, height, context, pos, step));
}


class App extends Component {

  initCanvas(c) {
    const canvas = c
    const thisWindow = Dimensions.get('window');
    canvas.width = thisWindow.width;
    canvas.height = thisWindow.height;
    const pos = {x: 0, y: 0};
    const step = {x: 5, y: 5};
    pos.x = canvas.width / 2;
    pos.y = canvas.height / 2;
    context = canvas.getContext('2d');
    const width = Number(canvas.width);
    const height = Number(canvas.height);
    requestAnimationFrame(() => drawLoop(width, height, context, pos, step));
  }

  render() {
    return (
      <View>
        <Canvas ref={this.initCanvas}/>
      </View>
    );
  }
}

export default App;
