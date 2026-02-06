package utils

import "strings"

func IsEmail(value string) bool {
  value = strings.TrimSpace(value)
  return strings.Contains(value, "@") && strings.Contains(value, ".")
}
