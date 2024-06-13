package main

import (
	"net/http"
	"ws/internal/handlers"

	"github.com/bmizerany/pat"
)

func routes() http.Handler {
	mux := pat.New()

	fs := http.FileServer(http.Dir("./js"))
	mux.Get("/js/", http.StripPrefix("/js/", fs))
	// fs := http.FileServer(http.Dir("./js/"))
	// mux.Get("/js/", http.StripPrefix("/js", fs))

	mux.Get("/", http.HandlerFunc(handlers.Home))
	mux.Get("/ws", http.HandlerFunc(handlers.WsEndpoint))

	return mux
}
