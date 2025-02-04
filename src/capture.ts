import {GrabberCaptureClient} from "webrtc-grabber-sdk";
import {useState} from "react";

const webcamConstraint = {aspectRatio: 16 / 9};
const webcamAudioConstraint = true;
const desktopConstraint = {
    video: {
        displaySurface: "window"
    }
};

const detectStreams = async () => {
    const detectedStreams: Record<string, MediaStream> = {};
    const webcamStream = await navigator.mediaDevices.getUserMedia({
        video: webcamConstraint,
        audio: webcamAudioConstraint,
    });
    if (webcamStream) {
        detectedStreams["webcam"] = webcamStream;
    }

    if (desktopConstraint) {
        const desktopStream = await navigator.mediaDevices.getDisplayMedia(desktopConstraint).catch(() => undefined);
        if (desktopStream) {
            detectedStreams["desktop"] = desktopStream;
        }
    }

    return detectedStreams;
}

export type State = "inactive" | "detecting" | "connecting" | "declinded" | "active"

// let currentState: State = "inactive";
// const updateState = (newState: State) => {
//     currentState = newState;
//     const captureButton = document.getElementById("captureButton")!;
//     captureButton.className = newState;
//     if (newState === "connecting") {
//         captureButton.innerText = "connecting ...";
//     } else if (newState === "active") {
//         captureButton.innerText = "OK";
//     }
// }

export const useCapture = (signallingUrl: string): {
    state: State,
    startCapture: (peerName: string) => {}
} => {
    const [state, setState] = useState<State>("inactive");
    return {
        state,
        startCapture: (peerName) => capture(peerName, signallingUrl, setState)
    };
}


export const capture = async (peerName: string, signallingUrl: string, updateState: (status: State) => void = (_) => {
}) => {
    updateState("detecting");
    let streams: Record<string, MediaStream> = {};
    try {
        streams = await detectStreams();
        if(streams["desktop"] === undefined) {
            updateState("declinded");
            return;
        }
    } catch (e) {
        updateState("declinded");
        return;
    }
    const pcs = new Map();
    let peerConnectionConfig: RTCConfiguration | undefined = undefined;
    let pingTimerId: number | undefined = undefined;

    updateState("connecting");
    console.log(signallingUrl);
    const client = new GrabberCaptureClient(peerName, signallingUrl);
    client.target.addEventListener("init_peer", async ({detail: {pcConfig, pingInterval}}: any) => {
        peerConnectionConfig = pcConfig;
        pingInterval = (pingInterval ?? 3000);
        if (pingTimerId) {
            clearInterval(pingTimerId);
        }
        pingTimerId = setInterval((() => {
            console.log("ping");
            client.sendPing(pcs.size, Object.keys(streams));
        }) as TimerHandler, pingInterval);
        console.log(`init peer (pingInterval = ${pingInterval})`);
        updateState("active");
    });

    client.target.addEventListener("offer", async ({
                                                       detail: {
                                                           playerId,
                                                           offer,
                                                           streamType
                                                       }
                                                   }: any) => {
        console.log(`create new peer connection for ${playerId}`);
        pcs.set(playerId, new RTCPeerConnection(peerConnectionConfig));
        const pc = pcs.get(playerId);

        streamType = streamType ?? "desktop";
        const stream = streams[streamType];
        if (stream) {
            stream.getTracks().forEach(track => {
                console.log("added track: ", track);
                pc.addTrack(track, stream);
            });
        } else {
            console.warn(`No surch ${streamType} as captured stream`);
        }

        pc.addEventListener("icecandidate", (event: any) => { // FIXME: remove once proper types are implemented
            console.log(`send ice for player ${playerId}`);
            client.sendGrabberICE(playerId, event.candidate);
        })

        pc.addEventListener('connectionstatechange', ({target: connection}: any) => { // FIXME: remove once proper types are implemented
            console.log(`change player ${playerId} connection state ${connection.connectionState}`);
            if (connection.connectionState === "failed") {
                connection.close();
                pcs.delete(playerId);
                console.log(`close connection for ${playerId}`);
            }
        });

        await pc.setRemoteDescription(offer);
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        client.sendOfferAnswer(playerId, answer);
        console.log(`send offer_answer for ${playerId}`);
    });

    client.target.addEventListener('player_ice', async ({detail: {peerId, candidate}}: any) => { // FIXME: remove once proper types are implemented
        pcs.get(peerId).addIceCandidate(candidate)
            .then(() => console.log(`add player_ice from ${peerId}`));
    });
};
