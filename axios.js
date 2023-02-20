require('dotenv').config()
const axios = require('axios')

let config = {
  headers: {
    Authorization: `Basic ${btoa(process.env.EMAIL + ":" + process.env.API_TOKEN)}`,
  }
}

module.exports = axios.create(config)