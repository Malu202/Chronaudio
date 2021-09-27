navigator.mediaDevices.enumerateDevices()
    .then(gotDevices)

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
maxSpeedInput.addEventListener("change", calculateMinimumDelay)

function calculateVelocity() {
    let speedOfSound = 20.05 * Math.sqrt(273.15 + parseFloat(temperatureInput.value));
    let soundDelay = distanceInput.value / speedOfSound;
    let totalTime = (trigger2Index - trigger1Index) / sampleRate;
    let arrowVelocity = distanceInput.value / (totalTime - soundDelay);
    let arrowVelocityImperial = arrowVelocity * 3.28084;

    console.log("Total time: " + totalTime);
    return arrowVelocityImperial;
}

function saveInputValues() {
    let settings = {
        audioZoom: audioZoom.value,
        trigger1Slider: trigger1Slider.value,
        trigger2Slider: trigger2Slider.value,
        distanceInput: distanceInput.value,
        temperatureInput: temperatureInput.value,
        maxSpeedInput: maxSpeedInput.value,
        gainSlider: gainSlider.value
    };

    localStorage.setItem('ChronaudioSettings', JSON.stringify(settings));
}

function loadInputValues() {
    let settings = JSON.parse(localStorage.getItem('ChronaudioSettings'));
    if (!settings) return;
    audioZoom.value = settings.audioZoom;
    trigger1Slider.value = settings.trigger1Slider;
    trigger2Slider.value = settings.trigger2Slider;
    distanceInput.value = settings.distanceInput;
    temperatureInput.value = settings.temperatureInput;
    maxSpeedInput.value = settings.maxSpeedInput;
    gainSlider.value = settings.gainSlider;
}
loadInputValues();

let inputs = document.getElementsByTagName("input");
for (let i = 0; i < inputs.length; i++) { inputs[i].addEventListener("change", saveInputValues) };

window.onload = function () {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    calculateMinimumDelay();
};