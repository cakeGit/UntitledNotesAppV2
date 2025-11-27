//Handling for any authorization API calls

//Get current token from cookie
export function getAuthToken() {
    const name = 'authToken=';
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
    console.log("Running auth check");
    //Check for existing cookie, if not there, then send the user to login page (if not already there)
    if (!getAuthToken() && !window.location.href.endsWith('/login')) {
        window.location.href = '/login';
    }
}

export function authElements() {
    return <>
        <script src="https://apis.google.com/js/platform.js" async defer></script>
        <meta name="google-signin-client_id" content="72817083579-kd1gu053ehj8os6snedmut08i4dgl6md.apps.googleusercontent.com"></meta>
    </>
}