package main

import (
	"log"
	"net/http"
	"ws/internal/handlers"
)

func main() {
	mux := routes()

	log.Println("Starting server on port 9090")
	go handlers.ListenToWsChan()

	_ = http.ListenAndServe(":9090", mux)
}
