import { createContext, useContext } from "react";

export interface PlayerState {
    login: string;
}

export const PlayerContext = createContext<PlayerState>(null!);

export const usePlayerState = (): PlayerState => useContext(PlayerContext);
