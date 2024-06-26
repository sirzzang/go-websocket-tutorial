let socket = null;
let o = document.getElementById("output");
let userField = document.getElementById("username");
let messageField = document.getElementById("message");

const ACTION_LIST_USERS = "list_users";
const ACTION_LEFT = "left";
const ACTION_BROADCAST = "broadcast";

window.onbeforeunload = () => {
    console.log("Leaving. Closing socket connection");
    let jsonData = {};
    jsonData["action"] = ACTION_LEFT;
    socket.send(JSON.stringify(jsonData));
}

document.addEventListener("DOMContentLoaded", () => {
    socket = new ReconnectingWebSocket(`ws://${location.host}/ws`, null, {debug: true, reconnectInterval: 3000});
    
    const offline = `<span class="badge bg-danger">Not connected</span>`
    const online = `<span class="badge bg-success">Connected</span>`
    
    let statusDiv = document.getElementById("status");

    socket.onopen = () => {
        console.log("Successfully connected");
        statusDiv.innerHTML = online;
    }

    socket.onclose = () => {
        console.log("Socket connection closed");
        statusDiv.innerHTML = offline;
    }

    socket.onerror = (e) => {
        console.log(`Socket error: ${e.JSON.stringify()}`)
        statusDiv.innerHTML = offline;
    }

    socket.onmessage = msg => {
        let data = JSON.parse(msg.data);
        console.log("Action is: ", data.action);

        switch (data.action) {
            case ACTION_LIST_USERS:
                let ul = document.getElementById("online_users");
                while (ul.firstChild) ul.removeChild(ul.firstChild);

                if (data.connected_users.length > 0) {
                    data.connected_users.forEach(item => {
                        let li = document.createElement("li");
                        li.appendChild(document.createTextNode(item));
                        ul.appendChild(li);
                    })
                }
                break;
            case ACTION_BROADCAST:
                o.innerHTML = o.innerHTML + data.message + "<br>";
                break;
        }
    }

    userField.addEventListener("change", function() {
        let jsonData = {};
        jsonData["action"] = "username";
        jsonData["username"] = this.value;
        socket.send(JSON.stringify(jsonData));
    })

    messageField.addEventListener("keydown", e => {
        if (e.code === "Enter") {
            if (!socket) {
                console.log("no socket connection");
                return false
            }

            if (!isValidChat()) {
                return false;
            }
            
            e.preventDefault();
            e.stopPropagation();
            sendMessage();
        } 
    })

    document.getElementById("sendBtn").addEventListener("click", () => {
        if (!isValidChat()) {
            return false;
        }
        sendMessage();
    })
})


function isValidChat() {
    if ((userField.value == "") || (messageField.value == "")) {
        errorMessage("Fill out user and message!");
        return false;
    } 
    return true;
}

function sendMessage() {
    let jsonData = {};

    jsonData["action"] = ACTION_BROADCAST;
    jsonData["username"] = userField.value;
    jsonData["message"]  = messageField.value;

    socket.send(JSON.stringify(jsonData));

    messageField.value = ""; // empty the message input field
}

function errorMessage(msg) {
    notie.alert({
        type: 'error', 
        text: msg,
      })
}