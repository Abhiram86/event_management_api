package main

import (
	"bytes"
	"fmt"
	"net/http"
	"sync"
	"time"
)

const (
	eventId = 3
	url = "http://localhost:3000/events/%d"
	totalReqs = 300
)

func main() {
	var wg sync.WaitGroup
	var mu sync.Mutex

	success := 0
	conflict := 0
	failure := 0

	concurrencyLimit := 20
	semaphore := make(chan struct{}, concurrencyLimit)

	start := time.Now()

	for i:= 1; i <= totalReqs; i++ {
		wg.Add(1)
		semaphore <- struct{}{}

		go func(userID int) {
			defer wg.Done()
			defer func() { <- semaphore }()

			payload := []byte(fmt.Sprintf(`{"user_id": %d}`, userID))

			requestURL := fmt.Sprintf(url, eventId)

			resp, err := http.Post(requestURL, "application/json", bytes.NewBuffer(payload))

			if err != nil {
				mu.Lock()
				failure++
				mu.Unlock()
				fmt.Printf("[ERROR] User %d: %v\n", userID, err)
				return
			}

			defer resp.Body.Close()

			mu.Lock()
			switch resp.StatusCode {
			case http.StatusOK:
				success++
			case http.StatusConflict:
				conflict++
			default:
				failure++
			}
			mu.Unlock()

			fmt.Printf("[INFO] User %d: %s\n", userID, resp.Status)
		}(i)
	}

	wg.Wait()
	elapsed := time.Since(start)

	fmt.Println("\n===== Load Test Results =====")
	fmt.Printf("Total Requests: %d\n", totalReqs)
	fmt.Printf("Success (200): %d\n", success)
	fmt.Printf("Conflict (409): %d\n", conflict)
	fmt.Printf("Failures: %d\n", failure)
	fmt.Printf("Time Taken: %v\n", elapsed)
}