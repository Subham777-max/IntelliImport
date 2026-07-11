import { AuthContext } from "./auth.context";

export const AuthProvider = ({ children }) => {
    return(
        <AuthContext.Provider>
            {children}
        </AuthContext.Provider>
    )
}