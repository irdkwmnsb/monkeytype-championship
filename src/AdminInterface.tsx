import {useFirestore, useFirestoreCollectionData} from "reactfire";
import styles from "./Admin.module.css";
import {SyntheticEvent, useCallback, useLayoutEffect, useRef, useState} from "react";
import classNames from "classnames";
import {collection, doc, setDoc, updateDoc, DocumentData, Timestamp, query, orderBy, limit} from "firebase/firestore";
import {GrabberPlayerClient} from "webrtc-grabber-sdk";
import {signallingUrl} from "./App.tsx";

export const AddInterface = () => {
    const fs = useFirestore();
    const [id, setId] = useState("")
    const [link, setLink] = useState("")
    const [participants, setParticipants] = useState("");
    const battlesCollection = collection(fs, `battles/`);
    const onSubmit = useCallback(async (ev: SyntheticEvent) => {
        ev.preventDefault();
        const participantsArray = participants.split(" ");
        await setDoc(doc(battlesCollection, id), {
            events: [],
            link,
            participants: participantsArray,
            running: false,
            timestamp: Timestamp.now()
        })
    }, [id, link, participants, fs]);

    return <form className={styles.startForm} onSubmit={onSubmit}>
        <label>
            id
            <input type="text" value={id} onChange={(ev) => setId(ev.target.value)}></input>
        </label>
        <label>
            Ссылка на игру
            <input type="text" value={link} onChange={(ev) => setLink(ev.target.value)}></input>
        </label>
        <label>
            Участники
            <input type="text" value={participants} onChange={(ev) => setParticipants(ev.target.value)}></input>
        </label>
        <input type="submit" value="Добавить"/>
    </form>;
}

export const ScreenViewer = ({peerId}: { peerId: string }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    useLayoutEffect(() => {
        const client = new GrabberPlayerClient("play", signallingUrl);
        client.authorize("live");
        client.on("initialized", () => {
            client.connect({peerName: peerId}, "desktop", (track) => {
                console.log("got video track");
                const remoteVideo = videoRef.current as HTMLVideoElement;
                remoteVideo.srcObject = track;
                remoteVideo.play();
                console.log(`pc2 received remote stream (${peerId}) `, track);
            });
        });
        return () => client.close();
    }, []);
    return <video ref={videoRef} className={styles.video}></video>;
}

export const EventViewer = ({data}: { data: DocumentData }) => {
    const [isOpen, setIsOpen] = useState(false);
    return <div onClick={() => setIsOpen((open) => !open)}>
        <div className={styles.eventHeader}>
            <span>{data.id}</span>
            {data.event.type === "finish" && <span>{data.event.result.wpm} ({data.event.result.rawWpm})</span>}
        </div>
        {isOpen && <pre>{JSON.stringify(data, null, 2)}</pre>}
    </div>
}

export const GameViewer = ({data}: { data: DocumentData }) => {
    const fs = useFirestore();
    const {status, data: eventData} = useFirestoreCollectionData(
        collection(fs, 'battles', data.id, 'events'),
        {idField: "id"}
    )
    return <div className={styles.viewer}>
        <div className={styles.videoGrid}>
        {data.participants.map((id: string) =>
            <div key={id}>
                <div>{id}</div>
                <ScreenViewer peerId={id}/>
            </div>
        )}
        </div>
        <div>
            Events:
            {status === "success" ? eventData.map((event) => (
                <EventViewer data={event}/>
            )) : status}
        </div>
    </div>
}

export const Game = ({data}: { data: DocumentData }) => {
    const fs = useFirestore();
    const [debugOpen, setDebugOpen] = useState(false);
    const [viewOpen, setViewOpen] = useState(false);
    const toggleStart = useCallback(async () => {
        const gameRef = doc(collection(fs, `battles/`), data.id);
        await updateDoc(gameRef, {
            running: !data.running
        });
    }, [data.id, data.running]);
    return <div className={classNames({
        [styles.activeRow]: data.running
    })}>
        <div className={styles.gameRow}>
            <span onClick={() => setDebugOpen((open) => !open)}>
                {data.id}
            </span>
            <span>
                {new Date(data.timestamp.seconds * 1000).toLocaleString()}
            </span>
            <a href={data.link}>mk</a>
            <span>participants: {JSON.stringify(data.participants)}</span>
            <button onClick={toggleStart}>
                {data.running ? "Stop" : "Start"}
            </button>
            <button onClick={() => setViewOpen((open) => !open)}>
                View
            </button>
        </div>
        {debugOpen && <pre>
            {JSON.stringify(data)}
        </pre>
        }
        {viewOpen &&
            <GameViewer data={data}/>
        }
    </div>;
}

export const ListGames = () => {
    const fs = useFirestore();
    const {status, data} = useFirestoreCollectionData(
        query(collection(fs, `battles/`), orderBy("timestamp", "desc"), limit(10)),
        {idField: "id"}
    );
    if (status === "error") {
        return "Error."
    }
    if (status === "loading") {
        return "Loading";
    }
    return <div>
        {data.map((data) =>
            <Game data={data} key={data.id}/>
        )}
    </div>;
}

export const AdminInterface = () => {
    return <>
        <AddInterface/>
        <ListGames/>
    </>;
}
