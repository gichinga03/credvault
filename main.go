package main

import (
	"embed"
	"fmt"
	"io/ioutil"
	"log"
	"os"
	"path/filepath"
	"runtime"
	"time"

	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/assetserver"
	"github.com/wailsapp/wails/v2/pkg/options/linux"
	"github.com/wailsapp/wails/v2/pkg/options/windows"
)

//go:embed all:frontend/dist
var assets embed.FS

func getAppDir() string {
	switch runtime.GOOS {
	case "windows":
		appData := os.Getenv("APPDATA")
		if appData == "" {
			appData = filepath.Join(os.Getenv("USERPROFILE"), "AppData", "Roaming")
		}
		return filepath.Join(appData, "CredVault")
	case "darwin":
		home, _ := os.UserHomeDir()
		return filepath.Join(home, "Library", "Application Support", "CredVault")
	default:
		home, _ := os.UserHomeDir()
		return filepath.Join(home, ".credvault")
	}
}

func main() {
	appDir := getAppDir()
	os.MkdirAll(appDir, 0700)

	logPath := filepath.Join(appDir, "startup.log")
	logFile, err := os.OpenFile(logPath, os.O_CREATE|os.O_WRONLY|os.O_TRUNC, 0600)
	if err == nil {
		log.SetOutput(logFile)
		defer logFile.Close()
	}
	log.SetFlags(log.LstdFlags | log.Lshortfile)
	log.Printf("CredVault starting - OS: %s ARCH: %s TIME: %s", runtime.GOOS, runtime.GOARCH, time.Now().String())
	log.Printf("App dir: %s", appDir)

	app := NewApp()
	log.Println("App created, starting Wails...")

	webviewPath := filepath.Join(appDir, "webview")
	os.MkdirAll(webviewPath, 0700)

	runErr := wails.Run(&options.App{
		Title:     "CredVault",
		Width:     1200,
		Height:    760,
		MinWidth:  900,
		MinHeight: 600,
		AssetServer: &assetserver.Options{
			Assets: assets,
		},
		BackgroundColour: &options.RGBA{R: 13, G: 15, B: 18, A: 1},
		OnStartup:        app.startup,
		Bind:             []interface{}{app},
		Linux: &linux.Options{
			WindowIsTranslucent: false,
		},
		Windows: &windows.Options{
			WebviewIsTransparent: false,
			WindowIsTranslucent:  false,
			WebviewUserDataPath:  webviewPath,
		},
	})

	if runErr != nil {
		log.Printf("FATAL: %v", runErr)
		errMsg := fmt.Sprintf("CredVault failed to start:\n\n%v\n\nFull log: %s", runErr, logPath)
		desktopErr := filepath.Join(os.Getenv("USERPROFILE"), "Desktop", "credvault-error.txt")
		ioutil.WriteFile(desktopErr, []byte(errMsg), 0644)
	}
}
