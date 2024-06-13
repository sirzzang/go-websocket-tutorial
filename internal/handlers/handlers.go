package handlers

import (
	"fmt"
	"log"
	"net/http"
	"sort"

	"github.com/CloudyKit/jet/v6"
	"github.com/gorilla/websocket"
)

var wsChan = make(chan WsJsonPayload)

var clients = make(map[WebSocketConnection]string)

var views = jet.NewSet(
	jet.NewOSFileSystemLoader("./html"),
	jet.InDevelopmentMode(), // auto reload
)

var upgradeConnection = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool { // allow all connections
		return true
	},
}

// Home renders the home page
func Home(w http.ResponseWriter, r *http.Request) {
	err := renderPage(w, "home.jet", nil)
	if err != nil {
		log.Println(err)
	}
}

type WebSocketConnection struct {
	*websocket.Conn
}

// WsJsonResponse defines the response sent back from websocket
type WsJsonResponse struct {
	Action         string   `json:"action"`
	Message        string   `json:"message"`
	MessageType    string   `json:"message_type"`
	ConnectedUsers []string `json:"connected_users"`
}

// WsJsonPayload defines the websocket request from the client
type WsJsonPayload struct {
	Action   string              `json:"action"`
	Username string              `json:"username"`
	Message  string              `json:"message"`
	Conn     WebSocketConnection `json:"-"`
}

// WsEndpoint upgrades connection to
// 1. client connects to a home page
// 2. server automatically calls ws endpoint to connect
// 3. once connected to ws endpoint, starts goroutine to listen for websocket
// 4. whenever getting payload from websocket channel, stores them and broadcast to all
// 5. if broadcast fails, which means losing client, the server closes connection and removes client from map
func WsEndpoint(w http.ResponseWriter, r *http.Request) {
	ws, err := upgradeConnection.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("error while upgrading connection: %v", err)
	}

	log.Println("client connected to endpoint")

	var response WsJsonResponse
	response.Message = `<em><small>Connected to server</small></em>`

	conn := WebSocketConnection{Conn: ws}
	clients[conn] = ""

	err = ws.WriteJSON(response)
	if err != nil {
		log.Printf("error while writing json: %v", err)
	}

	go ListenForWs(&conn)
}

func ListenForWs(conn *WebSocketConnection) {
	defer func() {
		if r := recover(); r != nil {
			log.Printf("error while listening for websocket: %v\n", r)
		}
	}()

	var payload WsJsonPayload
	for {
		err := conn.ReadJSON(&payload)
		if err != nil {
			// do nothing
		} else {
			payload.Conn = *conn
			wsChan <- payload
		}
	}
}

func ListenToWsChan() {
	var response WsJsonResponse

	for {
		e := <-wsChan

		switch e.Action {
		case "username":
			// get a list of all users and send it back via broadcast
			clients[e.Conn] = e.Username
			response.Action = "list_users"
			response.ConnectedUsers = getUserList()
			broadcastToAll(response)
		case "left":
			log.Printf("client %v left", e.Username)
			response.Action = "list_users"
			delete(clients, e.Conn)
			response.ConnectedUsers = getUserList()
			broadcastToAll(response)
		}

	}
}

func getUserList() []string {
	fmt.Printf("clients: %v\n", clients)
	users := []string{}
	for _, v := range clients {
		users = append(users, v)
	}
	sort.Strings(users)
	return users
}

func broadcastToAll(response WsJsonResponse) {
	for client := range clients {
		err := client.WriteJSON(response)
		if err != nil {
			log.Println("websocket err")
			_ = client.Close()
			delete(clients, client)
		}
	}
}

// renderPage renders a jet template
func renderPage(w http.ResponseWriter, tmpl string, data jet.VarMap) error {
	view, err := views.GetTemplate(tmpl)
	if err != nil {
		log.Printf("error while getting template: %v", err)
		return err
	}

	err = view.Execute(w, data, nil)
	if err != nil {
		log.Printf("error while executing template: %v", err)
		return err
	}
	return nil
}
