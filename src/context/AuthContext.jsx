import { auth } from "../firebase/firebase.config";
import { GithubAuthProvider, GoogleAuthProvider, createUserWithEmailAndPassword, onAuthStateChanged, signInWithEmailAndPassword, signInWithPopup, signOut, updateProfile } from "firebase/auth";
import { createContext, useEffect, useState } from "react";
import PropTypes from 'prop-types'
import useAxiosSecure from "../hooks/useAxiosSecure";

// Create a context to manage user authentication.
export const UserContext = createContext();

// Initialize authentication providers.
const googleProvider = new GoogleAuthProvider();
const githubProvider = new GithubAuthProvider();
// const auth = auth();

// Authentication context component.
const AuthContext = ({ children }) => {
    // State for the currently authenticated user and loading status.
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const axios = useAxiosSecure();

    // Function to handle authentication actions.
    const handleAuth = (authAction, ...params) => {
        setLoading(true);
        return authAction(auth, ...params);
    }

    const updateUser = (name, photo) => {
        setLoading(true);
        return updateProfile(auth.currentUser, { displayName: name, photoURL: photo })
    };

    // Unsubscribe from the authentication state changes when the component unmounts.
    useEffect(() => {
        // Effect to listen for changes in authentication state.
        const unSubscribe = onAuthStateChanged(auth, async (currentUser) => {
            setUser(currentUser);
            setLoading(false);
            if (currentUser) {
                try {
                    await axios.post('/create-access-key', { email: currentUser?.email });
                } catch (error) {
                    console.log(error);
                }
            } else {
                try {
                    await axios.post('/clear-access-key');
                } catch (error) {
                    console.log(error);
                }
            }
        })

        // Clean up the effect.
        return () => unSubscribe();
    }, [axios])

    // Authentication context information.
    const AuthInfo = {
        // Functions for authentication actions.
        signInWithGoogle: () => handleAuth(signInWithPopup, googleProvider),
        signInWitGithub: () => handleAuth(signInWithPopup, githubProvider),
        signInWithEmailPass: (email, passsword) => handleAuth(signInWithEmailAndPassword, email, passsword),
        signUpWithEmailPass: (email, passsword) => handleAuth(createUserWithEmailAndPassword, email, passsword),
        updateUser,
        signOutUser: () => handleAuth(signOut),

        // Current user and loading status.
        user,
        loading
    }

    // Provide authentication context to child components.
    return (
        <UserContext.Provider value={AuthInfo}>
            {children}
        </UserContext.Provider>
    );
};

AuthContext.propTypes = {
    children: PropTypes.node,
}

export default AuthContext;