# Jira Status lib

A simple command line program to help understand how things are moving along in jira

## Installation
1. `touch .env` in the root of this repo
1. add your email like this `EMAIL=amolla@whitepages.com` to the .env file you just created
1. go to your official jira profile https://id.atlassian.com/manage-profile/security
1. make an api token
1. add your api token like this `API_TOKEN=SUPERSECRET123` to the .env file


```
npm i
```

### usage

```
# node index.js {jira ticket}

node index.js PREM-4160
```

### notes

For epics, it digs deeper into the stories of each ticket
For stories, it displays useful information

```
node index.js prem-4426
# getting story details prem-4426
# {
#   'actual days': 8,
#   story: 'Rung 3.15 - Speed Search Results Page Base Layout',
#   assignee: 'Meni Livne',
#   status: 'In Progress In Progress',
#   estimate: '1w',
#   comments: 0
# }
```

it calculates actual days, where they are Mon-Fri
it also shows the estimate (here 1w)
it shows the status as well as the status category
it shows the conversation involved (number of comments)