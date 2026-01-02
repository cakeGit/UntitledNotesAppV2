//Handling for any authorization API calls

//Get current token from cookie
export function getAuthToken() {
    const name = 'auth_present=';
    const decodedCookie = decodeURIComponent(document.cookie);
    const cookieComponents = decodedCookie.split(';');
    for(let i = 0; i < cookieComponents.length; i++) {
        let c = cookieComponents[i];
        while (c.charAt(0) === ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) === 0) {
            return c.substring(name.length, c.length);
        }
    }
    return "";
}

export function withAuthCheck() {
    //Check for existing cookie, if not there, then send the user to login page (if not already there)
    if (!getAuthToken() && !window.location.href.endsWith('/get_account')) {
        console.log("No auth token found, redirecting to login page");
        window.location.href = '/get_account';
    }
}
