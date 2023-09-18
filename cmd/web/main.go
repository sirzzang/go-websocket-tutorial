package main

import (
	"log"
	"net/http"
)

func main() {
	mux := routes()
	log.Println("Starting server on port 9090")

	_ = http.ListenAndServe(":9090", mux)
}
