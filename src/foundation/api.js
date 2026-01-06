export class UnsuccessfulResponseError extends Error {
    constructor(data) {
        super(data.error || "Unknown API error " + JSON.stringify(data));
        this.data = data;
    }

    getData() {
        return this.data;
    }
}

export async function fetchApi(endpoint, body = null, options = {}) {
    let url = window.location.origin + "/api/" + endpoint;
    let fetchOptions = {
        method: body ? 'POST' : 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
        ...options,
    };
    if (body) {
        fetchOptions.body = JSON.stringify(body);
    }
    return fetch(url, fetchOptions)
        .then(response => {
            // if (!response.ok) {
            //     throw new Error('Failed to fetch api: ' + response.statusText);
            // }
            return response.json() || { success: false, error: "Empty response from server" };
        })
        .then(data => {
            if (data?.success === false) {
                if (data.effect == "needs_new_login" && window.location.pathname !== "/get_account") {
                    window.location.href = "/get_account";
                }
                throw new UnsuccessfulResponseError(data);
            }
            return data;
        });
}