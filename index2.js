let AudioContext = window.AudioContext || window.webkitAudioContext || false;
let canvas = document.getElementById("canvas");
let context2d = canvas.getContext("2d");
let audioZoom = document.getElementById("audioZoom");
let audioZoomLabel = document.getElementById("audioZoomLabel");
let trigger1Slider = document.getElementById("trigger1Slider");
let trigger2Slider = document.getElementById("trigger2Slider");
let results = document.getElementById("results");
let resumeButton = document.getElementById("resumeButton");
let distanceInput = document.getElementById("distanceInput");
let temperatureInput = document.getElementById("temperatureInput");
let maxSpeedInput = document.getElementById("maxSpeedInput");
let gainSlider = document.getElementById("gainSlider");
let audioInputSelect = document.getElementById("audioInputSelect");

let zoom = parseInt(audioZoom.value);
let drawnData = new Float32Array(),
    recBuffersR = new Float32Array();



setup();
function setup() {
    navigator.getUserMedia({ audio: true },
        function (stream) {
            var context = new AudioContext();
            var source = context.createMediaStreamSource(stream);

            if (!context.createScriptProcessor) {
                node = context.createJavaScriptNode(256, 2, 2);
            } else {
                node = context.createScriptProcessor(256, 2, 2);
            }
            setupBuffers(node.bufferSize);
            // listen to the audio data, and record into the buffer
            node.onaudioprocess = function (e) {

                let bufferLength = e.inputBuffer.getChannelData(0).length;
                let offset = bufferLength - 1;
                let newData = e.inputBuffer.getChannelData(0);


                drawnData.set(drawnData.subarray(offset), 0)
                drawnData.set(newData, bufferLength * (zoom - 1));
            }

            source.connect(node);
            // if the ScriptProcessorNode is not connected to an output the "onaudioprocess" event is not triggered in chrome
            node.connect(context.destination);
            drawNew();
        },
        function (e) {
            // do something about errors
        });
}

function setupBuffers(bufferSize) {
    zoom = parseInt(audioZoom.value);
    drawnData = new Float32Array(bufferSize * zoom);
    for (let i = 0; i < drawnData.length; i++) { drawnData[i] = 0; }
};


let trigger1Index = null;
let trigger2Index = null;
function drawNew() {
    draw2(drawnData, true);
    requestAnimationFrame(drawNew);
}

