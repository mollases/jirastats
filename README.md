# Jira Status lib

A simple command line program to help understand how things are moving along in jira

## Installation
1. `touch .env` in the root of this repo
1. add the base url like this `BASE_URL=https://company.atlasian.com`, you'll need to find the right url
1. add your email like this `EMAIL=user@company.com` to the .env file you just created, this is your work email
1. go to your official jira profile https://id.atlassian.com/manage-profile/security
1. make an api token
1. add your api token like this `API_TOKEN=SUPERSECRET123` to the .env file


```
npm i
```

### usage
Follow the instructions from `npm start`