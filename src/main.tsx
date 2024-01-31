import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import {AuthProvider, FirebaseAppProvider, FirestoreProvider, useFirebaseApp} from 'reactfire';
import {getAuth} from 'firebase/auth';
import {firebaseConfig} from './firebaseconfig';
import App from "./App.tsx";
import {Admin} from "./Admin.tsx";
import {getFirestore} from "firebase/firestore";

const Index = () => {
    let params = new URLSearchParams(document.location.search);
    const firebaseApp = useFirebaseApp();
    const firestore = getFirestore(firebaseApp);
    const auth = getAuth(firebaseApp);
    if (params.get("admin") === "amogus") {
        return <AuthProvider sdk={auth}>
            <FirestoreProvider sdk={firestore}>
                <Admin/>
            </FirestoreProvider>
        </AuthProvider>;
    } else {
        return <FirestoreProvider sdk={firestore}>
            <App/>
        </FirestoreProvider>;
    }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <FirebaseAppProvider firebaseConfig={firebaseConfig}>
            <Index/>
        </FirebaseAppProvider>
    </React.StrictMode>,
)
