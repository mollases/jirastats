require('dotenv').config()
const axios = require('axios')

let config = {
  baseURL: process.env.BASE_URL,
  headers: {
    Authorization: `Basic ${btoa(process.env.EMAIL + ":" + process.env.API_TOKEN)}`,
  }
}

module.exports = axios.create(config)