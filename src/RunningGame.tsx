import classes from "./Game.module.css";
import {useCallback, useEffect} from "react";
import {useFirestore} from "reactfire";
import {collection, setDoc, doc} from "firebase/firestore";
import {usePlayerState} from "./PlayerContext.tsx";

type Props = {
    battleId: string,
    link: string
}

export const RunningGame = ({battleId, link}: Props) => {
    const fs = useFirestore();
    const { login} = usePlayerState();

    const eventsCollection = collection(fs, `battles/${battleId}/events`);

    console.log(login);

    const messageListener = useCallback(async (event: MessageEvent) => {
        if(["restart", "finish", "start"].indexOf(event.data.type) === -1) {
            return;
        }
        await setDoc(doc(eventsCollection, `${login}-${event.data.type}-${Date.now()}`), {
            player: login,
            event: event.data
        })
    }, [fs, login]);
    useEffect(() => {
        window.addEventListener("message", messageListener);
        return () => window.removeEventListener("message", messageListener)
    }, [messageListener])

    return <iframe src={link} className={classes.monkeyTypeContainer}></iframe>
}
