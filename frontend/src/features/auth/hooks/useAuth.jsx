import { useCallback, useContext } from "react";
import { AuthContext } from "../auth.context";
import authService from "../service/auth.service";

export function useAuth() {
    const {user, setUser, loading, setLoading, error, setError} =  useContext(AuthContext);

    async function handleLogin(email, password) {
        try{
            setLoading(true);
            const response = await authService.login({email, password});
            setUser(response.data);
            setError(null);
            return response;
        }catch(error){
            setError(error);
        } finally {
            setLoading(false);
        }
    }

    async function handleRegister(fullName, email, password) {
        try{
            setLoading(true);
            const response = await authService.register({fullName, email, password});
            setUser(response.data);
            setError(null);
            return response;
        }catch(error){
            setError(error);
        }
        finally {
            setLoading(false);
        }
    }

    async function handleLogout() {
        try{
            setLoading(true);
            await authService.logout();
            setUser(null);
            setError(null);
        }catch(error){
            setError(error);
        }
        finally {
            setLoading(false);
        }
    }

    const handleGetMe = useCallback(async () => {
        try{
            const response = await authService.getMe();
            setUser(response.data);
            setError(null);
            return response;
        }catch(error){
            setError(error);
        }
        finally {
            setLoading(false);
        }
    },[setUser, setError, setLoading]);

    return { user, loading, error, handleLogin, handleRegister, handleLogout, handleGetMe };
}