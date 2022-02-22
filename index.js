

let stopped = false;
let dataHistory = new Float32Array();
let gainNode;
let stream = null;
let context;
let sampleRate = null;
async function setup() {
    //await getAudio();
    let audioSource = audioInputSelect.value;
    let constraints = { video: false, audio: true }
    if (audioSource != "auto") constraints = { audio: { deviceId: audioSource ? { exact: audioSource } : undefined } };

    stream = await navigator.mediaDevices.getUserMedia(constraints);


    context = new AudioContext();
    gainNode = context.createGain();
    let source = context.createMediaStreamSource(stream);

    let scriptNode;
    if (!context.createScriptProcessor) {
        scriptNode = context.createJavaScriptNode(0, 1, 1);
    } else {
        scriptNode = context.createScriptProcessor(0, 1, 1);
    }
    sampleRate = context.sampleRate;
    calculateDelays();
    setupBuffers(scriptNode.bufferSize);

    scriptNode.onaudioprocess = function (e) {
        onNewData(e.inputBuffer.getChannelData(0));
    }

    source.connect(gainNode);
    gainNode.connect(scriptNode);
    scriptNode.connect(context.destination);
    drawLoop();
}

async function getAudio() {
    let audioSource = audioInputSelect.value;
    let constraints = { video: false, audio: true }
    if (audioSource != "auto") constraints = { audio: { deviceId: audioSource ? { exact: audioSource } : undefined } };

    let newStream = await navigator.mediaDevices.getUserMedia(constraints);
    if (!stream) stream = newStream;
    else {
        newStream.getTracks().forEach(function (track) {
            stream.addTrack(track);
        });
    }
    console.log("audio running")
}

function setupBuffers(inputBufferSize) {
    dataHistory = new Float32Array(maximumDelay);

    for (let i = 0; i < dataHistory.length; i++) { dataHistory[i] = 0; }
};
function onNewData(newData) {
    if (stopped) return;
    let bufferLength = newData.length;
    let offset = bufferLength;

    dataHistory.set(dataHistory.subarray(offset), 0)
    dataHistory.set(newData, dataHistory.length - bufferLength);

    if (checkTriggers(dataHistory, newData, offset)) {
        stopped = true;
        stream.getTracks().forEach(function (track) {
            track.stop();
            stream.removeTrack(track);
        });
        context.close();
        showStartButton();

        let velocity = calculateVelocity();
        let totalTime = (trigger2Index - trigger1Index) / sampleRate;

        let error = (totalTime - 60 / 240) * 1000;

        let resultString = Math.round(velocity) + " ft/s, " + Math.round(velocity * 0.3048) + " m/s";
        if (!minimalOutputCheckbox.checked) resultString += ", time measured: " + totalTime * 1000 + "ms, error: " + error + "ms";
        results.innerText = resultString + '\n' + results.innerText;
    }
}
function resume() {
    // drawLoop();
    // getAudio();
    setup();
};

gainSlider.addEventListener("change", function () {
    gainNode.gain.value = gainSlider.value;
})

let trigger1Index = null;
let trigger2Index = null;
function checkTriggers(dataHistory, sample, offset) {
    if (trigger1Index != null) {
        trigger1Index -= offset;
        if (trigger1Index < 0) { trigger1Index = null }
    }
    if (trigger2Index != null) {
        trigger2Index -= offset;
        if (trigger1Index < dataHistory.length / 4) { return true }
    }
    if (trigger1Index == null) {
        for (let i = sample.length - offset - 1; i < sample.length; i++) {
            let volume = Math.abs(sample[i]);
            if (volume > trigger1Slider.value) {
                trigger1Index = i + dataHistory.length - sample.length;
                break;
            }
        }
    } else if (trigger2Index == null) {
        for (let i = 0; i < sample.length; i++) {
            let volume = Math.abs(sample[i]);
            if (volume > trigger2Slider.value) {
                let newTrigger = i + dataHistory.length - sample.length;
                if ((newTrigger - trigger1Index) > minimumDelay) {
                    trigger2Index = newTrigger;
                    break;
                }
            }
        }
    }
    return false;
}


function drawLoop() {
    if (stopped) return;
    draw2(dataHistory, true);
    requestAnimationFrame(drawLoop);
}

