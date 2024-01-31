import classes from "./Game.module.css";
import {useFirestore, useFirestoreCollection} from "reactfire";
import {query, where, collection} from 'firebase/firestore';
import {RunningGame} from "./RunningGame.tsx";
import {usePlayerState} from "./PlayerContext.tsx";
// import { FirestoreProvider, useFirestoreDocData, useFirestore, useFirebaseApp } from 'reactfire';

export const Game = () => {
    const fs = useFirestore();
    const {status, data: upcomingBattles} = useFirestoreCollection(
        query(
            collection(fs, "battles"),
            where("running", "==", true),
        )
    );
    const {login} = usePlayerState();

    console.log(status);

    const runningBattle = (status === "success" &&
        upcomingBattles.size != 0 &&
        upcomingBattles.docs[0]) || undefined;

    const isOurBattle = runningBattle?.get("participants").indexOf(login) !== -1;

    return (
        <div className={classes.appContainer}>
            <div>
                <button onClick={() => window.location.reload()}>Выйти</button>
            </div>
            {runningBattle ?
                (isOurBattle ?
                    <RunningGame battleId={runningBattle.id} link={runningBattle.get("link")}/>
                    :
                    <div>
                        Сейчас соревнуются {runningBattle?.get("participants").join(" и ")}
                    </div>)
                : (
                    <div>
                        Сейчас никто не соревнуется
                    </div>
                )
            }
        </div>
    )
}

export default Game;
