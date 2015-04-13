/* fountain.js
   Carbon JavaScript standard library
*/

var fountain = function(ctx) {
  ctx.MEMORY_SIZE = 1024 * 1024; // 1MB (enough for small demoes)

  ctx.init = function(recipe) {
    ctx.heap = new ArrayBuffer(ctx.MEMORY_SIZE);

    ctx.drink = recipe(window, null, ctx.heap);
    ctx.drink.init();
  }

  ctx.initWebGL = function (width, height, shaders) {
    // init canvas
    var canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    ctx.container.appendChild(canvas);

    ctx.shaders = shaders;

    // detect WebGL
    var gl = (canvas.getContext("webgl") ||
              canvas.getContext("experimental-webgl"));

    if(!gl) {
      console.error("WebGL is not supported in this browser");
      console.error("Please upgrade your browser.");
      return;
    }

    // save context
    ctx.gl = gl;

    var frag = ctx.loadShader("frag");
    var vert = ctx.loadShader("vert");
    ctx.gl.whiteShader = ctx.gl.createProgram();
    ctx.gl.attachShader(ctx.gl.whiteShader, vert);
    ctx.gl.attachShader(ctx.gl.whiteShader, frag);
    ctx.gl.linkProgram(ctx.gl.whiteShader);

    if(!ctx.gl.getProgramParameter(ctx.gl.whiteShader, ctx.gl.LINK_STATUS)) {
      console.error("Linking failed");
      return null;
    }

    ctx.gl.useProgram(ctx.gl.whiteShader);
    ctx.gl.vertPosAttr = ctx.gl.getAttribLocation(ctx.gl.whiteShader, "aVertexPosition")
    ctx.gl.enableVertexAttribArray(ctx.gl.vertPosAttr);

    ctx.squareBuffer = ctx.gl.createBuffer();
    ctx.gl.bindBuffer(ctx.gl.ARRAY_BUFFER, ctx.squareBuffer);
    ctx.gl.bufferData(ctx.gl.ARRAY_BUFFER, new Float32Array([
      1.0, 1.0, 0.0,
      -1.0, 1.0, 0.0,
      1.0, -1.0, 0.0,
      -1.0, -1.0, 0.0
    ]), ctx.gl.STATIC_DRAW);

    ctx.gl.clearColor(1.0, 1.0, 0.0, 1.0);
    ctx.gl.enable(gl.DEPTH_TEST);
    ctx.gl.depthFunc(gl.LEQUAL);
    ctx.gl.clear(ctx.gl.COLOR_BUFFER_BIT | ctx.gl.DEPTH_BUFFER_BIT);
  }

  ctx.loadShader = function(shadername) {
    var shaderDef = ctx.shaders[shadername];
    var shader;

    if(shaderDef.type == "fragment") {
      shader = ctx.gl.createShader(ctx.gl.FRAGMENT_SHADER);
    } else if(shaderDef.type == "vertex") {
      shader = ctx.gl.createShader(ctx.gl.VERTEX_SHADER);
    } else {
      console.error("Unknown shader type");
      return null;
    }

    ctx.gl.shaderSource(shader, shaderDef.source.join("\n"));
    ctx.gl.compileShader(shader);

    if(!ctx.gl.getShaderParameter(shader, ctx.gl.COMPILE_STATUS)) {
      console.error("Error compiling shader:");
      console.error(ctx.gl.getShaderInfoLog(shader));
      return null;
    }

    return shader;
  }

  ctx.glLoop = function() {
    var value = program.drink.loop();

    ctx.gl.clearColor(value, value, value, 1.0);
    ctx.gl.clear(ctx.gl.COLOR_BUFFER_BIT | ctx.gl.DEPTH_BUFFER_BIT);

    var cx = value;
    var cy = cx;
    var xScale = 0.4;
    var yScale = 0.4;

    ctx.gl.bindBuffer(ctx.gl.ARRAY_BUFFER, ctx.squareBuffer);
    ctx.gl.vertexAttribPointer(ctx.gl.vertPosAttr, 3, ctx.gl.FLOAT, false, 0, 0);

    var pUniform = ctx.gl.getUniformLocation(ctx.gl.whiteShader, "uPMatrix");
    ctx.gl.uniformMatrix4fv(pUniform, false, new Float32Array([1.8106601717798214, 0, 0, 0, 0, 2.4142135623730954, 0, 0, 0, 0, -1.002002002002002, -1, 0, 0, -0.20020020020020018, 0]));

    var mvUniform = ctx.gl.getUniformLocation(ctx.gl.whiteShader, "uMVMatrix");
    ctx.gl.uniformMatrix4fv(mvUniform, false, [xScale, 0, 0, 0, 0, yScale, 0, 0, 0, 0, 1, 0, cx, cy, -6, 1]);

    ctx.gl.drawArrays(ctx.gl.TRIANGLE_STRIP, 0, 4);

    requestAnimationFrame(ctx.glLoop);
  }

  return ctx;
}