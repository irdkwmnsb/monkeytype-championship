import { useAuth, useSigninCheck } from 'reactfire';
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { Auth } from "firebase/auth";
import {AdminInterface} from "./AdminInterface.tsx";

// const signOut = (auth: Auth) => auth.signOut().then(() => console.log('signed out'));
const signIn = async (auth: Auth) => {
    const provider = new GoogleAuthProvider();

    await signInWithPopup(auth, provider);
}


export const Admin = () => {
    const { status, data: signinResult } = useSigninCheck();
    const auth = useAuth();

    if (status === 'loading') {
        return "Loading";
    }

    const { signedIn, user } = signinResult;

    if (signedIn) {
        if(user?.uid !== "8PWfCBMCXiXQ0vYTjqyCHF9rscn1") {
            return "Вы не админ.";
        }
        return <AdminInterface/>;
    } else {
        return <button onClick={() => signIn(auth)}>Стереть жесткий диск</button>;
    }
};
