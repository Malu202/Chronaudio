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
let minSpeedInput = document.getElementById("minSpeedInput");
let gainSlider = document.getElementById("gainSlider");
let audioInputSelect = document.getElementById("audioInputSelect");
let minimalOutputCheckbox = document.getElementById("minimalOutputCheckbox");

navigator.mediaDevices.enumerateDevices().then(gotDevices)

function gotDevices(deviceInfos) {
    for (var i = 0; i !== deviceInfos.length; ++i) {
        var deviceInfo = deviceInfos[i];
        var option = document.createElement('option');
        option.value = deviceInfo.deviceId;
        if (deviceInfo.kind === 'audioinput') {
            option.text = deviceInfo.label ||
                'Microphone ' + (audioInputSelect.length + 1);
            audioInputSelect.appendChild(option);
        }
    };
}
let minimumDelay;
function calculateMinimumDelay() {
    let speedOfSound = 20.05 * Math.sqrt(273.15 + parseFloat(temperatureInput.value));
    let soundDelay = distanceInput.value / speedOfSound;
    let totalTime = soundDelay + distanceInput.value / (maxSpeedInput.value * 0.3048);
    minimumDelay = totalTime * sampleRate;
}
let maximumDelay;
function calculateMaximumDelay() {
    let soundDelay = distanceInput.value / speedOfSound();
    let totalTime = soundDelay + distanceInput.value / (minSpeedInput.value * 0.3048);
    maximumDelay = totalTime * sampleRate;
}
function calculateDelays() {
    calculateMinimumDelay();
    calculateMaximumDelay();
}
temperatureInput.addEventListener("change", calculateDelays);
distanceInput.addEventListener("change", calculateDelays);
minSpeedInput.addEventListener("change", calculateDelays);
maxSpeedInput.addEventListener("change", calculateDelays);


function calculateVelocity() {
    let speedOfSound = 20.05 * Math.sqrt(273.15 + parseFloat(temperatureInput.value));
    let soundDelay = distanceInput.value / speedOfSound;
    let totalTime = (trigger2Index - trigger1Index) / sampleRate;
    let arrowVelocity = distanceInput.value / (totalTime - soundDelay);
    let arrowVelocityImperial = arrowVelocity * 3.28084;

    console.log("Total time: " + totalTime);
    return arrowVelocityImperial;
}
function speedOfSound() {
    return 20.05 * Math.sqrt(273.15 + parseFloat(temperatureInput.value));
}


function saveInputValues() {
    let settings = {
        trigger1Slider: trigger1Slider.value,
        trigger2Slider: trigger2Slider.value,
        distanceInput: distanceInput.value,
        temperatureInput: temperatureInput.value,
        maxSpeedInput: maxSpeedInput.value,
        minSpeedInput: minSpeedInput.value,
        gainSlider: gainSlider.value,
        minimalOutputCheckbox: minimalOutputCheckbox.checked
    };

    localStorage.setItem('ChronaudioSettings', JSON.stringify(settings));
}

function loadInputValues() {
    let settings = JSON.parse(localStorage.getItem('ChronaudioSettings'));
    if (!settings) return;
    trigger1Slider.value = settings.trigger1Slider;
    trigger2Slider.value = settings.trigger2Slider;
    distanceInput.value = settings.distanceInput;
    temperatureInput.value = settings.temperatureInput;
    maxSpeedInput.value = settings.maxSpeedInput;
    minSpeedInput.value = settings.minSpeedInput;
    gainSlider.value = settings.gainSlider;
    minimalOutputCheckbox.checked = settings.minimalOutputCheckbox;
}
loadInputValues();

let inputs = document.getElementsByTagName("input");
for (let i = 0; i < inputs.length; i++) { inputs[i].addEventListener("change", saveInputValues) };

window.onload = function () {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
};

resumeButton.onclick = function () {
    if (stopped) {
        reset();
        resume();
    } else {
        //initial start
        setup();
        resumeButton.style.display = "none";
        resumeButton.innerText = "Resume";
    }
}
function reset() {
    trigger1Index = null;
    trigger2Index = null;
    stopped = false;
    resumeButton.style.display = "none";
}
function showStartButton() {
    resumeButton.style.display = "inline-block";
}