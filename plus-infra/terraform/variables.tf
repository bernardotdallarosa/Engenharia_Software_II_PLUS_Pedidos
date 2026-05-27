variable "endpoint" {
  default = "http://localhost:4566"
}

variable "region" {
  default = "us-east-1"
}

variable "db_name" {
  default = "plus_auth"
}

variable "db_user" {
  default = "plus"
}

variable "db_password" {
  default   = "plus_secret"
  sensitive = true
}

variable "ms_auth_host" {
  default = "plus-ms-auth"
}

variable "ms_auth_port" {
  default = "3001"
}
