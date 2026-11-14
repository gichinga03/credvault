package crypto

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"encoding/base64"
	"errors"
	"fmt"
	"io"

	"golang.org/x/crypto/argon2"
)

const (
	argonTime    = 2
	argonMemory  = 64 * 1024
	argonThreads = 4
	argonKeyLen  = 32
)

var masterKey []byte

// RandFill fills a byte slice with cryptographically secure random bytes
func RandFill(b []byte) {
	if _, err := rand.Read(b); err != nil {
		panic(fmt.Sprintf("crypto/rand read: %v", err))
	}
}

// B64Enc encodes bytes to base64 string
func B64Enc(b []byte) string {
	return base64.StdEncoding.EncodeToString(b)
}

// B64Dec decodes a base64 string to bytes
func B64Dec(s string) []byte {
	b, _ := base64.StdEncoding.DecodeString(s)
	return b
}

// DeriveKey derives AES-256 key from password + salt using Argon2id
func DeriveKey(password string, salt []byte) []byte {
	return argon2.IDKey(
		[]byte(password),
		salt,
		argonTime,
		argonMemory,
		argonThreads,
		argonKeyLen,
	)
}

// SetMasterKey stores the derived key in memory for the session
func SetMasterKey(key []byte) {
	masterKey = make([]byte, len(key))
	copy(masterKey, key)
}

// IsUnlocked returns true if vault has been unlocked
func IsUnlocked() bool {
	return masterKey != nil
}

// ClearMasterKey wipes the key from memory (lock)
func ClearMasterKey() {
	for i := range masterKey {
		masterKey[i] = 0
	}
	masterKey = nil
}

// Encrypt encrypts plaintext using AES-GCM with the master key
func Encrypt(plaintext string) (string, error) {
	if !IsUnlocked() {
		return "", errors.New("vault is locked")
	}

	block, err := aes.NewCipher(masterKey)
	if err != nil {
		return "", fmt.Errorf("creating cipher: %w", err)
	}

	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return "", fmt.Errorf("creating GCM: %w", err)
	}

	nonce := make([]byte, gcm.NonceSize())
	if _, err := io.ReadFull(rand.Reader, nonce); err != nil {
		return "", fmt.Errorf("generating nonce: %w", err)
	}

	ciphertext := gcm.Seal(nonce, nonce, []byte(plaintext), nil)
	return base64.StdEncoding.EncodeToString(ciphertext), nil
}

// Decrypt decrypts a base64-encoded AES-GCM ciphertext
func Decrypt(encoded string) (string, error) {
	if !IsUnlocked() {
		return "", errors.New("vault is locked")
	}

	ciphertext, err := base64.StdEncoding.DecodeString(encoded)
	if err != nil {
		return "", fmt.Errorf("decoding base64: %w", err)
	}

	block, err := aes.NewCipher(masterKey)
	if err != nil {
		return "", fmt.Errorf("creating cipher: %w", err)
	}

	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return "", fmt.Errorf("creating GCM: %w", err)
	}

	nonceSize := gcm.NonceSize()
	if len(ciphertext) < nonceSize {
		return "", errors.New("ciphertext too short")
	}

	nonce, ciphertext := ciphertext[:nonceSize], ciphertext[nonceSize:]
	plaintext, err := gcm.Open(nil, nonce, ciphertext, nil)
	if err != nil {
		return "", fmt.Errorf("decrypting: %w", err)
	}

	return string(plaintext), nil
}