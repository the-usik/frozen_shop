async function request(path = "", params = {}) {
    try {
        let response = await fetch(path, {
            method: "POST",
            headers: {
                "content-type": "application/json"
            },
            body: JSON.stringify(params)
        });

        return response.json();
    } catch (error) {
        return { error: 0, error_message: error.message };
    }
}