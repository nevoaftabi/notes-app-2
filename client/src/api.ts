import { getToken } from "@clerk/react";

async function authFetch(url: string, method: string, authToken: string, body?: string) {
    const options: RequestInit = {
        method,
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${authToken}`
        },
    };

    if(body) {
        options.body = body;
    }

    return fetch(url, options);
}