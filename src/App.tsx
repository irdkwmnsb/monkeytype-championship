// import {FirestoreProvider, useFirebaseApp} from "reactfire";
// import {getFirestore} from 'firebase/firestore';
import React, {useCallback, useEffect, useState} from "react";
import {PlayerContext, PlayerState} from "./PlayerContext.tsx";
import Game from "./Game.tsx";
import {useCapture} from "./capture.ts";

export const signallingUrl = "wss://grabber.kbats.ru"

export const App = () => {
    const [username, setUsername] = useState("");
    const [playerState, setPlayerState] = useState<PlayerState | undefined>(undefined);
    const {state: captureState, startCapture} = useCapture(signallingUrl);

    const onEnterClick = useCallback((_: React.MouseEvent<HTMLButtonElement>) => {
        localStorage.setItem("savedUsername", username);
        setPlayerState({login: username});
        console.log(username);
        startCapture(username);
    }, [username]);

    useEffect(() => {
        const storedUsername = localStorage.getItem("savedUsername");
        if (storedUsername !== null) {
            setUsername(storedUsername);
        }
    }, []);

    return <>
        {playerState === undefined &&
            <label>
                Введите ваш ИСУ:
                <input type="text" value={username} onChange={(ev) => setUsername(ev.target.value)}/>
                <button onClick={onEnterClick}>Войти</button>
            </label>
        }
        {playerState !== undefined && captureState !== "active" &&
            <div>
                Пожалуйста разрешите доступ к вебкамере и к полному экрану.
                ({captureState})
            </div>
        }
        {playerState !== undefined && captureState === "declinded" &&
            <div>Перезагрузите страницу.</div>
        }
        {playerState !== undefined && captureState === "active" &&
            <PlayerContext.Provider value={playerState}>
                <Game/>
            </PlayerContext.Provider>
        }
    </>;
}
export default App;
