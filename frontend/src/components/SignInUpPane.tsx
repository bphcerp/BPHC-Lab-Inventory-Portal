import { CredentialResponse, GoogleLogin } from "@react-oauth/google";
import { FormEvent, FormEventHandler, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toastError, toastWarn } from "../toasts";
import PasswordLoginPane from "./PasswordLoginPane";

const SignInUpPane = () => {
    const [usePass, setUsePass] = useState(false);
    const navigate = useNavigate();

    const handleSignIn = async (credentials: CredentialResponse) => {
        try {
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/user/login`, {
                method: "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(credentials),
            });

            if (response.status === 401) {
                toastWarn("Wrong Credentials");
            } else if (response.status === 404) {
                toastError("User not found");
            }else if (response.status === 200) {
                navigate("/dashboard");
            } 
            else {
                toastError("Something went wrong");
            }
        } catch (error) {
            toastError("Something went wrong");
            console.log(error);
        }
    };

    const handlePasswordSignIn: FormEventHandler<HTMLFormElement> = async (e: FormEvent) => {
        e.preventDefault();

        const hash = async (str: string): Promise<string> => {
            const utf8 = new TextEncoder().encode(str);
            const hashBuffer = await crypto.subtle.digest("SHA-256", utf8);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            const hashHex = hashArray.map((bytes) => bytes.toString(16).padStart(2, "0")).join("");
            return hashHex;
        };

        const formData = new FormData(e.target as HTMLFormElement);
        const email = formData.get("email") as string;
        const pwd = await hash(formData.get("pwd") as string);

        try {
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/user/passlogin`, {
                method: "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ email, pwd }),
            });

            if (response.status === 401) {
                toastWarn("Wrong Credentials");
            } else if (response.status === 200) {
                navigate("/consumables")
            } else if (response.status === 404) {
                toastError("User not found");
            } else {
                toastError("Something went wrong");
            }
        } catch (error) {
            toastError("Something went wrong");
            console.log(error);
        }
    };

    useEffect(() => {
        setUsePass(!navigator.onLine);
    }, []);

    return (
        <div className="SignInUpPane flex flex-col items-center w-3/4 shadow-lg bg-gray-50 text-gray-900 p-3">
            <span className="text-xl mb-4">LAMBDA Inventory Management System</span>
            <span className="text-2xl mb-3">Sign In</span>
            <div className="inputArea w-full grow p-5">
                <div className="flex flex-col w-full h-full">
                    {usePass ? (
                        <PasswordLoginPane onSubmit={handlePasswordSignIn} />
                    ) : (
                        <GoogleLogin
                            text="continue_with"
                            onSuccess={handleSignIn}
                            onError={() => {
                                toastError("Something went wrong!");
                                console.log("Login Failed");
                            }}
                        />
                    )}
                    <div className="flex flex-col items-center mt-4 space-y-5">
                        {usePass ? (
                            <a
                                className="text-xs hover:underline hover:cursor-pointer"
                                onClick={() => setUsePass(false)}
                            >
                                Sign in With Google
                            </a>
                        ) : (
                            <a
                                className="text-xs hover:underline hover:cursor-pointer"
                                onClick={() => setUsePass(true)}
                            >
                                Click Here for Password Login
                            </a>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SignInUpPane;
