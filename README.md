# Jira Status lib

A simple command line program to help understand how things are moving along in jira

## Installation
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