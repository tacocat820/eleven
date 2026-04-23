let serverTest = undefined;
let usernameTest = undefined;
let passwdTest = undefined;
let authTimeout = undefined;

let validServer = true;
let server = document.getElementById("server");
let server_url = undefined;

let authSession = undefined;

let AUTH = {};

function checkServerTimeout(params) {
    clearTimeout(serverTest);
    serverTest = setTimeout(checkServer, 2000);    

    document.getElementById("server").classList.remove("good");
    document.getElementById("server").classList.remove("bad");
    document.getElementById("server").classList.add("thinking");

    let s = document.getElementById("server").value;
    if (s.startsWith("https://") || s.startsWith("http://")) {
        server_url = s;
    } else {
        server_url = "https://" + s;
    }

    console.log(server_url);
}
async function checkServer(params) {
    try {
        validServer = true;
        let response = await fetch(`${server_url}/.well-known/matrix/client`);

        document.getElementById("server").classList.remove("thinking");
        document.getElementById("server").classList.remove("bad");
        document.getElementById("server").classList.add("good");
    } catch (err) {
        console.log(err);
        validServer = false;

        document.getElementById("server").classList.remove("thinking");
        document.getElementById("server").classList.remove("good");
        document.getElementById("server").classList.add("bad");
    }
}

function checkUsernameTimeout(params) {
    clearTimeout(usernameTest);
    if (!validServer) {
        document.getElementById("username").classList.remove("good");
        document.getElementById("username").classList.remove("bad");
        document.getElementById("username").classList.remove("thinking");
        return;
    }
    usernameTest = setTimeout(checkUsername, 500);    

    document.getElementById("username").classList.remove("good");
    document.getElementById("username").classList.remove("bad");
    document.getElementById("username").classList.add("thinking");
}
async function checkUsername(params) {
    try {
        let s = document.getElementById("server").value;
        let u = document.getElementById("username").value;

        let response = await fetch(`${server_url}/_matrix/client/v3/register/available?username=${u}`);
        if (!response.ok) throw 1;

        document.getElementById("username").classList.remove("thinking");
        document.getElementById("username").classList.remove("bad");
        document.getElementById("username").classList.add("good");
    } catch (err) {
        console.log(err);

        document.getElementById("username").classList.remove("thinking");
        document.getElementById("username").classList.remove("good");
        document.getElementById("username").classList.add("bad");
    }
}

function checkPasswdTimeout(params) {
    clearTimeout(usernameTest);
    if (!validServer) {
        document.getElementById("confirm_passwd").classList.remove("good");
        document.getElementById("confirm_passwd").classList.remove("bad");
        document.getElementById("confirm_passwd").classList.remove("thinking");
        return;
    }
    passwdTest = setTimeout(checkPasswd, 500);    

    document.getElementById("confirm_passwd").classList.remove("good");
    document.getElementById("confirm_passwd").classList.remove("bad");
    document.getElementById("confirm_passwd").classList.add("thinking");
}
async function checkPasswd(params) {
    try {
        let a = document.getElementById("passwd").value;
        let b = document.getElementById("confirm_passwd").value;

        if (a != b) throw 1;

        document.getElementById("confirm_passwd").classList.remove("thinking");
        document.getElementById("confirm_passwd").classList.remove("bad");
        document.getElementById("confirm_passwd").classList.add("good");
    } catch (err) {
        console.log(err);

        document.getElementById("confirm_passwd").classList.remove("thinking");
        document.getElementById("confirm_passwd").classList.remove("good");
        document.getElementById("confirm_passwd").classList.add("bad");
    }
}

function passwdDone() {
    let a = document.getElementById("passwd").value;
    if (document.getElementById("confirm_passwd").value != "") {
        checkPasswd();
    }

    if (a.length < 6) {
        document.getElementById("passwd").classList.remove("good");
        document.getElementById("passwd").classList.add("thinking");
    } else {
        document.getElementById("passwd").classList.add("good");
        document.getElementById("passwd").classList.remove("thinking");
    }
}
async function tryAuth() {
    if (!validServer) return;

    let s = document.getElementById("server").value;
    let u = document.getElementById("username").value;
    let p = document.getElementById("passwd").value;
    server_name = s;

    // recheck username
    try {
        let response = await fetch(`${server_url}/_matrix/client/v3/register/available?username=${u}`);
        if (!response.ok) throw 1;
    } catch (err) {
        return;
    }
    
    // recheck passwd
    try {
        let b = document.getElementById("confirm_passwd").value;

        if (p != b) throw 1;
    } catch (err) {
        return;
    }

    AUTH = {
            "initial_device_display_name": "Make Matrix account thing",
            "password": document.getElementById("passwd").value,
            "username": document.getElementById("username").value
        };

    authSession = await (await fetch(`${server_url}/_matrix/client/v3/register`, {
        method: "POST",
        body: JSON.stringify(AUTH) 
    })).json();

    console.log(authSession);

    authTimeout = setTimeout(keepAuth, 1000);

    AUTH.auth = {
        "session": authSession.session
    };

    if (authSession.flows[0].stages[0] == "m.login.registration_token") {   
        document.getElementById("authb").innerHTML = `
        <h1 class="h">Enter the token:</h1>
        <hr><br>
        <div class="field_div">
            <input type="text" id="token" class="field"> </br>
            <label for="token">Token</label>
        </div>
        <br><br><hr><br>
        <button onclick="addToAuth()"> asdasd</button>`;  
    } else if (authSession.flows[0].stages[0] == "m.login.dummy") {   
        document.getElementById("authb").innerHTML = `
        <h1 class="h">Thinking...</h1>`;  
        AUTH.auth.type = "m.login.dummy";
    } else {
        document.getElementById("authb").innerHTML = "unsupported server";   
    }
}

function addToAuth() {
    if (document.getElementById("token") != null) {
        AUTH.auth.type = "m.login.registration_token";
        AUTH.auth.token = document.getElementById("token").value;
    }    
}

async function keepAuth(params) {
    console.log("trying");

    const fetched = await fetch(`${server_url}/_matrix/client/v3/register`, {
        method: "POST",
        body: JSON.stringify(AUTH)
    });
    authSession = await fetched.json();

    if (fetched.ok) {
        document.getElementById("authb").innerHTML = `
        <h1 class="h">Done!</h1>
        You can now login as ${authSession.user_id}`;
        return;
    }

    clearTimeout(authTimeout);
    authTimeout = setTimeout(keepAuth, 1000);
}
