const axios = require('./axios')

/**
 * how many times a ticket has changed columns
 * 
 */

const issue = process.argv[2]
const person = process.argv[3]

const getEpicStories = (epicId, person) => {
    let extended = ''
    if(!person){
        console.log('getting epic details')
    } else {
        console.log('getting epic details for ' + person)
        extended = ` and assignee = "${person}"`
    }
    const request = `https://whitepages.atlassian.net/rest/api/2/search?jql=${encodeURIComponent(`"Epic Link" = ${epicId} ${extended}`)}`
    console.log(request)

    return axios
    .get(request)
    .then(res => {
      const stories = res.data.issues.map((k) => {
          return k.key
      });
      console.log(`found ${stories.length} child stories`)
      return stories
    })
    .catch(error => {
      console.error(error);
    });
}

const findStory = (issue) => {
    return axios
    .get(`https://whitepages.atlassian.net/rest/api/latest/issue/${issue}`)
    .then(r => r.data.fields)
}

const getStoryDetails = (issue) => {
    const storyDetails = findStory(issue)
        .then(story => {
            return {
                "ticket": `https://whitepages.atlassian.net/browse/${issue}`,
                "story": story.summary,
                "assignee":story.assignee?.displayName || "none",
                "status": story.status.statusCategory.name +" "+ story.status.name,
                "estimate": story.timetracking.originalEstimate,
                "comments": story.comment.comments.length
            }
        })

    const storyHistory =
        axios
            .get(`https://whitepages.atlassian.net/rest/api/latest/issue/${issue}/changelog`)
            .then(r => {
                const inProgress = findInterestingInfo(r.data.values, {"toString": "In Progress"})
                const done = findInterestingInfo(r.data.values, {"toString": "Done"})

                return  {inProgress, done}
            })
            .then(({inProgress, done}) => {
                if(inProgress.length > 0){
                    const startDate = new Date(inProgress[0].created)
                    let end = Date.now()
                    if(done.length > 0){
                        end = new Date(done[0].created)
                    }
                    return {
                        "actual days": getBusinessDatesCount(startDate,end),
                        'in progress': startDate,
                        'done/today': end,
                            }
                } else {
                    return {"actual days": "not started"}
                }
            })
            .catch(e => {
                console.error('there was an error fetching an issues changelong', issue, e)
            })
    
    return Promise.all([storyHistory,storyDetails])
        .then(arr => {
            return {
                ...arr[0],
                ...arr[1],
            }
        })
}

const recurse = (story, person) => {
    return findStory(story)
        .then(r => {
            if(r.issuetype.name === 'Epic'){
                return getEpicStories(story,person)
                    .then((substories) => {
                        const childStories = substories.map((substory) => {
                            return recurse(substory)
                        })
                        return Promise.all(childStories)
                        .then((e) =>{
                            console.log(e)
                        })
                    })
                    .catch(e => {
                        console.error("error getting child stories",substories, e)
                    })
            } else {
                console.log("getting story details", story)
                return getStoryDetails(story)
            }
        })
        .catch(error => {
            if(error.response.status === 404) {
                console.log('error, 404')
            } else {
                console.error('error fetching issue details', story, error)
            }
        })
}

recurse(issue, person)
    .then(console.log)

const findInterestingInfo = (changeLogValues, objToFind) => {
    const keysToSearch = Object.keys(objToFind)
    const valueInQuestion = changeLogValues.filter(value => {
        const itemsInQuestion = value.items[0]
        return itemsInQuestion[keysToSearch[0]] === objToFind[keysToSearch[0]]
    })
    return valueInQuestion.map((v) =>{
        return {
            author: v.author.displayName,
            created: v.created,
            toString:v.items[0].toString,
        }
    })
}

function getBusinessDatesCount(startDate, endDate) {
    let count = 0;
    const curDate = new Date(startDate.getTime());
    while (curDate <= endDate) {
        const dayOfWeek = curDate.getDay();
        if(dayOfWeek !== 0 && dayOfWeek !== 6) count++;
        curDate.setDate(curDate.getDate() + 1);
    }
    return count;
}

