let socket = null;
let o = document.getElementById("output");


window.onbeforeunload = function() {
    console.log("Leaving. Closing socket connection");
    let jsonData = {};
    jsonData["action"] = "left";
    socket.send(JSON.stringify(jsonData));
}

document.addEventListener("DOMContentLoaded", function() {
    socket = new WebSocket(`ws://${location.host}/ws`);

    socket.onopen = () => {
        console.log("Successfully connected");
    }

    socket.onclose = () => {
        console.log("Socket connection closed");
    }

    socket.onerror = error => {
        console.log("error")
    }

    socket.onmessage = msg => {
        let data = JSON.parse(msg.data);
        console.log("Action is: ", data.action);

        switch (data.action) {
            case "list_users":
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
            case "broadcast":
                o.innerHTML = o.innerHTML + data.message + "<br>";
                break;
        }
    }

    let userInput = document.getElementById("username");
    userInput.addEventListener("change", function() {
        let jsonData = {};
        jsonData["action"] = "username";
        jsonData["username"] = this.value;
        socket.send(JSON.stringify(jsonData));
    })

    document.getElementById("message").addEventListener("keydown", function(e) {
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

    document.getElementById("sendBtn").addEventListener("click", function() {
        if (!isValidChat()) {
            return false;
        }
        sendMessage();
    })
})


function isValidChat() {
    let userField = document.getElementById("username");
    let messageField = document.getElementById("message");


    if ((userField.value == "") || (messageField.value == "")) {
        alert("fill out user and message");
        return false;
    } 
    return true;
}

function sendMessage() {
    let jsonData = {};
    jsonData["action"] = "broadcast";
    jsonData["username"] = document.getElementById("username").value;
    jsonData["message"]  = document.getElementById("message").value;
    socket.send(JSON.stringify(jsonData));

    document.getElementById("message").value = ""; // empty the message input field
}